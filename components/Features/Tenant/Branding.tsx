"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  ImageIcon,
  Palette,
  RefreshCw,
  Save,
  Upload,
  X,
} from "lucide-react";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import {
  DEFAULT_TENANT_BRANDING,
  isHexColor,
  TENANT_BRANDING_COLOR_FIELDS,
  type TenantBranding,
  type TenantBrandingColorField,
} from "@/lib/tenantBranding";
import { supabase } from "@/lib/supabaseClient";

type LogoPalette = {
  primaryColor: string;
  lightPrimaryColor: string;
  secondaryColor: string;
  accentColor: string;
  defaultColor: string;
  backgroundColor: string;
  cardColor: string;
};

type BrandingProps = {
  onBrandingUpdated?: (branding: TenantBranding) => void;
  showInitialSkeleton?: boolean;
};

type BrandingPayload = {
  branding?: TenantBranding;
  org?: {
    name?: string;
  };
  error?: string;
};

const clampColor = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const componentToHex = (value: number) => clampColor(value).toString(16).padStart(2, "0");

const rgbToHex = (r: number, g: number, b: number) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

const hexToRgb = (hex: string) => {
  const clean = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return null;
  }

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const blendHex = (base: string, overlay: string, amount: number) => {
  const baseRgb = hexToRgb(base);
  const overlayRgb = hexToRgb(overlay);

  if (!baseRgb || !overlayRgb) {
    return base;
  }

  return rgbToHex(
    baseRgb.r + (overlayRgb.r - baseRgb.r) * amount,
    baseRgb.g + (overlayRgb.g - baseRgb.g) * amount,
    baseRgb.b + (overlayRgb.b - baseRgb.b) * amount,
  );
};

const lightenHex = (hex: string, amount: number) => blendHex(hex, "#ffffff", amount);

const darkenHex = (hex: string, amount: number) => blendHex(hex, "#000000", amount);

const rgbToHsl = (r: number, g: number, b: number) => {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  const h = delta === 0
    ? 0
    : max === rr
      ? ((gg - bb) / delta) % 6
      : max === gg
        ? (bb - rr) / delta + 2
        : (rr - gg) / delta + 4;

  return { h: (h * 60 + 360) % 360, s, l };
};

const isNearWhite = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return false;
  }

  return rgb.r > 235 && rgb.g > 235 && rgb.b > 235;
};

const colorDistance = (hexA: string, hexB: string) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);

  if (!a || !b) {
    return 0;
  }

  return Math.sqrt(
    (a.r - b.r) ** 2 +
      (a.g - b.g) ** 2 +
      (a.b - b.b) ** 2,
  );
};

