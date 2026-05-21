  "use client";

import TeachingScheduleGrid from "@/components/Features/TeachingScheduleGrid";
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

export default function TeachingLoadTable({ rows = teacherLoadRows }: TeachingLoadTableProps) {
  return (
    <div className="space-y-4">
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

      <TeachingScheduleGrid rows={rows} timeSlots={collegeScheduleTimeSlots} />
    </div>
  );
}
