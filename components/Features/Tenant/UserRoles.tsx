"use client";

import { ChevronDown, Maximize2, Minimize2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CreateRoleModal, { type CreatedRole } from "./CreateRoleModal";

export type TenantRoleUser = {
  idNo: string;
  fullName: string;
  schoolEmail: string;
  role: string;
  description: string;
};

const roleOptions = [
  "All Roles",
  "Dean",
  "VPAA",
  "Coordinator",
  "Department Head",
  "Teacher",
] as const;

export const initialRoleUsers: TenantRoleUser[] = [
  {
    idNo: "TLC-1001",
    fullName: "Andrea Mae Santos",
    schoolEmail: "andrea.santos@email.edu",
    role: "Dean",
    description: "College Dean with full department oversight",
  },
  {
    idNo: "TLC-1002",
    fullName: "Miguel Rafael Dizon",
    schoolEmail: "miguel.dizon@email.edu",
    role: "Dean",
    description: "College Dean for academic operations",
  },
  {
    idNo: "TLC-1003",
    fullName: "Patricia Anne Mercado",
    schoolEmail: "patricia.mercado@email.edu",
    role: "VPAA",
    description: "Vice President for Academic Affairs",
  },
  {
    idNo: "TLC-1004",
    fullName: "Leonardo Cruz",
    schoolEmail: "leonardo.cruz@email.edu",
    role: "VPAA",
    description: "Academic affairs reviewer and approver",
  },
  {
    idNo: "TLC-1005",
    fullName: "Carlo Mateo Reyes",
    schoolEmail: "carlo.reyes@email.edu",
    role: "Coordinator",
    description: "Program Coordinator",
  },
  {
    idNo: "TLC-1006",
    fullName: "Elaine Joy Navarro",
    schoolEmail: "elaine.navarro@email.edu",
    role: "Coordinator",
    description: "Coordinates program schedules and subject loads",
  },
  {
    idNo: "TLC-1007",
    fullName: "Francesca Lim",
    schoolEmail: "francesca.lim@email.edu",
    role: "Department Head",
    description: "Department Head with faculty management",
  },
  {
    idNo: "TLC-1008",
    fullName: "Jonathan dela Pena",
    schoolEmail: "jonathan.pena@email.edu",
    role: "Department Head",
    description: "Department Head for subject assignment review",
  },
  {
    idNo: "TLC-1009",
    fullName: "Maria Lourdes Bautista",
    schoolEmail: "maria.bautista@email.edu",
    role: "Department Head",
    description: "Department Head for curriculum load planning",
  },
  {
    idNo: "TLC-1010",
    fullName: "Josephine Bracken",
    schoolEmail: "josephine.bracken@email.edu",
    role: "Teacher",
    description: "Faculty member with assigned teaching loads",
  },
  {
    idNo: "TLC-1011",
    fullName: "Jose Antonio Reyes",
    schoolEmail: "jose.reyes@email.edu",
    role: "Teacher",
    description: "Faculty member for lecture and laboratory classes",
  },
  {
    idNo: "TLC-1012",
    fullName: "Maria Clara Santos",
    schoolEmail: "maria.santos@email.edu",
    role: "Teacher",
    description: "Faculty member for academic instruction",
  },
  {
    idNo: "TLC-1013",
    fullName: "Juan Carlos dela Cruz",
    schoolEmail: "juan.cruz@email.edu",
    role: "Teacher",
    description: "Faculty member with active class assignments",
  },
  {
    idNo: "TLC-1014",
    fullName: "Sofia Beatriz Ramos",
    schoolEmail: "sofia.ramos@email.edu",
    role: "Teacher",
    description: "Faculty member for departmental teaching loads",
  },
];

type UserRolesProps = {
  roleUsers: TenantRoleUser[];
  selectedRoleId: string;
  isExpanded: boolean;
  onCreateRole: (createdRole: CreatedRole) => void;
  onExpandedChange: (isExpanded: boolean) => void;
  onSelectRole: (roleId: string) => void;
  onVisibleRoleIdsChange: (roleIds: string[]) => void;
};

export default function UserRoles({
  roleUsers,
  selectedRoleId,
  isExpanded,
  onCreateRole,
  onExpandedChange,
  onSelectRole,
  onVisibleRoleIdsChange,
}: UserRolesProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof roleOptions)[number]>("All Roles");
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return roleUsers.filter((user) => {
      const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.fullName.toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch) ||
        user.idNo.toLowerCase().includes(normalizedSearch) ||
        Boolean(user.schoolEmail?.toLowerCase().includes(normalizedSearch));

      return matchesRole && matchesSearch;
    });
  }, [roleFilter, roleUsers, search]);

  const visibleRoleIds = useMemo(
    () => filteredUsers.map((user) => user.idNo),
    [filteredUsers],
  );

  useEffect(() => {
    onVisibleRoleIdsChange(visibleRoleIds);
  }, [onVisibleRoleIdsChange, visibleRoleIds]);

  return (
    <>
      <section
        className={`flex h-full min-h-0 flex-col rounded-lg bg-white px-5 py-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition-[max-width,width] duration-200 ${
          isExpanded ? "w-full max-w-none" : "w-full max-w-[360px]"
        }`}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-black">Roles</h1>
            <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
              {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={isExpanded ? "Collapse roles panel" : "Expand roles panel"}
              title={isExpanded ? "Collapse" : "Expand"}
              onClick={() => onExpandedChange(!isExpanded)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-default)] text-[var(--color-primary)] transition hover:bg-[#ecf8f6] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsCreateRoleOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 text-xs font-medium text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Create Role
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
            <span className="sr-only">Search roles</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search role, name, ID, or email..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
            />
          </label>

          <label className="relative flex h-10 items-center rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
            <span className="sr-only">Filter by role</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as (typeof roleOptions)[number])}
              className="h-full min-w-[150px] appearance-none bg-transparent pr-8 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
            >
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--color-low-emphasis)]"
              aria-hidden="true"
            />
          </label>
        </div>

        {isExpanded ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--color-default)]">
            <div className="h-full overflow-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-[var(--color-primary)] text-white">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold">ID No.</th>
                    <th className="px-4 py-3 text-xs font-semibold">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-default)] bg-white">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
                        No roles found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedRoleId === user.idNo;

                      return (
                      <tr
                        key={user.idNo}
                        onClick={() => onSelectRole(user.idNo)}
                        className={`cursor-pointer transition hover:bg-[#ecf8f6] ${
                          isSelected ? "bg-[#e0f4f1]" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-xs font-medium text-[var(--color-high-emphasis)]">
                          {user.idNo}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                          {user.fullName}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                          {user.schoolEmail}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-[var(--color-primary)]">
                          {user.role}
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--color-default)] px-4 py-8 text-center text-sm text-[var(--color-low-emphasis)]">
                No roles found.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedRoleId === user.idNo;

                return (
                  <button
                    type="button"
                    key={user.idNo}
                    onClick={() => onSelectRole(user.idNo)}
                    className={
                      isSelected
                        ? "w-full rounded-lg bg-[var(--color-primary)] px-3 py-4 text-left text-white"
                        : "w-full rounded-lg border border-transparent px-3 py-3 text-left text-[var(--color-high-emphasis)] transition hover:border-[var(--color-default)] hover:bg-[#ecf8f6]"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold">{user.role}</h2>
                        <p
                          className={`mt-1 text-xs font-medium ${
                            isSelected ? "text-white" : "text-[var(--color-high-emphasis)]"
                          }`}
                        >
                          {user.fullName}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-medium ${
                          isSelected ? "text-white/80" : "text-[var(--color-low-emphasis)]"
                        }`}
                      >
                        {user.idNo}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-xs leading-relaxed ${
                        isSelected ? "text-white/90" : "text-[var(--color-low-emphasis)]"
                      }`}
                    >
                      {user.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        )}
      </section>

      <CreateRoleModal
        isOpen={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        onCreateRole={onCreateRole}
      />
    </>
  );
}