const extractLogoPalette = async (file: File): Promise<string[] | null> => {
  try {
    const bitmap = await createImageBitmap(file);
    const maxDimension = 64;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.floor(bitmap.width * scale));
    const height = Math.max(1, Math.floor(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const counts = new Map<string, number>();

    for (let i = 0; i < imageData.length; i += 4) {
      const alpha = imageData[i + 3];
      if (alpha < 100) {
        continue;
      }

      const r = (imageData[i] >> 4) << 4;
      const g = (imageData[i + 1] >> 4) << 4;
      const b = (imageData[i + 2] >> 4) << 4;
      const hex = rgbToHex(r, g, b);
      const count = counts.get(hex) ?? 0;
      counts.set(hex, count + 1);
    }

    const colors = Array.from(counts.entries())
      .map(([color, count]) => ({ color, count }))
      .filter(({ color }) => !isNearWhite(color))
      .sort((a, b) => {
        const aRgb = hexToRgb(a.color);
        const bRgb = hexToRgb(b.color);
        const aHsl = aRgb ? rgbToHsl(aRgb.r, aRgb.g, aRgb.b) : { s: 0, l: 1 };
        const bHsl = bRgb ? rgbToHsl(bRgb.r, bRgb.g, bRgb.b) : { s: 0, l: 1 };
        const aScore = a.count * (0.6 + aHsl.s * 0.4) * (1 - aHsl.l);
        const bScore = b.count * (0.6 + bHsl.s * 0.4) * (1 - bHsl.l);
        return bScore - aScore;
      })
      .map(({ color }) => color);

    if (colors.length === 0) {
      return null;
    }

    return colors.slice(0, 5);
  } catch {
    return null;
  }
};

const deriveBrandingFromLogo = async (file: File): Promise<LogoPalette> => {
  const colors = await extractLogoPalette(file);
  const primary = colors?.[0] ?? DEFAULT_TENANT_BRANDING.primaryColor;
  const secondaryCandidate = colors?.[1];
  const accentCandidate = colors?.[2];
  const primaryLuma = hexToRgb(primary);

  const secondary =
    secondaryCandidate && colorDistance(primary, secondaryCandidate) > 40
      ? secondaryCandidate
      : lightenHex(primary, 0.18);

  const accent =
    accentCandidate && colorDistance(primary, accentCandidate) > 40
      ? accentCandidate
      : secondary;

  const lightPrimaryColor = primaryLuma && rgbToHsl(primaryLuma.r, primaryLuma.g, primaryLuma.b).l > 0.75
    ? darkenHex(primary, 0.16)
    : lightenHex(primary, 0.18);

  const defaultColor = lightenHex(primary, 0.68);
  const backgroundColor = lightenHex(primary, 0.86);
  const cardColor = lightenHex(primary, 0.92);

  return {
    primaryColor: primary,
    lightPrimaryColor,
    secondaryColor: secondary,
    accentColor: accent,
    defaultColor,
    backgroundColor,
    cardColor,
  };
};

const colorLabels: Record<TenantBrandingColorField, { label: string; hint: string }> = {
  primaryColor: {
    label: "Primary",
    hint: "Navbar, primary buttons, active states",
  },
  lightPrimaryColor: {
    label: "Primary hover",
    hint: "Button hover and secondary emphasis",
  },
  secondaryColor: {
    label: "Secondary",
    hint: "Supporting actions and highlights",
  },
  accentColor: {
    label: "Accent",
    hint: "Badges and decorative emphasis",
  },
  defaultColor: {
    label: "Soft brand",
    hint: "Borders, soft backgrounds, focus rings",
  },
  backgroundColor: {
    label: "Workspace background",
    hint: "Tenant page background",
  },
  cardColor: {
    label: "Card surface",
    hint: "Panels, cards, and forms",
  },
};

const snapshotBranding = (branding: TenantBranding) =>
  JSON.stringify({
    primaryColor: branding.primaryColor,
    lightPrimaryColor: branding.lightPrimaryColor,
    secondaryColor: branding.secondaryColor,
    accentColor: branding.accentColor,
    defaultColor: branding.defaultColor,
    backgroundColor: branding.backgroundColor,
    cardColor: branding.cardColor,
    logoPath: branding.logoPath,
    logoAlt: branding.logoAlt,
    loginTitle: branding.loginTitle,
    loginSubtitle: branding.loginSubtitle,
  });

function BrandingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex animate-pulse flex-wrap items-start justify-between gap-4" role="status" aria-label="Loading branding">
        <span className="sr-only">Loading branding</span>
        <div className="space-y-3">
          <BrandedSkeletonBlock className="h-7 w-44 rounded-full" />
          <BrandedSkeletonBlock className="h-8 w-72" />
          <BrandedSkeletonBlock className="h-4 w-[560px] max-w-full" />
        </div>
        <div className="flex gap-2">
          <BrandedSkeletonBlock className="h-10 w-24" />
          <BrandedSkeletonBlock className="h-10 w-32" />
        </div>
      </div>

      <div className="grid animate-pulse gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <BrandedSkeletonBlock className="h-6 w-36" />
          <BrandedSkeletonBlock className="mt-3 h-4 w-72" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="rounded-lg border border-[var(--color-default)] p-4">
                <BrandedSkeletonBlock className="h-5 w-28" />
                <BrandedSkeletonBlock className="mt-2 h-3 w-40" />
                <div className="mt-4 flex gap-3">
                  <BrandedSkeletonBlock className="h-11 w-14" />
                  <BrandedSkeletonBlock className="h-11 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <BrandedSkeletonBlock className="h-6 w-20" />
          <BrandedSkeletonBlock className="mt-3 h-4 w-44" />
          <BrandedSkeletonBlock className="mt-5 h-40 w-full rounded-lg" />
          <BrandedSkeletonBlock className="mt-4 h-11 w-full" />
          <div className="mt-4 flex gap-2">
            <BrandedSkeletonBlock className="h-10 w-32" />
            <BrandedSkeletonBlock className="h-10 w-28" />
          </div>
        </section>
      </div>

      <section className="animate-pulse rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <BrandedSkeletonBlock className="h-6 w-28" />
        <BrandedSkeletonBlock className="mt-3 h-4 w-80" />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <BrandedSkeletonBlock className="h-20" />
          <BrandedSkeletonBlock className="h-20" />
        </div>
      </section>
    </div>
  );
}

const buildDefaultDraft = (orgName = "Institution") => ({
  ...DEFAULT_TENANT_BRANDING,
  logoAlt: orgName,
});

