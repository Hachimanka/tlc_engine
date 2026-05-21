"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";
import { TesdaMetricCard, TesdaPageShell, TesdaSection } from "@/components/Features/TESDA/TesdaPageShell";

const reportRows = [
  { label: "Completion records", value: "27" },
  { label: "Certificates prepared", value: "18" },
  { label: "Batches reviewed", value: "7" },
  { label: "Compliance flags", value: "2" },
];

export default function TesdaReportsPage() {
  return (
    <TenantRoleLayout
      tenantType="Tesda"
      role="tesda_trainer"
      title="TESDA Trainer Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="tesda-certificates-reports"
      contentClassName="px-4 py-4 sm:px-6 lg:px-8"
    >
      <TesdaPageShell
        eyebrow="Reports and Certificates"
        title="Reports / Certificates"
        description="Review completion records, prepare certificates, and summarize TESDA batch progress for admin reporting."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reportRows.map((item) => (
            <TesdaMetricCard key={item.label} label={item.label} value={item.value} detail="Current reporting cycle" />
          ))}
        </div>

        <TesdaSection
          title="Report Snapshot"
          description="A quick summary for trainers and administrators who need batch completion visibility."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#d0d5dd] bg-[#f8fafc] p-4">
              <p className="text-sm font-semibold text-[var(--color-high-emphasis)]">Ready for release</p>
              <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">Completed trainees can be queued for certificates and completion reports.</p>
            </div>
            <div className="rounded-xl border border-[#d0d5dd] bg-[#f8fafc] p-4">
              <p className="text-sm font-semibold text-[var(--color-high-emphasis)]">Admin review</p>
              <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">Batch summaries are ready for review before final submission.</p>
            </div>
          </div>
        </TesdaSection>
      </TesdaPageShell>
    </TenantRoleLayout>
  );
}