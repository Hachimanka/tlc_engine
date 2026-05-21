"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, UserPlus } from "lucide-react";
import AddUserModal, {
  type AddUserPayload,
  type CreatedUser,
  type RoleOption,
} from "./AddUserModal";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import type { FeatureDefinition } from "@/features/tenant-feature-catalog";
import { supabase } from "@/lib/supabaseClient";

type EmployeeRole = RoleOption;

type EmployeeUser = {
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

const normalizeJoinedRole = (role: unknown) => {
  if (Array.isArray(role)) {
    return role[0] as { id?: string; key?: string; name?: string } | undefined;
  }

  return role as { id?: string; key?: string; name?: string } | undefined;
};

const normalizeUser = (user: UserPayload): EmployeeUser => {
  const role = normalizeJoinedRole(user.roles ?? user.role);

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    employeeId: user.employee_id ?? null,
    department: user.department ?? null,
    roleId: user.role_id || role?.id || "",
    roleKey: role?.key ?? "",
    roleName: role?.name ?? "Unassigned",
    status: user.status === "disabled" ? "disabled" : "active",
    createdAt: user.created_at ?? null,
  };
};

const getStaffGroup = (roleKey: string, roleName: string) => {
  const key = roleKey.toLowerCase();
  const name = roleName.toLowerCase();

  if (key === "org_admin") {
    return "Administration";
  }

  if (
    key === "faculty" ||
    key === "teacher" ||
    name.includes("faculty") ||
    name.includes("teacher") ||
    name.includes("trainer") ||
    name.includes("facilitator")
  ) {
    return "Faculty / Teaching Staff";
  }

  if (
    key.includes("dean") ||
    key.includes("vpaa") ||
    key.includes("school_head") ||
    key.includes("department_head") ||
    name.includes("principal") ||
    name.includes("program chair")
  ) {
    return "Academic Leadership";
  }

  if (
    key.includes("load") ||
    key.includes("subject") ||
    key.includes("room") ||
    name.includes("manager")
  ) {
    return "Academic Operations";
  }

  return "Staff";
};

export default function Employee() {
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [orgEmailDomain, setOrgEmailDomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("All Groups");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Please sign in to load faculty and staff.");
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
      setLoadError(payload?.error || "Failed to load faculty and staff.");
      return;
    }

    const nextRoles: EmployeeRole[] = ((payload.roles ?? []) as RolePayload[]).map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description ?? null,
      requiresDepartment: Boolean(role.requiresDepartment ?? role.requires_department),
    }));

    const nextEmployees = ((payload.users ?? []) as UserPayload[])
      .map(normalizeUser)
      .filter((user) => user.roleKey !== "org_admin");

    setRoles(nextRoles);
    setFeatures((payload.features ?? []) as FeatureDefinition[]);
    setEmployees(nextEmployees);
    setOrgEmailDomain(payload.org?.emailDomain ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEmployees();
  }, [loadEmployees]);

  const assignableRoles = useMemo(
    () => roles.filter((role) => role.key !== "org_admin"),
    [roles],
  );

  const groups = useMemo(() => {
    const staffGroups = employees.map((employee) =>
      getStaffGroup(employee.roleKey, employee.roleName),
    );

    return ["All Groups", ...Array.from(new Set(staffGroups))];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const staffGroup = getStaffGroup(employee.roleKey, employee.roleName);
      const matchesGroup = groupFilter === "All Groups" || staffGroup === groupFilter;
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        (employee.employeeId ?? "").toLowerCase().includes(normalizedSearch) ||
        employee.fullName.toLowerCase().includes(normalizedSearch) ||
        employee.email.toLowerCase().includes(normalizedSearch) ||
        (employee.department ?? "").toLowerCase().includes(normalizedSearch) ||
        employee.roleName.toLowerCase().includes(normalizedSearch) ||
        staffGroup.toLowerCase().includes(normalizedSearch);

      return matchesGroup && matchesStatus && matchesSearch;
    });
  }, [employees, groupFilter, search, statusFilter]);

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
      throw new Error(data?.error || "Failed to create account.");
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

    setEmployees((current) => [
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

    return {
      tempPassword: data.tempPassword,
      user: createdUser,
      emailSentTo: data.emailSentTo,
      loginUrl: data.loginUrl ?? null,
    };
  };

  if (isLoading) {
    return (
      <TenantLoadingScreen
        className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        label="Loading faculty and staff"
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
    <div className="flex h-full min-h-0 flex-col">
      <AddUserModal
        isOpen={isAddUserOpen}
        roles={assignableRoles}
        features={features}
        emailDomain={orgEmailDomain}
        onClose={() => setIsAddUserOpen(false)}
        onCreate={handleCreateUser}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-none text-[var(--color-high-emphasis)]">
            Faculty & Staff
          </h1>
          <p className="mt-2 text-sm text-[var(--color-low-emphasis)]">
            {employees.length} database-backed profile{employees.length === 1 ? "" : "s"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddUserOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add Faculty / Staff
        </button>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_220px_180px]">
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
          <span className="sr-only">Search faculty and staff</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, ID, department, group, or role..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
          />
        </label>

        <label className="relative flex h-10 items-center rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
          <span className="sr-only">Filter by group</span>
          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-8 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
          >
            {groups.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--color-low-emphasis)]"
            aria-hidden="true"
          />
        </label>

        <label className="relative flex h-10 items-center rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
          <span className="sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | "active" | "disabled")
            }
            className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-8 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--color-low-emphasis)]"
            aria-hidden="true"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--color-default)] bg-white">
        <div className="h-full overflow-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[var(--color-primary)] text-white">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold">ID No.</th>
                <th className="px-5 py-4 text-sm font-semibold">Name</th>
                <th className="px-5 py-4 text-sm font-semibold">Email</th>
                <th className="px-5 py-4 text-sm font-semibold">Department</th>
                <th className="px-5 py-4 text-sm font-semibold">Group</th>
                <th className="px-5 py-4 text-sm font-semibold">Role</th>
                <th className="px-5 py-4 text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-default)] bg-white">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
                    No faculty or staff profiles found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const staffGroup = getStaffGroup(employee.roleKey, employee.roleName);

                  return (
                    <tr key={employee.id} className="transition hover:bg-[#ecf8f6]">
                      <td className="px-5 py-4 text-sm font-medium text-[var(--color-high-emphasis)]">
                        {employee.employeeId || "-"}
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                        {employee.fullName}
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                        {employee.email}
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                        {employee.department || "-"}
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                        {staffGroup}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[var(--color-primary)]">
                        {employee.roleName}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={
                            employee.status === "active"
                              ? "rounded-full bg-[#ecfdf3] px-2 py-1 text-xs font-semibold text-[#027a48]"
                              : "rounded-full bg-[#f2f4f7] px-2 py-1 text-xs font-semibold text-[#667085]"
                          }
                        >
                          {employee.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
