const RESERVED_SUBDOMAINS = new Set(["admin", "localhost", "www", "yourapp"]);

export const normalizeHostname = (host: string | null | undefined) => {
  const normalized = (host || "").trim().toLowerCase();

  if (normalized.startsWith("[")) {
    const closingBracket = normalized.indexOf("]");
    return closingBracket > 0 ? normalized.slice(1, closingBracket) : normalized;
  }

  if (normalized === "::1") {
    return normalized;
  }

  return normalized.split(":")[0] || normalized;
};

export const normalizeAppDomain = (domain: string | null | undefined) =>
  (domain || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase()
    .replace(/^www\./, "");

export const getAppDomain = () =>
  normalizeAppDomain(process.env.NEXT_PUBLIC_APP_DOMAIN);

export const isLocalHostname = (host: string | null | undefined) => {
  const hostname = normalizeHostname(host);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};

export const isVercelHostname = (host: string | null | undefined) =>
  normalizeHostname(host).endsWith(".vercel.app");

export const isAdminHostname = (
  host: string | null | undefined,
  appDomain = getAppDomain(),
) => {
  const hostname = normalizeHostname(host);
  const domain = normalizeAppDomain(appDomain);

  if (!hostname || isLocalHostname(hostname) || isVercelHostname(hostname)) {
    return false;
  }

  if (domain) {
    return hostname === `admin.${domain}`;
  }

  return hostname.split(".")[0] === "admin";
};

export const getTenantSubdomain = (
  host: string | null | undefined,
  appDomain = getAppDomain(),
) => {
  const hostname = normalizeHostname(host);
  const domain = normalizeAppDomain(appDomain);

  if (!hostname || !domain || isLocalHostname(hostname) || isVercelHostname(hostname)) {
    return "";
  }

  if (hostname === domain || hostname === `www.${domain}` || hostname === `admin.${domain}`) {
    return "";
  }

  const domainSuffix = `.${domain}`;
  if (!hostname.endsWith(domainSuffix)) {
    return "";
  }

  const subdomain = hostname.slice(0, -domainSuffix.length);

  if (!subdomain || subdomain.includes(".") || RESERVED_SUBDOMAINS.has(subdomain)) {
    return "";
  }

  return subdomain;
};
