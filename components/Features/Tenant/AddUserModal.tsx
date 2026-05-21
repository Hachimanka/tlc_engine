"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  FeatureDefinition,
  FeatureKey,
} from "@/features/tenant-feature-catalog";

export type RoleOption = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  requiresDepartment?: boolean;
  requires_department?: boolean;
};

export type AddUserPayload = {
  fullName: string;
  recipientEmail: string;
  roleId?: string;
  customRoleName?: string;
  customRoleFeatureKeys?: string[];
  customRoleRequiresDepartment?: boolean;
  department?: string | null;
  departmentId?: string | null;
};

export type CreatedUser = {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string | null;
  department?: string | null;
  departmentId?: string | null;
  roleId: string;
  roleKey: string;
  roleName: string;
  description: string;
};

export type AddUserResult = {
  tempPassword: string;
  user: CreatedUser;
  emailSentTo: string;
  loginUrl?: string | null;
};

export type DepartmentOption = {
  id: string;
  name: string;
  code?: string | null;
  collegeId?: string | null;
};

type AddUserModalProps = {
  isOpen: boolean;
  roles: RoleOption[];
  features: FeatureDefinition[];
  departments?: DepartmentOption[];
  emailDomain?: string | null;
  onClose: () => void;
  onCreate: (payload: AddUserPayload) => Promise<AddUserResult>;
};

const normalizeNamePart = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

const getEmailPreview = (fullName: string, emailDomain?: string | null) => {
  const domain = emailDomain || "institution.edu";
  const parts = fullName
    .trim()
    .split(/\s+/)
    .map(normalizeNamePart)
    .filter(Boolean);

  if (parts.length === 0) {
    return `name@${domain}`;
  }

  if (parts.length === 1) {
    return `${parts[0]}@${domain}`;
  }

  return `${parts[0]}.${parts[parts.length - 1]}@${domain}`;
};

const customRoleValue = "__custom_role__";

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const groupFeatures = (features: FeatureDefinition[]) => {
  const groups = features.reduce<Record<string, FeatureDefinition[]>>((currentGroups, feature) => {
    currentGroups[feature.group] = [
      ...(currentGroups[feature.group] ?? []),
      feature,
    ];
    return currentGroups;
  }, {});

  for (const group of Object.keys(groups)) {
    groups[group] = groups[group].sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === "active" ? -1 : 1;
      }

      if (Boolean(left.adminOnly) !== Boolean(right.adminOnly)) {
        return left.adminOnly ? 1 : -1;
      }

      return left.label.localeCompare(right.label);
    });
  }

  return groups;
};

