"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Global/navbar";
import Sidebar, { type SidebarItem } from "@/components/Global/sidebar";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import TenantFeatureContent from "@/components/Global/TenantFeatureContent";
import {
  getFeatureSidebarItems,
  tenantTypeToInstitutionType,
  type FeatureRole,
  type TenantType,
} from "@/features.config";
import type {
  FeatureKey,
  InstitutionType,
} from "@/features/tenant-feature-catalog";
import { ICON_SVGS } from "@/public/icons";
import type { TenantBranding } from "@/lib/tenantBranding";
import { saveStoredTenantBranding } from "@/lib/tenantBrandingSession";
import {
  buildTenantLoginUrl,
  buildTenantMeUrl,
  getExpectedTenantSlug,
  isOrgSlugMismatch,
} from "@/lib/tenantRoute";
import { isRecoverableSupabaseSessionError } from "@/lib/supabaseAuthErrors";
import { supabase } from "@/lib/supabaseClient";

type TenantRoleLayoutProps = {
  tenantType: TenantType;
  role: FeatureRole;
  title: string;
  iconSvg?: string;
  contentClassName?: string;
  requiredFeatureKey?: FeatureKey;
  children: ReactNode;
};

type TenantAccess = {
  org: {
    id?: string;
    name?: string;
    slug?: string;
    institutionType: InstitutionType;
  };
  branding?: TenantBranding | null;
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  role: {
    key: string;
    name: string;
  };
  enabledFeatureKeys: string[];
};

