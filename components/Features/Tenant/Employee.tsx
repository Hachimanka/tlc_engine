"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import AddUserModal, {
  type AddUserPayload,
  type CreatedUser,
  type RoleOption,
} from "./AddUserModal";
import StyledSelect from "@/components/Global/StyledSelect";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import type { FeatureDefinition } from "@/features/tenant-feature-catalog";
import {
  getDepedSelectedLevelSummary,
  getDepedSubjectOptions,
  getDepedTeacherAssignmentOptions,
} from "@/lib/depedTeacherAssignments";
import { supabase } from "@/lib/supabaseClient";

type InstitutionType = "higher_ed" | "deped" | "tesda" | "training" | null;

type EmployeeRole = RoleOption;

type EmployeeUser = {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string | null;
  department?: string | null;
  teacherMajor?: string | null;
  qualifiedSubjects?: string[];
  preferredSubject?: string | null;
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
  featureKeys?: string[];
};

type UserPayload = {
  id: string;
  full_name: string;
  email: string;
  employee_id?: string | null;
  department?: string | null;
  teacher_major?: string | null;
  qualified_subjects?: unknown;
  preferred_subject?: string | null;
  role_id: string;
  status?: string | null;
  created_at?: string | null;
  role?: unknown;
  roles?: unknown;
};

function EmployeeSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-4" role="status" aria-label="Loading teachers">
      <span className="sr-only">Loading teachers</span>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <BrandedSkeletonBlock className="h-8 w-48" strong />
          <BrandedSkeletonBlock className="h-4 w-80" />
        </div>
        <BrandedSkeletonBlock className="h-10 w-36 rounded-lg" strong />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-default)] bg-white p-4 shadow-level-1 lg:flex-row">
        <BrandedSkeletonBlock className="h-10 min-w-[260px] flex-1 rounded-lg" />
        <BrandedSkeletonBlock className="h-10 w-48 rounded-lg" />
        <BrandedSkeletonBlock className="h-10 w-48 rounded-lg" />
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-default)] bg-white shadow-level-1">
        <div className="grid grid-cols-5 gap-4 bg-[var(--color-primary)] px-4 py-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <BrandedSkeletonBlock key={index} className="h-3 bg-white/30" />
          ))}
        </div>
        <div className="divide-y divide-[var(--color-default)]">
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="grid grid-cols-5 gap-4 px-4 py-4">
              {Array.from({ length: 5 }).map((__, column) => (
                <BrandedSkeletonBlock key={column} className="h-3" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const normalizeJoinedRole = (role: unknown) => {
  if (Array.isArray(role)) {
    return role[0] as { id?: string; key?: string; name?: string } | undefined;
  }

  return role as { id?: string; key?: string; name?: string } | undefined;
};

const normalizeUser = (user: UserPayload): EmployeeUser => {
  const role = normalizeJoinedRole(user.roles ?? user.role);
  const qualifiedSubjects = Array.isArray(user.qualified_subjects)
    ? user.qualified_subjects.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    employeeId: user.employee_id ?? null,
    department: user.department ?? null,
    teacherMajor: user.teacher_major ?? null,
    qualifiedSubjects,
    preferredSubject: user.preferred_subject ?? null,
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

const isTeacherAccount = (roleKey: string, roleName: string) => {
  const key = roleKey.toLowerCase();
  const name = roleName.toLowerCase();

  return key === "teacher" || name.includes("teacher");
};

type EmployeeProps = {
  showInitialSkeleton?: boolean;
};

export default function Employee({ showInitialSkeleton = false }: EmployeeProps) {
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [institutionType, setInstitutionType] = useState<InstitutionType>(null);
  const [onboardingConfig, setOnboardingConfig] = useState<Record<string, unknown>>({});
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
      featureKeys: role.featureKeys ?? [],
    }));

    const nextEmployees = ((payload.users ?? []) as UserPayload[])
      .map(normalizeUser)
      .filter((user) => user.roleKey !== "org_admin");

    setRoles(nextRoles);
    setFeatures((payload.features ?? []) as FeatureDefinition[]);
    setEmployees(nextEmployees);
    setInstitutionType((payload.institutionType ?? null) as InstitutionType);
    setOnboardingConfig((payload.onboardingConfig ?? {}) as Record<string, unknown>);
    setOrgEmailDomain(payload.org?.emailDomain ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEmployees();
  }, [loadEmployees]);

  const isDeped = institutionType === "deped";
  const depedAssignmentOptions = useMemo(
    () => getDepedTeacherAssignmentOptions(onboardingConfig),
    [onboardingConfig],
  );
  const depedSelectedLevels = useMemo(
    () => getDepedSelectedLevelSummary(onboardingConfig),
    [onboardingConfig],
  );
  const depedSubjectOptions = useMemo(
    () => getDepedSubjectOptions(onboardingConfig),
    [onboardingConfig],
  );

  const assignableRoles = useMemo(
    () =>
      roles.filter((role) =>
        isDeped ? role.key === "teacher" : role.key !== "org_admin",
      ),
    [isDeped, roles],
  );

  const visibleEmployees = useMemo(
    () =>
      isDeped
        ? employees.filter((employee) =>
            isTeacherAccount(employee.roleKey, employee.roleName),
          )
        : employees,
    [employees, isDeped],
  );

  const groups = useMemo(() => {
    const staffGroups = visibleEmployees.map((employee) =>
      getStaffGroup(employee.roleKey, employee.roleName),
    );

    return ["All Groups", ...Array.from(new Set(staffGroups))];
  }, [visibleEmployees]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return visibleEmployees.filter((employee) => {
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
  }, [groupFilter, search, statusFilter, visibleEmployees]);

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
      teacherMajor: data.user.teacher_major ?? null,
      qualifiedSubjects: Array.isArray(data.user.qualified_subjects)
        ? data.user.qualified_subjects
        : [],
      preferredSubject: data.user.preferred_subject ?? null,
      roleId: data.user.role?.id ?? data.user.role_id ?? "",
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

  if (isLoading && showInitialSkeleton) {
    return <EmployeeSkeleton />;
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
        roleSuggestions={assignableRoles.map((role) => role.name)}
        features={features}
        assignmentLabel={isDeped ? "Grade Level Assignment" : undefined}
        assignmentPlaceholder={isDeped ? "e.g., Grade 7, STEM, or Elementary" : undefined}
        assignmentHint={
          isDeped
            ? "Assign the teacher to one of the enabled DepEd grade levels from onboarding."
            : undefined
        }
        assignmentOptions={isDeped ? depedAssignmentOptions : undefined}
        assignmentRequiredError={
          isDeped ? "Grade level assignment is required for teacher accounts." : undefined
        }
        showTeacherProfileFields={isDeped}
        subjectOptions={isDeped ? depedSubjectOptions : undefined}
        emailDomain={orgEmailDomain}
        onClose={() => setIsAddUserOpen(false)}
        onCreate={handleCreateUser}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-none text-[var(--color-high-emphasis)]">
            {isDeped ? "Teachers" : "Faculty & Staff"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-low-emphasis)]">
            {visibleEmployees.length} {isDeped ? "teacher" : "database-backed"} profile{visibleEmployees.length === 1 ? "" : "s"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddUserOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {isDeped ? "Add Teacher" : "Add Faculty / Staff"}
        </button>
      </div>

      {isDeped ? (
        <section className="mb-5 rounded-lg border border-[var(--color-default)] bg-white p-5 shadow-level-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--color-high-emphasis)]">
                Teacher setup from onboarding
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[var(--color-low-emphasis)]">
                New teacher accounts are scoped to the DepEd grade levels enabled during onboarding. Use this page for teacher accounts; broader admin and load roles can still be managed in Accounts.
              </p>
            </div>
            <div className="rounded-lg bg-[#ecf8f6] px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">
              {depedSelectedLevels.length} level{depedSelectedLevels.length === 1 ? "" : "s"} enabled
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(depedSelectedLevels.length > 0
              ? depedSelectedLevels
              : [{ label: "No grade levels selected", detail: "Run onboarding setup" }]
            ).map((level) => (
              <div key={level.label} className="rounded-lg border border-[var(--color-default)] bg-[#f8fafc] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--color-high-emphasis)]">
                  {level.label}
                </p>
                <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
                  {level.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_220px_180px]">
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
          <span className="sr-only">Search faculty and staff</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isDeped ? "Search teacher, email, ID, grade level, or role..." : "Search name, email, ID, department, group, or role..."}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
          />
        </label>

        <div>
          <span className="sr-only">Filter by group</span>
          <StyledSelect
            value={groupFilter}
            onChange={setGroupFilter}
            options={groups.map((group) => ({ value: group, label: group }))}
            className="[&_button]:h-10"
          />
        </div>

        <div>
          <span className="sr-only">Filter by status</span>
          <StyledSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as "all" | "active" | "disabled")}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "disabled", label: "Disabled" },
            ]}
            className="[&_button]:h-10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--color-default)] bg-white">
        <div className="h-full overflow-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[var(--color-primary)] text-white">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold">ID No.</th>
                <th className="px-5 py-4 text-sm font-semibold">Name</th>
                <th className="px-5 py-4 text-sm font-semibold">Email</th>
                <th className="px-5 py-4 text-sm font-semibold">
                  {isDeped ? "Grade Level" : "Department"}
                </th>
                {isDeped ? (
                  <>
                    <th className="px-5 py-4 text-sm font-semibold">Major</th>
                    <th className="px-5 py-4 text-sm font-semibold">Can Teach</th>
                  </>
                ) : null}
                <th className="px-5 py-4 text-sm font-semibold">Group</th>
                <th className="px-5 py-4 text-sm font-semibold">Role</th>
                <th className="px-5 py-4 text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-default)] bg-white">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={isDeped ? 9 : 7} className="px-5 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
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
                      {isDeped ? (
                        <>
                          <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                            {employee.teacherMajor || "-"}
                          </td>
                          <td className="max-w-[260px] px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                            {employee.qualifiedSubjects && employee.qualifiedSubjects.length > 0
                              ? employee.qualifiedSubjects.join(", ")
                              : "-"}
                          </td>
                        </>
                      ) : null}
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
