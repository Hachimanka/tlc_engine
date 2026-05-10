import { NextResponse } from "next/server";
import {
  normalizeInstitutionType,
  type InstitutionType,
} from "@/features/tenant-feature-catalog";
import {
  loadTenantContext,
  reconcileInstitutionSystemRoles,
} from "@/lib/tenantAccess";
import { asRecord } from "@/lib/tenantBranding";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type OnboardingRequest = {
  institutionType?: InstitutionType;
  profile?: unknown;
  departments?: unknown;
  programs?: unknown;
  gradeLevels?: unknown;
  qualifications?: unknown;
  courses?: unknown;
  instructors?: unknown;
  academic?: unknown;
  grading?: unknown;
};

export async function POST(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  let payload: OnboardingRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const institutionType = normalizeInstitutionType(payload.institutionType);

  if (!institutionType) {
    return NextResponse.json(
      { error: "Institution type is required." },
      { status: 400 },
    );
  }

  const currentConfig = asRecord(context.org.onboarding_config);
  const onboardingConfig = {
    ...currentConfig,
    profile: payload.profile ?? null,
    departments: payload.departments ?? [],
    programs: payload.programs ?? [],
    gradeLevels: payload.gradeLevels ?? null,
    qualifications: payload.qualifications ?? [],
    courses: payload.courses ?? [],
    instructors: payload.instructors ?? [],
    academic: payload.academic ?? null,
    grading: payload.grading ?? null,
  };

  const { error: orgError } = await supabaseAdmin
    .from("organizations")
    .update({
      institution_type: institutionType,
      onboarding_config: onboardingConfig,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.org.id);

  if (orgError) {
    return NextResponse.json(
      { error: orgError.message || "Failed to save organization setup." },
      { status: 500 },
    );
  }

  try {
    await reconcileInstitutionSystemRoles(context.org.id, institutionType, {
      forceSeedPermissions: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reconcile role defaults.",
      },
      { status: 500 },
    );
  }

  const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
    context.authUser.id,
    {
      user_metadata: {
        ...(context.authUser.user_metadata ?? {}),
        first_login: false,
        onboarding_complete: true,
        institution_type: institutionType,
        onboarding_profile: payload.profile ?? null,
      },
    },
  );

  if (metadataError) {
    return NextResponse.json(
      { error: metadataError.message || "Failed to update admin metadata." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    org: {
      id: context.org.id,
      institutionType,
    },
  });
}
