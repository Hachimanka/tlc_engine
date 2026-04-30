"use client";

import Navbar from "@/components/Global/HeaderTenant";
import DepartmentFacultyTable from "@/components/Features/Deped/manage-load/components/DepartmentFacultyTable";
import Sidebar from "@/components/Features/sidebar";
import { getFeatureSidebarItems } from "@/features.config";

const sidebarItems = getFeatureSidebarItems("Deped", "load-manager");

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
                Subject Management
              </h1>
            </div>

            <DepartmentFacultyTable />
          </div>
        </section>
      </div>
    </main>
  );
}
