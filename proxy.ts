import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder static assets (svg, png, jpg, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp)).*)",
  ],
};

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host")?.split(":")[0] || "localhost";

  if (url.pathname.startsWith("/_next") || url.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const tenantAdminAliases = new Set([
    "/tenant/dashboard",
    "/tenant/employees",
    "/tenant/policies",
    "/tenant/tenant-page",
    "/dashboard",
    "/employees",
    "/policies",
  ]);

  if (url.pathname === "/tenant" || url.pathname === "/tenant/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (tenantAdminAliases.has(url.pathname)) {
    return NextResponse.redirect(new URL("/tenant/tenant-admin", req.url));
  }

  if (url.pathname.startsWith("/tenant/features/College")) {
    return NextResponse.redirect(
      new URL(url.pathname.replace("/tenant/features/College", "/tenant/college"), req.url),
    );
  }

  if (url.pathname.startsWith("/tenant/features/Deped")) {
    return NextResponse.redirect(
      new URL(url.pathname.replace("/tenant/features/Deped", "/tenant/deped"), req.url),
    );
  }

  const depedRoutes: Record<string, string> = {
    "/load-manager": "manage-load",
    "/principal": "load-admin",
    "/teacher": "view-teaching-load",
    "/subject-room-management": "manage-subject",
    "/roomPage": "manage-room",
    "/room-page": "manage-room",
  };

  const depedTarget = depedRoutes[url.pathname];

  if (depedTarget) {
    return NextResponse.rewrite(new URL(`/tenant/deped/${depedTarget}`, req.url));
  }

  const collegeRoutes: Record<string, string> = {
    "/dean": "dean",
    "/loadmanager": "manage-load",
    "/teacher": "view-teaching-load",
    "/college/teacher": "view-teaching-load",
    "/college/subject-room-management": "manage-subject",
    "/vpaa": "vpaa",
  };

  const collegeTarget = collegeRoutes[url.pathname];

  if (collegeTarget) {
    return NextResponse.rewrite(new URL(`/tenant/college/${collegeTarget}`, req.url));
  }

  const subdomain = hostname.split(".")[0];

  if (
    subdomain === "localhost" &&
    (url.pathname.startsWith("/superadmin") || url.pathname.startsWith("/tenant"))
  ) {
    return NextResponse.next();
  }

  if (subdomain === "localhost") {
    if (url.pathname === "/") {
      return NextResponse.rewrite(new URL("/LandingPage", req.url));
    }

    return NextResponse.next();
  }

  if (subdomain === "admin") {
    const newPath = url.pathname === "/" ? "/superadmin" : `/superadmin${url.pathname}`;
    return NextResponse.rewrite(new URL(newPath, req.url));
  }

  if (subdomain !== "www" && subdomain !== "yourapp" && subdomain !== "localhost") {
    const newPath = url.pathname === "/" ? "/login" : `/tenant${url.pathname}`;
    return NextResponse.rewrite(new URL(newPath, req.url));
  }

  const newPath = url.pathname === "/" ? "/LandingPage" : `/LandingPage${url.pathname}`;
  return NextResponse.rewrite(new URL(newPath, req.url));
}
