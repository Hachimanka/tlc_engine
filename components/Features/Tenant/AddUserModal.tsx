"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

export type RoleOption = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
};

export type AddUserPayload = {
  fullName: string;
  roleId: string;
};

export type CreatedUser = {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string | null;
  roleId: string;
  roleKey: string;
  roleName: string;
  description: string;
};

type AddUserModalProps = {
  isOpen: boolean;
  roles: RoleOption[];
  emailDomain?: string | null;
  onClose: () => void;
  onCreate: (payload: AddUserPayload) => Promise<{ tempPassword: string; user: CreatedUser }>;
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

export default function AddUserModal({
  isOpen,
  roles,
  emailDomain,
  onClose,
  onCreate,
}: AddUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ tempPassword: string; user: CreatedUser } | null>(null);

  const roleOptions = useMemo(() => roles, [roles]);
  const generatedEmailPreview = useMemo(
    () => getEmailPreview(fullName, emailDomain),
    [emailDomain, fullName],
  );

  const resetForm = useCallback(() => {
    setFullName("");
    setRoleId("");
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

  const canSubmit = Boolean(fullName.trim() && roleId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Please complete all required fields.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await onCreate({
        fullName: fullName.trim(),
        roleId,
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
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
                Share the temporary password securely with the new user.
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
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
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
              <select
                id="role"
                value={roleId}
                onChange={(event) => setRoleId(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              >
                <option value="">Select a role</option>
                {roleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
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
