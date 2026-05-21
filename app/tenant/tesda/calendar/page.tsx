"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";
import { TesdaMetricCard, TesdaPageShell, TesdaSection } from "@/components/Features/TESDA/TesdaPageShell";

const calendarRows = [
  {
    program: "Shielded Metal Arc Welding NC II",
    schedule: "Full-time",
    start: "2026-06-03",
    end: "2026-08-21",
    hours: "240",
    batch: "Batch 2026-A",
  },
  {
    program: "Bread and Pastry Production NC II",
    schedule: "Weekend",
    start: "2026-06-07",
    end: "2026-10-18",
    hours: "176",
    batch: "Batch 2026-W1",
  },
  {
    program: "Electrical Installation NC II",
    schedule: "Night class",
    start: "2026-06-09",
    end: "2026-09-29",
    hours: "216",
    batch: "Batch 2026-N1",
  },
  {
    program: "Food and Beverage Services NC II",
    schedule: "Modular",
    start: "2026-06-15",
    end: "2026-11-07",
    hours: "320",
    batch: "Batch 2026-M1",
  },
];

export default function TesdaCalendarPage() {
  return (
    <TenantRoleLayout
      tenantType="Tesda"
      role="tesda_trainer"
      title="TESDA Trainer Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="tesda-training-batches"
      contentClassName="px-4 py-4 sm:px-6 lg:px-8"
    >
      <TesdaPageShell
        eyebrow="Training Calendar"
        title="Training Calendar"
        description="Plan TESDA programs around required training hours instead of a semester calendar. Track full-time, part-time, weekend, night, and modular delivery in one simple view."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TesdaMetricCard label="Delivery Modes" value="5" detail="Full-time, part-time, weekend, night, modular" />
          <TesdaMetricCard label="Active Batches" value="12" detail="Programs currently running or scheduled" />
          <TesdaMetricCard label="Total Hours" value="952" detail="Scheduled training hours this cycle" />
          <TesdaMetricCard label="Next Start" value="Jun 03" detail="Earliest batch start date" />
        </div>

        <TesdaSection
          title="Batch Schedule"
          description="Each training program shows its required hours, schedule type, and batch window."
        >
          <div className="overflow-x-auto rounded-xl border border-[#d0d5dd]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Schedule</th>
                  <th className="px-4 py-3 font-semibold">Start Date</th>
                  <th className="px-4 py-3 font-semibold">End Date</th>
                  <th className="px-4 py-3 font-semibold">Training Hours</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0] bg-white">
                {calendarRows.map((row) => (
                  <tr key={`${row.program}-${row.batch}`}>
                    <td className="px-4 py-3 font-medium text-[var(--color-high-emphasis)]">{row.program}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.schedule}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.start}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.end}</td>
                    <td className="px-4 py-3 text-[var(--color-high-emphasis)]">{row.hours}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.batch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TesdaSection>
      </TesdaPageShell>
    </TenantRoleLayout>
  );
}