import { NextResponse } from "next/server";
import { getFeatureKeysForInstitution } from "@/features/tenant-feature-catalog";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateTempPassword } from "@/lib/tempPassword";

export const runtime = "nodejs";

type CreateUserRequest = {
  fullName?: string;
  email?: string;
  employeeId?: string;
  roleId?: string;
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name, description, is_system")
    .eq("org_id", context.org.id)
    .order("name", { ascending: true });

  if (rolesError) {
    return NextResponse.json({ error: rolesError.message || "Failed to load roles." }, { status: 500 });
  }

  const { data: users, error: usersError } = await supabaseAdmin
    .from("org_users")
    .select("id, full_name, email, employee_id, status, role_id, created_at, roles(id, key, name)")
    .eq("org_id", context.org.id)
    .order("created_at", { ascending: false });

  if (usersError) {
    return NextResponse.json({ error: usersError.message || "Failed to load users." }, { status: 500 });
  }

  const roleIds = (roles ?? []).map((role) => role.id);
  const permissionsByRole = new Map<string, string[]>();

  if (roleIds.length > 0) {
    const { data: permissions, error: permissionsError } = await supabaseAdmin
      .from("role_feature_permissions")
      .select("role_id, feature_key")
      .in("role_id", roleIds)
      .eq("enabled", true);

    if (permissionsError) {
      return NextResponse.json(
        { error: permissionsError.message || "Failed to load role features." },
        { status: 500 },
      );
    }

    for (const permission of permissions ?? []) {
      const current = permissionsByRole.get(permission.role_id) ?? [];
      current.push(permission.feature_key);
      permissionsByRole.set(permission.role_id, current);
    }
  }

  const allFeatureKeys = getFeatureKeysForInstitution(context.institutionType);

  return NextResponse.json({
    roles: (roles ?? []).map((role) => ({
      ...role,
      featureKeys:
        role.key === "org_admin"
          ? allFeatureKeys
          : permissionsByRole.get(role.id) ?? [],
    })),
    users: users ?? [],
  });
}

export async function POST(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  let payload: CreateUserRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = payload.fullName?.trim();
  const email = payload.email?.trim();
  const employeeId = payload.employeeId?.trim();
  const roleId = payload.roleId?.trim();

  if (!fullName || !email || !roleId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { context } = result;

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name")
    .eq("id", roleId)
    .eq("org_id", context.org.id)
    .single();

  if (roleError || !roleRow) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  if (roleRow.key === "org_admin") {
    return NextResponse.json(
      { error: "The protected admin role cannot be assigned from account creation." },
      { status: 400 },
    );
  }

  const { data: orgInfo } = await supabaseAdmin
    .from("organizations")
    .select("name, slug, institution_type")
    .eq("id", context.org.id)
    .single();

  const tempPassword = generateTempPassword();

  const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: roleRow.key,
      role_id: roleRow.id,
      role_name: roleRow.name,
      org_id: context.org.id,
      org_name: orgInfo?.name ?? null,
      org_slug: orgInfo?.slug ?? null,
      institution_type: orgInfo?.institution_type ?? context.institutionType,
      account_status: "active",
      full_name: fullName,
      first_login: false,
      onboarding_complete: true,
      must_change_password: true,
    },
  });

  if (createUserError || !createdUser?.user) {
    const status = createUserError?.message?.toLowerCase().includes("already") ? 409 : 500;
    return NextResponse.json({ error: createUserError?.message || "Failed to create user." }, { status });
  }

  const now = new Date().toISOString();

  const { data: orgUserRow, error: orgUserError } = await supabaseAdmin
    .from("org_users")
    .insert([
      {
        org_id: context.org.id,
        role_id: roleRow.id,
        auth_user_id: createdUser.user.id,
        full_name: fullName,
        email,
        employee_id: employeeId || null,
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ])
    .select("id, full_name, email, employee_id, status, role_id, created_at")
    .single();

  if (orgUserError || !orgUserRow) {
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: orgUserError?.message || "Failed to save user." }, { status: 500 });
  }

  return NextResponse.json({
    tempPassword,
    user: {
      ...orgUserRow,
      role: {
        id: roleRow.id,
        key: roleRow.key,
        name: roleRow.name,
      },
    },
  });
}
