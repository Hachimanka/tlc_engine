"use client";
// import { cn } from "@/lib/utils";
import { NavItems } from "@/config";
import { type ReactNode } from "react";
import Link from "next/link";
import { Fragment } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@radix-ui/react-tooltip";

export default function SidePanel() {
  const isSidebarExpanded = true;
  const navItems = NavItems();

  return (
    <aside className="bg-white flex h-screen min-h-full w-80 min-w-[20rem] flex-col break-words px-1 overflow-x-hidden">
      {/* Top */}
      <div className="mt-4 relative pb-2">
        <div className="flex flex-col space-y-1">
          {navItems.map((item, idx) => {
            if (item.position === "top") {
              return (
                <Fragment key={idx}>
                  <div className="space-y-1">
                    <SideNavItem
                      label={item.name}
                      icon={item.icon}
                      path={item.href}
                      active={item.active}
                      isSidebarExpanded={isSidebarExpanded}
                    />
                  </div>
                </Fragment>
              );
            }
          })}
        </div>
      </div>
      {/* Bottom */}
      <div className="sticky bottom-0 mt-auto whitespace-nowrap mb-4 transition duration-200 block">
        {/* <ThemeToggle isDropDown={true} /> */}
        {navItems.map((item, idx) => {
          if (item.position === "bottom") {
            return (
              <Fragment key={idx}>
                <div className="space-y-1">
                  <SideNavItem
                    label={item.name}
                    icon={item.icon}
                    path={item.href}
                    active={item.active}
                    isSidebarExpanded={isSidebarExpanded}
                  />
                </div>
              </Fragment>
            );
          }
        })}
      </div>
    </aside>
  );
}

export const SideNavItem: React.FC<{
  label: string;
  icon: ReactNode;
  path: string;
  active: boolean;
  isSidebarExpanded: boolean;
}> = ({ label, icon, path, active, isSidebarExpanded }) => {
  return (
    <>
      {isSidebarExpanded ? (
        <Link
          href={path}
          className={`w-full h-14 relative flex items-center whitespace-nowrap rounded-xl ${
            active
              ? "text-body-default text-[var(--color-card)] bg-[var(--color-primary)]"
              : "text-body-default text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-card)] hover:hover:[&_svg_path]:stroke-[var(--color-card)]"
          }`}
        >
          <div className="relative w-full h-full text-body-default px-4 flex items-center space-x-3 rounded-xl duration-100">
            {icon}
            <span>{label}</span>
          </div>
        </Link>
      ) : (
        <TooltipProvider delayDuration={70}>
          <Tooltip>
            <TooltipTrigger>
              <Link
                href={path}
                className={`w-full h-14 relative flex items-center justify-center whitespace-nowrap rounded-xl ${
                  active
                    ? "text-body-default text-[var(--color-card)] bg-[var(--color-primary)]"
                    : "text-body-default text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-card)]"
                }`}
              >
                <div className="relative w-full h-full text-body-default p-2 flex items-center justify-center rounded-xl duration-100">
                  {icon}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="px-1 py-1.5 text-xs"
              sideOffset={10}
            >
              <span>{label}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
};
