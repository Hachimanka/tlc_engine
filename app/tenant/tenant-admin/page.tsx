"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Global/navbar";
import Sidebar, { type SidebarItem } from "@/components/Global/sidebar";
import TenantLogoLoader from "@/components/Global/TenantLogoLoader";
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
  subscriptionPlan?: string | null;
  canUseFullAnalyticsReports?: boolean;
  roleName: string;
  profile: {
    displayName: string;
    email: string;
    avatarUrl: string;
  };
  branding: TenantBranding | null;
};

type AnalyticsUserPayload = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role_label?: string | null;
  department?: string | null;
  status?: string | null;
  featureKeys?: string[];
};

type AnalyticsFeaturePayload = {
  key: string;
  label: string;
  status: string;
  adminOnly?: boolean;
};

type AnalyticsDepartmentPayload = {
  id: string;
  name: string;
};

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-default)] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-low-emphasis)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold text-[var(--color-high-emphasis)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">{detail}</p>
    </div>
  );
}

function UpgradeRequiredPanel({ subscriptionPlan }: { subscriptionPlan?: string | null }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-default)] text-[var(--color-primary)]"
          dangerouslySetInnerHTML={{ __html: ICON_SVGS.analytics }}
        />
        <h1 className="text-xl font-bold text-[var(--color-high-emphasis)]">
          Premium analytics required
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-low-emphasis)]">
          Analytics & Reports is available for Premium and Diamond subscriptions.
          {subscriptionPlan ? ` Current plan: ${subscriptionPlan}.` : ""}
        </p>
      </div>
    </div>
  );
}

