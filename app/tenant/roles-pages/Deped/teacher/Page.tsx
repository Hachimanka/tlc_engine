"use client";

import { useState } from "react";
import Navbar from "@/components/Global/navbar";
import ExportFrom from "@/components/roles/Deped/teacher/components/ExportFrom";
import TeachingLoadTable from "@/components/roles/Deped/teacher/components/TeachingLoadTable";
import Sidebar, { type RoleSidebarItem } from "@/components/roles/sidebar";
import { ICON_SVGS } from "@/public/icons";

const sidebarItems: RoleSidebarItem[] = [
  {
    href: "/tenant/roles-pages/Deped/teacher",
    label: "Teaching Load",
    icon: ICON_SVGS.menu,
  },
  {
    href: "#",
    label: "Send Request",
    icon: ICON_SVGS.menu,
  },
  {
    href: "#",
    label: "Settings",
    icon: ICON_SVGS.settings,
  },
];

export default function TenantPage() {
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <Navbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar title="Deped Menu" items={sidebarItems} />

        <section className="min-w-0 flex-1 overflow-y-auto px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1120px] space-y-3">
            <div className="flex items-center justify-between gap-4 px-1 py-1">
              <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
                Teaching Load
              </h1>

              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-[12px] font-medium text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)]"
              >
                <span
                  className="flex h-4 w-4 items-center justify-center"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: ICON_SVGS.download }}
                />
                Export
              </button>
            </div>

            <TeachingLoadTable />
          </div>
        </section>
      </div>

        <ExportFrom isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </main>
  );
}