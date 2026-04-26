import { usePathname } from "next/navigation";
import { AppIcon } from "@/public/icons";

export const NavItems = () => {
  const pathname = usePathname();

  function isNavItemActive(pathname: string, nav: string) {
    return pathname.includes(nav);
  }

  return [
    {
      name: "Manage Users",
      href: "/tenant/dashboard",
      icon: <AppIcon name="people" className="w-5 h-5" />,
      active: pathname === "/tenant/dashboard",
      position: "top",
    },
    {
      name: "Manage Policies",
      href: "/tenant/policies",
      icon: <AppIcon name="file" className="w-5 h-5 " />,
      active: isNavItemActive(pathname, "/tenant/policies"),
      position: "top",
    },
    {
      name: "Employees",
      href: "/tenant/employees",
      icon: <AppIcon name="files" className="w-5 h-5" />,
      active: isNavItemActive(pathname, "/tenant/employees"),
      position: "top",
    },
  ];
};