function AnalyticsReportsPanel({
  showInitialSkeleton = false,
}: {
  showInitialSkeleton?: boolean;
}) {
  const [users, setUsers] = useState<AnalyticsUserPayload[]>([]);
  const [features, setFeatures] = useState<AnalyticsFeaturePayload[]>([]);
  const [departments, setDepartments] = useState<AnalyticsDepartmentPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Please sign in to view analytics.");
      return;
    }

    const response = await fetch("/api/tenant/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setIsLoading(false);
      setLoadError(payload?.error || "Failed to load analytics.");
      return;
    }

    setUsers((payload.users ?? []) as AnalyticsUserPayload[]);
    setFeatures((payload.features ?? []) as AnalyticsFeaturePayload[]);
    setDepartments((payload.departments ?? []) as AnalyticsDepartmentPayload[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      loadAnalytics();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loadAnalytics]);

  const activeUsers = users.filter((user) => (user.status ?? "active") === "active");
  const disabledUsers = users.filter((user) => user.status === "disabled");
  const assignableFeatures = features.filter(
    (feature) => feature.status === "active" && !feature.adminOnly,
  );
  const featureAssignments = users.reduce(
    (total, user) => total + (user.featureKeys?.length ?? 0),
    0,
  );
  const averageFeatureAccess =
    users.length > 0 ? Math.round(featureAssignments / users.length) : 0;
  const roleCounts = users.reduce<Record<string, number>>((counts, user) => {
    const role = user.role_label?.trim() || "Unassigned";
    counts[role] = (counts[role] ?? 0) + 1;
    return counts;
  }, {});
  const departmentCounts = users.reduce<Record<string, number>>((counts, user) => {
    const department = user.department?.trim() || "Unassigned";
    counts[department] = (counts[department] ?? 0) + 1;
    return counts;
  }, {});

  const roleRows = Object.entries(roleCounts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);
  const departmentRows = Object.entries(departmentCounts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);

  if (loadError) {
    return (
      <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="text-sm text-red-600">{loadError}</div>
      </div>
    );
  }

  if (isLoading && showInitialSkeleton) {
    return (
      <TenantLoadingScreen
        branding={null}
        className="flex min-h-[420px] items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        label="Loading analytics"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
            Institution account, department, and feature-access overview.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAnalytics}
          className="rounded-lg border border-[var(--color-default)] bg-white px-4 py-2 text-xs font-semibold text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={users.length} detail={`${activeUsers.length} active, ${disabledUsers.length} disabled`} />
        <MetricCard label="Departments" value={departments.length} detail="Configured institutional departments" />
        <MetricCard label="Available features" value={assignableFeatures.length} detail="Active assignable workspace features" />
        <MetricCard label="Avg. access" value={averageFeatureAccess} detail="Enabled features per account" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <h2 className="text-base font-bold text-[var(--color-high-emphasis)]">Users by Role</h2>
          <div className="mt-4 space-y-3">
            {roleRows.length > 0 ? roleRows.map(([role, count]) => (
              <div key={role} className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-high-emphasis)]">{role}</span>
                <span className="rounded-full bg-[#ecf8f6] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {count}
                </span>
              </div>
            )) : (
              <p className="text-sm text-[var(--color-low-emphasis)]">No users yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <h2 className="text-base font-bold text-[var(--color-high-emphasis)]">Users by Department</h2>
          <div className="mt-4 space-y-3">
            {departmentRows.length > 0 ? departmentRows.map(([department, count]) => (
              <div key={department} className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-high-emphasis)]">{department}</span>
                <span className="rounded-full bg-[#ecf8f6] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {count}
                </span>
              </div>
            )) : (
              <p className="text-sm text-[var(--color-low-emphasis)]">No department assignments yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

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
  const [activeView, setActiveView] = useState<TenantAdminView>(() =>
    getDefaultTenantAdminView(),
  );
  const [institutionType, setInstitutionType] = useState<InstitutionType>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [canUseFullAnalyticsReports, setCanUseFullAnalyticsReports] = useState(false);
  const [roleName, setRoleName] = useState("Org Admin");
  const [profile, setProfile] = useState(
    {
      displayName: "User",
      email: "",
      avatarUrl: "",
    },
  );
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [tabSkeletonView, setTabSkeletonView] = useState<TenantAdminView | null>(null);
  const [authError, setAuthError] = useState("");
  const [showTenantLoader, setShowTenantLoader] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    const iconMap: Record<TenantAdminView, string> = {
      accounts: ICON_SVGS.people,
      "manage-users": ICON_SVGS.people,
      departments: ICON_SVGS.flow,
      policies: ICON_SVGS.file,
      employees: ICON_SVGS.files,
      branding: ICON_SVGS.settings,
      "analytics-reports": ICON_SVGS.analytics,
    };

    return NavItems(
      activeView,
      institutionType ?? undefined,
      canUseFullAnalyticsReports,
    ).map((item) => ({
      key: item.view,
      label: item.name,
      icon: iconMap[item.view],
    }));
  }, [activeView, canUseFullAnalyticsReports, institutionType]);

  const handleBrandingUpdated = (nextBranding: TenantBranding | null) => {
    setBranding(nextBranding);
    saveStoredTenantBranding(nextBranding);
    saveStoredTenantShell({
      institutionType,
      orgName,
      orgSlug,
      subscriptionPlan,
      canUseFullAnalyticsReports,
      roleName,
      profile,
      branding: nextBranding,
    });
  };

  const content = {
    accounts: <Accounts showInitialSkeleton={tabSkeletonView === "accounts"} />,
    policies: <Policies showInitialSkeleton={tabSkeletonView === "policies"} />,
    "manage-users": (
      <TenantRolePermissionsPanel
        showInitialSkeleton={tabSkeletonView === "manage-users"}
      />
    ),
    departments: <Departments showInitialSkeleton={tabSkeletonView === "departments"} />,
    employees: <Employee showInitialSkeleton={tabSkeletonView === "employees"} />,
    branding: (
      <Branding
        onBrandingUpdated={handleBrandingUpdated}
        showInitialSkeleton={tabSkeletonView === "branding"}
      />
    ),
    "analytics-reports": canUseFullAnalyticsReports ? (
      <AnalyticsReportsPanel
        showInitialSkeleton={tabSkeletonView === "analytics-reports"}
      />
    ) : (
      <UpgradeRequiredPanel subscriptionPlan={subscriptionPlan} />
    ),
  }[activeView];

  useEffect(() => {
    const storedShell = readStoredTenantShell();

    if (storedShell) {
      setInstitutionType(storedShell.institutionType);
      setOrgName(storedShell.orgName);
      setOrgSlug(storedShell.orgSlug);
      setSubscriptionPlan(storedShell.subscriptionPlan ?? null);
      setCanUseFullAnalyticsReports(Boolean(storedShell.canUseFullAnalyticsReports));
      setRoleName(storedShell.roleName);
      setProfile(storedShell.profile);
      setBranding(storedShell.branding);
      setActiveView(getDefaultTenantAdminView(storedShell.institutionType));
    } else {
      setBranding(readStoredTenantBranding());
    }

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
        const nextSubscriptionPlan = payload.org?.subscriptionPlan ?? null;
        const nextCanUseFullAnalyticsReports = Boolean(payload.canUseFullAnalyticsReports);
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
        setSubscriptionPlan(nextSubscriptionPlan);
        setCanUseFullAnalyticsReports(nextCanUseFullAnalyticsReports);
        setRoleName(nextRoleName);
        setProfile(nextProfile);
        setBranding(nextBranding);
        saveStoredTenantBranding(nextBranding);
        saveStoredTenantShell({
          institutionType: detectedType,
          orgName: nextOrgName,
          orgSlug: nextOrgSlug,
          subscriptionPlan: nextSubscriptionPlan,
          canUseFullAnalyticsReports: nextCanUseFullAnalyticsReports,
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
      "analytics-reports",
    ];
    const shouldUseSectionLoader = !viewsWithLocalLoaders.includes(key as TenantAdminView);

    setTabSkeletonView(shouldUseSectionLoader ? null : (key as TenantAdminView));
    setContentLoading(shouldUseSectionLoader);
    setActiveView(key as TenantAdminView);
  };

  if (authError) {
    return (
      <TenantBrandScope
        branding={branding}
        applyToDocument
        lockDocumentScroll
        className="tenant-branded-scrollbars min-h-screen bg-[var(--color-background)] text-[var(--color-high-emphasis)]"
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
      <TenantBrandScope
        branding={branding}
        applyToDocument
        lockDocumentScroll
        className="tenant-branded-scrollbars min-h-screen bg-[var(--color-background)] text-[var(--color-high-emphasis)]"
      >
        <TenantLogoLoader
          branding={branding}
          logoUrl={branding?.logoUrl}
          logoAlt={branding?.logoAlt}
          isDataReady={false}
        />
      </TenantBrandScope>
    );
  }

  return (
    <TenantBrandScope
      branding={branding}
      applyToDocument
      lockDocumentScroll
      className="tenant-branded-scrollbars flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]"
    >
      {showTenantLoader ? (
        <TenantLogoLoader
          branding={branding}
          logoUrl={branding?.logoUrl}
          logoAlt={branding?.logoAlt}
          isDataReady
          onAnimationComplete={() => {
            setShowTenantLoader(false);
            setShowDashboard(true);
          }}
        />
      ) : null}
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
        <section
          className={`min-w-0 flex-1 bg-[var(--color-background)] p-6 ${
            activeView === "manage-users" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {showDashboard ? (
            <>
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
            </>
          ) : null}
        </section>
      </div>
    </TenantBrandScope>
  );
}
