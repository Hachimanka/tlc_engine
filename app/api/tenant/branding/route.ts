import { NextResponse } from "next/server";
import {
  asRecord,
  DEFAULT_TENANT_BRANDING,
  isHexColor,
  normalizeTenantBranding,
  TENANT_BRAND_ASSET_BUCKET,
  TENANT_BRANDING_COLOR_FIELDS,
} from "@/lib/tenantBranding";
import { createSignedBrandLogoUrl } from "@/lib/tenantBrandingServer";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MAX_LOGO_BYTES = 750_000;
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const getLogoFile = (formData: FormData) => {
  const logoEntry = formData.get("logo");

  if (!logoEntry) {
    return { file: null as File | null };
  }

  if (!(logoEntry instanceof File)) {
    return { file: null as File | null, error: "Logo must be an image file." };
  }

  if (logoEntry.size === 0) {
    return { file: null as File | null };
  }

  const extension = ALLOWED_LOGO_TYPES[logoEntry.type];

  if (!extension) {
    return {
      file: null as File | null,
      error: "Please choose a JPG, PNG, WEBP, or GIF logo.",
    };
  }

  if (logoEntry.size > MAX_LOGO_BYTES) {
    return {
      file: null as File | null,
      error: "Please choose a logo below 750 KB.",
    };
  }

  return { file: logoEntry, extension };
};

const uploadLogo = async (orgId: string, file: File, extension: string) => {
  const filePath = `${orgId}/logo-${Date.now()}.${extension}`;
  const fileBody = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from(TENANT_BRAND_ASSET_BUCKET)
    .upload(filePath, fileBody, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Failed to upload logo.");
  }

  return filePath;
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const currentConfig = asRecord(context.org.onboarding_config);
  const currentBranding = asRecord(currentConfig.branding);
  const logoUrl = await createSignedBrandLogoUrl(
    typeof currentBranding.logoPath === "string" ? currentBranding.logoPath : null,
  );

  return NextResponse.json({
    org: {
      id: context.org.id,
      name: context.org.name,
      slug: context.org.slug,
    },
    isOrgAdmin: context.isOrgAdmin,
    branding: normalizeTenantBranding(currentBranding, {
      logoUrl,
      fallbackLogoAlt: context.org.name,
    }),
  });
}

export async function PATCH(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return jsonError("Expected multipart form data.", 400);
  }

  const currentConfig = asRecord(context.org.onboarding_config);
  const currentBranding = asRecord(currentConfig.branding);
  const nextColors: Record<string, string> = {};

  for (const field of TENANT_BRANDING_COLOR_FIELDS) {
    const value = formData.get(field);
    const fallback = currentBranding[field] ?? DEFAULT_TENANT_BRANDING[field];
    const nextValue = typeof value === "string" && value.trim() ? value.trim() : String(fallback);

    if (!isHexColor(nextValue)) {
      return jsonError(`${field} must be a #RRGGBB hex color.`, 400);
    }

    nextColors[field] = nextValue.toLowerCase();
  }

  const logoAltValue = formData.get("logoAlt");
  const logoAlt =
    typeof logoAltValue === "string" && logoAltValue.trim()
      ? logoAltValue.trim().slice(0, 120)
      : context.org.name;
  const loginTitleValue = formData.get("loginTitle");
  const loginSubtitleValue = formData.get("loginSubtitle");
  const loginTitle =
    typeof loginTitleValue === "string" && loginTitleValue.trim()
      ? loginTitleValue.trim().slice(0, 80)
      : DEFAULT_TENANT_BRANDING.loginTitle;
  const loginSubtitle =
    typeof loginSubtitleValue === "string" && loginSubtitleValue.trim()
      ? loginSubtitleValue.trim().slice(0, 180)
      : DEFAULT_TENANT_BRANDING.loginSubtitle;
  const removeLogo = formData.get("removeLogo") === "true";
  const logo = getLogoFile(formData);

  if (logo.error) {
    return jsonError(logo.error, 400);
  }

  try {
    const uploadedLogoPath =
      logo.file && logo.extension
        ? await uploadLogo(context.org.id, logo.file, logo.extension)
        : null;
    const currentLogoPath =
      typeof currentBranding.logoPath === "string" ? currentBranding.logoPath : null;
    const nextLogoPath = uploadedLogoPath ?? (removeLogo ? null : currentLogoPath);
    const nextBranding = {
      ...currentBranding,
      ...nextColors,
      logoPath: nextLogoPath,
      logoAlt,
      loginTitle,
      loginSubtitle,
      updatedAt: new Date().toISOString(),
    };
    const nextConfig = {
      ...currentConfig,
      branding: nextBranding,
    };

    const { error } = await supabaseAdmin
      .from("organizations")
      .update({
        onboarding_config: nextConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.org.id);

    if (error) {
      throw new Error(error.message || "Failed to save branding.");
    }

    if (
      currentLogoPath &&
      (removeLogo || uploadedLogoPath) &&
      currentLogoPath !== uploadedLogoPath
    ) {
      await supabaseAdmin.storage
        .from(TENANT_BRAND_ASSET_BUCKET)
        .remove([currentLogoPath]);
    }

    const logoUrl = await createSignedBrandLogoUrl(nextLogoPath);

    return NextResponse.json({
      branding: normalizeTenantBranding(nextBranding, {
        logoUrl,
        fallbackLogoAlt: context.org.name,
      }),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to save branding.",
      500,
    );
  }
}
