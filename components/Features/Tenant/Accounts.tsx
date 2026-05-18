"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, RefreshCw, Search, UserPlus } from "lucide-react";
import AddUserModal, {
  type AddUserPayload,
  type CreatedUser,
  type RoleOption,
} from "./AddUserModal";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
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

function EditAccountModal({
  user,
  roles,
  onClose,
  onSave,
}: {
  user: AccountUser;
  roles: AccountRole[];
  onClose: () => void;
  onSave: (payload: EditAccountPayload) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(user.fullName);
  const [roleId, setRoleId] = useState(user.roleId);
  const [department, setDepartment] = useState(user.department ?? "");
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

  useEffect(() => {
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
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !roleId || (requiresDepartment && !department.trim())) {
      setError(
        requiresDepartment
          ? "Full name, role, and department are required."
          : "Full name and role are required.",
      );
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        fullName: fullName.trim(),
        roleId,
        department: department.trim() ? department.trim().replace(/\s+/g, " ") : null,
        status,
      });
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[var(--color-primary)] px-6 py-5">
          <h2 id="edit-account-title" className="text-xl font-semibold text-white">
            Edit Account
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
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

            <div className="space-y-2 sm:col-span-2">
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
              <p className="text-xs text-[var(--color-low-emphasis)]">
                Employee ID is generated by the system and cannot be edited.
              </p>
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

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="edit-department" className="text-sm font-medium text-[#344054]">
                Department
                {requiresDepartment ? (
                  <span className="ml-1 text-[var(--color-primary)]">*</span>
                ) : null}
              </label>
              <input
                id="edit-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder="e.g., Mathematics Department"
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              />
              <p className="text-xs text-[var(--color-low-emphasis)]">
                {requiresDepartment
                  ? "Required because the selected role needs a department."
                  : "Optional. Leave blank if this account is not assigned to a department."}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
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
      </div>
    </div>
  );
}

export default function Accounts() {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [roles, setRoles] = useState<AccountRole[]>([]);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [orgEmailDomain, setOrgEmailDomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<AccountUser | null>(null);
  const [resettingUserId, setResettingUserId] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetResult, setResetResult] = useState<{
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
    setUsers(nextUsers);
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
    setEditUser(null);
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
      userName: user.fullName,
      tempPassword: payload.tempPassword,
    });
  };

  if (isLoading) {
    return (
      <TenantLoadingScreen
        className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        label="Loading accounts"
        useStoredBranding
      />
    );
  }

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
        emailDomain={orgEmailDomain}
        onClose={() => setIsAddUserOpen(false)}
        onCreate={handleCreateUser}
      />

      {editUser ? (
        <EditAccountModal
          key={editUser.id}
          user={editUser}
          roles={roles}
          onClose={() => setEditUser(null)}
          onSave={(payload) => handleSaveAccount(editUser, payload)}
        />
      ) : null}

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
        {filteredUsers.length === 0 ? (
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
                  <tr key={user.id} className="align-middle">
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
                          onClick={() => setEditUser(user)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(user)}
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
    </div>
  );
}
