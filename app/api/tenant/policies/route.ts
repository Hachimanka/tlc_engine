import { NextResponse } from "next/server";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const onboardingConfig = asRecord(context.org.onboarding_config);

  return NextResponse.json({
    institutionType: context.institutionType,
    onboardingConfig,
    policies: asRecord(onboardingConfig.policies),
    org: {
      id: context.org.id,
      name: context.org.name,
      slug: context.org.slug,
    },
    isOrgAdmin: context.isOrgAdmin,
  });
}

export async function PATCH(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  let payload: { policies?: unknown } = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!payload.policies || typeof payload.policies !== "object" || Array.isArray(payload.policies)) {
    return NextResponse.json({ error: "Policies object is required." }, { status: 400 });
  }

  const currentConfig = asRecord(context.org.onboarding_config);
  const nextConfig = {
    ...currentConfig,
    policies: payload.policies,
  };

  const { error } = await supabaseAdmin
    .from("organizations")
    .update({
      onboarding_config: nextConfig,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.org.id);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to save policies." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    institutionType: context.institutionType,
    onboardingConfig: nextConfig,
    policies: payload.policies,
  });
}
