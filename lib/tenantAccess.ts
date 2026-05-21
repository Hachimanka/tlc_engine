import "server-only";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getFeatureKeysForInstitution,
  normalizeInstitutionType,
  type FeatureKey,
  type InstitutionType,
} from "@/features/tenant-feature-catalog";
import {
  getDefaultFeatureKeysForRole,
  getLegacySystemRoleTargetKey,
  getSystemRoleDefinitionsForInstitution,
  normalizeRoleKey,
  type SystemRoleDefinition,
} from "@/features/tenant-role-catalog";

type TenantRole = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  is_system?: boolean;
};

type TenantOrganization = {
  id: string;
  name: string;
  slug: string;
  institution_type?: string | null;
  onboarding_config?: unknown;
};

type OrgUserRow = {
  id: string;
  org_id: string;
  role_id: string;
  role_label?: string | null;
  full_name: string;
  email: string;
  department?: string | null;
  status?: string | null;
};

type DatabaseErrorLike = {
  code?: string;
  message?: string;
};

export const isMissingRoleLabelError = (error?: DatabaseErrorLike | null) =>
  error?.code === "42703" ||
  error?.message?.toLowerCase().includes("org_users.role_label") ||
  error?.message?.toLowerCase().includes("role_label");

export const isMissingOrgUserFeaturePermissionsError = (error?: DatabaseErrorLike | null) =>
  error?.code === "42P01" ||
  error?.message?.toLowerCase().includes("org_user_feature_permissions");

export type TenantContext = {
  authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  orgUser: {
    id: string;
    org_id: string;
    role_id: string;
    role_label: string | null;
    full_name: string;
    email: string;
    department: string | null;
    status: string;
  };
  org: TenantOrganization;
  role: TenantRole;
  institutionType: InstitutionType;
  isOrgAdmin: boolean;
  enabledFeatureKeys: FeatureKey[];
};

