"use client";

import Navbar from "@/components/Global/navbar";
import Sidebar, { type RoleSidebarItem } from "@/components/roles/sidebar";
import { ICON_SVGS } from "@/public/icons";
import { use } from "react";
import Link from "next/link"; // 1. Import Link
import DepartmentFacultyTable from "@/components/roles/Deped/principal/components/DepartmentFacultyTable";

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

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const departmentName =
    id === "dept-1" ? "Filipino Department" : "General Department";

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <Navbar />
      <div className="flex min-h-0 flex-1 w-full overflow-hidden">
        <Sidebar title="Deped Menu" items={sidebarItems} />
        <section className="min-w-0 flex-1 overflow-y-auto px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-none space-y-4">
            {/* 2. Back Button Section */}
            <div className="mb-2">
              <Link
                href="/tenant/roles-pages/Deped/principal"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-light-primary)] transition-colors"
              >
                <span className="text-lg">←</span> Back to Departments
              </Link>
            </div>

            <div>
              <div>
                <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
                  Teaching Load Assignment
                </h1>
              </div>
              <div className="mt-4">
                {" "}
                {/* Adjusted padding/margin for better fit */}
                <DepartmentFacultyTable departmentName={departmentName} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
