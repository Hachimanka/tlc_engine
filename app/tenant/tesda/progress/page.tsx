"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";
import { TesdaMetricCard, TesdaPageShell, TesdaSection } from "@/components/Features/TESDA/TesdaPageShell";

const traineeRows = [
  { name: "Maria Dela Cruz", batch: "Batch 2026-A", attendance: "96%", progress: "On track", notes: "Completed welding safety checklist" },
  { name: "Juan Santos", batch: "Batch 2026-W1", attendance: "88%", progress: "Needs follow-up", notes: "Pending output review" },
  { name: "Liza Garcia", batch: "Batch 2026-N1", attendance: "100%", progress: "Competency ready", notes: "Ready for assessment" },
];

export default function TesdaProgressPage() {
  return (
    <TenantRoleLayout
      tenantType="Tesda"
      role="tesda_trainer"
      title="TESDA Trainer Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="tesda-trainee-records"
      contentClassName="px-4 py-4 sm:px-6 lg:px-8"
    >
      <TesdaPageShell
        eyebrow="Trainee Progress"
        title="Trainee Progress"
        description="Update attendance, upload training materials, check outputs, and follow trainee competency status in one place."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TesdaMetricCard label="Trainees" value="28" detail="Active trainees across all batches" />
          <TesdaMetricCard label="Attendance" value="95%" detail="Average attendance rate" />
          <TesdaMetricCard label="Outputs Reviewed" value="64" detail="Submissions already checked" />
          <TesdaMetricCard label="Ready for Assessment" value="11" detail="Trainees with complete evidence" />
        </div>

        <TesdaSection
          title="Trainee Tracker"
          description="A simple view for attendance, materials, assessment evidence, and overall progress."
        >
          <div className="overflow-x-auto rounded-xl border border-[#d0d5dd]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Trainee</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 font-semibold">Attendance</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Trainer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0] bg-white">
                {traineeRows.map((trainee) => (
                  <tr key={trainee.name}>
                    <td className="px-4 py-3 font-medium text-[var(--color-high-emphasis)]">{trainee.name}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{trainee.batch}</td>
                    <td className="px-4 py-3 text-[var(--color-high-emphasis)]">{trainee.attendance}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{trainee.progress}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{trainee.notes}</td>
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