import type { ReactNode } from "react";
import { AppIcon } from "@/public/icons";

export type InstitutionType =
  | "higher_ed"
  | "deped"
  | "tesda"
  | "training"
  | null;

export type TenantAdminView =
  | "accounts"
  | "policies"
  | "manage-users"
  | "departments"
  | "branding"
  | "analytics-reports";

type TenantAdminNavItem = {
  name: string;
  href: string;
  view: TenantAdminView;
  icon: ReactNode;
  active: boolean;
  position: "top";
  institutionTypes?: InstitutionType[];
  hiddenForInstitutionTypes?: InstitutionType[];
  requiresFullAnalyticsReports?: boolean;
};

const getTenantAdminLabels = (institutionType?: InstitutionType) => {
  if (institutionType === "higher_ed") {
    return { policies: "Academic Policies" };
  }

  if (institutionType === "deped") {
    return { policies: "School Policies" };
  }

  if (institutionType === "tesda") {
    return { policies: "Assessment Policies" };
  }

  if (institutionType === "training") {
    return { policies: "Training Policies" };
  }

  return { policies: "Manage Policies" };
};

const getTenantAdminOrder = (
  institutionType?: InstitutionType,
): TenantAdminView[] => {
  if (institutionType === "higher_ed") {
    return [
      "accounts",
      "manage-users",
      "departments",
      "policies",
      "analytics-reports",
      "branding",
    ];
  }

  if (institutionType === "deped") {
    return [
      "accounts",
      "manage-users",
      "policies",
      "analytics-reports",
      "branding",
    ];
  }

  if (institutionType === "tesda" || institutionType === "training") {
    return [
      "accounts",
      "manage-users",
      "policies",
      "analytics-reports",
      "branding",
    ];
  }

  return [
    "accounts",
    "manage-users",
    "policies",
    "analytics-reports",
    "branding",
  ];
};

export const getDefaultTenantAdminView = (
  institutionType?: InstitutionType,
): TenantAdminView => {
  return "accounts";
};

export const NavItems = (
  activeView: TenantAdminView = "policies",
  institutionType?: InstitutionType,
  canUseFullAnalyticsReports = false,
) => {
  const labels = getTenantAdminLabels(institutionType);
  const order = getTenantAdminOrder(institutionType);

  const items = [
    {
      name: "Accounts",
      href: "/tenant/tenant-admin",
      view: "accounts" as TenantAdminView,
      icon: <AppIcon name="people" className="w-5 h-5" />,
      active: activeView === "accounts",
      position: "top",
    },
    {
      name: "Roles & Feature Access",
      href: "/tenant/tenant-admin",
      view: "manage-users" as TenantAdminView,
      icon: <AppIcon name="people" className="w-5 h-5" />,
      active: activeView === "manage-users",
      position: "top",
    },
    {
      name: labels.policies,
      href: "/tenant/tenant-admin",
      view: "policies" as TenantAdminView,
      icon: <AppIcon name="file" className="w-5 h-5 " />,
      active: activeView === "policies",
      position: "top",
    },
    {
      name: "Colleges & Departments",
      href: "/tenant/tenant-admin",
      view: "departments" as TenantAdminView,
      icon: <AppIcon name="flow" className="w-5 h-5" />,
      active: activeView === "departments",
      position: "top",
      institutionTypes: ["higher_ed"],
    },
    {
      name: "Analytics & Reports",
      href: "/tenant/tenant-admin",
      view: "analytics-reports" as TenantAdminView,
      icon: <AppIcon name="analytics" className="w-5 h-5" />,
      active: activeView === "analytics-reports",
      position: "top",
      requiresFullAnalyticsReports: true,
    },
    {
      name: "Branding",
      href: "/tenant/tenant-admin",
      view: "branding" as TenantAdminView,
      icon: <AppIcon name="settings" className="w-5 h-5" />,
      active: activeView === "branding",
      position: "top",
    },
  ] as TenantAdminNavItem[];

  return items
    .filter((item) => {
      if (!("institutionTypes" in item)) {
        if (
          "requiresFullAnalyticsReports" in item &&
          item.requiresFullAnalyticsReports &&
          !canUseFullAnalyticsReports
        ) {
          return false;
        }

        if ("hiddenForInstitutionTypes" in item) {
          return !(
            institutionType &&
            item.hiddenForInstitutionTypes?.includes(institutionType)
          );
        }

        return true;
      }

      const institutionTypes = item.institutionTypes;
      return Boolean(
        institutionType && institutionTypes?.includes(institutionType),
      );
    })
    .sort((a, b) => order.indexOf(a.view) - order.indexOf(b.view));
};
