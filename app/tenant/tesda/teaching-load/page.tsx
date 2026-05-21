"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";
import { TesdaMetricCard, TesdaPageShell, TesdaSection } from "@/components/Features/TESDA/TesdaPageShell";

const batches = [
  { batch: "Batch 2026-A", qualification: "Shielded Metal Arc Welding NC II", trainer: "A. Reyes", weeklyHours: "18", sessions: "6" },
  { batch: "Batch 2026-W1", qualification: "Bread and Pastry Production NC II", trainer: "M. Santos", weeklyHours: "14", sessions: "4" },
  { batch: "Batch 2026-N1", qualification: "Electrical Installation NC II", trainer: "J. Cruz", weeklyHours: "16", sessions: "5" },
];

export default function TesdaTeachingLoadPage() {
  return (
    <TenantRoleLayout
      tenantType="Tesda"
      role="tesda_trainer"
      title="TESDA Trainer Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="tesda-trainers"
      contentClassName="px-4 py-4 sm:px-6 lg:px-8"
    >
      <TesdaPageShell
        eyebrow="Teaching Load"
        title="Teaching Load"
        description="Review assigned batches, qualifications, weekly training hours, and session counts."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TesdaMetricCard label="Assigned Batches" value="3" detail="Batches currently under trainer coverage" />
          <TesdaMetricCard label="Weekly Hours" value="48" detail="Total weekly trainer hours" />
          <TesdaMetricCard label="Training Sessions" value="15" detail="Scheduled delivery sessions" />
          <TesdaMetricCard label="Hands-on Labs" value="9" detail="Laboratory or practical sessions" />
        </div>

        <TesdaSection
          title="Assigned Batches and Courses"
          description="Trainer load depends on batch count, course duration, training hours, and laboratory activities."
        >
          <div className="overflow-x-auto rounded-xl border border-[#d0d5dd]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 font-semibold">Qualification / Course</th>
                  <th className="px-4 py-3 font-semibold">Trainer</th>
                  <th className="px-4 py-3 font-semibold">Weekly Hours</th>
                  <th className="px-4 py-3 font-semibold">Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0] bg-white">
                {batches.map((batch) => (
                  <tr key={batch.batch}>
                    <td className="px-4 py-3 font-medium text-[var(--color-high-emphasis)]">{batch.batch}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{batch.qualification}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{batch.trainer}</td>
                    <td className="px-4 py-3 text-[var(--color-high-emphasis)]">{batch.weeklyHours}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{batch.sessions}</td>
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