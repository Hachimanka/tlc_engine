"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";
import { TesdaMetricCard, TesdaPageShell, TesdaSection } from "@/components/Features/TESDA/TesdaPageShell";

const workloadItems = [
  { task: "Session planning", status: "Complete", hours: "4" },
  { task: "Teaching and facilitation", status: "In progress", hours: "18" },
  { task: "Demonstration and mentoring", status: "Scheduled", hours: "6" },
  { task: "Hands-on supervision", status: "Scheduled", hours: "8" },
  { task: "Checking trainee outputs", status: "In progress", hours: "5" },
  { task: "Attendance recording", status: "Daily", hours: "2" },
  { task: "Assessment preparation", status: "Scheduled", hours: "4" },
  { task: "Tool / equipment checking", status: "Daily", hours: "3" },
  { task: "Training documentation", status: "Weekly", hours: "2" },
];

export default function TesdaWorkloadPage() {
  return (
    <TenantRoleLayout
      tenantType="Tesda"
      role="tesda_trainer"
      title="TESDA Trainer Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="tesda-training-hours-compliance"
      contentClassName="px-4 py-4 sm:px-6 lg:px-8"
    >
      <TesdaPageShell
        eyebrow="Workload Tracking"
        title="Workload"
        description="Track the full trainer workload: planning, teaching, demonstrations, supervision, output checking, attendance, assessments, equipment checks, and documentation."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TesdaMetricCard label="Planned Hours" value="54" detail="Work planned for the current cycle" />
          <TesdaMetricCard label="Teaching Hours" value="18" detail="Direct trainer delivery time" />
          <TesdaMetricCard label="Support Tasks" value="5" detail="Prep, checking, and documentation tasks" />
          <TesdaMetricCard label="Compliance" value="92%" detail="On-track workload completion" />
        </div>

        <TesdaSection
          title="Trainer Workload Breakdown"
          description="A simple tracker for the activities a TESDA trainer performs each week."
        >
          <div className="space-y-3">
            {workloadItems.map((item) => (
              <div
                key={item.task}
                className="grid gap-3 rounded-xl border border-[#d0d5dd] bg-[#f8fafc] p-4 md:grid-cols-[1.5fr_120px_80px] md:items-center"
              >
                <div>
                  <p className="font-medium text-[var(--color-high-emphasis)]">{item.task}</p>
                  <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">Trainer activity captured for TESDA workload monitoring.</p>
                </div>
                <div className="text-sm font-semibold text-[var(--color-high-emphasis)]">{item.status}</div>
                <div className="text-sm font-semibold text-[var(--color-primary)]">{item.hours} hrs</div>
              </div>
            ))}
          </div>
        </TesdaSection>
      </TesdaPageShell>
    </TenantRoleLayout>
  );
}