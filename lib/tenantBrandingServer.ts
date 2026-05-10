import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  asRecord,
  normalizeTenantBranding,
  TENANT_BRAND_ASSET_BUCKET,
} from "@/lib/tenantBranding";

export const TENANT_BRAND_SIGNED_URL_SECONDS = 60 * 60;

export async function createSignedBrandLogoUrl(logoPath?: string | null) {
  if (!logoPath) {
    return "";
  }

  const { data, error } = await supabaseAdmin.storage
    .from(TENANT_BRAND_ASSET_BUCKET)
    .createSignedUrl(logoPath, TENANT_BRAND_SIGNED_URL_SECONDS);

  if (error) {
    return "";
  }

  return data?.signedUrl ?? "";
}

export async function getTenantBrandingFromConfig(
  onboardingConfig: unknown,
  fallbackLogoAlt?: string,
) {
  const brandingRecord = asRecord(asRecord(onboardingConfig).branding);
  const logoUrl = await createSignedBrandLogoUrl(
    typeof brandingRecord.logoPath === "string" ? brandingRecord.logoPath : null,
  );

  return normalizeTenantBranding(brandingRecord, {
    logoUrl,
    fallbackLogoAlt,
  });
}
