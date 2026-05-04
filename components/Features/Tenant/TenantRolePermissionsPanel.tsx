"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Permission, {
  createDefaultPermissions,
  type PermissionId,
  type PermissionValues,
} from "./Permission";
import UserRoles, { initialRoleUsers, type TenantRoleUser } from "./UserRoles";
import AddUserModal, {
  type AddUserPayload,
  type CreatedUser,
  type RoleOption,
} from "./AddUserModal";
import { supabase } from "@/lib/supabaseClient";

type PermissionsByRole = Record<string, PermissionValues>;

const mergePermissions = (roleUsers: TenantRoleUser[], current: PermissionsByRole) => {
  const next = { ...current };
  roleUsers.forEach((user) => {
    if (!next[user.id]) {
      next[user.id] = createDefaultPermissions(user.roleName);
    }
  });
  return next;
};

export default function TenantRolePermissionsPanel() {
  const [roleUsers, setRoleUsers] = useState<TenantRoleUser[]>(initialRoleUsers);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleUsers[0]?.id ?? "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleRoleIds, setVisibleRoleIds] = useState<string[]>(
    initialRoleUsers.map((user) => user.id),
  );
  const [permissionsByRole, setPermissionsByRole] = useState<PermissionsByRole>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Please sign in to view users.");
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
      setLoadError(payload?.error || "Failed to load users.");
      return;
    }

    const nextRoles: RoleOption[] = (payload.roles ?? []).map((role: RoleOption) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description ?? null,
    }));

    const nextUsers: TenantRoleUser[] = (payload.users ?? []).map((user: any) => ({
      id: user.id,
      fullName: user.full_name,
      schoolEmail: user.email,
      roleName: user.roles?.name ?? "Unassigned",
      roleKey: user.roles?.key ?? "",
      description: user.roles?.name
        ? `${user.roles.name} access`
        : "Role assignment not set.",
      employeeId: user.employee_id ?? null,
    }));

    setRoles(nextRoles);
    setRoleUsers(nextUsers);
    setSelectedRoleId((prev) => nextUsers.find((user) => user.id === prev)?.id ?? nextUsers[0]?.id ?? "");
    setVisibleRoleIds(nextUsers.map((user) => user.id));
    setPermissionsByRole((current) => mergePermissions(nextUsers, current));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const effectiveSelectedRoleId = visibleRoleIds.includes(selectedRoleId)
    ? selectedRoleId
    : visibleRoleIds[0] ?? "";

  const selectedRoleUser = useMemo(
    () => roleUsers.find((user) => user.id === effectiveSelectedRoleId) ?? null,
    [effectiveSelectedRoleId, roleUsers],
  );

  const selectedPermissions = useMemo(() => {
    if (!selectedRoleUser) {
      return createDefaultPermissions("");
    }

    return permissionsByRole[selectedRoleUser.id] ?? createDefaultPermissions(selectedRoleUser.roleName);
  }, [permissionsByRole, selectedRoleUser]);

  const handleVisibleRoleIdsChange = useCallback((roleIds: string[]) => {
    setVisibleRoleIds(roleIds);
  }, []);

  const handlePermissionChange = (permissionId: PermissionId, checked: boolean) => {
    if (!selectedRoleUser) {
      return;
    }

    setPermissionsByRole((currentPermissions) => ({
      ...currentPermissions,
      [selectedRoleUser.id]: {
        ...selectedPermissions,
        [permissionId]: checked,
      },
    }));
  };

  const handleSavePermissions = () => {
    if (!selectedRoleUser) {
      return;
    }

    setPermissionsByRole((currentPermissions) => ({
      ...currentPermissions,
      [selectedRoleUser.id]: selectedPermissions,
    }));
  };

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
      roleId: data.user.role?.id ?? payload.roleId,
      roleKey: data.user.role?.key ?? "",
      roleName: data.user.role?.name ?? "Unassigned",
      description: data.user.role?.name
        ? `${data.user.role.name} access`
        : "Role assignment not set.",
    };

    const nextUser: TenantRoleUser = {
      id: createdUser.id,
      fullName: createdUser.fullName,
      schoolEmail: createdUser.email,
      roleName: createdUser.roleName,
      roleKey: createdUser.roleKey,
      description: createdUser.description,
      employeeId: createdUser.employeeId,
    };

    setRoleUsers((current) => [nextUser, ...current]);
    setPermissionsByRole((current) => ({
      ...current,
      [nextUser.id]: createDefaultPermissions(nextUser.roleName),
    }));
    setSelectedRoleId(nextUser.id);

    return { tempPassword: data.tempPassword, user: createdUser };
  };

  return (
    <div
      className={`flex h-full min-h-0 gap-6 ${
        isExpanded ? "flex-col overflow-y-auto" : "flex-row overflow-hidden"
      }`}
    >
      <AddUserModal
        isOpen={isAddUserOpen}
        roles={roles}
        onClose={() => setIsAddUserOpen(false)}
        onCreate={handleCreateUser}
      />

      {isLoading ? (
        <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <div className="text-sm text-[var(--color-low-emphasis)]">Loading users...</div>
        </div>
      ) : loadError ? (
        <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <div className="text-sm text-red-600">{loadError}</div>
        </div>
      ) : (
        <>
          <div className={isExpanded ? "h-[430px] shrink-0" : "h-full shrink-0"}>
            <UserRoles
              roleUsers={roleUsers}
              roles={roles}
              selectedRoleId={effectiveSelectedRoleId}
              isExpanded={isExpanded}
              onAddUser={() => setIsAddUserOpen(true)}
              onExpandedChange={setIsExpanded}
              onSelectRole={setSelectedRoleId}
              onVisibleRoleIdsChange={handleVisibleRoleIdsChange}
            />
          </div>

          <div className={isExpanded ? "min-h-[560px] shrink-0" : "min-w-0 flex-1"}>
            <Permission
              selectedRoleUser={selectedRoleUser}
              permissions={selectedPermissions}
              onPermissionChange={handlePermissionChange}
              onSave={handleSavePermissions}
            />
          </div>
        </>
      )}
    </div>
  );
}
