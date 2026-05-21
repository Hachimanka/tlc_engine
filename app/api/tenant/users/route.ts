import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import {
  type FeatureKey,
  getAssignableFeatureKeysForInstitution,
  getFeatureKeysForInstitution,
  getFeaturesForInstitution,
} from "@/features/tenant-feature-catalog";
import { isDepartmentRequiredRole } from "@/features/tenant-role-catalog";
import {
  loadTenantContext,
  reconcileInstitutionSystemRoles,
  replaceRoleFeaturePermissions,
} from "@/lib/tenantAccess";
import {
  getCustomerConversionEmailConfigError,
  sendTenantAccountCreatedEmail,
} from "@/lib/customerConversionEmail";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateTempPassword } from "@/lib/tempPassword";

export const runtime = "nodejs";

type CreateUserRequest = {
  fullName?: string;
  recipientEmail?: string;
  roleId?: string;
  customRoleName?: string;
  customRoleFeatureKeys?: string[];
  customRoleRequiresDepartment?: boolean;
  department?: string | null;
  departmentId?: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getRequestOrigin = (req: Request) => {
  const explicitOrigin = req.headers.get("origin")?.trim();

  if (explicitOrigin) {
    return explicitOrigin.replace(/\/+$/, "");
  }

  const forwardedHost = req.headers.get("x-forwarded-host")?.trim();
  const host = forwardedHost || req.headers.get("host")?.trim();

  if (host) {
    const forwardedProto = req.headers.get("x-forwarded-proto")?.trim();
    const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
    return `${protocol}://${host}`.replace(/\/+$/, "");
  }

  return new URL(req.url).origin.replace(/\/+$/, "");
};

const buildLoginUrl = (req: Request, slug: string) =>
  `${getRequestOrigin(req)}/login?slug=${encodeURIComponent(slug)}`;

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

const slugifyRoleKey = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-/g, "_") || "custom_role";

const buildUniqueRoleKey = async (orgId: string, name: string) => {
  const baseKey = slugifyRoleKey(name);
  let nextKey = baseKey;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("org_id", orgId)
      .eq("key", nextKey)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to check role uniqueness.");
    }

    if (!data?.id) {
      return nextKey;
    }

    nextKey = `${baseKey}_${suffix}`;
    suffix += 1;
  }
};

type TenantRoleRow = {
  id: string;
  key: string;
  name: string;
  requires_department?: boolean | null;
};

type DepartmentOptionRow = {
  id: string;
  name: string;
  code?: string | null;
  college_id?: string | null;
};

const createCustomRole = async (
  orgId: string,
  roleName: string,
  requiresDepartment: boolean,
) => {
  const now = new Date().toISOString();
  const roleKey = await buildUniqueRoleKey(orgId, roleName);

  const { data: role, error } = await supabaseAdmin
    .from("roles")
    .insert([
      {
        org_id: orgId,
        key: roleKey,
        name: roleName,
        description: null,
        is_system: false,
        requires_department: requiresDepartment,
        created_at: now,
        updated_at: now,
      },
    ])
    .select("id, key, name, requires_department")
    .single<TenantRoleRow>();

  if (error || !role) {
    throw new Error(error?.message || "Failed to create custom role.");
  }

  return role;
};

