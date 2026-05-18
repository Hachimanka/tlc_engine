import { NextResponse } from "next/server";
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
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type CreateRoleRequest = {
  name?: string;
  description?: string;
  featureKeys?: string[];
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
    const { data } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("org_id", orgId)
      .eq("key", nextKey)
      .maybeSingle();

    if (!data?.id) {
      return nextKey;
    }

    nextKey = `${baseKey}_${suffix}`;
    suffix += 1;
  }
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
    .select("id, key, name, description, is_system, requires_department, created_at")
    .eq("org_id", context.org.id)
    .order("created_at", { ascending: true });

  if (rolesError) {
    return NextResponse.json(
      { error: rolesError.message || "Failed to load roles." },
      { status: 500 },
    );
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

  const allKeys = getFeatureKeysForInstitution(context.institutionType);
  const assignableKeys = new Set(
    getAssignableFeatureKeysForInstitution(context.institutionType),
  );

  return NextResponse.json({
    org: {
      id: context.org.id,
      name: context.org.name,
      slug: context.org.slug,
      institutionType: context.institutionType,
    },
    features: getFeaturesForInstitution(context.institutionType),
    roles: (roles ?? []).map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: Boolean(role.is_system),
      requiresDepartment:
        Boolean(role.requires_department) || isDepartmentRequiredRole(role.key),
      featureKeys:
        role.key === "org_admin"
          ? allKeys
          : (permissionsByRole.get(role.id) ?? []).filter((key) =>
              assignableKeys.has(key as FeatureKey),
            ),
    })),
  });
}

export async function POST(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  let payload: CreateRoleRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = payload.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Role name is required." }, { status: 400 });
  }

  const roleKey = await buildUniqueRoleKey(context.org.id, name);
  const now = new Date().toISOString();

  const { data: role, error: roleError } = await supabaseAdmin
    .from("roles")
    .insert([
      {
        org_id: context.org.id,
        key: roleKey,
        name,
        description: payload.description?.trim() || null,
        is_system: false,
        requires_department: false,
        created_at: now,
        updated_at: now,
      },
    ])
    .select("id, key, name, description, is_system, requires_department")
    .single();

  if (roleError || !role) {
    return NextResponse.json(
      { error: roleError?.message || "Failed to create role." },
      { status: 500 },
    );
  }

  const allowedKeys = new Set(
    getAssignableFeatureKeysForInstitution(context.institutionType),
  );
  const featureKeys = (payload.featureKeys ?? []).filter((key) =>
    allowedKeys.has(key as FeatureKey),
  );

  try {
    await replaceRoleFeaturePermissions(role.id, featureKeys);
  } catch (error) {
    await supabaseAdmin.from("roles").delete().eq("id", role.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save role features.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    role: {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: Boolean(role.is_system),
      requiresDepartment:
        Boolean(role.requires_department) || isDepartmentRequiredRole(role.key),
      featureKeys,
    },
  });
}
