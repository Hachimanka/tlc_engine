"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Global/navbar";
import Sidebar, { type SidebarItem } from "@/components/Global/sidebar";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import Accounts from "@/components/Features/Tenant/Accounts";
import Branding from "@/components/Features/Tenant/Branding";
import Departments from "@/components/Features/Tenant/Departments";
import Employee from "@/components/Features/Tenant/Employee";
import Policies from "@/components/Features/Tenant/Policies";
import TenantRolePermissionsPanel from "@/components/Features/Tenant/TenantRolePermissionsPanel";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import {
  NavItems,
  type TenantAdminView,
  type InstitutionType,
  getDefaultTenantAdminView,
} from "@/config";
import { ICON_SVGS } from "@/public/icons";
import type { TenantBranding } from "@/lib/tenantBranding";
import {
  readStoredTenantBranding,
  saveStoredTenantBranding,
} from "@/lib/tenantBrandingSession";
import {
  buildTenantLoginUrl,
  buildTenantMeUrl,
  getExpectedTenantSlug,
  isOrgSlugMismatch,
} from "@/lib/tenantRoute";
import { isRecoverableSupabaseSessionError } from "@/lib/supabaseAuthErrors";
import { supabase } from "@/lib/supabaseClient";

const TENANT_ADMIN_SHELL_SESSION_KEY = "tlc:tenant-admin-shell";

type TenantAdminShellSnapshot = {
  institutionType: InstitutionType;
  orgName: string;
  orgSlug: string;
  roleName: string;
  profile: {
    displayName: string;
    email: string;
    avatarUrl: string;
  };
  branding: TenantBranding | null;
};

const readStoredTenantShell = (): TenantAdminShellSnapshot | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.sessionStorage.getItem(TENANT_ADMIN_SHELL_SESSION_KEY);

    if (!value) {
      return null;
    }

    const snapshot = JSON.parse(value) as TenantAdminShellSnapshot;
    const expectedSlug = getExpectedTenantSlug();

    if (expectedSlug && snapshot.orgSlug && snapshot.orgSlug !== expectedSlug) {
      return null;
    }

    return snapshot;
  } catch {
    return null;
  }
};

const saveStoredTenantShell = (snapshot: TenantAdminShellSnapshot) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    TENANT_ADMIN_SHELL_SESSION_KEY,
    JSON.stringify(snapshot),
  );
};

