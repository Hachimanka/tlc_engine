"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import DepartmentFacultyTable from "@/components/Features/Deped/manage-load/components/DepartmentFacultyTable";
import { ICON_SVGS } from "@/public/icons";

export default function TenantPage() {
  return (
    <TenantRoleLayout
      tenantType="Deped"
      role="load-manager"
      title="Deped Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="deped-teacher-load-assignment"
      contentClassName="px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-none space-y-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
            Subject Management
          </h1>
        </div>

        <DepartmentFacultyTable />
      </div>
    </TenantRoleLayout>
  );
}
