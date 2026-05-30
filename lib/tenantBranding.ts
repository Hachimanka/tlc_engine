export type TenantBranding = {
  primaryColor: string;
  lightPrimaryColor: string;
  secondaryColor: string;
  accentColor: string;
  defaultColor: string;
  backgroundColor: string;
  cardColor: string;
  logoPath: string | null;
  logoUrl: string;
  logoAlt: string;
  loginTitle: string;
  loginSubtitle: string;
  updatedAt: string | null;
};

export type TenantBrandingColorField =
  | "primaryColor"
  | "lightPrimaryColor"
  | "secondaryColor"
  | "accentColor"
  | "defaultColor"
  | "backgroundColor"
  | "cardColor";

export const TENANT_BRAND_ASSET_BUCKET = "org-brand-assets";
export const DEFAULT_TENANT_LOGO_URL = "/navbar/tlclogo.png";

export const DEFAULT_TENANT_BRANDING: TenantBranding = {
  primaryColor: "#006b5f",
  lightPrimaryColor: "#029383",
  secondaryColor: "#01ac8e",
  accentColor: "#006b5f",
  defaultColor: "#c5eeea",
  backgroundColor: "#f3f3f1",
  cardColor: "#ffffff",
  logoPath: null,
  logoUrl: DEFAULT_TENANT_LOGO_URL,
  logoAlt: "TLC Logo",
  loginTitle: "Institution Login",
  loginSubtitle: "Use your organization account credentials.",
  updatedAt: null,
};

export const TENANT_BRANDING_COLOR_FIELDS: TenantBrandingColorField[] = [
  "primaryColor",
  "lightPrimaryColor",
  "secondaryColor",
  "accentColor",
  "defaultColor",
  "backgroundColor",
  "cardColor",
];

export const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

export const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const toText = (value: unknown, fallback = "") => {
  if (typeof value === "string") {
    return value.trim();
  }

  return fallback;
};

const normalizeColor = (value: unknown, fallback: string) => {
  const text = toText(value);
  return isHexColor(text) ? text.toLowerCase() : fallback;
};

export const normalizeTenantBranding = (
  value: unknown,
  options: { logoUrl?: string; fallbackLogoAlt?: string } = {},
): TenantBranding => {
  const record = asRecord(value);
  const fallbackAlt = options.fallbackLogoAlt || DEFAULT_TENANT_BRANDING.logoAlt;

  return {
    primaryColor: normalizeColor(record.primaryColor, DEFAULT_TENANT_BRANDING.primaryColor),
    lightPrimaryColor: normalizeColor(
      record.lightPrimaryColor,
      DEFAULT_TENANT_BRANDING.lightPrimaryColor,
    ),
    secondaryColor: normalizeColor(record.secondaryColor, DEFAULT_TENANT_BRANDING.secondaryColor),
    accentColor: normalizeColor(record.accentColor, DEFAULT_TENANT_BRANDING.accentColor),
    defaultColor: normalizeColor(record.defaultColor, DEFAULT_TENANT_BRANDING.defaultColor),
    backgroundColor: normalizeColor(record.backgroundColor, DEFAULT_TENANT_BRANDING.backgroundColor),
    cardColor: normalizeColor(record.cardColor, DEFAULT_TENANT_BRANDING.cardColor),
    logoPath: toText(record.logoPath) || null,
    logoUrl: options.logoUrl || toText(record.logoUrl) || DEFAULT_TENANT_BRANDING.logoUrl,
    logoAlt: toText(record.logoAlt, fallbackAlt) || fallbackAlt,
    loginTitle: toText(record.loginTitle, DEFAULT_TENANT_BRANDING.loginTitle),
    loginSubtitle: toText(record.loginSubtitle, DEFAULT_TENANT_BRANDING.loginSubtitle),
    updatedAt: toText(record.updatedAt) || null,
  };
};

export const tenantBrandingToCssVariables = (
  branding: Partial<TenantBranding> | null | undefined,
) => {
  const normalized = normalizeTenantBranding(branding ?? {});

  return {
    "--color-default": normalized.defaultColor,
    "--color-primary": normalized.primaryColor,
    "--color-light-primary": normalized.lightPrimaryColor,
    "--color-secondary": normalized.secondaryColor,
    "--color-accent": normalized.accentColor,
    "--color-background": normalized.backgroundColor,
    "--color-card": normalized.cardColor,
    "--color-primary-soft": `color-mix(in srgb, ${normalized.primaryColor} 10%, white)`,
    "--color-primary-muted": `color-mix(in srgb, ${normalized.primaryColor} 16%, white)`,
    "--color-primary-ring": `color-mix(in srgb, ${normalized.primaryColor} 22%, transparent)`,
    "--teal-primary": normalized.primaryColor,
    "--gradient-primary": `linear-gradient(90deg, ${normalized.defaultColor} 0%, ${normalized.lightPrimaryColor} 100%)`,
    "--tenant-logo-url": normalized.logoUrl ? `url("${normalized.logoUrl}")` : "none",
  };
};
