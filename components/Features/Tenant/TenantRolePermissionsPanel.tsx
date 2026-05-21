"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import CreateRoleModal, { type CreatedRole } from "./CreateRoleModal";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import type {
  FeatureDefinition,
  FeatureKey,
} from "@/features/tenant-feature-catalog";
import { supabase } from "@/lib/supabaseClient";

type TenantUser = {
  id: string;
  fullName: string;
  schoolEmail: string;
  roleId: string;
  roleName: string;
  roleKey: string;
  featureKeys: string[];
  employeeId?: string | null;
  department?: string | null;
  status: string;
};

type RoleAccess = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  featureKeys: string[];
};

type RolePayload = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  is_system?: boolean;
  featureKeys?: string[];
};

type UserPayload = {
  id: string;
  full_name: string;
  email: string;
  employee_id?: string | null;
  department?: string | null;
  role_id: string;
  status?: string;
  featureKeys?: string[];
  roles?: unknown;
};

const sameStringSet = (left: string[], right: string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
};

const normalizeJoinedRole = (role: unknown) => {
  if (Array.isArray(role)) {
    return role[0] as { id?: string; key?: string; name?: string } | undefined;
  }

  return role as { id?: string; key?: string; name?: string } | undefined;
};

const groupFeatures = (features: FeatureDefinition[]) => {
  const groups = features.reduce<Record<string, FeatureDefinition[]>>((currentGroups, feature) => {
    currentGroups[feature.group] = [...(currentGroups[feature.group] ?? []), feature];
    return currentGroups;
  }, {});

  for (const group of Object.keys(groups)) {
    groups[group] = groups[group].sort((left, right) => left.label.localeCompare(right.label));
  }

  return groups;
};

function UsersSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading users with role">
      <span className="sr-only">Loading users with role</span>
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="grid animate-pulse gap-3 rounded-lg border border-[var(--color-default)] px-4 py-4 md:grid-cols-[110px_1fr_1fr_160px_80px]"
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <BrandedSkeletonBlock key={index} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TenantRolePermissionsPanel() {
  const [roles, setRoles] = useState<RoleAccess[]>([]);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [roleNameDraft, setRoleNameDraft] = useState("");
  const [roleDescriptionDraft, setRoleDescriptionDraft] = useState("");
  const [userFeatureDraft, setUserFeatureDraft] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [userFeatureError, setUserFeatureError] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isSavingUserFeatures, setIsSavingUserFeatures] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isRoleUsersLoading, setIsRoleUsersLoading] = useState(false);
  const selectedRoleIdRef = useRef("");
  const roleUsersTimerRef = useRef<number | null>(null);

  const assignableFeatures = useMemo(
    () => features.filter((feature) => feature.status === "active" && !feature.adminOnly),
    [features],
  );
  const groupedFeatures = useMemo(() => groupFeatures(assignableFeatures), [assignableFeatures]);
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );
  const selectedRoleUsers = useMemo(
    () => users.filter((user) => user.roleId === selectedRoleId),
    [selectedRoleId, users],
  );
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );
  const filteredRoles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return roles;
    }

    return roles.filter((role) =>
      role.name.toLowerCase().includes(normalizedSearch) ||
      role.key.toLowerCase().includes(normalizedSearch) ||
      (role.description ?? "").toLowerCase().includes(normalizedSearch),
    );
  }, [roles, search]);
  const hasRoleChanges = useMemo(() => {
    if (!selectedRole) {
      return false;
    }

    return (
      roleNameDraft.trim() !== selectedRole.name ||
      (roleDescriptionDraft.trim() || "") !== (selectedRole.description ?? "")
    );
  }, [roleDescriptionDraft, roleNameDraft, selectedRole]);
  const hasUserFeatureChanges = useMemo(() => {
    if (!selectedUser) {
      return false;
    }

    return !sameStringSet(userFeatureDraft, selectedUser.featureKeys);
  }, [selectedUser, userFeatureDraft]);

  const loadAccessData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    setSaveError("");
    setUserFeatureError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Please sign in to manage roles.");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const [rolesResponse, usersResponse] = await Promise.all([
      fetch("/api/tenant/roles", { headers }),
      fetch("/api/tenant/users", { headers }),
    ]);
    const rolesPayload = await rolesResponse.json().catch(() => ({}));
    const usersPayload = await usersResponse.json().catch(() => ({}));

    if (!rolesResponse.ok) {
      setIsLoading(false);
      setLoadError(rolesPayload?.error || "Failed to load roles.");
      return;
    }

    if (!usersResponse.ok) {
      setIsLoading(false);
      setLoadError(usersPayload?.error || "Failed to load users.");
      return;
    }

    const nextRoles: RoleAccess[] = ((rolesPayload.roles ?? []) as RolePayload[]).map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description ?? null,
      isSystem: Boolean(role.isSystem ?? role.is_system),
      featureKeys: role.featureKeys ?? [],
    }));
    const nextUsers: TenantUser[] = ((usersPayload.users ?? []) as UserPayload[]).map((user) => {
      const role = normalizeJoinedRole(user.roles);

      return {
        id: user.id,
        fullName: user.full_name,
        schoolEmail: user.email,
        employeeId: user.employee_id ?? null,
        department: user.department ?? null,
        roleId: user.role_id,
        roleKey: role?.key ?? "",
        roleName: role?.name ?? "Unassigned",
        status: user.status ?? "active",
        featureKeys: user.featureKeys ?? [],
      };
    });
    const nextSelectedRole =
      nextRoles.find((role) => role.id === selectedRoleIdRef.current) ??
      nextRoles.find((role) => role.key !== "org_admin") ??
      nextRoles[0] ??
      null;

    setFeatures(rolesPayload.features ?? []);
    setRoles(nextRoles);
    setUsers(nextUsers);
    setSelectedRoleId(nextSelectedRole?.id ?? "");
    selectedRoleIdRef.current = nextSelectedRole?.id ?? "";
    setRoleNameDraft(nextSelectedRole?.name ?? "");
    setRoleDescriptionDraft(nextSelectedRole?.description ?? "");
    setSelectedUserId("");
    setUserFeatureDraft([]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAccessData();
  }, [loadAccessData]);

  useEffect(() => {
    return () => {
      if (roleUsersTimerRef.current !== null) {
        window.clearTimeout(roleUsersTimerRef.current);
      }
    };
  }, []);

  const handleSelectRole = (role: RoleAccess) => {
    if (role.id === selectedRoleId) {
      return;
    }

    if (roleUsersTimerRef.current !== null) {
      window.clearTimeout(roleUsersTimerRef.current);
    }

    setIsRoleUsersLoading(true);
    setSelectedRoleId(role.id);
    selectedRoleIdRef.current = role.id;
    setRoleNameDraft(role.name);
    setRoleDescriptionDraft(role.description ?? "");
    setSelectedUserId("");
    setUserFeatureDraft([]);
    setUserFeatureError("");
    roleUsersTimerRef.current = window.setTimeout(() => {
      setIsRoleUsersLoading(false);
      roleUsersTimerRef.current = null;
    }, 350);
  };

  const handleCreateRole = async (payload: {
    name: string;
    description?: string;
  }): Promise<CreatedRole> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error("Session expired. Please log in again.");
    }

    const response = await fetch("/api/tenant/roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Failed to create role.");
    }

    const nextRole: RoleAccess = {
      id: data.role.id,
      key: data.role.key,
      name: data.role.name,
      description: data.role.description ?? null,
      isSystem: Boolean(data.role.isSystem),
      featureKeys: data.role.featureKeys ?? [],
    };

    setRoles((current) => [...current, nextRole]);
    handleSelectRole(nextRole);

    return nextRole;
  };

  const handleSaveRole = async () => {
    if (!selectedRole || selectedRole.key === "org_admin") {
      return;
    }

    setIsSavingRole(true);
    setSaveError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsSavingRole(false);
      setSaveError("Session expired. Please log in again.");
      return;
    }

    const response = await fetch(`/api/tenant/roles/${selectedRole.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: roleNameDraft.trim(),
        description: roleDescriptionDraft.trim(),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setIsSavingRole(false);

    if (!response.ok) {
      setSaveError(payload?.error || "Failed to save role.");
      return;
    }

    setRoles((current) =>
      current.map((role) =>
        role.id === selectedRole.id
          ? {
              ...role,
              name: payload.role.name,
              description: payload.role.description,
            }
          : role,
      ),
    );
    setUsers((current) =>
      current.map((user) =>
        user.roleId === selectedRole.id
          ? {
              ...user,
              roleName: payload.role.name,
            }
          : user,
      ),
    );
    setRoleNameDraft(payload.role.name);
    setRoleDescriptionDraft(payload.role.description ?? "");
  };

  const handleSelectUser = (user: TenantUser) => {
    setSelectedUserId(user.id);
    setUserFeatureDraft(user.featureKeys);
    setUserFeatureError("");
  };

  const handleUserFeatureToggle = (featureKey: FeatureKey, enabled: boolean) => {
    setUserFeatureDraft((current) => {
      if (enabled) {
        return Array.from(new Set([...current, featureKey]));
      }

      return current.filter((key) => key !== featureKey);
    });
  };

  const handleSaveUserFeatures = async () => {
    if (!selectedUser || selectedUser.roleKey === "org_admin") {
      return;
    }

    setIsSavingUserFeatures(true);
    setUserFeatureError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsSavingUserFeatures(false);
      setUserFeatureError("Session expired. Please log in again.");
      return;
    }

    const response = await fetch(`/api/tenant/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        featureKeys: userFeatureDraft,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setIsSavingUserFeatures(false);

    if (!response.ok) {
      setUserFeatureError(payload?.error || "Failed to save account features.");
      return;
    }

    const nextFeatureKeys = payload.user?.featureKeys ?? userFeatureDraft;
    setUsers((current) =>
      current.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              featureKeys: nextFeatureKeys,
            }
          : user,
      ),
    );
    setUserFeatureDraft(nextFeatureKeys);
  };

  if (loadError) {
    return (
      <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="text-sm text-red-600">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-6 overflow-hidden">
      <CreateRoleModal
        isOpen={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        onCreateRole={handleCreateRole}
      />

      <aside className="flex h-full w-full max-w-[420px] shrink-0 flex-col rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-black">Roles & Access</h1>
            <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
              {roles.length} role{roles.length === 1 ? "" : "s"} in this organization
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateRoleOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 text-xs font-medium text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Role
          </button>
        </div>

        <label className="mb-4 flex h-10 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
          <span className="sr-only">Search roles</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search role name or responsibility..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
          />
        </label>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {filteredRoles.map((role) => {
            const isSelected = selectedRoleId === role.id;
            const roleUserCount = users.filter((user) => user.roleId === role.id).length;

            return (
              <button
                type="button"
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={
                  isSelected
                    ? "w-full rounded-lg bg-[var(--color-primary)] px-3 py-4 text-left text-white"
                    : "w-full rounded-lg border border-transparent px-3 py-3 text-left text-[var(--color-high-emphasis)] transition hover:border-[var(--color-default)] hover:bg-[#ecf8f6]"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold">{role.name}</h2>
                    <p
                      className={`mt-1 text-xs ${
                        isSelected ? "text-white/85" : "text-[var(--color-low-emphasis)]"
                      }`}
                    >
                      {role.description || "Role label for account grouping"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isSelected
                        ? "bg-white/15 text-white"
                        : "bg-[#ecf8f6] text-[var(--color-primary)]"
                    }`}
                  >
                    {roleUserCount} user{roleUserCount === 1 ? "" : "s"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedRole ? (
          <div className="mt-4 space-y-3 border-t border-[var(--color-default)] pt-4">
            <h3 className="text-sm font-bold text-[var(--color-high-emphasis)]">
              Role Details
            </h3>
            <input
              value={roleNameDraft}
              onChange={(event) => setRoleNameDraft(event.target.value)}
              disabled={selectedRole.key === "org_admin"}
              className="h-10 w-full rounded-lg border border-[var(--color-default)] px-3 text-sm outline-none disabled:bg-[#f8fafc] disabled:text-[var(--color-low-emphasis)]"
              aria-label="Role name"
            />
            <textarea
              value={roleDescriptionDraft}
              onChange={(event) => setRoleDescriptionDraft(event.target.value)}
              disabled={selectedRole.key === "org_admin"}
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--color-default)] px-3 py-2 text-sm outline-none disabled:bg-[#f8fafc] disabled:text-[var(--color-low-emphasis)]"
              aria-label="Role description"
            />
            {saveError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {saveError}
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleSaveRole}
              disabled={selectedRole.key === "org_admin" || !hasRoleChanges || isSavingRole}
              className="w-full rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingRole ? "Saving..." : "Save Role"}
            </button>
          </div>
        ) : null}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--color-high-emphasis)]">
              Users with {selectedRole?.name ?? "selected role"}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
              Click a user to edit that account's feature access.
            </p>
          </div>
          <span className="rounded-full bg-[#ecf8f6] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary)]">
            {selectedRoleUsers.length} user{selectedRoleUsers.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading || isRoleUsersLoading ? (
          <UsersSkeleton />
        ) : selectedRoleUsers.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--color-default)] px-4 py-8 text-center text-sm text-[var(--color-low-emphasis)]">
            No users are assigned to this role yet.
          </div>
        ) : (
          <div className={`grid min-h-0 flex-1 gap-4 ${selectedUser ? "xl:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
            <div className="min-h-0 overflow-auto rounded-lg border border-[var(--color-default)]">
              <table className="min-w-full border-collapse text-left">
                <thead className="sticky top-0 bg-[var(--color-primary)] text-white">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold">ID No.</th>
                    <th className="px-4 py-3 text-xs font-semibold">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold">Department</th>
                    <th className="px-4 py-3 text-xs font-semibold">Features</th>
                    <th className="px-4 py-3 text-xs font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-default)] bg-white">
                  {selectedRoleUsers.map((user) => (
                    <tr
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      title={`Edit feature access for ${user.fullName}`}
                      aria-label={`Edit feature access for ${user.fullName}`}
                      onClick={() => handleSelectUser(user)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelectUser(user);
                        }
                      }}
                      className={`cursor-pointer transition hover:bg-[#ecf8f6] focus:bg-[#ecf8f6] focus:outline-none ${
                        selectedUserId === user.id ? "bg-[#ecf8f6]" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                        {user.employeeId || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-[var(--color-high-emphasis)]">
                        {user.fullName}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                        {user.schoolEmail}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                        {user.department || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-[var(--color-primary)]">
                        {user.roleKey === "org_admin" ? "Full" : user.featureKeys.length}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-[var(--color-primary)]">
                        {user.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedUser ? (
              <aside className="min-h-0 overflow-y-auto rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-4">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-[var(--color-high-emphasis)]">
                    {selectedUser.fullName}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
                    {selectedUser.schoolEmail} - {selectedUser.roleName}
                  </p>
                </div>

                {selectedUser.roleKey === "org_admin" ? (
                  <div className="rounded-lg border border-[var(--color-default)] bg-white px-4 py-5 text-sm text-[var(--color-low-emphasis)]">
                    Org Admin accounts always keep full access.
                  </div>
                ) : (
                  <>
                    {userFeatureError ? (
                      <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {userFeatureError}
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {Object.entries(groupedFeatures).map(([group, groupItems]) => (
                        <fieldset key={group} className="space-y-2">
                          <legend className="text-xs font-bold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                            {group}
                          </legend>
                          <div className="space-y-2">
                            {groupItems.map((feature) => {
                              const isSelected = userFeatureDraft.includes(feature.key);

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
                                      handleUserFeatureToggle(feature.key, event.target.checked)
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

                    <button
                      type="button"
                      onClick={handleSaveUserFeatures}
                      disabled={!hasUserFeatureChanges || isSavingUserFeatures}
                      className="mt-4 w-full rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingUserFeatures ? "Saving..." : "Save Account Features"}
                    </button>
                  </>
                )}
              </aside>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
