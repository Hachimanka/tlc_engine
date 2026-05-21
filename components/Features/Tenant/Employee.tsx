"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Pencil, Search, X } from "lucide-react";
import {
  type TeacherSetupDetails,
  TeacherSetupDetailsSection,
} from "./AddUserModal";
import StyledSelect from "@/components/Global/StyledSelect";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import {
  getDepedSelectedLevelSummary,
} from "@/lib/depedTeacherAssignments";
import { supabase } from "@/lib/supabaseClient";

type InstitutionType = "higher_ed" | "deped" | "tesda" | "training" | null;

type EmployeeUser = {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string | null;
  department?: string | null;
  teacherMajor?: string | null;
  qualifiedSubjects?: string[];
  preferredSubject?: string | null;
  teacherSetupDetails?: TeacherSetupDetails | null;
  roleId: string;
  roleKey: string;
  roleName: string;
  status: "active" | "disabled";
  createdAt?: string | null;
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
  teacher_setup_details?: unknown;
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

const normalizeTeacherSetupDetails = (value: unknown): TeacherSetupDetails | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const result: TeacherSetupDetails = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" && item.trim()) {
      result[key as keyof TeacherSetupDetails] = item;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
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
    teacherSetupDetails: normalizeTeacherSetupDetails(user.teacher_setup_details),
    roleId: user.role_id || role?.id || "",
    roleKey: role?.key ?? "",
    roleName: role?.name ?? "Unassigned",
    status: user.status === "disabled" ? "disabled" : "active",
    createdAt: user.created_at ?? null,
  };
};

const compactTeacherSetupDetails = (details: TeacherSetupDetails) => {
  const entries = Object.entries(details)
    .map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "",
    ])
    .filter(([, value]) => value);

  return entries.length > 0 ? (Object.fromEntries(entries) as TeacherSetupDetails) : null;
};

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-[var(--color-default)] py-3 last:border-0">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-low-emphasis)]">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-[var(--color-high-emphasis)]">
        {value || "-"}
      </div>
    </div>
  );
}

const getTeacherSubjectSummary = (employee: EmployeeUser) =>
  employee.teacherSetupDetails?.subjectDomainTrack ||
  employee.teacherSetupDetails?.learningDomain ||
  employee.teacherSetupDetails?.track ||
  employee.preferredSubject ||
  employee.teacherMajor ||
  "-";

function TeacherEditForm({
  teacher,
  error,
  onCancel,
  onSave,
}: {
  teacher: EmployeeUser;
  error: string;
  onCancel: () => void;
  onSave: (payload: {
    teacherMajor: string;
    preferredSubject: string;
    teacherSetupDetails: TeacherSetupDetails;
  }) => Promise<void>;
}) {
  const [teacherMajor, setTeacherMajor] = useState(teacher.teacherMajor ?? "");
  const [preferredSubject, setPreferredSubject] = useState(teacher.preferredSubject ?? "");
  const [teacherSetupDetails, setTeacherSetupDetails] = useState<TeacherSetupDetails>(
    teacher.teacherSetupDetails ?? {
      gradeLevelAssignment: teacher.department ?? "",
      adviserStatus: "No",
    },
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ teacherMajor, preferredSubject, teacherSetupDetails });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
      <TeacherSetupDetailsSection
        value={teacherSetupDetails}
        onChange={setTeacherSetupDetails}
        employeeIdPreview={teacher.employeeId}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">Subject / Domain / Track</label>
          <input
            value={teacherMajor}
            onChange={(event) => setTeacherMajor(event.target.value)}
            className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">Preferred Subject</label>
          <input
            value={preferredSubject}
            onChange={(event) => setPreferredSubject(event.target.value)}
            className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
          />
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
          {isSaving ? "Saving..." : "Save Teacher"}
        </button>
      </div>
    </form>
  );
}

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

