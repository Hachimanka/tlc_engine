import { ICON_SVGS } from "@/public/icons";
import { type FeatureSidebarItem } from "@/components/Features/sidebar";

export type TenantType = FeatureSidebarItem["tenantType"];
export type FeatureRole =
  | "teacher"
  | "load-manager"
  | "subject-room-manager"
  | "load-admin"
  | "dean"
  | "vpaa";

export type FeatureKey =
  | "dashboard"
  | "view-teaching-load"
  | "manage-load"
  | "manage-subject"
  | "manage-room"
  | "load-admin"
  | "requests"
  | "compliance"
  | "settings";

export const featureSidebarItems: FeatureSidebarItem[] = [
  {
    tenantType: "Deped",
    role: "teacher",
    featureKey: "view-teaching-load",
    href: "/tenant/features/Deped/view-teaching-load",
    label: "Teaching Load",
    icon: ICON_SVGS.menu,
  },
  {
    tenantType: "Deped",
    role: "teacher",
    featureKey: "settings",
    href: "#",
    label: "Settings",
    icon: ICON_SVGS.settings,
  },
  {
    tenantType: "Deped",
    role: "load-manager",
    featureKey: "manage-load",
    href: "/tenant/features/Deped/manage-load",
    label: "Teaching Load Assignment",
    icon: ICON_SVGS.menu,
  },
  {
    tenantType: "Deped",
    role: "load-manager",
    featureKey: "settings",
    href: "#",
    label: "Settings",
    icon: ICON_SVGS.settings,
  },
  {
    tenantType: "Deped",
    role: "subject-room-manager",
    featureKey: "manage-subject",
    href: "/tenant/features/Deped/manage-subject",
    label: "Subject Management",
    icon: ICON_SVGS.menu,
  },
  {
    tenantType: "Deped",
    role: "subject-room-manager",
    featureKey: "manage-room",
    href: "/tenant/features/Deped/manage-room",
    label: "Room Management",
    icon: ICON_SVGS.menu,
  },
  {
    tenantType: "Deped",
    role: "subject-room-manager",
    featureKey: "settings",
    href: "#",
    label: "Settings",
    icon: ICON_SVGS.settings,
  },
  {
    tenantType: "Deped",
    role: "load-admin",
    featureKey: "dashboard",
    href: "#",
    label: "Dashboard",
    icon: ICON_SVGS.menu,
  },
  {
    tenantType: "Deped",
    role: "load-admin",
    featureKey: "load-admin",
    href: "/tenant/features/Deped/load-admin",
    label: "Department Load",
    icon: ICON_SVGS.hat,
  },
  {
    tenantType: "Deped",
    role: "load-admin",
    featureKey: "requests",
    href: "#",
    label: "Adjustment Requests",
    icon: ICON_SVGS.file,
  },
  {
    tenantType: "Deped",
    role: "load-admin",
    featureKey: "compliance",
    href: "#",
    label: "Compliance",
    icon: ICON_SVGS.shield,
  },
  {
    tenantType: "College",
    role: "teacher",
    featureKey: "view-teaching-load",
    href: "/tenant/features/College/view-teaching-load",
    label: "Teaching Load",
    icon: ICON_SVGS.menu,
  },
  {
    tenantType: "College",
    role: "teacher",
    featureKey: "settings",
    href: "#",
    label: "Settings",
    icon: ICON_SVGS.settings,
  },
  {
    tenantType: "College",
    role: "load-manager",
    featureKey: "manage-load",
    href: "/tenant/features/College/manage-load",
    label: "Teaching Load Assignment",
    icon: ICON_SVGS.menu,
  },
  {
    tenantType: "College",
    role: "subject-room-manager",
    featureKey: "manage-subject",
    href: "/tenant/features/College/manage-subject",
    label: "Subject Management",
    icon: ICON_SVGS.menu,
  },
];

export function getFeatureSidebarItems(
  tenantType: TenantType,
  role: FeatureRole,
) {
  return featureSidebarItems.filter(
    (item) => item.tenantType === tenantType && item.role === role,
  );
}