export default function AddUserModal({
  isOpen,
  roles,
  features,
  departments = [],
  emailDomain,
  onClose,
  onCreate,
}: AddUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleFeatureKeys, setCustomRoleFeatureKeys] = useState<string[]>([]);
  const [customRoleRequiresDepartment, setCustomRoleRequiresDepartment] = useState(false);
  const [department, setDepartment] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<AddUserResult | null>(null);

  const roleOptions = useMemo(() => roles, [roles]);
  const selectedRole = useMemo(
    () => roleOptions.find((role) => role.id === roleId) ?? null,
    [roleId, roleOptions],
  );
  const isCustomRole = roleId === customRoleValue;
  const selectedRoleLabel = isCustomRole
    ? "Custom role"
    : selectedRole?.name ?? "Select a role";
  const selectedRoleRequiresDepartment = Boolean(
    selectedRole?.requiresDepartment ?? selectedRole?.requires_department,
  );
  const departmentIsRequired = isCustomRole
    ? customRoleRequiresDepartment
    : selectedRoleRequiresDepartment;
  const hasManagedDepartments = departments.length > 0;
  const assignableFeatures = useMemo(
    () =>
      features.filter(
        (feature) => feature.status === "active" && !feature.adminOnly,
      ),
    [features],
  );
  const groupedFeatures = useMemo(
    () => groupFeatures(assignableFeatures),
    [assignableFeatures],
  );
  const generatedEmailPreview = useMemo(
    () => getEmailPreview(fullName, emailDomain),
    [emailDomain, fullName],
  );

  const resetForm = useCallback(() => {
    setFullName("");
    setRecipientEmail("");
    setRoleId("");
    setCustomRoleName("");
    setCustomRoleFeatureKeys([]);
    setCustomRoleRequiresDepartment(false);
    setDepartment("");
    setDepartmentId("");
    setIsRoleMenuOpen(false);
    setError("");
    setIsSubmitting(false);
    setSuccess(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, resetForm]);

  if (!isOpen) {
    return null;
  }

  const canSubmit = Boolean(
    fullName.trim() &&
      (isCustomRole
        ? customRoleName.trim() && customRoleFeatureKeys.length > 0
        : roleId) &&
      isValidEmail(recipientEmail) &&
      (!departmentIsRequired || (hasManagedDepartments ? departmentId : department.trim())),
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(
        !isValidEmail(recipientEmail)
          ? "Enter a valid recipient email."
          : departmentIsRequired && hasManagedDepartments && !departmentId
          ? "Department is required for this role."
          : departmentIsRequired && !department.trim()
          ? "Department is required for this role."
          : isCustomRole && customRoleFeatureKeys.length === 0
          ? "Select at least one feature for this custom role."
          : "Please complete all required fields.",
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await onCreate({
        fullName: fullName.trim(),
        recipientEmail: recipientEmail.trim(),
        roleId: isCustomRole ? undefined : roleId,
        customRoleName: isCustomRole
          ? customRoleName.trim().replace(/\s+/g, " ")
          : undefined,
        customRoleFeatureKeys: isCustomRole ? customRoleFeatureKeys : undefined,
        customRoleRequiresDepartment: isCustomRole
          ? customRoleRequiresDepartment
          : undefined,
        department: hasManagedDepartments
          ? null
          : department.trim()
          ? department.trim().replace(/\s+/g, " ")
          : null,
        departmentId: hasManagedDepartments ? departmentId || null : undefined,
      });
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRoleChange = (nextRoleId: string) => {
    setRoleId(nextRoleId);
    setIsRoleMenuOpen(false);

    if (nextRoleId !== customRoleValue) {
      setCustomRoleName("");
      setCustomRoleFeatureKeys([]);
      setCustomRoleRequiresDepartment(false);
    }
  };

  const handleFeatureToggle = (featureKey: FeatureKey, enabled: boolean) => {
    setCustomRoleFeatureKeys((current) => {
      if (enabled) {
        return Array.from(new Set([...current, featureKey]));
      }

      return current.filter((key) => key !== featureKey);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className={`w-full overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)] ${
          isCustomRole ? "max-w-[760px]" : "max-w-[520px]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[var(--color-primary)] px-6 py-5">
          <h2 id="add-user-title" className="text-xl font-semibold text-white">
            Add Account
          </h2>
        </div>

        {success ? (
          <div className="space-y-4 px-6 py-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-high-emphasis)]">
                Account created
              </h3>
              <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
                Login details were emailed to {success.emailSentTo}.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  User
                </div>
                <div className="text-sm font-semibold text-[var(--color-high-emphasis)]">
                  {success.user.fullName}
                </div>
                <div className="text-xs text-[var(--color-low-emphasis)]">
                  {success.user.email} - {success.user.roleName}
                </div>
                {success.user.department ? (
                  <div className="text-xs text-[var(--color-low-emphasis)]">
                    Department: {success.user.department}
                  </div>
                ) : null}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  Emailed To
                </div>
                <div className="mt-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[var(--color-high-emphasis)]">
                  {success.emailSentTo}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  Temporary Password
                </div>
                <div className="mt-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">
                  {success.tempPassword}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-[var(--color-default)] px-4 py-2 text-xs font-semibold text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
              >
                Add another account
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(100vh-9rem)] space-y-5 overflow-y-auto px-6 py-6"
          >
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="full-name" className="text-sm font-medium text-[#344054]">
                Full Name
              </label>
              <input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g., Maria Santos"
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="generated-email" className="text-sm font-medium text-[#344054]">
                Generated Email
              </label>
              <input
                id="generated-email"
                type="email"
                value={generatedEmailPreview}
                readOnly
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-3 text-sm text-[#475467] outline-none"
              />
              <p className="text-xs text-[var(--color-low-emphasis)]">
                The final email is generated from the full name and made unique if needed.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="recipient-email" className="text-sm font-medium text-[#344054]">
                Recipient Email <span className="text-[var(--color-primary)]">*</span>
              </label>
              <input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                placeholder="e.g., maria.santos@gmail.com"
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              />
              <p className="text-xs text-[var(--color-low-emphasis)]">
                Login credentials will be sent here. This email is not stored on the account.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="generated-employee-id" className="text-sm font-medium text-[#344054]">
                Generated Employee ID
              </label>
              <input
                id="generated-employee-id"
                value={`${new Date().getFullYear().toString().slice(-2)}-####-###`}
                readOnly
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-3 text-sm text-[#475467] outline-none"
              />
              <p className="text-xs text-[var(--color-low-emphasis)]">
                Format follows YY-####-###, for example 23-0001-001.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-[#344054]">
                Role
              </label>
              <div className="relative">
                <button
                  id="role"
                  type="button"
                  onClick={() => setIsRoleMenuOpen((current) => !current)}
                  className="flex h-11 w-full items-center justify-between rounded-lg border border-[#d0d5dd] bg-white px-3 text-left text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                  aria-haspopup="listbox"
                  aria-expanded={isRoleMenuOpen}
                >
                  <span>{selectedRoleLabel}</span>
                  <span className="text-xs text-[var(--color-low-emphasis)]">v</span>
                </button>

                {isRoleMenuOpen ? (
                  <div
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#d0d5dd] bg-white py-1 shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                    role="listbox"
                    aria-label="Role options"
                  >
                    <button
                      type="button"
                      onClick={() => handleRoleChange(customRoleValue)}
                      className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-[#ecf8f6] ${
                        isCustomRole
                          ? "font-semibold text-[var(--color-primary)]"
                          : "text-[var(--color-high-emphasis)]"
                      }`}
                      role="option"
                      aria-selected={isCustomRole}
                    >
                      Custom role
                    </button>
                    {roleOptions.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleChange(role.id)}
                        className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-[#ecf8f6] ${
                          role.id === roleId
                            ? "font-semibold text-[var(--color-primary)]"
                            : "text-[var(--color-high-emphasis)]"
                        }`}
                        role="option"
                        aria-selected={role.id === roleId}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {isCustomRole ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="custom-role-name" className="text-sm font-medium text-[#344054]">
                    Custom Role Name
                  </label>
                  <input
                    id="custom-role-name"
                    value={customRoleName}
                    onChange={(event) => setCustomRoleName(event.target.value)}
                    placeholder="e.g., Laboratory Coordinator"
                    className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-3">
                  <input
                    type="checkbox"
                    checked={customRoleRequiresDepartment}
                    onChange={(event) =>
                      setCustomRoleRequiresDepartment(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-[#cfd5dd] text-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[var(--color-high-emphasis)]">
                      Requires department
                    </span>
                    <span className="mt-1 block text-xs text-[var(--color-low-emphasis)]">
                      Turn this on when every account with this custom role must belong to a department.
                    </span>
                  </span>
                </label>

                <div className="space-y-4 rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-4">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-high-emphasis)]">
                      Initial Feature Access
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
                      Select at least one available feature so this account can enter the workspace after login.
                    </p>
                  </div>

                  {assignableFeatures.length === 0 ? (
                    <div className="rounded-md border border-[var(--color-default)] bg-white px-3 py-4 text-sm text-[var(--color-low-emphasis)]">
                      No assignable features are available for this institution yet.
                    </div>
                  ) : null}

                  {Object.entries(groupedFeatures).map(([group, groupItems]) => (
                    <fieldset key={group} className="space-y-2">
                      <legend className="text-xs font-bold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                        {group}
                      </legend>
                      <div className="grid gap-2 md:grid-cols-2">
                        {groupItems.map((feature) => {
                          const isSelected = customRoleFeatureKeys.includes(feature.key);

                          return (
                            <label
                              key={feature.key}
                              className={`grid cursor-pointer grid-cols-[18px_1fr] gap-3 rounded-md border px-3 py-2 text-sm transition ${
                                isSelected
                                  ? "border-[var(--color-primary)] bg-[#ecf8f6]"
                                  : "border-[var(--color-default)] bg-white hover:bg-[#ecf8f6]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(event) =>
                                  handleFeatureToggle(feature.key, event.target.checked)
                                }
                                className="sr-only"
                              />
                              <span
                                className={`mt-1 flex h-4 w-4 items-center justify-center rounded border ${
                                  isSelected
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                                    : "border-[#cfd5dd] bg-white"
                                }`}
                                aria-hidden="true"
                              >
                                {isSelected ? (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                ) : null}
                              </span>
                              <span>
                                <span className="font-semibold text-[var(--color-high-emphasis)]">
                                  {feature.label}
                                </span>
                                <span className="mt-0.5 block text-xs leading-5 text-[var(--color-low-emphasis)]">
                                  {feature.description}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-medium text-[#344054]">
                Department
                {departmentIsRequired ? (
                  <span className="ml-1 text-[var(--color-primary)]">*</span>
                ) : null}
              </label>
              {hasManagedDepartments ? (
                <select
                  id="department"
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                >
                  <option value="">
                    {departmentIsRequired ? "Select a department" : "No department"}
                  </option>
                  {departments.map((departmentOption) => (
                    <option key={departmentOption.id} value={departmentOption.id}>
                      {departmentOption.code
                        ? `${departmentOption.code} - ${departmentOption.name}`
                        : departmentOption.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="department"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  placeholder="e.g., Computer Engineering"
                  className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                />
              )}
              <p className="text-xs text-[var(--color-low-emphasis)]">
                {departmentIsRequired
                  ? "Required because the selected role needs a department."
                  : "Optional. Leave blank if this account is not assigned to a department."}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-[var(--color-default)] px-4 py-2 text-xs font-semibold text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
