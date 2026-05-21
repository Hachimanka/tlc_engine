"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";
import { TesdaMetricCard, TesdaPageShell, TesdaSection } from "@/components/Features/TESDA/TesdaPageShell";

const resultRows = [
  { trainee: "Maria Dela Cruz", competency: "Perform arc welding tasks", result: "Competent", method: "Actual demonstration", date: "2026-07-18" },
  { trainee: "Juan Santos", competency: "Practice occupational safety and health", result: "Not Yet Competent", method: "Observation checklist", date: "2026-07-19" },
  { trainee: "Liza Garcia", competency: "Use institution-specific equipment", result: "Competent", method: "Portfolio", date: "2026-07-21" },
];

export default function TesdaAssessmentResultsPage() {
  return (
    <TenantRoleLayout
      tenantType="Tesda"
      role="tesda_trainer"
      title="TESDA Trainer Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="tesda-assessment-results"
      contentClassName="px-4 py-4 sm:px-6 lg:px-8"
    >
      <TesdaPageShell
        eyebrow="Assessment Results"
        title="Assessment Results"
        description="Submit competency results using Competent or Not Yet Competent. Results can be based on written tests, demonstrations, oral questioning, portfolios, and observation checklists."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TesdaMetricCard label="Competent" value="19" detail="Trainees marked Competent" />
          <TesdaMetricCard label="Not Yet Competent" value="4" detail="Trainees needing reassessment" />
          <TesdaMetricCard label="Pending" value="3" detail="Results waiting for submission" />
          <TesdaMetricCard label="Methods Used" value="5" detail="Assessment methods recorded" />
        </div>

        <TesdaSection
          title="Assessment Result Register"
          description="Use the register to confirm each trainee's competency outcome and the method used."
        >
          <div className="overflow-x-auto rounded-xl border border-[#d0d5dd]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Trainee</th>
                  <th className="px-4 py-3 font-semibold">Competency</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Assessment Method</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0] bg-white">
                {resultRows.map((row) => (
                  <tr key={`${row.trainee}-${row.competency}`}>
                    <td className="px-4 py-3 font-medium text-[var(--color-high-emphasis)]">{row.trainee}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.competency}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-high-emphasis)]">{row.result}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.method}</td>
                    <td className="px-4 py-3 text-[var(--color-low-emphasis)]">{row.date}</td>
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