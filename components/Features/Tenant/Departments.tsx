"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  GraduationCap,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import { supabase } from "@/lib/supabaseClient";

type CollegePayload = {
  id: string;
  name: string;
  code?: string | null;
  dean_user_id?: string | null;
};

type DepartmentPayload = {
  id: string;
  college_id?: string | null;
  name: string;
  code?: string | null;
  chair_user_id?: string | null;
};

type Person = {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string | null;
  department?: string | null;
  departmentId?: string | null;
  status: string;
  roleId: string;
  roleKey: string;
  roleName: string;
};

type College = {
  id: string;
  name: string;
  code: string | null;
  deanUserId: string | null;
};

type Department = {
  id: string;
  collegeId: string | null;
  name: string;
  code: string | null;
  chairUserId: string | null;
};

type CollegeDraft = {
  name: string;
  code: string;
  deanUserId: string;
};

type DepartmentDraft = {
  name: string;
  code: string;
  collegeId: string;
  chairUserId: string;
};

type HierarchyPayload = {
  colleges?: CollegePayload[];
  departments?: DepartmentPayload[];
  users?: Person[];
};

const emptyCollegeDraft: CollegeDraft = {
  name: "",
  code: "",
  deanUserId: "",
};

const emptyDepartmentDraft: DepartmentDraft = {
  name: "",
  code: "",
  collegeId: "",
  chairUserId: "",
};

const normalizeCollege = (college: CollegePayload): College => ({
  id: college.id,
  name: college.name,
  code: college.code ?? null,
  deanUserId: college.dean_user_id ?? null,
});

const normalizeDepartment = (department: DepartmentPayload): Department => ({
  id: department.id,
  collegeId: department.college_id ?? null,
  name: department.name,
  code: department.code ?? null,
  chairUserId: department.chair_user_id ?? null,
});

const formatUnitName = (unit: { name: string; code?: string | null }) =>
  unit.code ? `${unit.code} - ${unit.name}` : unit.name;

const sortPeople = (people: Person[]) =>
  [...people].sort((left, right) => left.fullName.localeCompare(right.fullName));

const activeAssignablePeople = (users: Person[]) =>
  sortPeople(users.filter((user) => user.status !== "disabled" && user.roleKey !== "org_admin"));

const leaderCandidates = (users: Person[], preferredRoleKey: string) =>
  activeAssignablePeople(users).sort((left, right) => {
    const leftPreferred = left.roleKey === preferredRoleKey ? 0 : 1;
    const rightPreferred = right.roleKey === preferredRoleKey ? 0 : 1;

    if (leftPreferred !== rightPreferred) {
      return leftPreferred - rightPreferred;
    }

    return left.fullName.localeCompare(right.fullName);
  });

const getPersonGroup = (person: Person) => {
  if (person.roleKey === "faculty" || person.roleKey === "teacher") {
    return "Faculty / Teachers";
  }

  if (
    person.roleKey.includes("manager") ||
    person.roleKey.includes("head") ||
    person.roleKey.includes("chair")
  ) {
    return "Academic Operations";
  }

  return "Personnel";
};

