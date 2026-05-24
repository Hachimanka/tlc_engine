import { NextResponse } from "next/server";
import { loadTenantContext } from "@/lib/tenantAccess";
import { getTenantBrandingFromConfig } from "@/lib/tenantBrandingServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type OptionalExportFields = {
  school_year?: string | null;
  reviewed_by?: string | null;
  reviewed_position?: string | null;
  approved_by?: string | null;
  approved_position?: string | null;
  address?: string | null;
  logo_url?: string | null;
};

type OrgSignatoryRow = {
  full_name: string | null;
  role_label?: string | null;
  status?: string | null;
  roles?: { key?: string | null; name?: string | null } | { key?: string | null; name?: string | null }[] | null;
};

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeKey = (value: unknown) =>
  normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const isBlankSignatory = (value: unknown) => {
  const text = normalizeText(value);
  return !text || text === "—" || text === "-";
};

const currentSchoolYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `SY ${year}-${year + 1}`;
};

const normalizeJoinedRole = (role: OrgSignatoryRow["roles"]) => {
  if (Array.isArray(role)) {
    return role[0] ?? null;
  }

  return role ?? null;
};

const roleSearchText = (user: OrgSignatoryRow) => {
  const role = normalizeJoinedRole(user.roles);
  return [
    user.role_label,
    role?.key,
    role?.name,
  ].map(normalizeKey).filter(Boolean).join(" ");
};

const findSignatory = (
  users: OrgSignatoryRow[],
  keywords: string[],
) =>
  users.find((user) => {
    const searchText = roleSearchText(user);
    return keywords.some((keyword) => searchText.includes(keyword));
  });

const loadOptionalExportFields = async (orgId: string) => {
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("school_year, reviewed_by, reviewed_position, approved_by, approved_position, address, logo_url")
    .eq("id", orgId)
    .maybeSingle<OptionalExportFields>();

  if (error) {
    return {};
  }

  return data ?? {};
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const branding = await getTenantBrandingFromConfig(
    context.org.onboarding_config,
    context.org.name,
  );
  const optionalFields = await loadOptionalExportFields(context.org.id);
  const { data: users } = await supabaseAdmin
    .from("org_users")
    .select("full_name, role_label, status, roles(key, name)")
    .eq("org_id", context.org.id)
    .eq("status", "active")
    .returns<OrgSignatoryRow[]>();

  const activeUsers = users ?? [];
  const reviewedUser = findSignatory(activeUsers, [
    "dean",
    "chair",
    "chairman",
    "department_head",
    "program_chair",
    "program_head",
  ]);
  const approvedUser = findSignatory(activeUsers, [
    "vpaa",
    "vice_president",
    "academic_director",
    "director",
    "president",
    "principal",
    "school_head",
  ]);
  const adminUser = findSignatory(activeUsers, ["org_admin", "admin"]);
  const reviewedPosition =
    normalizeText(optionalFields.reviewed_position) || "Dean / Department Head";
  const approvedPosition =
    normalizeText(optionalFields.approved_position) || "VPAA / School Director";

  return NextResponse.json({
    teacherName: context.orgUser.full_name,
    schoolYear: normalizeText(optionalFields.school_year) || currentSchoolYear(),
    reviewedBy: !isBlankSignatory(optionalFields.reviewed_by)
      ? normalizeText(optionalFields.reviewed_by)
      : reviewedUser?.full_name || adminUser?.full_name || "—",
    reviewedPosition,
    approvedBy: !isBlankSignatory(optionalFields.approved_by)
      ? normalizeText(optionalFields.approved_by)
      : approvedUser?.full_name || adminUser?.full_name || "—",
    approvedPosition,
    address: normalizeText(optionalFields.address),
    orgLogoUrl: branding.logoUrl || normalizeText(optionalFields.logo_url) || null,
    orgLogoAlt: branding.logoAlt || context.org.name,
    orgName: context.org.name,
  });
}
