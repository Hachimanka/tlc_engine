import { NextResponse } from "next/server";
import {
  type FeatureKey,
  getAssignableFeatureKeysForInstitution,
  getFeatureKeysForInstitution,
} from "@/features/tenant-feature-catalog";
import {
  isMissingOrgUserFeaturePermissionsError,
  isMissingRoleLabelError,
  loadTenantContext,
  replaceOrgUserFeaturePermissions,
} from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type UpdateUserRequest = {
  fullName?: string;
  roleLabel?: string;
  department?: string | null;
  departmentId?: string | null;
  status?: "active" | "disabled";
  featureKeys?: string[];
};

type OrgUserRow = {
  id: string;
  org_id: string;
  auth_user_id: string;
  role_id: string;
  role_label?: string | null;
  full_name: string;
  email: string;
  employee_id?: string | null;
  department?: string | null;
  department_id?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type RoleRow = {
  id: string;
  key: string;
  name: string;
  requires_department?: boolean | null;
};

const normalizeDepartment = (value?: string | null) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
};

const normalizeRoleLabel = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim().replace(/\s+/g, " ") || null;
};

const ROLE_LABEL_MIGRATION_ERROR =
  "Account role names require the org_users.role_label column. Run scripts/db/20260521_org_user_feature_permissions.sql in Supabase, then try again.";

type ManagedDepartmentRow = {
  id: string;
  name: string;
};

const loadManagedDepartment = async (orgId: string, departmentId?: string | null) => {
  const normalizedId = normalizeDepartment(departmentId);
  if (!normalizedId) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("org_departments")
    .select("id, name")
    .eq("id", normalizedId)
    .eq("org_id", orgId)
    .maybeSingle<ManagedDepartmentRow>();

  if (error || !data?.id) {
    throw new Error("Selected department was not found in this organization.");
  }

  return data;
};