export default function TenantPage() {
  const router = useRouter();
  const [storedShell] = useState(() => readStoredTenantShell());
  const [activeView, setActiveView] = useState<TenantAdminView>(() =>
    getDefaultTenantAdminView(storedShell?.institutionType ?? null),
  );
  const [institutionType, setInstitutionType] = useState<InstitutionType>(
    storedShell?.institutionType ?? null,
  );
  const [orgName, setOrgName] = useState(storedShell?.orgName ?? "");
  const [orgSlug, setOrgSlug] = useState(storedShell?.orgSlug ?? "");
  const [roleName, setRoleName] = useState(storedShell?.roleName ?? "Org Admin");
  const [profile, setProfile] = useState(
    storedShell?.profile ?? {
      displayName: "User",
      email: "",
      avatarUrl: "",
    },
  );
  const [branding, setBranding] = useState<TenantBranding | null>(() =>
    storedShell?.branding ?? readStoredTenantBranding(),
  );
  const [isBootstrapping, setIsBootstrapping] = useState(!storedShell);
  const [contentLoading, setContentLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    const iconMap: Record<TenantAdminView, string> = {
      accounts: ICON_SVGS.people,
      "manage-users": ICON_SVGS.people,
      departments: ICON_SVGS.flow,
      policies: ICON_SVGS.file,
      employees: ICON_SVGS.files,
      branding: ICON_SVGS.settings,
    };

    return NavItems(activeView, institutionType ?? undefined).map((item) => ({
      key: item.view,
      label: item.name,
      icon: iconMap[item.view],
    }));
  }, [activeView, institutionType]);

  const handleBrandingUpdated = (nextBranding: TenantBranding | null) => {
    setBranding(nextBranding);
    saveStoredTenantBranding(nextBranding);
    saveStoredTenantShell({
      institutionType,
      orgName,
      orgSlug,
      roleName,
      profile,
      branding: nextBranding,
    });
  };

  const content = {
    accounts: <Accounts />,
    policies: <Policies />,
    "manage-users": <TenantRolePermissionsPanel />,
    departments: <Departments />,
    employees: <Employee />,
    branding: <Branding onBrandingUpdated={handleBrandingUpdated} />,
  }[activeView];

  useEffect(() => {
    const checkAuth = async () => {
      setAuthError("");
      const expectedSlug = getExpectedTenantSlug();
      const loginUrl = buildTenantLoginUrl(expectedSlug, "/tenant/tenant-admin");

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
          institution_type?: InstitutionType;
          role?: string;
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

          router.replace(loginUrl);
          return;
        }

        if (metadata?.must_change_password === true) {
          router.replace("/tenant/password-setup?redirect=/tenant/tenant-admin");
          return;
        }

        if (metadata?.first_login === true || metadata?.onboarding_complete === false) {
          router.replace("/tenant/onboarding");
          return;
        }

        if (!payload.isOrgAdmin) {
          router.replace(payload.firstActiveHref || "/tenant/no-access");
          return;
        }

        const detectedType = payload.org?.institutionType ?? metadata?.institution_type ?? null;
        const nextOrgName = payload.org?.name || "";
        const nextOrgSlug = payload.org?.slug || "";
        const nextRoleName = payload.role?.name || "Org Admin";
        const nextProfile = {
          displayName: payload.user?.fullName || user.email || "User",
          email: payload.user?.email || user.email || "",
          avatarUrl: payload.user?.avatarUrl || "",
        };
        const nextBranding = payload.branding ?? null;

        setInstitutionType(detectedType);
        setOrgName(nextOrgName);
        setOrgSlug(nextOrgSlug);
        setRoleName(nextRoleName);
        setProfile(nextProfile);
        setBranding(nextBranding);
        saveStoredTenantBranding(nextBranding);
        saveStoredTenantShell({
          institutionType: detectedType,
          orgName: nextOrgName,
          orgSlug: nextOrgSlug,
          roleName: nextRoleName,
          profile: nextProfile,
          branding: nextBranding,
        });
        setActiveView(getDefaultTenantAdminView(detectedType));
        setIsBootstrapping(false);

      } catch {
        setAuthError("Unable to reach Supabase Auth. Please check your internet connection and Supabase env values.");
        setIsBootstrapping(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!contentLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      setContentLoading(false);
    }, 520);

    return () => window.clearTimeout(timer);
  }, [activeView, contentLoading]);

  const handleSidebarViewChange = (key: string) => {
    if (key === activeView) {
      return;
    }

    const viewsWithLocalLoaders: TenantAdminView[] = [
      "accounts",
      "manage-users",
      "departments",
      "policies",
      "branding",
    ];
    const shouldUseSectionLoader = !viewsWithLocalLoaders.includes(key as TenantAdminView);

    setContentLoading(shouldUseSectionLoader);
    setActiveView(key as TenantAdminView);
  };

  if (authError) {
    return (
      <TenantBrandScope
        branding={branding}
        className="min-h-screen bg-[var(--color-background)] text-[var(--color-high-emphasis)]"
      >
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md rounded-lg bg-white px-6 py-5 text-center shadow-level-1">
            <h1 className="text-lg font-bold text-[var(--color-high-emphasis)]">
              Authentication unavailable
            </h1>
            <p className="mt-2 text-sm text-red-600">{authError}</p>
          </div>
        </div>
      </TenantBrandScope>
    );
  }

  if (isBootstrapping) {
    return (
      <TenantLoadingScreen
        branding={branding}
        label="Loading workspace"
        useStoredBranding
      />
    );
  }

  return (
    <TenantBrandScope
      branding={branding}
      className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]"
    >
      <Navbar
        branding={branding}
        organizationName={orgName}
        organizationSlug={orgSlug}
        profile={{
          displayName: profile.displayName,
          email: profile.email,
          roleName,
          avatarUrl: profile.avatarUrl,
        }}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          activeKey={activeView}
          setActiveKey={handleSidebarViewChange}
          items={sidebarItems}
          title={`${roleName} Menu`}
          iconSvg={ICON_SVGS.people}
          profile={{
            displayName: profile.displayName,
            email: profile.email,
            roleName,
            avatarUrl: profile.avatarUrl,
          }}
        />
        <section className="min-w-0 flex-1 overflow-y-auto bg-[var(--color-background)] p-6">
          {contentLoading &&
          activeView !== "accounts" &&
          activeView !== "manage-users" &&
          activeView !== "departments" &&
          activeView !== "policies" &&
          activeView !== "branding" ? (
            <TenantLoadingScreen
              branding={branding}
              className="flex min-h-[420px] items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
              label="Loading section"
            />
          ) : (
            content
          )}
        </section>
      </div>
    </TenantBrandScope>
  );
}
