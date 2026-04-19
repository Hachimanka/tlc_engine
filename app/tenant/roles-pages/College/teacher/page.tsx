"use client";

import { useState } from "react";
import HeaderTenant from "@/components/Global/HeaderTenant";
import ExportForm from "@/components/roles/College/teacher/components/ExportForm";
import RequestForm from "@/components/roles/College/teacher/components/RequestForm";
import TeachingLoadTable from "@/components/roles/College/teacher/components/TeachingLoadTable";
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
    label: "Settings",
    icon: ICON_SVGS.settings,
  },
];

export default function TenantPage() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <HeaderTenant />

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
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-[12px] font-medium text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)] cursor-pointer"
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsRequestOpen(true)}
                className="group relative inline-flex min-w-[150px] items-center justify-center overflow-visible rounded-[18px] bg-[var(--color-primary)] px-6 py-3 text-[13px] font-semibold text-white shadow-none transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-light-primary)] sm:min-w-[180px]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 inset-y-0 translate-x-1.5 translate-y-1.5 rounded-[18px] bg-[rgba(2,147,131,0.30)] transition-transform duration-200 group-hover:translate-x-2 group-hover:translate-y-2"
                />
                <span className="relative z-10 text-center cursor-pointer">
                  Send Request
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <ExportForm
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
      <RequestForm
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </main>
  );
}