const normalizeFeatureKeys = (
  value: unknown,
  institutionType: Parameters<typeof getAssignableFeatureKeysForInstitution>[0],
) => {
  if (!Array.isArray(value)) {
    return null;
  }

  const allowedKeys = new Set(getAssignableFeatureKeysForInstitution(institutionType));

  return Array.from(
    new Set(
      value.filter(
        (item): item is FeatureKey =>
          typeof item === "string" && allowedKeys.has(item as FeatureKey),
      ),
    ),
  );
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  let payload: UpdateUserRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { context } = result;

  let { data: targetUser, error: targetError } = await supabaseAdmin
    .from("org_users")
    .select("id, org_id, auth_user_id, role_id, role_label, full_name, email, employee_id, department, department_id, status, created_at")
    .eq("id", userId)
    .eq("org_id", context.org.id)
    .maybeSingle<OrgUserRow>();

  if (isMissingRoleLabelError(targetError)) {
    return NextResponse.json({ error: ROLE_LABEL_MIGRATION_ERROR }, { status: 500 });
  }

  if (targetError || !targetUser?.id) {
    return NextResponse.json(
      { error: targetError?.message || "Account not found in this organization." },
      { status: 404 },
    );
  }

  const nextStatus = payload.status ?? (targetUser.status === "disabled" ? "disabled" : "active");
  if (nextStatus !== "active" && nextStatus !== "disabled") {
    return NextResponse.json({ error: "Invalid account status." }, { status: 400 });
  }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name, requires_department")
    .eq("id", targetUser.role_id)
    .eq("org_id", context.org.id)
    .maybeSingle<RoleRow>();

  if (roleError || !roleRow?.id) {
    return NextResponse.json({ error: "Role not found in this organization." }, { status: 404 });
  }

  const targetIsOrgAdmin = roleRow.key === "org_admin";
  const isSelf = targetUser.auth_user_id === context.authUser.id;

  if (targetIsOrgAdmin && nextStatus !== "active") {
    return NextResponse.json(
      { error: "The protected admin account cannot be demoted or disabled." },
      { status: 400 },
    );
  }

  if (isSelf && nextStatus !== "active") {
    return NextResponse.json(
      { error: "You cannot disable your own account." },
      { status: 400 },
    );
  }

  const nextFullName =
    typeof payload.fullName === "string" ? payload.fullName.trim() : targetUser.full_name;

  if (!nextFullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  const nextRoleLabel = targetIsOrgAdmin
    ? targetUser.role_label ?? roleRow.name
    : normalizeRoleLabel(payload.roleLabel) ?? targetUser.role_label ?? "Staff";
  const departmentIdWasProvided =
    typeof payload.departmentId === "string" || payload.departmentId === null;
  let managedDepartment: ManagedDepartmentRow | null = null;

  if (departmentIdWasProvided && payload.departmentId) {
    try {
      managedDepartment = await loadManagedDepartment(context.org.id, payload.departmentId);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Selected department was not found in this organization.",
        },
        { status: 400 },
      );
    }
  }

  const requestedDepartment =
    typeof payload.department === "string" ? payload.department : targetUser.department;
  const nextDepartment = departmentIdWasProvided
    ? managedDepartment?.name ?? null
    : normalizeDepartment(requestedDepartment) || null;
  const nextDepartmentId = departmentIdWasProvided
    ? managedDepartment?.id ?? null
    : targetUser.department_id ?? null;

  const now = new Date().toISOString();

  let { data: updatedUser, error: updateError } = await supabaseAdmin
    .from("org_users")
    .update({
      full_name: nextFullName,
      role_label: nextRoleLabel,
      department: nextDepartment,
      department_id: nextDepartmentId,
      status: nextStatus,
      updated_at: now,
    })
    .eq("id", targetUser.id)
    .eq("org_id", context.org.id)
    .select("id, full_name, email, employee_id, department, department_id, role_label, status, role_id, created_at")
    .single();

  if (isMissingRoleLabelError(updateError)) {
    return NextResponse.json({ error: ROLE_LABEL_MIGRATION_ERROR }, { status: 500 });
  }

  if (updateError || !updatedUser) {
    return NextResponse.json(
      { error: updateError?.message || "Failed to update account." },
      { status: 500 },
    );
  }

  const { data: authTarget } = await supabaseAdmin.auth.admin.getUserById(targetUser.auth_user_id);
  const metadata = authTarget?.user?.user_metadata ?? {};
  const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
    targetUser.auth_user_id,
    {
      user_metadata: {
        ...metadata,
        role: roleRow.key,
        role_id: roleRow.id,
        role_name: nextRoleLabel,
        role_label: nextRoleLabel,
        account_status: nextStatus,
        department: nextDepartment,
        department_id: nextDepartmentId,
        full_name: nextFullName,
      },
    },
  );

  if (authUpdateError) {
    return NextResponse.json(
      { error: authUpdateError.message || "Account saved, but auth profile update failed." },
      { status: 500 },
    );
  }

  const nextFeatureKeys =
    roleRow.key === "org_admin"
      ? getFeatureKeysForInstitution(context.institutionType)
      : normalizeFeatureKeys(payload.featureKeys, context.institutionType);

  if (nextFeatureKeys && roleRow.key !== "org_admin") {
    try {
      await replaceOrgUserFeaturePermissions(targetUser.id, nextFeatureKeys);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to update account feature access.",
        },
        { status: 500 },
      );
    }
  }

  let responseFeatureKeys = nextFeatureKeys;

  if (!responseFeatureKeys) {
    const { data: permissions, error: permissionsError } = await supabaseAdmin
      .from("org_user_feature_permissions")
      .select("feature_key")
      .eq("org_user_id", targetUser.id)
      .eq("enabled", true);

    if (isMissingOrgUserFeaturePermissionsError(permissionsError)) {
      responseFeatureKeys = [];
    } else if (permissionsError) {
      return NextResponse.json(
        { error: permissionsError.message || "Failed to load account features." },
        { status: 500 },
      );
    }

    responseFeatureKeys = (permissions ?? []).map((permission) => permission.feature_key);
  }

  return NextResponse.json({
    user: {
      ...updatedUser,
      featureKeys: responseFeatureKeys,
      roles: {
        id: roleRow.id,
        key: roleRow.key,
        name: nextRoleLabel,
        requiresDepartment: false,
      },
    },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  const { context } = result;

  const { data: targetUser, error: targetError } = await supabaseAdmin
    .from("org_users")
    .select("id, org_id, auth_user_id, role_id, full_name")
    .eq("id", userId)
    .eq("org_id", context.org.id)
    .maybeSingle<Pick<OrgUserRow, "id" | "org_id" | "auth_user_id" | "role_id" | "full_name">>();

  if (targetError || !targetUser?.id) {
    return NextResponse.json(
      { error: targetError?.message || "Account not found in this organization." },
      { status: 404 },
    );
  }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name")
    .eq("id", targetUser.role_id)
    .eq("org_id", context.org.id)
    .maybeSingle<RoleRow>();

  if (roleError || !roleRow?.id) {
    return NextResponse.json({ error: "Role not found in this organization." }, { status: 404 });
  }

  if (roleRow.key === "org_admin") {
    return NextResponse.json(
      { error: "The protected admin account cannot be deleted." },
      { status: 400 },
    );
  }

  if (targetUser.auth_user_id === context.authUser.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  const { error: deleteOrgUserError } = await supabaseAdmin
    .from("org_users")
    .delete()
    .eq("id", targetUser.id)
    .eq("org_id", context.org.id);

  if (deleteOrgUserError) {
    return NextResponse.json(
      { error: deleteOrgUserError.message || "Failed to delete account." },
      { status: 500 },
    );
  }

  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
    targetUser.auth_user_id,
  );

  if (deleteAuthError) {
    return NextResponse.json(
      {
        error:
          deleteAuthError.message ||
          "Account was removed from the organization, but the auth user could not be deleted.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    deleted: true,
    user: {
      id: targetUser.id,
      fullName: targetUser.full_name,
    },
  });
}
