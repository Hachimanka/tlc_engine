"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  ImageIcon,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Upload,
  X,
} from "lucide-react";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import {
  DEFAULT_TENANT_BRANDING,
  isHexColor,
  TENANT_BRANDING_COLOR_FIELDS,
  type TenantBranding,
  type TenantBrandingColorField,
} from "@/lib/tenantBranding";
import { supabase } from "@/lib/supabaseClient";

type BrandingProps = {
  onBrandingUpdated?: (branding: TenantBranding) => void;
};

type BrandingPayload = {
  branding?: TenantBranding;
  org?: {
    name?: string;
  };
  error?: string;
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

const buildDefaultDraft = (orgName = "Institution") => ({
  ...DEFAULT_TENANT_BRANDING,
  logoAlt: orgName,
});

export default function Branding({ onBrandingUpdated }: BrandingProps) {
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
  const logoUrl = logoPreviewUrl || draft.logoUrl;

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

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
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

  if (isLoading) {
    return (
      <TenantLoadingScreen
        className="flex min-h-[360px] items-center justify-center rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        label="Loading branding"
        useStoredBranding
      />
    );
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
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
              disabled={!logoUrl && !draft.logoPath}
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
