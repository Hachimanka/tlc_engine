"use client";

import { use } from "react";
import Link from "next/link";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import DepartmentFacultyTable from "@/components/Features/Deped/load-admin/components/DepartmentFacultyTable";
import { ICON_SVGS } from "@/public/icons";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ departmentName?: string }>;
};

export default function Page({ params, searchParams }: PageProps) {
  use(params);
  const { departmentName } = use(searchParams);
  const displayDepartmentName = departmentName || "General Department";

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
        <div className="mb-2">
          <Link
            href="/tenant/deped/load-admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-light-primary)]"
          >
            <span aria-hidden="true" className="text-lg">
              &larr;
            </span>
            Back to Departments
          </Link>
        </div>

        <div>
          <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
            Teaching Load Assignment
          </h1>
          <div className="mt-4">
            <DepartmentFacultyTable departmentName={displayDepartmentName} />
          </div>
        </div>
      </div>
    </TenantRoleLayout>
  );
}