function PersonLine({
  person,
  departments,
  selectedDepartmentId,
  isSaving,
  onDepartmentChange,
  onAssign,
  onRemove,
}: {
  person: Person;
  departments: Department[];
  selectedDepartmentId?: string;
  isSaving: boolean;
  onDepartmentChange?: (departmentId: string) => void;
  onAssign?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="grid gap-3 border-t border-[var(--color-default)] px-4 py-3 first:border-t-0 md:grid-cols-[1fr_240px_auto] md:items-center">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--color-high-emphasis)]">
          {person.fullName}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--color-low-emphasis)]">
          <span>{person.roleName}</span>
          {person.employeeId ? <span>ID {person.employeeId}</span> : null}
          <span>{person.email}</span>
        </div>
      </div>

      {onDepartmentChange ? (
        <select
          value={selectedDepartmentId ?? ""}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="h-10 rounded-md border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none"
          aria-label={`Department for ${person.fullName}`}
        >
          <option value="">Select department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {formatUnitName(department)}
            </option>
          ))}
        </select>
      ) : (
        <div />
      )}

      <div className="flex justify-end gap-2">
        {onAssign ? (
          <button
            type="button"
            onClick={onAssign}
            disabled={isSaving || !selectedDepartmentId}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            Assign
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={isSaving}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function Departments() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<Person[]>([]);
  const [collegeForm, setCollegeForm] = useState<CollegeDraft>(emptyCollegeDraft);
  const [departmentForm, setDepartmentForm] = useState<DepartmentDraft>(emptyDepartmentDraft);
  const [editingCollegeId, setEditingCollegeId] = useState("");
  const [editingDepartmentId, setEditingDepartmentId] = useState("");
  const [collegeDraft, setCollegeDraft] = useState<CollegeDraft>(emptyCollegeDraft);
  const [departmentDraft, setDepartmentDraft] = useState<DepartmentDraft>(emptyDepartmentDraft);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingKey, setSavingKey] = useState("");

  const deanCandidates = useMemo(() => leaderCandidates(users, "dean"), [users]);
  const chairCandidates = useMemo(() => leaderCandidates(users, "department_head"), [users]);
  const assignablePeople = useMemo(() => activeAssignablePeople(users), [users]);
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const leadershipAssignedUserIds = useMemo(
    () =>
      new Set(
        [
          ...colleges.map((college) => college.deanUserId),
          ...departments.map((department) => department.chairUserId),
        ].filter((userId): userId is string => Boolean(userId)),
      ),
    [colleges, departments],
  );

  const departmentsByCollege = useMemo(() => {
    const grouped = new Map<string, Department[]>();

    for (const department of departments) {
      const key = department.collegeId ?? "";
      grouped.set(key, [...(grouped.get(key) ?? []), department]);
    }

    for (const [key, group] of grouped) {
      grouped.set(
        key,
        group.sort((left, right) => left.name.localeCompare(right.name)),
      );
    }

    return grouped;
  }, [departments]);

  const usersByDepartment = useMemo(() => {
    const grouped = new Map<string, Person[]>();

    for (const user of activeAssignablePeople(users)) {
      if (!user.departmentId) {
        continue;
      }

      grouped.set(user.departmentId, [...(grouped.get(user.departmentId) ?? []), user]);
    }

    for (const [key, group] of grouped) {
      grouped.set(key, sortPeople(group));
    }

    return grouped;
  }, [users]);

  const legacyGroups = useMemo(() => {
    const grouped = new Map<string, Person[]>();

    for (const user of activeAssignablePeople(users)) {
      const legacyDepartment = user.department?.trim();
      if (leadershipAssignedUserIds.has(user.id) || user.departmentId || !legacyDepartment) {
        continue;
      }

      grouped.set(legacyDepartment, [...(grouped.get(legacyDepartment) ?? []), user]);
    }

    return Array.from(grouped.entries())
      .map(([name, people]) => ({ name, people: sortPeople(people) }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [leadershipAssignedUserIds, users]);

  const unassignedPeople = useMemo(
    () =>
      activeAssignablePeople(users).filter(
        (user) =>
          !leadershipAssignedUserIds.has(user.id) &&
          !user.departmentId &&
          !user.department?.trim(),
      ),
    [leadershipAssignedUserIds, users],
  );

  const applyPayload = useCallback((payload: HierarchyPayload) => {
    setColleges((payload.colleges ?? []).map(normalizeCollege));
    setDepartments((payload.departments ?? []).map(normalizeDepartment));
    setUsers(payload.users ?? []);
  }, []);

  const loadHierarchy = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    setActionError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Please sign in to manage departments.");
      return;
    }

    const response = await fetch("/api/tenant/departments", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setIsLoading(false);
      setLoadError(payload?.error || "Failed to load departments hierarchy.");
      return;
    }

    applyPayload(payload as HierarchyPayload);
    setIsLoading(false);
  }, [applyPayload]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHierarchy();
  }, [loadHierarchy]);

  const mutateHierarchy = async (
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
    savingLabel: string,
  ) => {
    setActionError("");
    setSavingKey(savingLabel);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setSavingKey("");
      setActionError("Session expired. Please log in again.");
      return false;
    }

    const response = await fetch("/api/tenant/departments", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    setSavingKey("");

    if (!response.ok) {
      setActionError(payload?.error || "Failed to update departments hierarchy.");
      return false;
    }

    applyPayload(payload as HierarchyPayload);
    return true;
  };

  const handleCreateCollege = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!collegeForm.name.trim()) {
      setActionError("College name is required.");
      return;
    }

    const saved = await mutateHierarchy(
      "POST",
      {
        entity: "college",
        name: collegeForm.name,
        code: collegeForm.code || null,
        deanUserId: collegeForm.deanUserId || null,
      },
      "create-college",
    );

    if (saved) {
      setCollegeForm(emptyCollegeDraft);
    }
  };

  const handleCreateDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!departmentForm.name.trim()) {
      setActionError("Department name is required.");
      return;
    }

    const saved = await mutateHierarchy(
      "POST",
      {
        entity: "department",
        name: departmentForm.name,
        code: departmentForm.code || null,
        collegeId: departmentForm.collegeId || null,
        chairUserId: departmentForm.chairUserId || null,
      },
      "create-department",
    );

    if (saved) {
      setDepartmentForm(emptyDepartmentDraft);
    }
  };

  const startCollegeEdit = (college: College) => {
    setEditingCollegeId(college.id);
    setCollegeDraft({
      name: college.name,
      code: college.code ?? "",
      deanUserId: college.deanUserId ?? "",
    });
  };

  const startDepartmentEdit = (department: Department) => {
    setEditingDepartmentId(department.id);
    setDepartmentDraft({
      name: department.name,
      code: department.code ?? "",
      collegeId: department.collegeId ?? "",
      chairUserId: department.chairUserId ?? "",
    });
  };

  const saveCollege = async (collegeId: string) => {
    if (!collegeDraft.name.trim()) {
      setActionError("College name is required.");
      return;
    }

    const saved = await mutateHierarchy(
      "PATCH",
      {
        entity: "college",
        id: collegeId,
        name: collegeDraft.name,
        code: collegeDraft.code || null,
        deanUserId: collegeDraft.deanUserId || null,
      },
      `college-${collegeId}`,
    );

    if (saved) {
      setEditingCollegeId("");
    }
  };

  const saveDepartment = async (departmentId: string) => {
    if (!departmentDraft.name.trim()) {
      setActionError("Department name is required.");
      return;
    }

    const saved = await mutateHierarchy(
      "PATCH",
      {
        entity: "department",
        id: departmentId,
        name: departmentDraft.name,
        code: departmentDraft.code || null,
        collegeId: departmentDraft.collegeId || null,
        chairUserId: departmentDraft.chairUserId || null,
      },
      `department-${departmentId}`,
    );

    if (saved) {
      setEditingDepartmentId("");
    }
  };

  const assignPerson = async (personId: string, departmentId: string | null) => {
    const saved = await mutateHierarchy(
      "PATCH",
      {
        entity: "user",
        id: personId,
        departmentId,
      },
      `user-${personId}`,
    );

    if (saved) {
      setAssignmentDrafts((current) => {
        const next = { ...current, [personId]: "" };

        for (const key of Object.keys(next)) {
          if (next[key] === personId) {
            next[key] = "";
          }
        }

        return next;
      });
    }
  };

  const renderLeaderSelect = (
    value: string,
    onChange: (value: string) => void,
    candidates: Person[],
    label: string,
    emptyLabel: string,
  ) => (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none"
      aria-label={label}
    >
      <option value="">{emptyLabel}</option>
      {candidates.map((person) => (
        <option key={person.id} value={person.id}>
          {person.fullName} - {person.roleName}
        </option>
      ))}
    </select>
  );

  const renderDepartment = (department: Department) => {
    const people = usersByDepartment.get(department.id) ?? [];
    const chair = department.chairUserId ? usersById.get(department.chairUserId) : null;
    const groupedPeople = people
      .filter((person) => person.id !== department.chairUserId)
      .reduce<Record<string, Person[]>>((groups, person) => {
        const group = getPersonGroup(person);
        groups[group] = [...(groups[group] ?? []), person];
        return groups;
      }, {});
    const selectedAssignment = assignmentDrafts[department.id] ?? "";

    return (
      <div
        key={department.id}
        className="overflow-hidden rounded-lg border border-[var(--color-default)] bg-white"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 bg-[#f8fafc] px-4 py-4">
          {editingDepartmentId === department.id ? (
            <div className="grid flex-1 gap-3 lg:grid-cols-[1.4fr_120px_1fr_1.2fr]">
              <input
                value={departmentDraft.name}
                onChange={(event) =>
                  setDepartmentDraft((current) => ({ ...current, name: event.target.value }))
                }
                className="h-10 rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
                aria-label="Department name"
              />
              <input
                value={departmentDraft.code}
                onChange={(event) =>
                  setDepartmentDraft((current) => ({ ...current, code: event.target.value }))
                }
                className="h-10 rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
                aria-label="Department code"
                placeholder="Code"
              />
              <select
                value={departmentDraft.collegeId}
                onChange={(event) =>
                  setDepartmentDraft((current) => ({
                    ...current,
                    collegeId: event.target.value,
                  }))
                }
                className="h-10 rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
                aria-label="Department college"
              >
                <option value="">Unassigned college</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {formatUnitName(college)}
                  </option>
                ))}
              </select>
              {renderLeaderSelect(
                departmentDraft.chairUserId,
                (value) =>
                  setDepartmentDraft((current) => ({ ...current, chairUserId: value })),
                chairCandidates,
                "Department chair",
                "No assigned chair",
              )}
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-[var(--color-high-emphasis)]">
                  {formatUnitName(department)}
                </h3>
                <span className="rounded-full bg-[#ecf8f6] px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {people.length} assigned
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-low-emphasis)]">
                <span>Chair: {chair?.fullName ?? "Unassigned"}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {editingDepartmentId === department.id ? (
              <>
                <button
                  type="button"
                  onClick={() => saveDepartment(department.id)}
                  disabled={Boolean(savingKey)}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDepartmentId("")}
                  className="h-9 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-high-emphasis)]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => startDepartmentEdit(department)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    mutateHierarchy(
                      "DELETE",
                      { entity: "department", id: department.id },
                      `delete-department-${department.id}`,
                    )
                  }
                  disabled={Boolean(savingKey)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <select
              value={selectedAssignment}
              onChange={(event) =>
                setAssignmentDrafts((current) => ({
                  ...current,
                  [department.id]: event.target.value,
                }))
              }
              className="h-10 rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
              aria-label={`Assign personnel to ${department.name}`}
            >
              <option value="">Add personnel</option>
              {assignablePeople.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName} - {person.roleName}
                </option>
              ))}
            </select>
            <div className="hidden md:block" />
            <button
              type="button"
              disabled={!selectedAssignment || Boolean(savingKey)}
              onClick={() => assignPerson(selectedAssignment, department.id)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Assign
            </button>
          </div>
        </div>

        {chair ? (
          <div className="border-t border-[var(--color-default)]">
            <div className="bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-low-emphasis)]">
              Chair
            </div>
            <PersonLine
              person={chair}
              departments={departments}
              isSaving={Boolean(savingKey)}
            />
          </div>
        ) : null}

        {Object.entries(groupedPeople).map(([group, groupPeople]) => (
          <div key={group} className="border-t border-[var(--color-default)]">
            <div className="bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-low-emphasis)]">
              {group}
            </div>
            {groupPeople.map((person) => (
              <PersonLine
                key={person.id}
                person={person}
                departments={departments}
                isSaving={Boolean(savingKey)}
                onRemove={() => assignPerson(person.id, null)}
              />
            ))}
          </div>
        ))}

        {!chair && people.length === 0 ? (
          <div className="border-t border-[var(--color-default)] px-4 py-5 text-sm text-[var(--color-low-emphasis)]">
            No personnel assigned yet.
          </div>
        ) : null}
      </div>
    );
  };

  const renderCollege = (college: College) => {
    const dean = college.deanUserId ? usersById.get(college.deanUserId) : null;
    const collegeDepartments = departmentsByCollege.get(college.id) ?? [];

    return (
      <section key={college.id} className="space-y-3">
        <div className="rounded-lg border border-[var(--color-default)] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {editingCollegeId === college.id ? (
              <div className="grid flex-1 gap-3 lg:grid-cols-[1.4fr_120px_1.2fr]">
                <input
                  value={collegeDraft.name}
                  onChange={(event) =>
                    setCollegeDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  className="h-10 rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
                  aria-label="College name"
                />
                <input
                  value={collegeDraft.code}
                  onChange={(event) =>
                    setCollegeDraft((current) => ({ ...current, code: event.target.value }))
                  }
                  className="h-10 rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
                  aria-label="College code"
                  placeholder="Code"
                />
                {renderLeaderSelect(
                  collegeDraft.deanUserId,
                  (value) =>
                    setCollegeDraft((current) => ({ ...current, deanUserId: value })),
                  deanCandidates,
                  "College dean",
                  "No assigned dean",
                )}
              </div>
            ) : (
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Building2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
                  <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
                    {formatUnitName(college)}
                  </h2>
                  <span className="rounded-full bg-[#ecf8f6] px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
                    {collegeDepartments.length} departments
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-low-emphasis)]">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                  Dean: {dean?.fullName ?? "Unassigned"}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {editingCollegeId === college.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => saveCollege(college.id)}
                    disabled={Boolean(savingKey)}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:opacity-60"
                  >
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCollegeId("")}
                    className="h-9 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-high-emphasis)]"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startCollegeEdit(college)}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      mutateHierarchy(
                        "DELETE",
                        { entity: "college", id: college.id },
                        `delete-college-${college.id}`,
                      )
                    }
                    disabled={Boolean(savingKey)}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 pl-0 lg:pl-6">
          {collegeDepartments.length > 0 ? (
            collegeDepartments.map(renderDepartment)
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--color-default)] bg-white px-4 py-5 text-sm text-[var(--color-low-emphasis)]">
              No departments inside this college yet.
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderUnassignedDepartmentSection = () => {
    const unassignedDepartments = departmentsByCollege.get("") ?? [];

    if (unassignedDepartments.length === 0) {
      return null;
    }

    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
            Unassigned College
          </h2>
        </div>
        <div className="space-y-3">
          {unassignedDepartments.map(renderDepartment)}
        </div>
      </section>
    );
  };

  const renderLegacyPeople = () => {
    if (legacyGroups.length === 0 && unassignedPeople.length === 0) {
      return null;
    }

    return (
      <section className="space-y-4 rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-2">
          <UsersRound className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
            Unassigned Personnel
          </h2>
        </div>

        {legacyGroups.map((group) => (
          <div key={group.name} className="overflow-hidden rounded-lg border border-[var(--color-default)]">
            <div className="bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[var(--color-high-emphasis)]">
              Legacy department: {group.name}
            </div>
            {group.people.map((person) => (
              <PersonLine
                key={person.id}
                person={person}
                departments={departments}
                selectedDepartmentId={assignmentDrafts[person.id] ?? ""}
                isSaving={Boolean(savingKey)}
                onDepartmentChange={(departmentId) =>
                  setAssignmentDrafts((current) => ({
                    ...current,
                    [person.id]: departmentId,
                  }))
                }
                onAssign={() => assignPerson(person.id, assignmentDrafts[person.id] ?? "")}
              />
            ))}
          </div>
        ))}

        {unassignedPeople.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-[var(--color-default)]">
            <div className="bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[var(--color-high-emphasis)]">
              No department
            </div>
            {unassignedPeople.map((person) => (
              <PersonLine
                key={person.id}
                person={person}
                departments={departments}
                selectedDepartmentId={assignmentDrafts[person.id] ?? ""}
                isSaving={Boolean(savingKey)}
                onDepartmentChange={(departmentId) =>
                  setAssignmentDrafts((current) => ({
                    ...current,
                    [person.id]: departmentId,
                  }))
                }
                onAssign={() => assignPerson(person.id, assignmentDrafts[person.id] ?? "")}
              />
            ))}
          </div>
        ) : null}
      </section>
    );
  };

  if (isLoading) {
    return (
      <TenantLoadingScreen
        className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        label="Loading colleges and departments"
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Colleges & Departments</h1>
          <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
            {colleges.length} college{colleges.length === 1 ? "" : "s"} and{" "}
            {departments.length} department{departments.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={loadHierarchy}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-default)] px-4 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {actionError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <form
          onSubmit={handleCreateCollege}
          className="space-y-4 rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[var(--color-high-emphasis)]">
              Add College
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
            <input
              value={collegeForm.name}
              onChange={(event) =>
                setCollegeForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="College name"
              className="h-11 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
            />
            <input
              value={collegeForm.code}
              onChange={(event) =>
                setCollegeForm((current) => ({ ...current, code: event.target.value }))
              }
              placeholder="Code"
              className="h-11 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
            />
          </div>
          {renderLeaderSelect(
            collegeForm.deanUserId,
            (value) => setCollegeForm((current) => ({ ...current, deanUserId: value })),
            deanCandidates,
            "College dean",
            "No assigned dean",
          )}
          <button
            type="submit"
            disabled={savingKey === "create-college"}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {savingKey === "create-college" ? "Adding..." : "Add College"}
          </button>
        </form>

        <form
          onSubmit={handleCreateDepartment}
          className="space-y-4 rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[var(--color-high-emphasis)]">
              Add Department
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
            <input
              value={departmentForm.name}
              onChange={(event) =>
                setDepartmentForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Department name"
              className="h-11 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
            />
            <input
              value={departmentForm.code}
              onChange={(event) =>
                setDepartmentForm((current) => ({ ...current, code: event.target.value }))
              }
              placeholder="Code"
              className="h-11 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={departmentForm.collegeId}
              onChange={(event) =>
                setDepartmentForm((current) => ({
                  ...current,
                  collegeId: event.target.value,
                }))
              }
              className="h-10 rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none"
              aria-label="Department college"
            >
              <option value="">Unassigned college</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {formatUnitName(college)}
                </option>
              ))}
            </select>
            {renderLeaderSelect(
              departmentForm.chairUserId,
              (value) =>
                setDepartmentForm((current) => ({ ...current, chairUserId: value })),
              chairCandidates,
              "Department chair",
              "No assigned chair",
            )}
          </div>
          <button
            type="submit"
            disabled={savingKey === "create-department"}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {savingKey === "create-department" ? "Adding..." : "Add Department"}
          </button>
        </form>
      </section>

      <div className="space-y-6">
        {colleges.length > 0 ? (
          colleges.map(renderCollege)
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--color-default)] bg-white px-6 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
            No colleges yet.
          </div>
        )}

        {renderUnassignedDepartmentSection()}
        {renderLegacyPeople()}
      </div>
    </div>
  );
}
