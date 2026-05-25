"use client";

import { useState } from "react";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import ExportFrom from "@/components/Features/Deped/view-teaching-load/components/ExportFrom";
import RequestForm from "@/components/Features/Deped/view-teaching-load/components/RequestForm";
import TeachingLoadTable from "@/components/Features/Deped/view-teaching-load/components/TeachingLoadTable";
import { ICON_SVGS } from "@/public/icons";

const brandedDownloadIcon = ICON_SVGS.download.replaceAll("#029383", "currentColor");

export default function TenantPage() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  return (
    <>
      <TenantRoleLayout
        tenantType="Deped"
        role="teacher"
        title="Deped Menu"
        iconSvg={ICON_SVGS.menu}
        requiredFeatureKey="deped-teaching-load-view"
        contentClassName="px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8"
      >
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
                className="flex h-4 w-4 items-center justify-center text-white"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: brandedDownloadIcon }}
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
                className="absolute inset-x-0 inset-y-0 translate-x-1.5 translate-y-1.5 rounded-[18px] bg-[var(--color-default)] opacity-80 transition-transform duration-200 group-hover:translate-x-2 group-hover:translate-y-2"
              />
              <span className="relative z-10 text-center">Send Request</span>
            </button>
          </div>
        </div>
      </TenantRoleLayout>

      <ExportFrom isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <RequestForm isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
    </>
  );
}
