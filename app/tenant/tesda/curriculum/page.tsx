"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";
import { TesdaMetricCard, TesdaPageShell, TesdaSection } from "@/components/Features/TESDA/TesdaPageShell";

const competencyRows = [
  { type: "Basic", competency: "Work effectively in a team environment", outcome: "Communicate and collaborate on training tasks", activities: "Group exercises, reflection logs", criteria: "Participates and contributes consistently", hours: "12" },
  { type: "Common", competency: "Practice occupational safety and health", outcome: "Apply safe work procedures", activities: "Lab inspection, safety briefing", criteria: "Follows safety standards without prompting", hours: "16" },
  { type: "Core", competency: "Perform arc welding tasks", outcome: "Produce welds that meet the required standard", activities: "Actual welding demo, correction drills", criteria: "Passes quality and safety checklist", hours: "96" },
  { type: "Institutional", competency: "Use institution-specific equipment and logbooks", outcome: "Complete local compliance and documentation", activities: "Tool check, logbook submission", criteria: "Submits complete training records", hours: "20" },
];

export default function TesdaCurriculumPage() {
  return (
    <TenantRoleLayout
      tenantType="Tesda"
      role="tesda_trainer"
      title="TESDA Trainer Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="tesda-qualifications"
      contentClassName="px-4 py-4 sm:px-6 lg:px-8"
    >
      <TesdaPageShell
        eyebrow="Competency-Based Curriculum"
        title="Competency-Based Curriculum"
        description="Build the curriculum around TESDA Training Regulations with basic, common, core, and institutional competencies."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TesdaMetricCard label="Competency Groups" value="4" detail="Basic, common, core, and institutional" />
          <TesdaMetricCard label="Learning Outcomes" value="16" detail="Outcomes defined across competency blocks" />
          <TesdaMetricCard label="Training Hours" value="144" detail="Planned curriculum hours in this sample" />
          <TesdaMetricCard label="Assessment Links" value="100%" detail="Each competency ties to assessment evidence" />
        </div>

        <TesdaSection
          title="Competency Matrix"
          description="Each row captures the learning outcome, activities, performance criteria, and training hours."
        >
          <div className="overflow-x-auto rounded-xl border border-[#d0d5dd]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Competency</th>
                  <th className="px-4 py-3 font-semibold">Learning Outcome</th>
                  <th className="px-4 py-3 font-semibold">Required Activities</th>
                  <th className="px-4 py-3 font-semibold">Performance Criteria</th>
                  <th className="px-4 py-3 font-semibold">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0] bg-white">
                {competencyRows.map((row) => (
                  <tr key={row.competency}>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.type}</td>
                    <td className="px-4 py-3 font-medium text-[var(--color-high-emphasis)]">{row.competency}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.outcome}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.activities}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.criteria}</td>
                    <td className="px-4 py-3 text-[var(--color-high-emphasis)]">{row.hours}</td>
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