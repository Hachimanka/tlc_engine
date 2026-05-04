import { AppIcon } from "@/public/icons";

export type InstitutionType = "higher_ed" | "deped" | "tesda" | "training" | null;

export type TenantAdminView = "policies" | "manage-users" | "employees";

const getTenantAdminLabels = (institutionType?: InstitutionType) => {
  if (institutionType === "higher_ed") {
    return { policies: "Academic Policies", employees: "Faculty & Staff" };
  }

  if (institutionType === "deped") {
    return { policies: "School Policies", employees: "Teachers" };
  }

  if (institutionType === "tesda") {
    return { policies: "Assessment Policies", employees: "Trainers" };
  }

  if (institutionType === "training") {
    return { policies: "Training Policies", employees: "Facilitators" };
  }

  return { policies: "Manage Policies", employees: "Employees" };
};

const getTenantAdminOrder = (institutionType?: InstitutionType): TenantAdminView[] => {
  if (institutionType === "tesda" || institutionType === "training") {
    return ["employees", "manage-users", "policies"];
  }

  return ["manage-users", "employees", "policies"];
};

export const getDefaultTenantAdminView = (institutionType?: InstitutionType): TenantAdminView => {
  if (institutionType === "tesda" || institutionType === "training") {
    return "employees";
  }

  return "manage-users";
};

export const NavItems = (
  activeView: TenantAdminView = "policies",
  institutionType?: InstitutionType,
) => {
  const labels = getTenantAdminLabels(institutionType);
  const order = getTenantAdminOrder(institutionType);

  const items = [
    {
      name: "Manage Users",
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
      name: labels.employees,
      href: "/tenant/tenant-admin",
      view: "employees" as TenantAdminView,
      icon: <AppIcon name="files" className="w-5 h-5" />,
      active: activeView === "employees",
      position: "top",
    },
  ];

  return items.sort((a, b) => order.indexOf(a.view) - order.indexOf(b.view));
};
