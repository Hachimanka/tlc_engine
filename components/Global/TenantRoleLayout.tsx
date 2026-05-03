"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Global/navbar";
import Sidebar, { type SidebarItem } from "@/components/Global/sidebar";
import {
  getFeatureSidebarItems,
  type FeatureRole,
  type TenantType,
} from "@/features.config";
import { ICON_SVGS } from "@/public/icons";
import { supabase } from "@/lib/supabaseClient";

type TenantRoleLayoutProps = {
  tenantType: TenantType;
  role: FeatureRole;
  title: string;
  iconSvg?: string;
  contentClassName?: string;
  children: ReactNode;
};

export default function TenantRoleLayout({
  tenantType,
  role,
  title,
  iconSvg,
  contentClassName,
  children,
}: TenantRoleLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const featureItems = getFeatureSidebarItems(tenantType, role);
  const sidebarItems: SidebarItem[] = featureItems.map((item) => ({
    key: item.featureKey,
    label: item.label,
    icon: item.icon,
  }));

  const activeMatch = featureItems
    .filter((item) => item.href && item.href !== "#" && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const activeKey = activeMatch?.featureKey ?? sidebarItems[0]?.key ?? "";

  const handleSetActiveKey = (key: string) => {
    const target = featureItems.find((item) => item.featureKey === key);
    if (target?.href && target.href !== "#") {
      router.push(target.href);
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
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        router.replace(`/tenant/login?redirect=${encodeURIComponent(pathname || "/tenant/tenant-admin")}`);
        return;
      }

      const metadata = user.user_metadata as {
        first_login?: boolean;
        onboarding_complete?: boolean;
      };

      if (metadata?.first_login === true || metadata?.onboarding_complete === false) {
        router.replace("/tenant/onboarding");
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [pathname, router]);

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
          activeKey={activeKey}
          setActiveKey={handleSetActiveKey}
          items={sidebarItems}
          title={title}
          iconSvg={iconSvg || ICON_SVGS.people}
        />
        <section className={sectionClassName}>{children}</section>
      </div>
    </div>
  );
}