function TenantRoleLayoutSkeleton({ contentClassName }: { contentClassName?: string }) {
  const sectionClassName = [
    "min-w-0 flex-1 overflow-y-auto bg-[var(--color-background)]",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TenantBrandScope className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <header className="flex h-20 shrink-0 items-center justify-between bg-[var(--color-primary)] px-8">
        <div className="flex items-center gap-4">
          <BrandedSkeletonBlock className="h-12 w-12 rounded-lg bg-white/30" />
          <div className="space-y-2">
            <BrandedSkeletonBlock className="h-4 w-64 bg-white/30" />
            <BrandedSkeletonBlock className="h-3 w-32 bg-white/30" />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <BrandedSkeletonBlock className="h-9 w-9 rounded-full bg-white/30" />
          <BrandedSkeletonBlock className="h-10 w-36 rounded-full bg-white/30" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[320px] shrink-0 bg-[var(--color-sidebar)] px-3 py-7">
          <div className="flex items-center gap-4 px-2">
            <BrandedSkeletonBlock className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <BrandedSkeletonBlock className="h-4 w-32" strong />
              <BrandedSkeletonBlock className="h-3 w-24" />
            </div>
          </div>
          <div className="my-5 h-px bg-[var(--color-primary)]/70" />
          <BrandedSkeletonBlock className="h-14 rounded-lg" strong />
        </aside>

        <section className={sectionClassName}>
          <div className="space-y-5">
            <div className="space-y-2">
              <BrandedSkeletonBlock className="h-8 w-72" strong />
              <BrandedSkeletonBlock className="h-4 w-96" />
            </div>

            <div className="rounded-lg border border-[var(--color-default)] bg-white p-4 shadow-level-1">
              <div className="flex flex-wrap gap-3">
                <BrandedSkeletonBlock className="h-10 min-w-[260px] flex-1 rounded-lg" />
                <BrandedSkeletonBlock className="h-10 w-48 rounded-lg" />
                <BrandedSkeletonBlock className="h-10 w-40 rounded-lg" strong />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--color-default)] bg-white shadow-level-1">
              <div className="grid grid-cols-5 gap-4 bg-[var(--color-primary)] px-4 py-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <BrandedSkeletonBlock key={index} className="h-3 bg-white/30" />
                ))}
              </div>
              <div className="divide-y divide-[var(--color-default)]">
                {Array.from({ length: 5 }).map((_, row) => (
                  <div key={row} className="grid grid-cols-5 gap-4 px-4 py-4">
                    {Array.from({ length: 5 }).map((__, column) => (
                      <BrandedSkeletonBlock key={column} className="h-3" />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--color-default)] bg-white shadow-level-1">
              <div className="grid grid-cols-8 gap-0 bg-[var(--color-primary)]">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="border-r border-white/20 px-3 py-4 last:border-r-0">
                    <BrandedSkeletonBlock className="mx-auto h-3 w-16 bg-white/30" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-8">
                {Array.from({ length: 24 }).map((_, index) => (
                  <div key={index} className="h-16 border-b border-r border-[var(--color-default)] p-3">
                    {index % 11 === 0 ? <BrandedSkeletonBlock className="h-8 rounded-md" strong /> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </TenantBrandScope>
  );
}

export default function TenantRoleLayout({
  tenantType,
  role,
  title,
  iconSvg,
  contentClassName,
  requiredFeatureKey,
  children,
}: TenantRoleLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [access, setAccess] = useState<TenantAccess | null>(null);
  const [accessError, setAccessError] = useState("");
  const [contentLoading, setContentLoading] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [selectedFeatureKey, setSelectedFeatureKey] = useState("");
  const institutionType = access?.org.institutionType ?? tenantTypeToInstitutionType(tenantType);
  const featureItems = getFeatureSidebarItems(
    institutionType,
    access?.enabledFeatureKeys ?? [],
  );
  const sidebarItems: SidebarItem[] = featureItems.map((item) => ({
    key: item.featureKey,
    label: item.label,
    icon: item.icon,
  }));

  const activeMatch = featureItems
    .filter((item) => item.href && item.href !== "#" && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const routeActiveKey = activeMatch?.featureKey ?? requiredFeatureKey ?? sidebarItems[0]?.key ?? "";
  const activeKey = selectedFeatureKey || routeActiveKey;

  const handleSetActiveKey = (key: string) => {
    if (key === activeKey) {
      return;
    }

    const target = featureItems.find((item) => item.featureKey === key);
    if (target?.href && target.href !== "#") {
      setContentLoading(true);
      setSelectedFeatureKey(key);
    }
  };

  const sectionClassName = [
    "min-w-0 flex-1 overflow-y-auto bg-[var(--color-background)]",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true);
      setAccessError("");
      setIsUnauthorized(false);
      const expectedSlug = getExpectedTenantSlug();
      const loginUrl = buildTenantLoginUrl(
        expectedSlug,
        pathname || "/tenant/tenant-admin",
      );

      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError && isRecoverableSupabaseSessionError(userError)) {
          await supabase.auth.signOut({ scope: "local" });
          router.replace(loginUrl);
          return;
        }

        if (userError) {
          throw userError;
        }

        const user = data?.user;
        if (!user) {
          router.replace(loginUrl);
          return;
        }

        const metadata = user.user_metadata as {
          first_login?: boolean;
          onboarding_complete?: boolean;
          must_change_password?: boolean;
        };

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          router.replace(loginUrl);
          return;
        }

        const response = await fetch(buildTenantMeUrl(expectedSlug), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (isOrgSlugMismatch(payload)) {
            await supabase.auth.signOut({ scope: "local" });
            router.replace(buildTenantLoginUrl(expectedSlug));
            return;
          }

          setAccessError(payload?.error || "Unable to load your feature access.");
          setCheckingAuth(false);
          return;
        }

        if (metadata?.must_change_password === true) {
          router.replace(`/tenant/password-setup?redirect=${encodeURIComponent(pathname || "/tenant/tenant-admin")}`);
          return;
        }

        if (metadata?.first_login === true || metadata?.onboarding_complete === false) {
          router.replace("/tenant/onboarding");
          return;
        }

        const enabledFeatureKeys = payload.enabledFeatureKeys ?? [];

        if (requiredFeatureKey && !enabledFeatureKeys.includes(requiredFeatureKey)) {
          setAccess(payload);
          saveStoredTenantBranding(payload.branding ?? null);
          setIsUnauthorized(true);
          setCheckingAuth(false);
          return;
        }

        setAccess(payload);
        saveStoredTenantBranding(payload.branding ?? null);
        setCheckingAuth(false);
      } catch {
        setAccessError("Unable to reach the authentication service. Please check your Supabase connection and try again.");
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [pathname, requiredFeatureKey, router]);

  useEffect(() => {
    if (!contentLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      setContentLoading(false);
    }, 520);

    return () => window.clearTimeout(timer);
  }, [activeKey, contentLoading]);

  if (checkingAuth) {
    return <TenantRoleLayoutSkeleton contentClassName={contentClassName} />;
  }

  if (accessError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white px-6 py-5 text-center shadow-level-1">
          <h1 className="text-lg font-bold text-[var(--color-high-emphasis)]">
            Access unavailable
          </h1>
          <p className="mt-2 text-sm text-red-600">{accessError}</p>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <TenantBrandScope
        branding={access?.branding}
        className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]"
      >
        <Navbar
          branding={access?.branding}
          organizationName={access?.org.name}
          organizationSlug={access?.org.slug}
          profile={{
            displayName: access?.user.fullName,
            email: access?.user.email,
            roleName: access?.role.name,
            avatarUrl: access?.user.avatarUrl ?? "",
          }}
        />
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <section className="max-w-md rounded-lg bg-white px-6 py-6 text-center shadow-level-1">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-default)]"
              dangerouslySetInnerHTML={{ __html: ICON_SVGS.lock }}
            />
            <h1 className="text-xl font-bold text-[var(--color-high-emphasis)]">
              Feature access required
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-low-emphasis)]">
              Your role does not currently include this feature. Ask your institution admin to update your role access if you need it.
            </p>
          </section>
        </div>
      </TenantBrandScope>
    );
  }

  return (
    <TenantBrandScope
      branding={access?.branding}
      className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]"
    >
      <Navbar
        branding={access?.branding}
        organizationName={access?.org.name}
        organizationSlug={access?.org.slug}
        profile={{
          displayName: access?.user.fullName,
          email: access?.user.email,
          roleName: access?.role.name,
          avatarUrl: access?.user.avatarUrl ?? "",
        }}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          activeKey={activeKey}
          setActiveKey={handleSetActiveKey}
          items={sidebarItems}
          title={access?.role.name ? `${access.role.name} Menu` : title || role}
          iconSvg={iconSvg || ICON_SVGS.people}
          profile={{
            displayName: access?.user.fullName,
            email: access?.user.email,
            roleName: access?.role.name,
            avatarUrl: access?.user.avatarUrl ?? "",
          }}
        />
        <section className={sectionClassName}>
          {contentLoading ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <BrandedSkeletonBlock className="h-8 w-72" strong />
                <BrandedSkeletonBlock className="h-4 w-96" />
              </div>
              <div className="rounded-lg border border-[var(--color-default)] bg-white p-4 shadow-level-1">
                <BrandedSkeletonBlock className="h-10 rounded-lg" />
              </div>
              <div className="overflow-hidden rounded-lg border border-[var(--color-default)] bg-white shadow-level-1">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-4 border-b border-[var(--color-default)] px-4 py-4 last:border-b-0"
                  >
                    {Array.from({ length: 5 }).map((__, column) => (
                      <BrandedSkeletonBlock key={column} className="h-3" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : selectedFeatureKey ? (
            <TenantFeatureContent featureKey={selectedFeatureKey}>
              {children}
            </TenantFeatureContent>
          ) : (
            children
          )}
        </section>
      </div>
    </TenantBrandScope>
  );
}
