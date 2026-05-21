  "use client";

import { useCallback, useEffect, useState } from "react";
import TeachingScheduleGrid from "@/components/Features/TeachingScheduleGrid";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import { supabase } from "@/lib/supabaseClient";
import { teacherLoadRows, type TeacherLoadRow } from "./teacher-load-data-college";

const collegeScheduleTimeSlots = [
  "7:30-8:30",
  "8:30-9:30",
  "9:30-10:30",
  "10:30-11:30",
  "11:30-12:30",
  "12:30-1:30",
  "1:30-2:30",
  "2:30-3:30",
  "3:30-4:30",
];

type TeachingLoadTableProps = {
  rows?: TeacherLoadRow[];
};

type TeachingLoadPayload = {
  rows?: TeacherLoadRow[];
  error?: string;
};

export default function TeachingLoadTable({ rows: providedRows }: TeachingLoadTableProps) {
  const [rows, setRows] = useState<TeacherLoadRow[]>(providedRows ?? teacherLoadRows);
  const [isLoading, setIsLoading] = useState(!providedRows);
  const [loadError, setLoadError] = useState("");

  const loadTeachingLoad = useCallback(async () => {
    if (providedRows) {
      setRows(providedRows);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setLoadError("Your session expired. Please log in again.");
        return;
      }

      const response = await fetch("/api/tenant/my-teaching-load", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload: TeachingLoadPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setLoadError(payload.error || "Unable to load teaching load.");
        return;
      }

      setRows(payload.rows ?? []);
    } catch {
      setLoadError("Unable to load teaching load. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [providedRows]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTeachingLoad();
  }, [loadTeachingLoad]);

  if (isLoading) {
    return (
      <TenantLoadingScreen
        className="flex min-h-[280px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-level-1"
        label="Loading teaching load"
        useStoredBranding
      />
    );
  }

  return (
    <div className="space-y-4">
      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[8px] border border-[color:var(--color-default)] bg-[var(--color-card)] shadow-level-1">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
                  Subject Title
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
                  Subject Code
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
                  Schedule
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
                  Room
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
                  Section
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
                  Students
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-default)] bg-white">
              {rows.length === 0 ? (
                <tr className="bg-white">
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-[12px] font-medium text-[var(--color-low-emphasis)]"
                  >
                    No subjects assigned yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                <tr key={row.id} className="bg-white">
                  <td className="px-4 py-3 text-[12px] font-semibold text-[var(--color-high-emphasis)]">
                    {row.subjectTitle}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
                    {row.subjectCode}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
                    {row.schedule}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
                    {row.room}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
                    {row.section}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
                    {row.students}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TeachingScheduleGrid rows={rows} timeSlots={rows.length === 0 ? collegeScheduleTimeSlots : undefined} />
    </div>
  );
}
