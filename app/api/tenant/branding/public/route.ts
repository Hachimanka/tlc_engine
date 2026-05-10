import { NextResponse } from "next/server";
import { asRecord, normalizeTenantBranding } from "@/lib/tenantBranding";
import { createSignedBrandLogoUrl } from "@/lib/tenantBrandingServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type OrganizationBrandingRow = {
  id: string;
  name: string;
  slug: string;
  onboarding_config?: unknown;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim().toLowerCase();

  if (!slug) {
    return NextResponse.json({ error: "Organization slug is required." }, { status: 400 });
  }

  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("id, name, slug, onboarding_config")
    .eq("slug", slug)
    .maybeSingle<OrganizationBrandingRow>();

  if (error || !org?.id) {
    return NextResponse.json(
      { error: error?.message || "Organization not found." },
      { status: 404 },
    );
  }

  const currentConfig = asRecord(org.onboarding_config);
  const currentBranding = asRecord(currentConfig.branding);
  const logoUrl = await createSignedBrandLogoUrl(
    typeof currentBranding.logoPath === "string" ? currentBranding.logoPath : null,
  );

  return NextResponse.json({
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
    },
    branding: normalizeTenantBranding(currentBranding, {
      logoUrl,
      fallbackLogoAlt: org.name,
    }),
  });
}