export default function Employee() {
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [institutionType, setInstitutionType] = useState<InstitutionType>(null);
  const [onboardingConfig, setOnboardingConfig] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("All Groups");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<EmployeeUser | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"view" | "edit">("view");
  const [saveError, setSaveError] = useState("");

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

    const nextEmployees = ((payload.users ?? []) as UserPayload[])
      .map(normalizeUser)
      .filter((user) => user.roleKey !== "org_admin");

    setEmployees(nextEmployees);
    setInstitutionType((payload.institutionType ?? null) as InstitutionType);
    setOnboardingConfig((payload.onboardingConfig ?? {}) as Record<string, unknown>);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEmployees();
  }, [loadEmployees]);

  const isDeped = institutionType === "deped";
  const depedSelectedLevels = useMemo(
    () => getDepedSelectedLevelSummary(onboardingConfig),
    [onboardingConfig],
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
        (employee.teacherSetupDetails?.section ?? "").toLowerCase().includes(normalizedSearch) ||
        getTeacherSubjectSummary(employee).toLowerCase().includes(normalizedSearch) ||
        (employee.teacherSetupDetails?.teachingLoad ?? "").toLowerCase().includes(normalizedSearch) ||
        (employee.teacherSetupDetails?.workload ?? "").toLowerCase().includes(normalizedSearch) ||
        (employee.teacherSetupDetails?.adviserStatus ?? "").toLowerCase().includes(normalizedSearch) ||
        employee.roleName.toLowerCase().includes(normalizedSearch) ||
        staffGroup.toLowerCase().includes(normalizedSearch);

      return matchesGroup && matchesStatus && matchesSearch;
    });
  }, [groupFilter, search, statusFilter, visibleEmployees]);

  const openTeacherPanel = (teacher: EmployeeUser, mode: "view" | "edit" = "view") => {
    setSelectedTeacher(teacher);
    setPanelMode(mode);
    setPanelOpen(true);
    setSaveError("");
  };

  const closeTeacherPanel = () => {
    setPanelOpen(false);
    setPanelMode("view");
    setSaveError("");
    window.setTimeout(() => setSelectedTeacher(null), 300);
  };

  const handleSaveTeacher = async (
    teacher: EmployeeUser,
    payload: {
      teacherMajor: string;
      preferredSubject: string;
      teacherSetupDetails: TeacherSetupDetails;
    },
  ) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setSaveError("Session expired. Please log in again.");
      return;
    }

    const gradeLevelAssignment = payload.teacherSetupDetails.gradeLevelAssignment?.trim() || null;
    const response = await fetch(`/api/tenant/users/${teacher.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: teacher.fullName,
        roleId: teacher.roleId,
        status: teacher.status,
        department: gradeLevelAssignment ?? teacher.department ?? null,
        departmentId: null,
        teacherMajor: payload.teacherMajor.trim().replace(/\s+/g, " ") || null,
        preferredSubject: payload.preferredSubject.trim().replace(/\s+/g, " ") || null,
        teacherSetupDetails: compactTeacherSetupDetails(payload.teacherSetupDetails),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSaveError(data?.error || "Failed to update teacher.");
      return;
    }

    const updatedTeacher = normalizeUser(data.user as UserPayload);
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === updatedTeacher.id ? updatedTeacher : employee,
      ),
    );
    setSelectedTeacher(updatedTeacher);
    setPanelMode("view");
    setSaveError("");
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-none text-[var(--color-high-emphasis)]">
            {isDeped ? "Teachers" : "Faculty & Staff"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-low-emphasis)]">
            {visibleEmployees.length} {isDeped ? "teacher" : "database-backed"} profile{visibleEmployees.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {isDeped ? (
        <section className="mb-5 rounded-lg border border-[var(--color-default)] bg-white p-5 shadow-level-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--color-high-emphasis)]">
                Teacher setup from onboarding
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[var(--color-low-emphasis)]">
                Teacher accounts are created from the Accounts tab by selecting the Teacher role. This page is a directory for reviewing and maintaining teacher assignments.
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
                    <th className="px-5 py-4 text-sm font-semibold">Section</th>
                    <th className="px-5 py-4 text-sm font-semibold">Subject / Domain / Track</th>
                    <th className="px-5 py-4 text-sm font-semibold">Teaching Load</th>
                    <th className="px-5 py-4 text-sm font-semibold">Workload</th>
                    <th className="px-5 py-4 text-sm font-semibold">Adviser</th>
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
                  <td colSpan={isDeped ? 12 : 7} className="px-5 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
                    No faculty or staff profiles found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const staffGroup = getStaffGroup(employee.roleKey, employee.roleName);

                  return (
                    <tr
                      key={employee.id}
                      onClick={() => openTeacherPanel(employee)}
                      className="cursor-pointer transition hover:bg-[#ecf8f6]"
                    >
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
                            {employee.teacherSetupDetails?.section || "-"}
                          </td>
                          <td className="max-w-[260px] px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                            {getTeacherSubjectSummary(employee)}
                          </td>
                          <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                            {employee.teacherSetupDetails?.teachingLoad || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                            {employee.teacherSetupDetails?.workload || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                            {employee.teacherSetupDetails?.adviserStatus || "-"}
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

      {panelOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={closeTeacherPanel}
        />
      ) : null}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Teacher details"
      >
        {selectedTeacher ? (
          <>
            <div className="border-b border-[var(--color-default)] px-6 pb-4 pt-6">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-[#ecf8f6] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {selectedTeacher.roleName}
                </span>
                <button
                  type="button"
                  onClick={closeTeacherPanel}
                  className="rounded-lg p-1 text-[var(--color-low-emphasis)] transition hover:bg-[#f2f4f7] hover:text-[var(--color-high-emphasis)]"
                  aria-label="Close teacher details"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <h2 className="mt-3 text-xl font-bold text-[var(--color-high-emphasis)]">
                {selectedTeacher.fullName}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--color-low-emphasis)]">
                {selectedTeacher.employeeId || "No employee ID"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2">
              {panelMode === "edit" ? (
                <TeacherEditForm
                  key={selectedTeacher.id}
                  teacher={selectedTeacher}
                  error={saveError}
                  onCancel={() => setPanelMode("view")}
                  onSave={(payload) => handleSaveTeacher(selectedTeacher, payload)}
                />
              ) : (
                <>
                  <FieldRow label="Email" value={selectedTeacher.email} />
                  <FieldRow label="Employee ID" value={selectedTeacher.employeeId || "-"} />
                  <FieldRow
                    label="Assigned Grade Level"
                    value={
                      selectedTeacher.teacherSetupDetails?.gradeLevelAssignment ||
                      selectedTeacher.department ||
                      "-"
                    }
                  />
                  <FieldRow
                    label="Grade / Year Level"
                    value={selectedTeacher.teacherSetupDetails?.gradeYearLevel || "-"}
                  />
                  <FieldRow label="Section" value={selectedTeacher.teacherSetupDetails?.section || "-"} />
                  <FieldRow
                    label="Subject / Domain / Track"
                    value={getTeacherSubjectSummary(selectedTeacher)}
                  />
                  <FieldRow
                    label="Teaching Load"
                    value={selectedTeacher.teacherSetupDetails?.teachingLoad || "-"}
                  />
                  <FieldRow
                    label="Workload"
                    value={selectedTeacher.teacherSetupDetails?.workload || "-"}
                  />
                  <FieldRow
                    label="Adviser Status"
                    value={selectedTeacher.teacherSetupDetails?.adviserStatus || "-"}
                  />
                </>
              )}
            </div>

            <div className="border-t border-[var(--color-default)] bg-[#f8fafc] px-6 py-4">
              {panelMode === "view" ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPanelMode("edit")}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)]"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit Teacher
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--color-low-emphasis)]">
                  Teacher accounts are added from Accounts by selecting the Teacher role.
                </p>
              )}
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}
