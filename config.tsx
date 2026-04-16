import { usePathname } from "next/navigation";
import { AppIcon } from "@/public/icons";

export const NavItems = () => {
  const pathname = usePathname();

  function isNavItemActive(pathname: string, nav: string) {
    return pathname.includes(nav);
  }

  return [
    {
      name: "Teaching Load",
      href: "/",
      icon: <AppIcon name="menu" className="w-5 h-5" />, // Use existing 'menu' or add 'home' to ICON_SVGS
      active: pathname === "/",
      position: "top",
    },
    {
      name: "Send Request",
      href: "/request",
      icon: <AppIcon name="file" className="w-5 h-5 " />,
      active: isNavItemActive(pathname, "/request"),
      position: "top",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <AppIcon name="settings" className="w-5 h-5" />,
      active: isNavItemActive(pathname, "/settings"),
      position: "top",
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <AppIcon name="files" className="w-5 h-5" />, // Use 'files' as proxy for projects
      active: isNavItemActive(pathname, "/projects"),
      position: "top",
    },
  ];
};
