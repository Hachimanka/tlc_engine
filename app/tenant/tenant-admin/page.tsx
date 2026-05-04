"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Global/navbar";
import Sidebar, { type SidebarItem } from "@/components/Global/sidebar";
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
    policies: <Policies />,
    "manage-users": <TenantRolePermissionsPanel />,
    employees: <Employee />,
  }[activeView];

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        router.replace("/tenant/login?redirect=/tenant/tenant-admin");
        return;
      }

      const metadata = user.user_metadata as {
        first_login?: boolean;
        onboarding_complete?: boolean;
        institution_type?: InstitutionType;
        role?: string;
      };

      if (metadata?.first_login === true || metadata?.onboarding_complete === false) {
        router.replace("/tenant/onboarding");
        return;
      }

      if (metadata?.role !== "org_admin") {
        await supabase.auth.signOut();
        router.replace("/tenant/login");
        return;
      }

      const detectedType = metadata?.institution_type ?? null;
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
