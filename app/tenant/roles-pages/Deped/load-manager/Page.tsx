"use client";

import Navbar from "@/components/Global/navbar";
import DepartmentFacultyTable from "@/components/roles/Deped/load-manager/components/DepartmentFacultyTable";
import Sidebar, { type RoleSidebarItem } from "@/components/roles/sidebar";
import { ICON_SVGS } from "@/public/icons";

const sidebarItems: RoleSidebarItem[] = [
  {
    href: "/tenant/roles-pages/Deped/load-manager",
    label: "Teaching Load Assignment",
    icon: ICON_SVGS.menu,
  },
  {
    href: "#",
    label: "Settings",
    icon: ICON_SVGS.settings,
  },
];

export default function TenantPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <Navbar />

      <div className="flex min-h-0 flex-1 w-full overflow-hidden">
        <Sidebar title="Deped Menu" items={sidebarItems} />

        <section className="min-w-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8">
          <div className="rounded-3xl px-5 py-4">
            <h1 className="text-heading-h3 text-[var(--color-primary)]">
              Teaching Load Assignment
            </h1>
          </div>

          <DepartmentFacultyTable />
        </section>
      </div>
    </main>
  );
}