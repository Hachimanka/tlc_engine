import { NextResponse } from "next/server";
import {
  getAssignableFeatureKeysForInstitution,
  type FeatureKey,
} from "@/features/tenant-feature-catalog";
import { isDepartmentRequiredRole } from "@/features/tenant-role-catalog";
import {
  loadTenantContext,
  replaceRoleFeaturePermissions,
} from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type UpdateRoleRequest = {
  name?: string;
  description?: string;
  featureKeys?: string[];
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const { roleId } = await params;

  const { data: role, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name, description, is_system, requires_department, org_id")
    .eq("id", roleId)
    .eq("org_id", context.org.id)
    .single();

  if (roleError || !role) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  if (role.key === "org_admin") {
    return NextResponse.json(
      { error: "Org Admin always has full access and cannot be modified here." },
      { status: 403 },
    );
  }

  let payload: UpdateRoleRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const nextName = payload.name?.trim() || role.name;
  const nextDescription =
    typeof payload.description === "string"
      ? payload.description.trim() || null
      : role.description;

  const { error: updateError } = await supabaseAdmin
    .from("roles")
    .update({
      name: nextName,
      description: nextDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", role.id)
    .eq("org_id", context.org.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Failed to update role." },
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update role features.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    role: {
      id: role.id,
      key: role.key,
      name: nextName,
      description: nextDescription,
      isSystem: Boolean(role.is_system),
      requiresDepartment:
        Boolean(role.requires_department) || isDepartmentRequiredRole(role.key),
      featureKeys,
    },
  });
}