export default function Branding({
  onBrandingUpdated,
  showInitialSkeleton = false,
}: BrandingProps) {
  const [orgName, setOrgName] = useState("Institution");
  const [draft, setDraft] = useState<TenantBranding>(() => buildDefaultDraft());
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentSnapshot = useMemo(() => snapshotBranding(draft), [draft]);
  const isDirty = currentSnapshot !== savedSnapshot || Boolean(logoFile) || removeLogo;
  const logoUrl = logoPreviewUrl || draft.logoUrl || DEFAULT_TENANT_BRANDING.logoUrl;

  const loadBranding = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setError("Please sign in to manage branding.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/tenant/branding", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload: BrandingPayload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.branding) {
        setError(payload.error || "Unable to load branding.");
        setIsLoading(false);
        return;
      }

      const nextOrgName = payload.org?.name || "Institution";
      setOrgName(nextOrgName);
      setDraft({
        ...payload.branding,
        logoAlt: payload.branding.logoAlt || nextOrgName,
      });
      setSavedSnapshot(snapshotBranding(payload.branding));
      setLogoFile(null);
      setLogoPreviewUrl("");
      setRemoveLogo(false);
      setIsLoading(false);
    } catch {
      setError("Unable to load branding. Please check your connection.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const updateColor = (field: TenantBrandingColorField, value: string) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setMessage("");
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 750_000) {
      setError("Please choose a logo below 750 KB.");
      return;
    }

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
    setRemoveLogo(false);
    setError("");
    setMessage("");

    try {
      const palette = await deriveBrandingFromLogo(file);
      setDraft((current) => ({
        ...current,
        ...palette,
      }));
      setMessage("Brand colors were updated from the logo palette.");
    } catch {
      // Keep the logo preview even if palette extraction fails.
    }
  };

  const removeCurrentLogo = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setLogoFile(null);
    setLogoPreviewUrl("");
    setRemoveLogo(true);
    setDraft((current) => ({
      ...current,
      logoPath: null,
      logoUrl: "",
    }));
    setMessage("");
  };

  const resetToDefaults = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setLogoFile(null);
    setLogoPreviewUrl("");
    setRemoveLogo(true);
    setDraft(buildDefaultDraft(orgName));
    setError("");
    setMessage("Default branding ready. Save to apply it.");
  };

  const validateDraft = () => {
    for (const field of TENANT_BRANDING_COLOR_FIELDS) {
      if (!isHexColor(draft[field])) {
        return `${colorLabels[field].label} must be a #RRGGBB hex color.`;
      }
    }

    if (!draft.logoAlt.trim()) {
      return "Logo alt text is required.";
    }

    if (!draft.loginTitle.trim()) {
      return "Login page title is required.";
    }

    if (!draft.loginSubtitle.trim()) {
      return "Login page subtitle is required.";
    }

    return "";
  };

  const saveBranding = async () => {
    const validationError = validateDraft();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setError("Your session expired. Please log in again.");
        setIsSaving(false);
        return;
      }

      const formData = new FormData();
      for (const field of TENANT_BRANDING_COLOR_FIELDS) {
        formData.set(field, draft[field]);
      }
      formData.set("logoAlt", draft.logoAlt.trim());
      formData.set("loginTitle", draft.loginTitle.trim());
      formData.set("loginSubtitle", draft.loginSubtitle.trim());
      formData.set("removeLogo", removeLogo ? "true" : "false");

      if (logoFile) {
        formData.set("logo", logoFile);
      }

      const response = await fetch("/api/tenant/branding", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const payload: BrandingPayload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.branding) {
        setError(payload.error || "Failed to save branding.");
        setIsSaving(false);
        return;
      }

      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }

      setDraft(payload.branding);
      setSavedSnapshot(snapshotBranding(payload.branding));
      setLogoFile(null);
      setLogoPreviewUrl("");
      setRemoveLogo(false);
      setMessage("Branding saved.");
      onBrandingUpdated?.(payload.branding);
    } catch {
      setError("Unable to save branding. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && showInitialSkeleton) {
    return <BrandingSkeleton />;
  }

  return (
    <TenantBrandScope branding={draft} className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-default)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            <Palette className="h-3.5 w-3.5" aria-hidden="true" />
            Organization branding
          </div>
          <h1 className="mt-3 text-2xl font-bold text-[var(--color-high-emphasis)]">
            Customize {orgName}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-low-emphasis)]">
            These colors and logo apply to tenant workspaces, tenant-facing forms, and printable exports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-default)] px-4 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-default)]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            onClick={saveBranding}
            disabled={!isDirty || isSaving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <span className="h-4 w-4 animate-pulse rounded bg-white/50" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {isSaving ? "Saving..." : "Save Branding"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-4 py-3 text-sm font-medium text-[var(--color-primary)]">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg bg-[var(--color-card)] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
            Brand colors
          </h2>
          <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
            Use full hex values so exports and printed forms match the workspace.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {TENANT_BRANDING_COLOR_FIELDS.map((field) => (
              <label key={field} className="rounded-lg border border-[var(--color-default)] p-4">
                <span className="text-sm font-semibold text-[var(--color-high-emphasis)]">
                  {colorLabels[field].label}
                </span>
                <span className="mt-1 block text-xs text-[var(--color-low-emphasis)]">
                  {colorLabels[field].hint}
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="color"
                    value={draft[field]}
                    onChange={(event) => updateColor(field, event.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-md border border-[var(--color-default)] bg-white p-1"
                  />
                  <input
                    value={draft[field]}
                    onChange={(event) => updateColor(field, event.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-md border border-[var(--color-default)] bg-white px-3 text-sm font-semibold text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)]"
                    placeholder="#006b5f"
                  />
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg bg-[var(--color-card)] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
            Logo
          </h2>
          <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
            PNG, JPG, WEBP, or GIF under 750 KB.
          </p>

          <div className="mt-5 flex min-h-40 items-center justify-center rounded-lg border border-dashed border-[var(--color-default)] bg-[var(--color-background)] p-4">
            {logoUrl ? (
              <div
                className="h-28 w-28 rounded-lg bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${logoUrl}")` }}
                role="img"
                aria-label={draft.logoAlt}
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-[var(--color-card)] text-[var(--color-primary)]">
                <ImageIcon className="h-10 w-10" aria-hidden="true" />
              </div>
            )}
          </div>

          <label className="mt-4 block text-sm font-semibold text-[var(--color-high-emphasis)]">
            Logo alt text
            <input
              value={draft.logoAlt}
              onChange={(event) =>
                setDraft((current) => ({ ...current, logoAlt: event.target.value }))
              }
              className="mt-2 h-11 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)]">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Logo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleLogoChange}
                className="sr-only"
              />
            </label>
            <button
              type="button"
              onClick={removeCurrentLogo}
              disabled={!logoPreviewUrl && !draft.logoPath}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-lg bg-[var(--color-card)] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
          Login page
        </h2>
        <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
          This appears when users open the login page with your organization slug.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-semibold text-[var(--color-high-emphasis)]">
            Login title
            <input
              value={draft.loginTitle}
              maxLength={80}
              onChange={(event) =>
                setDraft((current) => ({ ...current, loginTitle: event.target.value }))
              }
              className="mt-2 h-11 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]"
              placeholder="Institution Login"
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--color-high-emphasis)]">
            Login subtitle
            <input
              value={draft.loginSubtitle}
              maxLength={180}
              onChange={(event) =>
                setDraft((current) => ({ ...current, loginSubtitle: event.target.value }))
              }
              className="mt-2 h-11 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--color-primary)]"
              placeholder="Use your organization account credentials."
            />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg bg-[var(--color-card)] shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="bg-[var(--color-primary)] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <span
                className="h-10 w-10 rounded-md bg-white bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${logoUrl}")` }}
                role="img"
                aria-label={draft.logoAlt}
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15">
                <ImageIcon className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <div>
              <h2 className="text-base font-bold">{orgName}</h2>
              <p className="text-xs text-white/75">Live tenant workspace preview</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 bg-[var(--color-background)] p-5 md:grid-cols-3">
          <div className="rounded-lg bg-[var(--color-card)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
              Primary action
            </p>
            <button className="mt-3 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
              Save Changes
            </button>
          </div>
          <div className="rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] p-4">
            <p className="text-sm font-bold text-[var(--color-high-emphasis)]">
              Card surface
            </p>
            <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
              Workspace content uses your chosen surfaces and borders.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--color-default)] p-4 text-[var(--color-primary)]">
            <p className="text-sm font-bold">Soft brand area</p>
            <p className="mt-1 text-sm">Used for badges, highlights, and subtle emphasis.</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-[var(--color-background)] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="mx-auto w-full max-w-sm rounded-xl bg-[var(--color-card)] p-6 shadow-lg">
          <div className="flex flex-col items-center gap-2 text-center">
            {logoUrl ? (
              <span
                className="h-12 w-12 rounded-md bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${logoUrl}")` }}
                role="img"
                aria-label={draft.logoAlt}
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--color-default)] text-[var(--color-primary)]">
                <ImageIcon className="h-6 w-6" aria-hidden="true" />
              </span>
            )}
            <h2 className="text-xl font-bold text-[var(--color-primary)]">
              {draft.loginTitle || "Institution Login"}
            </h2>
            <p className="text-xs text-[var(--color-low-emphasis)]">
              {draft.loginSubtitle || "Use your organization account credentials."}
            </p>
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-10 rounded-md border border-[var(--color-default)] bg-white" />
            <div className="h-10 rounded-md border border-[var(--color-default)] bg-white" />
            <div className="h-10 rounded-md bg-[var(--color-primary)]" />
          </div>
        </div>
      </section>
    </TenantBrandScope>
  );
}
