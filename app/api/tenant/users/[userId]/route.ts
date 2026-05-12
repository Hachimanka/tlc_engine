import { NextResponse } from "next/server";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type UpdateUserRequest = {
  fullName?: string;
  department?: string | null;
  roleId?: string;
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
  status?: string | null;
  created_at?: string | null;
};

type RoleRow = {
  id: string;
  key: string;
  name: string;
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
    .select("id, org_id, auth_user_id, role_id, full_name, email, employee_id, department, status, created_at")
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
    .select("id, key, name")
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
  const nextDepartment =
    typeof payload.department === "string" ? payload.department.trim() || null : targetUser.department ?? null;

  if (!nextFullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from("org_users")
    .update({
      full_name: nextFullName,
      department: nextDepartment,
      role_id: roleRow.id,
      status: nextStatus,
      updated_at: now,
    })
    .eq("id", targetUser.id)
    .eq("org_id", context.org.id)
    .select("id, full_name, email, employee_id, department, status, role_id, created_at")
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
        full_name: nextFullName,
        department: nextDepartment,
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
      },
    },
  });
}
