"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Pencil, RefreshCw, Search, UserPlus, X } from "lucide-react";
import AddUserModal, {
  type DepartmentOption,
  type AddUserPayload,
  type CreatedUser,
  type RoleOption,
} from "./AddUserModal";
import { isDepartmentRequiredRole } from "@/features/tenant-role-catalog";
import type { FeatureDefinition } from "@/features/tenant-feature-catalog";
import { supabase } from "@/lib/supabaseClient";

type AccountRole = RoleOption;

type AccountUser = {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string | null;
  department?: string | null;
  departmentId?: string | null;
  roleId: string;
  roleKey: string;
  roleName: string;
  status: "active" | "disabled";
  createdAt?: string | null;
};

type RolePayload = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  is_system?: boolean;
  requiresDepartment?: boolean;
  requires_department?: boolean;
};

type UserPayload = {
  id: string;
  full_name: string;
  email: string;
  employee_id?: string | null;
  department?: string | null;
  department_id?: string | null;
  role_id: string;
  status?: string | null;
  created_at?: string | null;
  role?: unknown;
  roles?: unknown;
};

type EditAccountPayload = {
  fullName: string;
  roleId: string;
  department?: string | null;
  departmentId?: string | null;
  status: "active" | "disabled";
};

const normalizeJoinedRole = (role: unknown) => {
  if (Array.isArray(role)) {
    return role[0] as { id?: string; key?: string; name?: string } | undefined;
  }

  return role as { id?: string; key?: string; name?: string } | undefined;
};

const normalizeUser = (user: UserPayload): AccountUser => {
  const role = normalizeJoinedRole(user.roles ?? user.role);
  const status = user.status === "disabled" ? "disabled" : "active";

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    employeeId: user.employee_id ?? null,
    department: user.department ?? null,
    departmentId: user.department_id ?? null,
    roleId: user.role_id || role?.id || "",
    roleKey: role?.key ?? "",
    roleName: role?.name ?? "Unassigned",
    status,
    createdAt: user.created_at ?? null,
  };
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const roleRequiresDepartment = (role?: AccountRole | null) =>
  Boolean(role?.requiresDepartment ?? role?.requires_department) ||
  isDepartmentRequiredRole(role?.key);

