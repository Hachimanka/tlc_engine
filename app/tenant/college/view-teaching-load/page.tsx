"use client";

import { useCallback, useEffect, useState } from "react";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import ExportForm from "@/components/Features/College/view-teaching-load/components/ExportForm";
import RequestForm from "@/components/Features/College/view-teaching-load/components/RequestForm";
import TeachingLoadTable from "@/components/Features/College/view-teaching-load/components/TeachingLoadTable";
import { ICON_SVGS } from "@/public/icons";
import { supabase } from "@/lib/supabaseClient";
import {
  teacherLoadRows,
  type TeacherLoadRow,
} from "@/components/Features/College/view-teaching-load/components/teacher-load-data-college";

const brandedDownloadIcon = ICON_SVGS.download.replaceAll("#029383", "currentColor");

export default function TenantPage() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [rows, setRows] = useState<TeacherLoadRow[]>(teacherLoadRows);

  const loadTeachingLoad = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setRows(teacherLoadRows);
      return;
    }

    try {
      const response = await fetch("/api/tenant/my-teaching-load", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setRows(teacherLoadRows);
        return;
      }

      setRows(payload.rows ?? teacherLoadRows);
    } catch {
      setRows(teacherLoadRows);
    }
  }, []);

  useEffect(() => {
    loadTeachingLoad();
  }, [loadTeachingLoad]);

  return (
    <>
      <TenantRoleLayout
        tenantType="College"
        role="teacher"
        title="College Menu"
        iconSvg={ICON_SVGS.menu}
        requiredFeatureKey="higher-teaching-load-view"
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
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-[12px] font-medium text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)] cursor-pointer"
            >
              <span
                className="flex h-4 w-4 items-center justify-center text-white"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: brandedDownloadIcon }}
              />
              Export
            </button>
          </div>

          <TeachingLoadTable rows={rows} />

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
              <span className="relative z-10 text-center cursor-pointer">
                Send Request
              </span>
            </button>
          </div>
        </div>
      </TenantRoleLayout>

      <ExportForm
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rows={rows}
      />
      <RequestForm
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </>
  );
}
