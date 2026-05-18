import { NextResponse } from "next/server";
import { isDepartmentRequiredRole } from "@/features/tenant-role-catalog";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type UpdateUserRequest = {
  fullName?: string;
  roleId?: string;
  department?: string | null;
  departmentId?: string | null;
  status?: "active" | "disabled";
};

type OrgUserRow = {
  id: string;
  org_id: string;
  auth_user_id: string;
  role_id: string;
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

  const { data: targetUser, error: targetError } = await supabaseAdmin
    .from("org_users")
    .select("id, org_id, auth_user_id, role_id, full_name, email, employee_id, department, department_id, status, created_at")
    .eq("id", userId)
    .eq("org_id", context.org.id)
    .maybeSingle<OrgUserRow>();

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

  const nextRoleId = payload.roleId?.trim() || targetUser.role_id;
  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name, requires_department")
    .eq("id", nextRoleId)
    .eq("org_id", context.org.id)
    .maybeSingle<RoleRow>();

  if (roleError || !roleRow?.id) {
    return NextResponse.json({ error: "Role not found in this organization." }, { status: 404 });
  }

  const targetIsOrgAdmin = targetUser.role_id === context.role.id && context.role.key === "org_admin";
  const isSelf = targetUser.auth_user_id === context.authUser.id;

  if (targetIsOrgAdmin && (nextRoleId !== targetUser.role_id || nextStatus !== "active")) {
    return NextResponse.json(
      { error: "The protected admin account cannot be demoted or disabled." },
      { status: 400 },
    );
  }

  if (isSelf && (nextRoleId !== targetUser.role_id || nextStatus !== "active")) {
    return NextResponse.json(
      { error: "You cannot change your own role or disable your own account." },
      { status: 400 },
    );
  }

  if (roleRow.key === "org_admin" && targetUser.role_id !== roleRow.id) {
    return NextResponse.json(
      { error: "The protected admin role cannot be assigned from account management." },
      { status: 400 },
    );
  }

  const nextFullName =
    typeof payload.fullName === "string" ? payload.fullName.trim() : targetUser.full_name;

  if (!nextFullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  const requiresDepartment =
    Boolean(roleRow.requires_department) || isDepartmentRequiredRole(roleRow.key);
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

  if (requiresDepartment && !nextDepartment) {
    return NextResponse.json(
      { error: "Department is required for this role." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from("org_users")
    .update({
      full_name: nextFullName,
      role_id: roleRow.id,
      department: nextDepartment,
      department_id: nextDepartmentId,
      status: nextStatus,
      updated_at: now,
    })
    .eq("id", targetUser.id)
    .eq("org_id", context.org.id)
    .select("id, full_name, email, employee_id, department, department_id, status, role_id, created_at")
    .single();

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
        role_name: roleRow.name,
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

  return NextResponse.json({
    user: {
      ...updatedUser,
      roles: {
        id: roleRow.id,
        key: roleRow.key,
        name: roleRow.name,
        requiresDepartment: requiresDepartment,
      },
    },
  });
}