const deleteCustomRole = async (roleId: string) => {
  await supabaseAdmin.from("role_feature_permissions").delete().eq("role_id", roleId);
  await supabaseAdmin.from("roles").delete().eq("id", roleId);
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
    .select("id, key, name, description, is_system, requires_department")
    .eq("org_id", context.org.id)
    .order("name", { ascending: true });

  if (rolesError) {
    return NextResponse.json({ error: rolesError.message || "Failed to load roles." }, { status: 500 });
  }

  const { data: users, error: usersError } = await supabaseAdmin
    .from("org_users")
    .select("id, full_name, email, employee_id, department, department_id, status, role_id, created_at, roles(id, key, name)")
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

  let departments: DepartmentOptionRow[] = [];

  if (context.institutionType === "higher_ed") {
    const { data: departmentRows, error: departmentsError } = await supabaseAdmin
      .from("org_departments")
      .select("id, name, code, college_id")
      .eq("org_id", context.org.id)
      .order("name", { ascending: true });

    if (departmentsError) {
      return NextResponse.json(
        { error: departmentsError.message || "Failed to load departments." },
        { status: 500 },
      );
    }

    departments = departmentRows ?? [];
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
    org: {
      emailDomain: getEmailDomain(orgInfo?.admin_email, orgInfo?.slug ?? context.org.slug),
    },
    features: getFeaturesForInstitution(context.institutionType),
    roles: (roles ?? []).map((role) => ({
      ...role,
      requiresDepartment:
        Boolean(role.requires_department) || isDepartmentRequiredRole(role.key),
      featureKeys:
        role.key === "org_admin"
          ? allFeatureKeys
          : permissionsByRole.get(role.id) ?? [],
    })),
    departments: departments.map((department) => ({
      id: department.id,
      name: department.name,
      code: department.code ?? null,
      collegeId: department.college_id ?? null,
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

  const { context } = result;
  const fullName = payload.fullName?.trim();
  const recipientEmail = payload.recipientEmail?.trim().toLowerCase() ?? "";
  const roleId = payload.roleId?.trim();
  const customRoleName = payload.customRoleName?.trim().replace(/\s+/g, " ");
  const customRoleRequiresDepartment = payload.customRoleRequiresDepartment === true;
  const allowedCustomFeatureKeys = new Set(
    getAssignableFeatureKeysForInstitution(context.institutionType),
  );
  const customRoleFeatureKeys = (payload.customRoleFeatureKeys ?? []).filter((key) =>
    allowedCustomFeatureKeys.has(key as FeatureKey),
  );

  if (!fullName || (!roleId && !customRoleName)) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(recipientEmail)) {
    return NextResponse.json(
      { error: "Enter a valid recipient email." },
      { status: 400 },
    );
  }

  const emailConfigError = getCustomerConversionEmailConfigError();

  if (emailConfigError) {
    return NextResponse.json({ error: emailConfigError }, { status: 500 });
  }

  let roleRow: TenantRoleRow | null = null;

  if (customRoleName) {
    if (customRoleFeatureKeys.length === 0) {
      return NextResponse.json(
        { error: "Select at least one feature for this custom role." },
        { status: 400 },
      );
    }

    try {
      roleRow = await createCustomRole(
        context.org.id,
        customRoleName,
        customRoleRequiresDepartment,
      );
      await replaceRoleFeaturePermissions(roleRow.id, customRoleFeatureKeys);
    } catch (error) {
      if (roleRow?.id) {
        await deleteCustomRole(roleRow.id);
      }

      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to create custom role.",
        },
        { status: 500 },
      );
    }
  } else if (roleId) {
    const { data, error } = await supabaseAdmin
      .from("roles")
      .select("id, key, name, requires_department")
      .eq("id", roleId)
      .eq("org_id", context.org.id)
      .single<TenantRoleRow>();

    if (error || !data) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    roleRow = data;
  }

  if (!roleRow) {
    return NextResponse.json({ error: "Role is required." }, { status: 400 });
  }

  if (roleRow.key === "org_admin") {
    return NextResponse.json(
      { error: "The protected admin role cannot be assigned from account creation." },
      { status: 400 },
    );
  }

  const roleRequiresDepartment =
    Boolean(roleRow.requires_department) || isDepartmentRequiredRole(roleRow.key);
  let managedDepartment: ManagedDepartmentRow | null = null;

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

  const department = managedDepartment?.name ?? (normalizeDepartment(payload.department) || null);
  const departmentId = managedDepartment?.id ?? null;

  if (roleRequiresDepartment && !department) {
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
      department_id: departmentId,
      full_name: fullName,
      first_login: false,
      onboarding_complete: true,
      must_change_password: true,
    },
  });

  if (createUserError || !createdUser?.user) {
    if (customRoleName) {
      await deleteCustomRole(roleRow.id);
    }
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
        department_id: departmentId,
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ])
    .select("id, full_name, email, employee_id, department, department_id, status, role_id, created_at")
    .single();

  if (orgUserError || !orgUserRow) {
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    if (customRoleName) {
      await deleteCustomRole(roleRow.id);
    }
    return NextResponse.json({ error: orgUserError?.message || "Failed to save user." }, { status: 500 });
  }

  const loginUrl = buildLoginUrl(req, orgInfo?.slug ?? context.org.slug ?? "institution");

  try {
    const emailResult = await sendTenantAccountCreatedEmail({
      to: recipientEmail,
      fullName,
      orgName: orgInfo?.name ?? "Your institution",
      loginEmail: email,
      tempPassword,
      loginUrl,
      roleName: roleRow.name,
      department,
    });

    return NextResponse.json({
      tempPassword,
      emailSentTo: emailResult.sentTo,
      emailDeliveryId: emailResult.id,
      loginUrl,
      user: {
        ...orgUserRow,
        role: {
          id: roleRow.id,
          key: roleRow.key,
          name: roleRow.name,
          requiresDepartment: roleRequiresDepartment,
        },
      },
    });
  } catch (error) {
    await supabaseAdmin.from("org_users").delete().eq("id", orgUserRow.id);
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    if (customRoleName) {
      await deleteCustomRole(roleRow.id);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? `Account was not created because the email could not be sent. ${error.message}`
            : "Account was not created because the email could not be sent.",
      },
      { status: 502 },
    );
  }

}
