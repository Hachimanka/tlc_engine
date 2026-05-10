import { NextResponse } from "next/server";
import {
  getActiveFeatureHref,
  getFeaturesForInstitution,
} from "@/features/tenant-feature-catalog";
import {
  getEnabledFeatureKeysForRole,
  loadTenantContext,
} from "@/lib/tenantAccess";
import {
  createSignedAvatarUrl,
  getUserProfileRow,
} from "@/lib/userProfiles";
import { getTenantBrandingFromConfig } from "@/lib/tenantBrandingServer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  try {
    const profile = await getUserProfileRow(context.authUser.id);
    const avatarUrl = await createSignedAvatarUrl(profile?.avatar_path);
    const branding = await getTenantBrandingFromConfig(
      context.org.onboarding_config,
      context.org.name,
    );
    const enabledFeatureKeys = await getEnabledFeatureKeysForRole(
      context.role,
      context.institutionType,
    );
    const availableFeatures = getFeaturesForInstitution(context.institutionType);

    return NextResponse.json({
      org: {
        id: context.org.id,
        name: context.org.name,
        slug: context.org.slug,
        institutionType: context.institutionType,
      },
      branding,
      user: {
        id: context.authUser.id,
        fullName: profile?.display_name || context.orgUser.full_name,
        email: context.orgUser.email,
        avatarUrl,
      },
      role: {
        id: context.role.id,
        key: context.role.key,
        name: context.role.name,
        isSystem: Boolean(context.role.is_system),
      },
      isOrgAdmin: context.isOrgAdmin,
      enabledFeatureKeys,
      availableFeatures,
      firstActiveHref: context.isOrgAdmin
        ? "/tenant/tenant-admin"
        : getActiveFeatureHref(enabledFeatureKeys, context.institutionType),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load tenant access.",
      },
      { status: 500 },
    );
  }
}
