"use client";

import { useCallback, useEffect, useState } from "react";
import TeachingScheduleGrid from "@/components/Features/TeachingScheduleGrid";
import { teacherLoadRows, type TeacherLoadRow } from "./teacher-load-data";
import { supabase } from "@/lib/supabaseClient";

const depedScheduleTimeSlots = [
    "8:00-9:00",
    "9:00-10:00",
    "10:00-11:30",
    "1:00-2:30",
    "2:00-3:00",
    "3:00-4:30",
];

type TeachingLoadTableProps = {
    rows?: TeacherLoadRow[];
};

type TeachingLoadPayload = {
    rows?: TeacherLoadRow[];
    error?: string;
};

export default function TeachingLoadTable({ rows: providedRows }: TeachingLoadTableProps) {
    const [backendRows, setBackendRows] = useState<TeacherLoadRow[]>(teacherLoadRows);
    const [isLoading, setIsLoading] = useState(providedRows === undefined);
    const [loadError, setLoadError] = useState("");
    const rows = providedRows ?? backendRows;

    const loadTeachingLoad = useCallback(async () => {
        if (providedRows !== undefined) {
            return;
        }

        setIsLoading(true);
        setLoadError("");

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
            setBackendRows([]);
            setLoadError("Please sign in again to load your teaching load.");
            setIsLoading(false);
            return;
        }

        const response = await fetch("/api/tenant/my-teaching-load", {
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        });
        const payload: TeachingLoadPayload = await response.json().catch(() => ({}));

        if (!response.ok) {
            setBackendRows([]);
            setLoadError(payload.error || "Unable to load your teaching load.");
            setIsLoading(false);
            return;
        }

        setBackendRows(payload.rows ?? []);
        setIsLoading(false);
    }, [providedRows]);

    useEffect(() => {
        void Promise.resolve().then(loadTeachingLoad);
    }, [loadTeachingLoad]);

    return (
        <div className="space-y-4">
            {loadError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {loadError}
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[8px] border border-[color:var(--color-default)] bg-[var(--color-card)] shadow-level-1">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left">
                        <thead>
                            <tr>
                                <th className="bg-[var(--color-primary)] px-4 py-4 text-[12px] font-semibold tracking-wide text-white">
                                    Subject Title
                                </th>
                                <th className="bg-[var(--color-primary)] px-4 py-4 text-[12px] font-semibold tracking-wide text-white">
                                    Subject Code
                                </th>
                                <th className="bg-[var(--color-primary)] px-4 py-4 text-[12px] font-semibold tracking-wide text-white">
                                    Schedule
                                </th>
                                <th className="bg-[var(--color-primary)] px-4 py-4 text-[12px] font-semibold tracking-wide text-white">
                                    Room
                                </th>
                                <th className="bg-[var(--color-primary)] px-4 py-4 text-[12px] font-semibold tracking-wide text-white">
                                    Section
                                </th>
                                <th className="bg-[var(--color-primary)] px-4 py-4 text-[12px] font-semibold tracking-wide text-white">
                                    Students
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[color:var(--color-default)] bg-white">
                            {isLoading ? (
                                <tr className="bg-white">
                                    <td
                                        colSpan={6}
                                        className="px-4 py-6 text-center text-[12px] font-medium text-[var(--color-low-emphasis)]"
                                    >
                                        Loading assigned subjects...
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
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
                                    <td className="px-4 py-4 text-[12px] font-semibold text-[var(--color-high-emphasis)]">
                                        {row.subjectTitle}
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-[var(--color-high-emphasis)]">
                                        {row.subjectCode}
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-[var(--color-high-emphasis)]">
                                        {row.schedule}
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-[var(--color-high-emphasis)]">
                                        {row.room}
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-[var(--color-high-emphasis)]">
                                        {row.section}
                                    </td>
                                    <td className="px-4 py-4 text-[12px] text-[var(--color-high-emphasis)]">
                                        {row.students}
                                    </td>
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TeachingScheduleGrid rows={isLoading ? [] : rows} timeSlots={depedScheduleTimeSlots} />
        </div>
    );
}
