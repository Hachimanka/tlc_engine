import {
  normalizeTenantBranding,
  type TenantBranding,
} from "@/lib/tenantBranding";

const TENANT_BRANDING_SESSION_KEY = "tlc:tenant-branding";

export const readStoredTenantBranding = (): TenantBranding | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.sessionStorage.getItem(TENANT_BRANDING_SESSION_KEY);

    if (!value) {
      return null;
    }

    return normalizeTenantBranding(JSON.parse(value));
  } catch {
    return null;
  }
};

export const saveStoredTenantBranding = (
  branding: TenantBranding | null | undefined,
) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!branding) {
    window.sessionStorage.removeItem(TENANT_BRANDING_SESSION_KEY);
    return;
  }

  window.sessionStorage.setItem(
    TENANT_BRANDING_SESSION_KEY,
    JSON.stringify(branding),
  );
};

export const clearStoredTenantBranding = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(TENANT_BRANDING_SESSION_KEY);
};
