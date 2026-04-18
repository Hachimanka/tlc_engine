"use client";

import { teacherLoadRows } from "./teacher-load-data";

export default function TeachingLoadTable() {
    return (
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
                        {teacherLoadRows.map((row) => (
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}