import "server-only";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getDefaultFeatureKeysForRole,
  getFeatureKeysForInstitution,
  normalizeInstitutionType,
  type FeatureKey,
  type InstitutionType,
} from "@/features/tenant-feature-catalog";

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
  full_name: string;
  email: string;
  status?: string | null;
};

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
    full_name: string;
    email: string;
    status: string;
  };
  org: TenantOrganization;
  role: TenantRole;
  institutionType: InstitutionType;
  isOrgAdmin: boolean;
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

  const { data: orgUserRow, error: orgUserError } = await supabaseAdmin
    .from("org_users")
    .select("id, org_id, role_id, full_name, email, status")
    .eq("auth_user_id", authUser.id)
    .maybeSingle<OrgUserRow>();

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

  const isOrgAdmin = role.key === "org_admin";

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
        full_name: orgUserRow.full_name,
        email: orgUserRow.email,
        status: accountStatus,
      },
      org,
      role,
      institutionType: normalizeInstitutionType(org.institution_type),
      isOrgAdmin,
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
    .insert(
      uniqueFeatureKeys.map((featureKey) => ({
        role_id: roleId,
        feature_key: featureKey,
        enabled: true,
        created_at: now,
        updated_at: now,
      })),
    );

  if (insertError) {
    throw new Error(insertError.message || "Failed to save feature permissions.");
  }
}

export async function seedDefaultRoleFeaturePermissions(
  orgId: string,
  institutionType: InstitutionType,
) {
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("roles")
    .select("id, key")
    .eq("org_id", orgId);

  if (rolesError) {
    throw new Error(rolesError.message || "Failed to load roles for feature seeding.");
  }

  for (const role of roles ?? []) {
    const featureKeys =
      role.key === "org_admin"
        ? getFeatureKeysForInstitution(institutionType)
        : getDefaultFeatureKeysForRole(role.key, institutionType);

    await replaceRoleFeaturePermissions(role.id, featureKeys);
  }
}
