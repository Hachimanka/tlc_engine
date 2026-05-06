"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import DepartmentListTable from "@/components/Features/Deped/load-admin/components/DepartmentListTable";
import { ICON_SVGS } from "@/public/icons";

export default function TenantPage() {
  return (
    <TenantRoleLayout
      tenantType="Deped"
      role="load-admin"
      title="Deped Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="deped-department-load"
      contentClassName="px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-none space-y-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
            All Departments View
          </h1>
        </div>

        <DepartmentListTable />
      </div>
    </TenantRoleLayout>
  );
}
