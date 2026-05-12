import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { getFeatureKeysForInstitution } from "@/features/tenant-feature-catalog";
import { isDepartmentRequiredRole } from "@/features/tenant-role-catalog";
import {
  loadTenantContext,
  reconcileInstitutionSystemRoles,
} from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateTempPassword } from "@/lib/tempPassword";

export const runtime = "nodejs";

type CreateUserRequest = {
  fullName?: string;
  roleId?: string;
  department?: string | null;
};

const normalizeIdentifierPart = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

const getEmailDomain = (adminEmail?: string | null, slug?: string | null) => {
  const domain = adminEmail?.split("@")[1]?.trim().toLowerCase();
  if (domain) {
    return domain;
  }

  const fallbackSlug = normalizeIdentifierPart(slug || "institution").replace(/\./g, "-");
  return `${fallbackSlug || "institution"}.tlc.local`;
};

const getEmailLocalPart = (fullName: string) => {
  const nameParts = fullName
    .trim()
    .split(/\s+/)
    .map(normalizeIdentifierPart)
    .filter(Boolean);

  if (nameParts.length === 0) {
    return "user";
  }

  if (nameParts.length === 1) {
    return nameParts[0];
  }

  return `${nameParts[0]}.${nameParts[nameParts.length - 1]}`;
};

const normalizeDepartment = (value?: string | null) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
};

const buildUniqueAccountEmail = async (
  orgId: string,
  fullName: string,
  emailDomain: string,
) => {
  const baseLocalPart = getEmailLocalPart(fullName);

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const localPart = suffix === 0 ? baseLocalPart : `${baseLocalPart}${suffix + 1}`;
    const candidate = `${localPart}@${emailDomain}`;

    const { data, error } = await supabaseAdmin
      .from("org_users")
      .select("id")
      .eq("org_id", orgId)
      .eq("email", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to check generated email.");
    }

    if (!data?.id) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique email for this account.");
};

const buildUniqueEmployeeId = async (orgId: string) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const { count, error: countError } = await supabaseAdmin
    .from("org_users")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .like("employee_id", `${year}-%`);

  if (countError) {
    throw new Error(countError.message || "Failed to generate employee ID.");
  }

  const sequence = String((count ?? 0) + 1).padStart(3, "0");

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const randomBlock = String(randomInt(1, 10000)).padStart(4, "0");
    const candidate = `${year}-${randomBlock}-${sequence}`;

    const { data, error } = await supabaseAdmin
      .from("org_users")
      .select("id")
      .eq("org_id", orgId)
      .eq("employee_id", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to check generated employee ID.");
    }

    if (!data?.id) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique employee ID.");
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  try {
    await reconcileInstitutionSystemRoles(context.org.id, context.institutionType);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reconcile institution roles.",
      },
      { status: 500 },
    );
  }

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
    .select("id, full_name, email, employee_id, department, status, role_id, created_at, roles(id, key, name)")
    .eq("org_id", context.org.id)
    .order("created_at", { ascending: false });

  if (usersError) {
    return NextResponse.json({ error: usersError.message || "Failed to load users." }, { status: 500 });
  }

  const { data: orgInfo } = await supabaseAdmin
    .from("organizations")
    .select("admin_email, slug")
    .eq("id", context.org.id)
    .single();

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
    org: {
      emailDomain: getEmailDomain(orgInfo?.admin_email, orgInfo?.slug ?? context.org.slug),
    },
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
  const roleId = payload.roleId?.trim();

  if (!fullName || !roleId) {
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

  const requiresDepartment = isDepartmentRequiredRole(roleRow.key);
  const department = requiresDepartment ? normalizeDepartment(payload.department) : null;

  if (requiresDepartment && !department) {
    return NextResponse.json(
      { error: "Department is required for this role." },
      { status: 400 },
    );
  }

  const { data: orgInfo } = await supabaseAdmin
    .from("organizations")
    .select("name, slug, admin_email, institution_type")
    .eq("id", context.org.id)
    .single();

  let email = "";
  let employeeId = "";

  try {
    const emailDomain = getEmailDomain(orgInfo?.admin_email, orgInfo?.slug ?? context.org.slug);
    email = await buildUniqueAccountEmail(context.org.id, fullName, emailDomain);
    employeeId = await buildUniqueEmployeeId(context.org.id);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate account identifiers.",
      },
      { status: 500 },
    );
  }

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
      department,
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
        employee_id: employeeId,
        department,
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ])
    .select("id, full_name, email, employee_id, department, status, role_id, created_at")
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