function AccountsTableSkeleton() {
  const cellWidths = ["w-24", "w-36", "w-44", "w-40", "w-48", "w-16", "w-24", "w-28"];

  return (
    <div className="overflow-x-auto" role="status" aria-label="Loading accounts table">
      <span className="sr-only">Loading accounts table</span>
      <table className="min-w-full border-collapse text-left">
        <thead className="bg-[var(--color-primary)] text-white">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold">ID No.</th>
            <th className="px-4 py-3 text-xs font-semibold">Name</th>
            <th className="px-4 py-3 text-xs font-semibold">Email</th>
            <th className="px-4 py-3 text-xs font-semibold">Department</th>
            <th className="px-4 py-3 text-xs font-semibold">Role</th>
            <th className="px-4 py-3 text-xs font-semibold">Status</th>
            <th className="px-4 py-3 text-xs font-semibold">Created</th>
            <th className="px-4 py-3 text-right text-xs font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-default)] bg-white">
          {[0, 1, 2, 3].map((rowIndex) => (
            <tr key={rowIndex} className="animate-pulse">
              {cellWidths.map((width, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-4">
                  <div
                    className={`h-4 rounded bg-[#c8e5e1] ${
                      cellIndex === cellWidths.length - 1 ? "ml-auto" : ""
                    } ${width}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--color-default)] py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-low-emphasis)]">
          {label}
        </div>
        <div className="mt-1 break-words text-sm font-medium text-[var(--color-high-emphasis)]">
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "disabled" }) {
  return (
    <span
      className={
        status === "active"
          ? "rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-semibold text-[#027a48]"
          : "rounded-full bg-[#f2f4f7] px-2.5 py-1 text-xs font-semibold text-[#667085]"
      }
    >
      {status}
    </span>
  );
}

function EditAccountForm({
  user,
  roles,
  departments,
  onCancel,
  onSave,
}: {
  user: AccountUser;
  roles: AccountRole[];
  departments: DepartmentOption[];
  onSave: (payload: EditAccountPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(user.fullName);
  const [roleId, setRoleId] = useState(user.roleId);
  const [department, setDepartment] = useState(user.department ?? "");
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? "");
  const [status, setStatus] = useState<"active" | "disabled">(user.status);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isProtectedAdmin = user.roleKey === "org_admin";
  const roleOptions = useMemo(
    () => roles.filter((role) => role.key !== "org_admin" || role.id === user.roleId),
    [roles, user.roleId],
  );
  const selectedRole = useMemo(
    () => roleOptions.find((role) => role.id === roleId) ?? null,
    [roleId, roleOptions],
  );
  const requiresDepartment = roleRequiresDepartment(selectedRole);
  const hasManagedDepartments = departments.length > 0;

  useEffect(() => {
    setFullName(user.fullName);
    setRoleId(user.roleId);
    setDepartment(user.department ?? "");
    setDepartmentId(user.departmentId ?? "");
    setStatus(user.status);
    setError("");
    setIsSaving(false);
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (
      !fullName.trim() ||
      !roleId ||
      (requiresDepartment &&
        !(hasManagedDepartments ? departmentId || user.department : department.trim()))
    ) {
      setError(
        requiresDepartment
          ? "Full name, role, and department are required."
          : "Full name and role are required.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const nextPayload: EditAccountPayload = {
        fullName: fullName.trim(),
        roleId,
        status,
      };

      if (hasManagedDepartments) {
        if (departmentId) {
          nextPayload.departmentId = departmentId;
        } else if (user.departmentId) {
          nextPayload.departmentId = null;
        } else {
          nextPayload.department = user.department ?? null;
        }
      } else {
        nextPayload.department = department.trim()
          ? department.trim().replace(/\s+/g, " ")
          : null;
      }

      await onSave(nextPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = (nextRoleId: string) => {
    setRoleId(nextRoleId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="edit-full-name" className="text-sm font-medium text-[#344054]">
            Full Name
          </label>
          <input
            id="edit-full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-email" className="text-sm font-medium text-[#344054]">
            Email
          </label>
          <input
            id="edit-email"
            type="email"
            value={user.email}
            readOnly
            className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-3 text-sm text-[#475467] outline-none"
          />
          <p className="text-xs text-[var(--color-low-emphasis)]">
            Email is generated by the system and cannot be edited.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="edit-employee-id" className="text-sm font-medium text-[#344054]">
              Employee ID
            </label>
            <input
              id="edit-employee-id"
              value={user.employeeId ?? "-"}
              readOnly
              className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-3 text-sm text-[#475467] outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-status" className="text-sm font-medium text-[#344054]">
              Status
            </label>
            <select
              id="edit-status"
              value={status}
              disabled={isProtectedAdmin}
              onChange={(event) => setStatus(event.target.value as "active" | "disabled")}
              className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)] disabled:bg-[#f8fafc] disabled:text-[#667085]"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-role" className="text-sm font-medium text-[#344054]">
            Role
          </label>
          <select
            id="edit-role"
            value={roleId}
            disabled={isProtectedAdmin}
            onChange={(event) => handleRoleChange(event.target.value)}
            className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)] disabled:bg-[#f8fafc] disabled:text-[#667085]"
          >
            {roleOptions.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-department" className="text-sm font-medium text-[#344054]">
            Department
            {requiresDepartment ? (
              <span className="ml-1 text-[var(--color-primary)]">*</span>
            ) : null}
          </label>
          {hasManagedDepartments ? (
            <select
              id="edit-department"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
            >
              <option value="">
                {user.departmentId
                  ? "No department"
                  : user.department
                  ? `Keep legacy: ${user.department}`
                  : requiresDepartment
                  ? "Select a department"
                  : "No department"}
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
              id="edit-department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="e.g., Mathematics Department"
              className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
            />
          )}
          <p className="text-xs text-[var(--color-low-emphasis)]">
            {requiresDepartment
              ? "Required because the selected role needs a department."
              : "Optional. Leave blank if this account is not assigned to a department."}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[var(--color-default)] px-4 py-2 text-xs font-semibold text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default function Accounts() {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [roles, setRoles] = useState<AccountRole[]>([]);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [managedDepartments, setManagedDepartments] = useState<DepartmentOption[]>([]);
  const [orgEmailDomain, setOrgEmailDomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AccountUser | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"view" | "edit">("view");
  const [resettingUserId, setResettingUserId] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetResult, setResetResult] = useState<{
    userId: string;
    userName: string;
    tempPassword: string;
  } | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    setResetError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Please sign in to manage accounts.");
      return;
    }

    const response = await fetch("/api/tenant/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setIsLoading(false);
      setLoadError(payload?.error || "Failed to load accounts.");
      return;
    }

    const nextRoles: AccountRole[] = ((payload.roles ?? []) as RolePayload[]).map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description ?? null,
      requiresDepartment: Boolean(role.requiresDepartment ?? role.requires_department),
    }));

    const nextUsers = ((payload.users ?? []) as UserPayload[]).map(normalizeUser);

    setRoles(nextRoles);
    setFeatures((payload.features ?? []) as FeatureDefinition[]);
    setManagedDepartments((payload.departments ?? []) as DepartmentOption[]);
    setUsers(nextUsers);
    setSelectedUser((current) =>
      current ? nextUsers.find((user) => user.id === current.id) ?? current : current,
    );
    setOrgEmailDomain(payload.org?.emailDomain ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAccounts();
  }, [loadAccounts]);

  const assignableRoles = useMemo(
    () => roles.filter((role) => role.key !== "org_admin"),
    [roles],
  );

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(users.map((user) => (user.department ?? "").trim()).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right)),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const userDepartment = (user.department ?? "").trim();
      const matchesSearch =
        !normalizedSearch ||
        user.fullName.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        (user.employeeId ?? "").toLowerCase().includes(normalizedSearch) ||
        (user.department ?? "").toLowerCase().includes(normalizedSearch) ||
        user.roleName.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === "all" || user.roleId === roleFilter;
      const matchesDepartment =
        departmentFilter === "all" || userDepartment === departmentFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
  }, [departmentFilter, roleFilter, search, statusFilter, users]);

  const handleCreateUser = async (payload: AddUserPayload) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error("Session expired. Please log in again.");
    }

    const response = await fetch("/api/tenant/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Failed to create user.");
    }

    const createdUser: CreatedUser = {
      id: data.user.id,
      fullName: data.user.full_name,
      email: data.user.email,
      employeeId: data.user.employee_id ?? null,
      department: data.user.department ?? null,
      departmentId: data.user.department_id ?? null,
      roleId: data.user.role?.id ?? data.user.role_id ?? payload.roleId ?? "",
      roleKey: data.user.role?.key ?? "",
      roleName: data.user.role?.name ?? "Unassigned",
      description: data.user.role?.name
        ? `${data.user.role.name} access`
        : "Role assignment not set.",
    };

    if (
      data.user.role?.id &&
      !roles.some((role) => role.id === data.user.role.id)
    ) {
      setRoles((current) =>
        [
          ...current,
          {
            id: data.user.role.id,
            key: data.user.role.key ?? "",
            name: data.user.role.name ?? "Custom Role",
            description: null,
            requiresDepartment: Boolean(
              data.user.role.requiresDepartment ?? data.user.role.requires_department,
            ),
          },
        ].sort((left, right) => left.name.localeCompare(right.name)),
      );
    }

    setUsers((current) => [
      {
        id: createdUser.id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        employeeId: createdUser.employeeId,
        department: createdUser.department ?? null,
        departmentId: data.user.department_id ?? null,
        roleId: createdUser.roleId,
        roleKey: createdUser.roleKey,
        roleName: createdUser.roleName,
        status: "active",
        createdAt: data.user.created_at ?? new Date().toISOString(),
      },
      ...current,
    ]);

    return { tempPassword: data.tempPassword, user: createdUser };
  };

  const openAccountPanel = (user: AccountUser, mode: "view" | "edit" = "view") => {
    setSelectedUser(user);
    setPanelMode(mode);
    setPanelOpen(true);
  };

  const closeAccountPanel = () => {
    setPanelOpen(false);
    setPanelMode("view");
    window.setTimeout(() => setSelectedUser(null), 300);
  };

  const handleSaveAccount = async (user: AccountUser, payload: EditAccountPayload) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error("Session expired. Please log in again.");
    }

    const response = await fetch(`/api/tenant/users/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Failed to update account.");
    }

    const updatedUser = normalizeUser(data.user as UserPayload);
    setUsers((current) =>
      current.map((currentUser) =>
        currentUser.id === updatedUser.id ? updatedUser : currentUser,
      ),
    );
    setSelectedUser(updatedUser);
    setPanelMode("view");
  };

  const handleResetPassword = async (user: AccountUser) => {
    setResetError("");
    setResetResult(null);
    setResettingUserId(user.id);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setResettingUserId("");
      setResetError("Session expired. Please log in again.");
      return;
    }

    const response = await fetch(`/api/tenant/users/${user.id}/reset-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json().catch(() => ({}));

    setResettingUserId("");

    if (!response.ok) {
      setResetError(payload?.error || "Failed to reset password.");
      return;
    }

    setResetResult({
      userId: user.id,
      userName: user.fullName,
      tempPassword: payload.tempPassword,
    });
  };

  if (loadError) {
    return (
      <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="text-sm text-red-600">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AddUserModal
        isOpen={isAddUserOpen}
        roles={assignableRoles}
        features={features}
        departments={managedDepartments}
        emailDomain={orgEmailDomain}
        onClose={() => setIsAddUserOpen(false)}
        onCreate={handleCreateUser}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Accounts</h1>
          <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
            {users.length} organization account{users.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddUserOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add Account
        </button>
      </div>

      {resetError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {resetError}
        </div>
      ) : null}

      {resetResult ? (
        <div className="rounded-lg border border-[rgba(0,107,95,0.25)] bg-[#ecf8f6] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-primary)]">
                Temporary password for {resetResult.userName}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
                This value is shown once. Share it securely, then clear it from this screen.
              </p>
              <div className="mt-3 inline-flex rounded-md bg-white px-3 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-sm">
                {resetResult.tempPassword}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setResetResult(null)}
              className="rounded-md border border-[rgba(0,107,95,0.25)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-white"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_180px]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
            <span className="sr-only">Search accounts</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, employee ID, or role..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="h-11 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none"
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="h-11 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none"
            aria-label="Filter by department"
          >
            <option value="all">All departments</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "disabled")}
            className="h-11 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        {isLoading ? (
          <AccountsTableSkeleton />
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[var(--color-low-emphasis)]">
            No accounts match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold">ID No.</th>
                  <th className="px-4 py-3 text-xs font-semibold">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold">Department</th>
                  <th className="px-4 py-3 text-xs font-semibold">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-default)] bg-white">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => openAccountPanel(user)}
                    className={`cursor-pointer align-middle transition hover:bg-[#ecf8f6] ${
                      selectedUser?.id === user.id && panelOpen ? "bg-[#ecf8f6]" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {user.employeeId || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-[var(--color-high-emphasis)]">
                      {user.fullName}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {user.department || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {user.roleName}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={
                          user.status === "active"
                            ? "rounded-full bg-[#ecfdf3] px-2 py-1 font-semibold text-[#027a48]"
                            : "rounded-full bg-[#f2f4f7] px-2 py-1 font-semibold text-[#667085]"
                        }
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openAccountPanel(user, "edit");
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleResetPassword(user);
                          }}
                          disabled={resettingUserId === user.id || user.status !== "active"}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                          {resettingUserId === user.id ? "Resetting..." : "Reset"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {panelOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={closeAccountPanel}
        />
      ) : null}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Account details"
      >
        {selectedUser ? (
          <>
            <div className="border-b border-[var(--color-default)] px-6 pb-4 pt-6">
              <div className="flex items-start justify-between gap-3">
                <StatusBadge status={selectedUser.status} />
                <button
                  type="button"
                  onClick={closeAccountPanel}
                  className="rounded-lg p-1 text-[var(--color-low-emphasis)] transition hover:bg-[#f2f4f7] hover:text-[var(--color-high-emphasis)]"
                  aria-label="Close account details"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <h2 className="mt-3 text-xl font-bold text-[var(--color-high-emphasis)]">
                {selectedUser.fullName}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--color-low-emphasis)]">
                {selectedUser.roleName}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2">
              {panelMode === "edit" ? (
                <div className="py-4">
                  <EditAccountForm
                    key={selectedUser.id}
                    user={selectedUser}
                    roles={roles}
                    departments={managedDepartments}
                    onCancel={() => setPanelMode("view")}
                    onSave={(payload) => handleSaveAccount(selectedUser, payload)}
                  />
                </div>
              ) : (
                <>
                  <FieldRow
                    label="Email"
                    value={
                      <a href={`mailto:${selectedUser.email}`} className="text-[var(--color-primary)] hover:underline">
                        {selectedUser.email}
                      </a>
                    }
                  />
                  <FieldRow label="Employee ID" value={selectedUser.employeeId || "-"} />
                  <FieldRow label="Department" value={selectedUser.department || "-"} />
                  <FieldRow label="Role" value={selectedUser.roleName} />
                  <FieldRow label="Status" value={<StatusBadge status={selectedUser.status} />} />
                  <FieldRow label="Created" value={formatDate(selectedUser.createdAt)} />
                  <FieldRow
                    label="Account ID"
                    value={
                      <span className="rounded bg-[#f2f4f7] px-2 py-1 font-mono text-xs">
                        {selectedUser.id}
                      </span>
                    }
                  />
                </>
              )}
            </div>

            <div className="border-t border-[var(--color-default)] bg-[#f8fafc] px-6 py-4">
              {panelMode === "view" ? (
                <div className="space-y-3">
                  {resetResult?.userId === selectedUser.id ? (
                    <div className="rounded-lg border border-[rgba(0,107,95,0.25)] bg-white px-4 py-3">
                      <div className="text-xs font-bold text-[var(--color-primary)]">
                        Temporary password
                      </div>
                      <div className="mt-2 rounded-md bg-[#ecf8f6] px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">
                        {resetResult.tempPassword}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetPassword(selectedUser)}
                      disabled={resettingUserId === selectedUser.id || selectedUser.status !== "active"}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      {resettingUserId === selectedUser.id ? "Resetting..." : "Reset Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelMode("edit")}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit Account
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--color-low-emphasis)]">
                  Email and employee ID are generated by the system.
                </p>
              )}
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}
