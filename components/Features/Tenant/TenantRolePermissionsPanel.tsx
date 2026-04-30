"use client";

import { useCallback, useMemo, useState } from "react";
import Permission, {
  createDefaultPermissions,
  type PermissionId,
  type PermissionValues,
} from "./Permission";
import UserRoles, {
  initialRoleUsers,
  type TenantRoleUser,
} from "./UserRoles";
import type { CreatedRole } from "./CreateRoleModal";

type PermissionsByRole = Record<string, PermissionValues>;

const createInitialPermissions = (roleUsers: TenantRoleUser[]): PermissionsByRole =>
  roleUsers.reduce((permissions, user) => {
    permissions[user.idNo] = createDefaultPermissions(user.role);
    return permissions;
  }, {} as PermissionsByRole);

export default function TenantRolePermissionsPanel() {
  const [roleUsers, setRoleUsers] = useState<TenantRoleUser[]>(initialRoleUsers);
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleUsers[0]?.idNo ?? "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleRoleIds, setVisibleRoleIds] = useState<string[]>(
    initialRoleUsers.map((user) => user.idNo),
  );
  const [permissionsByRole, setPermissionsByRole] = useState<PermissionsByRole>(() =>
    createInitialPermissions(initialRoleUsers),
  );

  const effectiveSelectedRoleId = visibleRoleIds.includes(selectedRoleId)
    ? selectedRoleId
    : visibleRoleIds[0] ?? "";

  const selectedRoleUser = useMemo(
    () => roleUsers.find((user) => user.idNo === effectiveSelectedRoleId) ?? null,
    [effectiveSelectedRoleId, roleUsers],
  );

  const selectedPermissions = useMemo(() => {
    if (!selectedRoleUser) {
      return createDefaultPermissions("");
    }

    return permissionsByRole[selectedRoleUser.idNo] ?? createDefaultPermissions(selectedRoleUser.role);
  }, [permissionsByRole, selectedRoleUser]);

  const handleVisibleRoleIdsChange = useCallback((roleIds: string[]) => {
    setVisibleRoleIds(roleIds);
  }, []);

  const handleCreateRole = (createdRole: CreatedRole) => {
    const newRoleUser: TenantRoleUser = {
      idNo: createdRole.idNo,
      fullName: createdRole.fullName,
      schoolEmail: createdRole.schoolEmail,
      role: createdRole.role,
      description: createdRole.description,
    };

    setRoleUsers((currentUsers) => [newRoleUser, ...currentUsers]);
    setPermissionsByRole((currentPermissions) => ({
      ...currentPermissions,
      [newRoleUser.idNo]: createDefaultPermissions(""),
    }));
    setSelectedRoleId(newRoleUser.idNo);
  };

  const handlePermissionChange = (permissionId: PermissionId, checked: boolean) => {
    if (!selectedRoleUser) {
      return;
    }

    setPermissionsByRole((currentPermissions) => ({
      ...currentPermissions,
      [selectedRoleUser.idNo]: {
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
      [selectedRoleUser.idNo]: selectedPermissions,
    }));
  };

  return (
    <div
      className={`flex h-full min-h-0 gap-6 ${
        isExpanded ? "flex-col overflow-y-auto" : "flex-row overflow-hidden"
      }`}
    >
      <div className={isExpanded ? "h-[430px] shrink-0" : "h-full shrink-0"}>
        <UserRoles
          roleUsers={roleUsers}
          selectedRoleId={effectiveSelectedRoleId}
          isExpanded={isExpanded}
          onCreateRole={handleCreateRole}
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
    </div>
  );
}
