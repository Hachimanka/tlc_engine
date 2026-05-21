"use client";

import { Maximize2, Minimize2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StyledSelect from "@/components/Global/StyledSelect";

export type TenantRoleUser = {
  id: string;
  fullName: string;
  schoolEmail: string;
  roleName: string;
  roleKey: string;
  description: string;
  employeeId?: string | null;
};

export type RoleOption = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
};

export const initialRoleUsers: TenantRoleUser[] = [];

type UserRolesProps = {
  roleUsers: TenantRoleUser[];
  roles: RoleOption[];
  selectedRoleId: string;
  isExpanded: boolean;
  onAddUser: () => void;
  onExpandedChange: (isExpanded: boolean) => void;
  onSelectRole: (roleId: string) => void;
  onVisibleRoleIdsChange: (roleIds: string[]) => void;
};

export default function UserRoles({
  roleUsers,
  roles,
  selectedRoleId,
  isExpanded,
  onAddUser,
  onExpandedChange,
  onSelectRole,
  onVisibleRoleIdsChange,
}: UserRolesProps) {
  const [search, setSearch] = useState("");
  const roleOptions = useMemo(
    () => ["All Roles", ...roles.map((role) => role.name)],
    [roles],
  );
  const [roleFilter, setRoleFilter] = useState("All Roles");

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return roleUsers.filter((user) => {
      const matchesRole = roleFilter === "All Roles" || user.roleName === roleFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.fullName.toLowerCase().includes(normalizedSearch) ||
        user.roleName.toLowerCase().includes(normalizedSearch) ||
        user.id.toLowerCase().includes(normalizedSearch) ||
        (user.employeeId || "").toLowerCase().includes(normalizedSearch) ||
        user.schoolEmail.toLowerCase().includes(normalizedSearch);

      return matchesRole && matchesSearch;
    });
  }, [roleFilter, roleUsers, search]);

  const visibleRoleIds = useMemo(
    () => filteredUsers.map((user) => user.id),
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
              onClick={onAddUser}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 text-xs font-medium text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add User
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

          <div className="min-w-[150px]">
            <span className="sr-only">Filter by role</span>
            <StyledSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions.map((role) => ({ value: role, label: role }))}
              className="[&_button]:h-10"
            />
          </div>
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
                        No users assigned yet. Add a user to assign a role.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedRoleId === user.id;

                      return (
                        <tr
                          key={user.id}
                          onClick={() => onSelectRole(user.id)}
                          className={`cursor-pointer transition hover:bg-[#ecf8f6] ${
                            isSelected ? "bg-[#e0f4f1]" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-xs font-medium text-[var(--color-high-emphasis)]">
                            {user.employeeId || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                            {user.fullName}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                            {user.schoolEmail}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-[var(--color-primary)]">
                            {user.roleName}
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
                No users assigned yet. Add a user to assign a role.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedRoleId === user.id;

                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => onSelectRole(user.id)}
                    className={
                      isSelected
                        ? "w-full rounded-lg bg-[var(--color-primary)] px-3 py-4 text-left text-white"
                        : "w-full rounded-lg border border-transparent px-3 py-3 text-left text-[var(--color-high-emphasis)] transition hover:border-[var(--color-default)] hover:bg-[#ecf8f6]"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold">{user.roleName}</h2>
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
                        {user.employeeId || "—"}
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
    </>
  );
}
