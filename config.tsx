import { AppIcon } from "@/public/icons";

export type TenantAdminView = "policies" | "manage-users" | "employees";

export const NavItems = (activeView: TenantAdminView = "policies") => {
  return [
    {
      name: "Manage Users",
      href: "/tenant/tenant-admin",
      view: "manage-users" as TenantAdminView,
      icon: <AppIcon name="people" className="w-5 h-5" />,
      active: activeView === "manage-users",
      position: "top",
    },
    {
      name: "Manage Policies",
      href: "/tenant/tenant-admin",
      view: "policies" as TenantAdminView,
      icon: <AppIcon name="file" className="w-5 h-5 " />,
      active: activeView === "policies",
      position: "top",
    },
    {
      name: "Employees",
      href: "/tenant/tenant-admin",
      view: "employees" as TenantAdminView,
      icon: <AppIcon name="files" className="w-5 h-5" />,
      active: activeView === "employees",
      position: "top",
    },
  ];
};
