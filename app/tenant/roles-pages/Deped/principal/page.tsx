"use client";

import Navbar from "@/components/Global/navbar";
import DepartmentFacultyTable from "@/components/roles/Deped/principal/components/DepartmentFacultyTable";
import DepartmentListTable from "@/components/roles/Deped/principal/components/DepartmentListTable";
import Sidebar, { type RoleSidebarItem } from "@/components/roles/sidebar";
import { ICON_SVGS } from "@/public/icons";

const sidebarItems: RoleSidebarItem[] = [
  {
    href: "#",
    label: "Dashboard",
    icon: ICON_SVGS.menu,
  },
  {
    href: "/tenant/roles-pages/Deped/principal",
    label: "Department Load",
    icon: ICON_SVGS.hat,
  },
  {
    href: "#",
    label: "Adjustment Requests",
    icon: ICON_SVGS.file,
  },
  {
    href: "#",
    label: "Compliance",
    icon: ICON_SVGS.shield,
  },
];

export default function TenantPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <Navbar />

      <div className="flex min-h-0 flex-1 w-full overflow-hidden">
        <Sidebar title="Deped Menu" items={sidebarItems} />

        <section className="min-w-0 flex-1 overflow-y-auto px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-none space-y-4">
            <div>
              <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
                All Departments View
              </h1>
            </div>

            <DepartmentListTable />
          </div>
        </section>
      </div>
    </main>
  );
}