export const getBearerToken = (req: Request) => {
  const authHeader = req.headers.get("authorization") || "";
  const [type, token] = authHeader.split(" ");

  if (type?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

export async function loadTenantContext(
  req: Request,
  options: { requireOrgAdmin?: boolean } = {},
): Promise<{ context: TenantContext; error?: never } | { context?: never; error: NextResponse }> {
  const token = getBearerToken(req);

  if (!token) {
    return {
      error: NextResponse.json({ error: "Missing authorization token." }, { status: 401 }),
    };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  const authUser = authData?.user;

  if (authError || !authUser) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  let { data: orgUserRow, error: orgUserError } = await supabaseAdmin
    .from("org_users")
    .select("id, org_id, role_id, role_label, full_name, email, department, status")
    .eq("auth_user_id", authUser.id)
    .maybeSingle<OrgUserRow>();

  if (isMissingRoleLabelError(orgUserError)) {
    const fallbackResult = await supabaseAdmin
      .from("org_users")
      .select("id, org_id, role_id, full_name, email, department, status")
      .eq("auth_user_id", authUser.id)
      .maybeSingle<OrgUserRow>();

    orgUserRow = fallbackResult.data;
    orgUserError = fallbackResult.error;
  }

  if (orgUserError || !orgUserRow?.org_id) {
    const message = orgUserError?.message
      ? `Organization membership lookup failed: ${orgUserError.message}`
      : "Organization membership not found for this auth user.";

    return {
      error: NextResponse.json({ error: message }, { status: 403 }),
    };
  }

  const accountStatus = orgUserRow.status ?? "active";

  if (accountStatus !== "active") {
    return {
      error: NextResponse.json({ error: "Account is disabled." }, { status: 403 }),
    };
  }

  const { data: role, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name, description, is_system")
    .eq("id", orgUserRow.role_id)
    .eq("org_id", orgUserRow.org_id)
    .maybeSingle<TenantRole>();

  if (roleError || !role?.id) {
    return {
      error: NextResponse.json(
        {
          error: roleError?.message
            ? `Organization role lookup failed: ${roleError.message}`
            : "Organization role context not found.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id, name, slug, institution_type, onboarding_config")
    .eq("id", orgUserRow.org_id)
    .maybeSingle<TenantOrganization>();

  if (orgError || !org?.id) {
    return {
      error: NextResponse.json(
        {
          error: orgError?.message
            ? `Organization lookup failed: ${orgError.message}`
            : "Organization context not found.",
        },
        { status: 403 },
      ),
    };
  }

  const institutionType = normalizeInstitutionType(org.institution_type);
  const isOrgAdmin = role.key === "org_admin";
  const enabledFeatureKeys = await getEnabledFeatureKeysForOrgUser(
    orgUserRow,
    role,
    institutionType,
  );

  if (options.requireOrgAdmin && !isOrgAdmin) {
    return {
      error: NextResponse.json({ error: "Insufficient permissions." }, { status: 403 }),
    };
  }

  return {
    context: {
      authUser: {
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata,
      },
      orgUser: {
        id: orgUserRow.id,
        org_id: orgUserRow.org_id,
        role_id: orgUserRow.role_id,
        role_label: orgUserRow.role_label ?? role.name ?? null,
        full_name: orgUserRow.full_name,
        email: orgUserRow.email,
        department: orgUserRow.department ?? null,
        status: accountStatus,
      },
      org,
      role,
      institutionType,
      isOrgAdmin,
      enabledFeatureKeys,
    },
  };
}

export async function getEnabledFeatureKeysForRole(
  role: Pick<TenantRole, "id" | "key">,
  institutionType: InstitutionType,
) {
  if (role.key === "org_admin") {
    return getFeatureKeysForInstitution(institutionType);
  }

  const { data, error } = await supabaseAdmin
    .from("role_feature_permissions")
    .select("feature_key")
    .eq("role_id", role.id)
    .eq("enabled", true);

  if (error) {
    throw new Error(error.message || "Failed to load feature permissions.");
  }

  return (data ?? []).map((row) => row.feature_key as FeatureKey);
}

export async function getEnabledFeatureKeysForOrgUser(
  orgUser: Pick<OrgUserRow, "id">,
  role: Pick<TenantRole, "id" | "key">,
  institutionType: InstitutionType,
) {
  if (role.key === "org_admin") {
    return getFeatureKeysForInstitution(institutionType);
  }

  const { data, error } = await supabaseAdmin
    .from("org_user_feature_permissions")
    .select("feature_key")
    .eq("org_user_id", orgUser.id)
    .eq("enabled", true);

  if (isMissingOrgUserFeaturePermissionsError(error)) {
    return getEnabledFeatureKeysForRole(role, institutionType);
  }

  if (error) {
    throw new Error(error.message || "Failed to load account feature permissions.");
  }

  return (data ?? []).map((row) => row.feature_key as FeatureKey);
}

export async function replaceRoleFeaturePermissions(
  roleId: string,
  featureKeys: string[],
) {
  const uniqueFeatureKeys = Array.from(new Set(featureKeys));
  const now = new Date().toISOString();

  const { error: deleteError } = await supabaseAdmin
    .from("role_feature_permissions")
    .delete()
    .eq("role_id", roleId);

  if (deleteError) {
    throw new Error(deleteError.message || "Failed to clear feature permissions.");
  }

  if (uniqueFeatureKeys.length === 0) {
    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("role_feature_permissions")
    .upsert(
      uniqueFeatureKeys.map((featureKey) => ({
        role_id: roleId,
        feature_key: featureKey,
        enabled: true,
        created_at: now,
        updated_at: now,
      })),
      { onConflict: "role_id,feature_key" },
    );

  if (insertError) {
    throw new Error(insertError.message || "Failed to save feature permissions.");
  }
}

export async function replaceOrgUserFeaturePermissions(
  orgUserId: string,
  featureKeys: string[],
) {
  const uniqueFeatureKeys = Array.from(new Set(featureKeys));
  const now = new Date().toISOString();

  const { error: deleteError } = await supabaseAdmin
    .from("org_user_feature_permissions")
    .delete()
    .eq("org_user_id", orgUserId);

  if (deleteError) {
    throw new Error(deleteError.message || "Failed to clear account feature permissions.");
  }

  if (uniqueFeatureKeys.length === 0) {
    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("org_user_feature_permissions")
    .upsert(
      uniqueFeatureKeys.map((featureKey) => ({
        org_user_id: orgUserId,
        feature_key: featureKey,
        enabled: true,
        created_at: now,
        updated_at: now,
      })),
      { onConflict: "org_user_id,feature_key" },
    );

  if (insertError) {
    throw new Error(insertError.message || "Failed to save account feature permissions.");
  }
}

const loadRolesForOrg = async (orgId: string): Promise<TenantRole[]> => {
  const { data, error } = await supabaseAdmin
    .from("roles")
    .select("id, key, name, description, is_system")
    .eq("org_id", orgId);

  if (error) {
    throw new Error(error.message || "Failed to load organization roles.");
  }

  return (data ?? []) as TenantRole[];
};

const getRoleUserCount = async (roleId: string) => {
  const { count, error } = await supabaseAdmin
    .from("org_users")
    .select("id", { count: "exact", head: true })
    .eq("role_id", roleId);

  if (error) {
    throw new Error(error.message || "Failed to count role users.");
  }

  return count ?? 0;
};

const buildUniqueRoleKey = async (
  orgId: string,
  baseKey: string,
  excludeRoleId?: string,
) => {
  let nextKey = normalizeRoleKey(baseKey);
  let suffix = 2;

  while (true) {
    let query = supabaseAdmin
      .from("roles")
      .select("id")
      .eq("org_id", orgId)
      .eq("key", nextKey);

    if (excludeRoleId) {
      query = query.neq("id", excludeRoleId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to check role key uniqueness.");
    }

    if (!data?.id) {
      return nextKey;
    }

    nextKey = `${normalizeRoleKey(baseKey)}_${suffix}`;
    suffix += 1;
  }
};

const isDuplicateRoleKeyError = (error: { code?: string; message?: string }) =>
  error.code === "23505" ||
  error.message?.toLowerCase().includes("duplicate") ||
  error.message?.toLowerCase().includes("unique");

const legacyDescriptionFor = (role: TenantRole) => {
  const legacyNote =
    "Legacy system role preserved during institution-specific role setup.";

  if (role.description?.includes(legacyNote)) {
    return role.description;
  }

  return [role.description, legacyNote].filter(Boolean).join(" ");
};

async function renameCustomRoleConflict(
  orgId: string,
  role: TenantRole,
  now: string,
) {
  if (role.key === "org_admin" || role.is_system) {
    return false;
  }

  const nextKey = await buildUniqueRoleKey(
    orgId,
    `${normalizeRoleKey(role.key)}_custom`,
    role.id,
  );

  const { error } = await supabaseAdmin
    .from("roles")
    .update({
      key: nextKey,
      description:
        role.description ||
        "Custom role preserved before institution-specific system roles were applied.",
      updated_at: now,
    })
    .eq("id", role.id)
    .eq("org_id", orgId);

  if (error) {
    throw new Error(error.message || "Failed to preserve custom role.");
  }

  return true;
}

async function ensureSystemRole(
  orgId: string,
  definition: SystemRoleDefinition,
  now: string,
) {
  let changed = false;
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name, description, is_system")
    .eq("org_id", orgId)
    .eq("key", definition.key)
    .maybeSingle<TenantRole>();

  if (existingError) {
    throw new Error(existingError.message || "Failed to check system role.");
  }

  if (existing?.id && !existing.is_system && existing.key !== "org_admin") {
    changed = (await renameCustomRoleConflict(orgId, existing, now)) || changed;
  }

  const { data: current, error: currentError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name, description, is_system")
    .eq("org_id", orgId)
    .eq("key", definition.key)
    .maybeSingle<TenantRole>();

  if (currentError) {
    throw new Error(currentError.message || "Failed to reload system role.");
  }

  if (current?.id) {
    if (
      current.name === definition.name &&
      current.description === definition.description &&
      current.is_system === true
    ) {
      return changed;
    }

    const { error } = await supabaseAdmin
      .from("roles")
      .update({
        name: definition.name,
        description: definition.description,
        is_system: true,
        updated_at: now,
      })
      .eq("id", current.id)
      .eq("org_id", orgId);

    if (error) {
      throw new Error(error.message || "Failed to update system role.");
    }

    return true;
  }

  const { error: insertError } = await supabaseAdmin.from("roles").insert([
    {
      org_id: orgId,
      key: definition.key,
      name: definition.name,
      description: definition.description,
      is_system: true,
      created_at: now,
      updated_at: now,
    },
  ]);

  if (insertError && !isDuplicateRoleKeyError(insertError)) {
    throw new Error(insertError.message || "Failed to create system role.");
  }

  return !insertError;
}

async function moveUsersToRole(
  orgId: string,
  sourceRoleId: string,
  targetRoleId: string,
  now: string,
) {
  const { error } = await supabaseAdmin
    .from("org_users")
    .update({
      role_id: targetRoleId,
      updated_at: now,
    })
    .eq("org_id", orgId)
    .eq("role_id", sourceRoleId);

  if (error) {
    throw new Error(error.message || "Failed to move users to system role.");
  }
}

async function deleteRoleIfUnused(orgId: string, roleId: string) {
  const userCount = await getRoleUserCount(roleId);

  if (userCount > 0) {
    return false;
  }

  const { error } = await supabaseAdmin
    .from("roles")
    .delete()
    .eq("id", roleId)
    .eq("org_id", orgId);

  if (error) {
    throw new Error(error.message || "Failed to remove unused legacy role.");
  }

  return true;
}

export async function reconcileInstitutionSystemRoles(
  orgId: string,
  institutionType: InstitutionType,
  options: { forceSeedPermissions?: boolean } = {},
) {
  const systemRoles = getSystemRoleDefinitionsForInstitution(institutionType);
  const now = new Date().toISOString();
  let changed = false;

  for (const roleDefinition of systemRoles) {
    changed = (await ensureSystemRole(orgId, roleDefinition, now)) || changed;
  }

  let roles = await loadRolesForOrg(orgId);
  let rolesByKey = new Map(roles.map((role) => [normalizeRoleKey(role.key), role]));
  const systemRoleKeys = new Set(systemRoles.map((role) => role.key));

  for (const role of roles) {
    const normalizedKey = normalizeRoleKey(role.key);

    if (!role.is_system || systemRoleKeys.has(normalizedKey)) {
      continue;
    }

    const targetKey = getLegacySystemRoleTargetKey(normalizedKey, institutionType);
    const targetRole = targetKey ? rolesByKey.get(targetKey) : null;

    if (!targetRole?.id) {
      continue;
    }

    await moveUsersToRole(orgId, role.id, targetRole.id, now);
    changed = true;
    changed = (await deleteRoleIfUnused(orgId, role.id)) || changed;
  }

  roles = await loadRolesForOrg(orgId);

  for (const role of roles) {
    const normalizedKey = normalizeRoleKey(role.key);

    if (!role.is_system || systemRoleKeys.has(normalizedKey)) {
      continue;
    }

    const userCount = await getRoleUserCount(role.id);

    if (userCount > 0) {
      const { error } = await supabaseAdmin
        .from("roles")
        .update({
          is_system: false,
          description: legacyDescriptionFor(role),
          updated_at: now,
        })
        .eq("id", role.id)
        .eq("org_id", orgId);

      if (error) {
        throw new Error(error.message || "Failed to preserve legacy role.");
      }

      changed = true;
      continue;
    }

    changed = (await deleteRoleIfUnused(orgId, role.id)) || changed;
  }

  if (!changed && !options.forceSeedPermissions) {
    return;
  }

  roles = await loadRolesForOrg(orgId);
  rolesByKey = new Map(roles.map((role) => [normalizeRoleKey(role.key), role]));

  for (const roleDefinition of systemRoles) {
    const role = rolesByKey.get(roleDefinition.key);

    if (!role?.id || !role.is_system) {
      continue;
    }

    await replaceRoleFeaturePermissions(
      role.id,
      getDefaultFeatureKeysForRole(role.key, institutionType),
    );
  }
}

export async function seedDefaultRoleFeaturePermissions(
  orgId: string,
  institutionType: InstitutionType,
) {
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("roles")
    .select("id, key, is_system")
    .eq("org_id", orgId);

  if (rolesError) {
    throw new Error(rolesError.message || "Failed to load roles for feature seeding.");
  }

  for (const role of roles ?? []) {
    if (!role.is_system) {
      continue;
    }

    const featureKeys =
      role.key === "org_admin"
        ? getFeatureKeysForInstitution(institutionType)
        : getDefaultFeatureKeysForRole(role.key, institutionType);

    await replaceRoleFeaturePermissions(role.id, featureKeys);
  }
}
