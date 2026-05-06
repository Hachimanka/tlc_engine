"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Global/navbar";
import Sidebar, { type SidebarItem } from "@/components/Global/sidebar";
import Accounts from "@/components/Features/Tenant/Accounts";
import Employee from "@/components/Features/Tenant/Employee";
import Policies from "@/components/Features/Tenant/Policies";
import TenantRolePermissionsPanel from "@/components/Features/Tenant/TenantRolePermissionsPanel";
import {
  NavItems,
  type TenantAdminView,
  type InstitutionType,
  getDefaultTenantAdminView,
} from "@/config";
import { ICON_SVGS } from "@/public/icons";
import { supabase } from "@/lib/supabaseClient";

export default function TenantPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<TenantAdminView>(() => getDefaultTenantAdminView());
  const [institutionType, setInstitutionType] = useState<InstitutionType>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    const iconMap: Record<TenantAdminView, string> = {
      accounts: ICON_SVGS.people,
      "manage-users": ICON_SVGS.people,
      policies: ICON_SVGS.file,
      employees: ICON_SVGS.files,
    };

    return NavItems(activeView, institutionType ?? undefined).map((item) => ({
      key: item.view,
      label: item.name,
      icon: iconMap[item.view],
    }));
  }, [activeView, institutionType]);

  const content = {
    accounts: <Accounts />,
    policies: <Policies />,
    "manage-users": <TenantRolePermissionsPanel />,
    employees: <Employee />,
  }[activeView];

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        router.replace("/login?redirect=/tenant/tenant-admin");
        return;
      }

      const metadata = user.user_metadata as {
        first_login?: boolean;
        onboarding_complete?: boolean;
        institution_type?: InstitutionType;
        role?: string;
        must_change_password?: boolean;
      };

      if (metadata?.must_change_password === true) {
        router.replace("/tenant/password-setup?redirect=/tenant/tenant-admin");
        return;
      }

      if (metadata?.first_login === true || metadata?.onboarding_complete === false) {
        router.replace("/tenant/onboarding");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        router.replace("/login?redirect=/tenant/tenant-admin");
        return;
      }

      const response = await fetch("/api/tenant/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        router.replace("/login");
        return;
      }

      if (!payload.isOrgAdmin) {
        router.replace(payload.firstActiveHref || "/login");
        return;
      }

      const detectedType = payload.org?.institutionType ?? metadata?.institution_type ?? null;
      setInstitutionType(detectedType);
      setActiveView(getDefaultTenantAdminView(detectedType));

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Checking session...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <Navbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          activeKey={activeView}
          setActiveKey={(key) => setActiveView(key as TenantAdminView)}
          items={sidebarItems}
          title="Tenant Admin"
          iconSvg={ICON_SVGS.people}
        />
        <section className="min-w-0 flex-1 overflow-y-auto bg-[var(--color-background)] p-6">
          {content}
        </section>
      </div>
    </div>
  );
}
