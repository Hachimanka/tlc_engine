"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";
import { TesdaMetricCard, TesdaPageShell, TesdaSection } from "@/components/Features/TESDA/TesdaPageShell";

const assessmentMethods = [
  { method: "Written test", use: "Knowledge checks and safety rules" },
  { method: "Actual demonstration", use: "Task performance and tool use" },
  { method: "Oral questioning", use: "Explain steps, standards, and reasoning" },
  { method: "Portfolio", use: "Collect outputs, logbooks, and evidence" },
  { method: "Observation checklist", use: "Trainer observation during practical work" },
];

export default function TesdaAssessmentPage() {
  return (
    <TenantRoleLayout
      tenantType="Tesda"
      role="tesda_trainer"
      title="TESDA Trainer Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="tesda-competency-assessment"
      contentClassName="px-4 py-4 sm:px-6 lg:px-8"
    >
      <TesdaPageShell
        eyebrow="Competency Assessment"
        title="Competency Assessment"
        description="Manage competency checklists, evidence requirements, and assessment methods used in TESDA-style training."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TesdaMetricCard label="Methods" value="5" detail="Written, demo, oral, portfolio, observation" />
          <TesdaMetricCard label="Checklist Items" value="24" detail="Competency check items in the sample list" />
          <TesdaMetricCard label="Evidence Types" value="6" detail="Outputs accepted for verification" />
          <TesdaMetricCard label="Ready for Result" value="11" detail="Trainees prepared for assessment" />
        </div>

        <TesdaSection
          title="Assessment Methods"
          description="Use a method that matches the competency being measured and keep evidence simple and clear."
        >
          <div className="space-y-3">
            {assessmentMethods.map((item) => (
              <div key={item.method} className="rounded-xl border border-[#d0d5dd] bg-[#f8fafc] p-4">
                <p className="font-medium text-[var(--color-high-emphasis)]">{item.method}</p>
                <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">{item.use}</p>
              </div>
            ))}
          </div>
        </TesdaSection>
      </TesdaPageShell>
    </TenantRoleLayout>
  );
}