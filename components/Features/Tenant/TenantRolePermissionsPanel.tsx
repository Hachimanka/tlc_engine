"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
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
  roleName: string;
  roleKey: string;
  featureKeys: string[];
  employeeId?: string | null;
  department?: string | null;
  status: string;
};

type UserPayload = {
  id: string;
  full_name: string;
  email: string;
  employee_id?: string | null;
  department?: string | null;
  role_label?: string | null;
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
    return role[0] as { key?: string; name?: string } | undefined;
  }

  return role as { key?: string; name?: string } | undefined;
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

function AccessSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading account access">
      <span className="sr-only">Loading account access</span>
      {[0, 1, 2, 3].map((row) => (
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
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [roleNameDraft, setRoleNameDraft] = useState("");
  const [featureDraft, setFeatureDraft] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [featureError, setFeatureError] = useState("");
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);

  const assignableFeatures = useMemo(
    () => features.filter((feature) => feature.status === "active" && !feature.adminOnly),
    [features],
  );
  const groupedFeatures = useMemo(() => groupFeatures(assignableFeatures), [assignableFeatures]);
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );
  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.fullName.toLowerCase().includes(normalizedSearch) ||
        user.schoolEmail.toLowerCase().includes(normalizedSearch) ||
        (user.employeeId ?? "").toLowerCase().includes(normalizedSearch) ||
        (user.department ?? "").toLowerCase().includes(normalizedSearch) ||
        user.roleName.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, users]);
  const hasFeatureChanges = useMemo(() => {
    if (!selectedUser) {
      return false;
    }

    return !sameStringSet(featureDraft, selectedUser.featureKeys);
  }, [featureDraft, selectedUser]);
  const hasRoleNameChanges = useMemo(() => {
    if (!selectedUser) {
      return false;
    }

    return roleNameDraft.trim() !== selectedUser.roleName;
  }, [roleNameDraft, selectedUser]);
  const canSaveAccountAccess = Boolean(
    selectedUser &&
      selectedUser.roleKey !== "org_admin" &&
      roleNameDraft.trim() &&
      (hasFeatureChanges || hasRoleNameChanges),
  );

  const loadAccessData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    setFeatureError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Please sign in to manage account access.");
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

    const nextUsers: TenantUser[] = ((payload.users ?? []) as UserPayload[]).map((user) => {
      const role = normalizeJoinedRole(user.roles);

      return {
        id: user.id,
        fullName: user.full_name,
        schoolEmail: user.email,
        employeeId: user.employee_id ?? null,
        department: user.department ?? null,
        roleKey: role?.key ?? "",
        roleName: user.role_label ?? role?.name ?? "Account",
        status: user.status ?? "active",
        featureKeys: user.featureKeys ?? [],
      };
    });
    const nextSelectedUser =
      nextUsers.find((user) => user.id === selectedUserId) ??
      nextUsers.find((user) => user.roleKey !== "org_admin") ??
      nextUsers[0] ??
      null;

    setFeatures((payload.features ?? []) as FeatureDefinition[]);
    setUsers(nextUsers);
    setSelectedUserId(nextSelectedUser?.id ?? "");
    setRoleNameDraft(nextSelectedUser?.roleName ?? "");
    setFeatureDraft(nextSelectedUser?.featureKeys ?? []);
    setIsLoading(false);
  }, [selectedUserId]);

  useEffect(() => {
    loadAccessData();
  }, [loadAccessData]);

  const handleSelectUser = (user: TenantUser) => {
    setSelectedUserId(user.id);
    setRoleNameDraft(user.roleName);
    setFeatureDraft(user.featureKeys);
    setFeatureError("");
  };

  const handleFeatureToggle = (featureKey: FeatureKey, enabled: boolean) => {
    setFeatureDraft((current) => {
      if (enabled) {
        return Array.from(new Set([...current, featureKey]));
      }

      return current.filter((key) => key !== featureKey);
    });
  };

  const handleSaveAccountAccess = async () => {
    if (!selectedUser || selectedUser.roleKey === "org_admin") {
      return;
    }

    const nextRoleName = roleNameDraft.trim();
    if (!nextRoleName) {
      setFeatureError("Role name is required.");
      return;
    }

    setIsSavingFeatures(true);
    setFeatureError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsSavingFeatures(false);
      setFeatureError("Session expired. Please log in again.");
      return;
    }

    const response = await fetch(`/api/tenant/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        roleLabel: nextRoleName,
        featureKeys: featureDraft,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setIsSavingFeatures(false);

    if (!response.ok) {
      setFeatureError(payload?.error || "Failed to save account features.");
      return;
    }

    const nextFeatureKeys = payload.user?.featureKeys ?? featureDraft;
    const nextRoleLabel = payload.user?.role_label ?? nextRoleName;
    setUsers((current) =>
      current.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              roleName: nextRoleLabel,
              featureKeys: nextFeatureKeys,
            }
          : user,
      ),
    );
    setRoleNameDraft(nextRoleLabel);
    setFeatureDraft(nextFeatureKeys);
  };

  if (loadError) {
    return (
      <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="text-sm text-red-600">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Account Feature Access</h1>
          <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
            Feature access is assigned per account.
          </p>
        </div>
        <span className="rounded-full bg-[#ecf8f6] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
          {users.length} account{users.length === 1 ? "" : "s"}
        </span>
      </div>

      <section className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
            <span className="sr-only">Search accounts</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, employee ID, department..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
            />
          </label>

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

      <section className="grid min-h-0 flex-1 gap-5 overflow-hidden xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-h-0 overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          {isLoading ? (
            <div className="p-5">
              <AccessSkeleton />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center px-6 py-12 text-center text-sm text-[var(--color-low-emphasis)]">
              No accounts match the current filters.
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-[var(--color-primary)] text-white">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold">ID No.</th>
                    <th className="px-4 py-3 text-xs font-semibold">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold">Department</th>
                    <th className="px-4 py-3 text-xs font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-default)] bg-white">
                  {filteredUsers.map((user) => (
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
                        {user.roleName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="min-h-0 overflow-y-auto rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
          {selectedUser ? (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
                  {selectedUser.fullName}
                </h2>
                <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
                  {selectedUser.schoolEmail}
                </p>
              </div>

              {selectedUser.roleKey === "org_admin" ? (
                <div className="rounded-lg border border-[var(--color-default)] bg-white px-4 py-5 text-sm text-[var(--color-low-emphasis)]">
                  Org Admin accounts always keep full access.
                </div>
              ) : (
                <>
                  {featureError ? (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {featureError}
                    </div>
                  ) : null}

                  <div className="mb-5 space-y-2">
                    <label htmlFor="account-role-name" className="text-sm font-medium text-[#344054]">
                      Role Name
                    </label>
                    <input
                      id="account-role-name"
                      value={roleNameDraft}
                      onChange={(event) => setRoleNameDraft(event.target.value)}
                      className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                    />
                  </div>

                  <div className="space-y-4">
                    {Object.entries(groupedFeatures).map(([group, groupItems]) => (
                      <fieldset key={group} className="space-y-2">
                        <legend className="text-xs font-bold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                          {group}
                        </legend>
                        <div className="space-y-2">
                          {groupItems.map((feature) => {
                            const isSelected = featureDraft.includes(feature.key);

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
                                    handleFeatureToggle(feature.key, event.target.checked)
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
                    onClick={handleSaveAccountAccess}
                    disabled={!canSaveAccountAccess || isSavingFeatures}
                    className="mt-4 w-full rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSavingFeatures ? "Saving..." : "Save Account Access"}
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-[var(--color-default)] px-4 py-8 text-center text-sm text-[var(--color-low-emphasis)]">
              Select an account to edit feature access.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
