import { getTenantSubdomain } from "@/lib/tenantHost";

export const ORG_SLUG_MISMATCH_CODE = "ORG_SLUG_MISMATCH";
export const ORG_SLUG_MISMATCH_MESSAGE =
  "This account does not belong to this organization.";

export const normalizeTenantSlug = (value: string | null | undefined) =>
  value?.trim().toLowerCase() || "";

export const getExpectedTenantSlug = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const searchParams = new URLSearchParams(window.location.search);

  return normalizeTenantSlug(
    searchParams.get("org") ||
      searchParams.get("slug") ||
      getTenantSubdomain(window.location.hostname),
  );
};

export const buildTenantMeUrl = (expectedSlug: string) =>
  expectedSlug
    ? `/api/tenant/me?expectedSlug=${encodeURIComponent(expectedSlug)}`
    : "/api/tenant/me";

export const buildTenantLoginUrl = (
  expectedSlug: string,
  redirect?: string | null,
) => {
  const searchParams = new URLSearchParams();

  if (expectedSlug) {
    searchParams.set("slug", expectedSlug);
  }

  if (redirect) {
    searchParams.set("redirect", redirect);
  }

  const query = searchParams.toString();
  return query ? `/login?${query}` : "/login";
};

export const isOrgSlugMismatch = (payload: { code?: string } | null | undefined) =>
  payload?.code === ORG_SLUG_MISMATCH_CODE;
