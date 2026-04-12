import { usePathname } from "next/navigation";
import { AppIcon } from "@/public/icons";

export const NavItems = () => {
  const pathname = usePathname();

  function isNavItemActive(pathname: string, nav: string) {
    return pathname.includes(nav);
  }

  return [
    {
      name: "Home",
      href: "/",
      icon: <AppIcon name="menu" className="w-5 h-5" />, // Use existing 'menu' or add 'home' to ICON_SVGS
      active: pathname === "/",
      position: "top",
    },
    {
      name: "Profile",
      href: "/profile",
      icon: <AppIcon name="people" className="w-5 h-5" />,
      active: isNavItemActive(pathname, "/profile"),
      position: "top",
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: <AppIcon name="bell" className="w-5 h-5" />,
      active: isNavItemActive(pathname, "/notifications"),
      position: "top",
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <AppIcon name="files" className="w-5 h-5" />, // Use 'files' as proxy for projects
      active: isNavItemActive(pathname, "/projects"),
      position: "top",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <AppIcon name="settings" className="w-5 h-5" />,
      active: isNavItemActive(pathname, "/settings"),
      position: "bottom",
    },
  ];
};
