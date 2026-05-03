"use client";

import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { use } from "react";
import Link from "next/link"; // 1. Import Link
import DepartmentFacultyTable from "@/components/Features/Deped/load-admin/components/DepartmentFacultyTable";
import { ICON_SVGS } from "@/public/icons";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const departmentName =
    id === "dept-1" ? "Filipino Department" : "General Department";

  return (
    <TenantRoleLayout
      tenantType="Deped"
      role="load-admin"
      title="Deped Menu"
      iconSvg={ICON_SVGS.menu}
      contentClassName="px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-none space-y-4">
        {/* 2. Back Button Section */}
        <div className="mb-2">
          <Link
            href="/tenant/deped/load-admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-light-primary)] transition-colors"
          >
            <span className="text-lg">←</span> Back to Departments
          </Link>
        </div>

        <div>
          <div>
            <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
              Teaching Load Assignment
            </h1>
          </div>
          <div className="mt-4">
            <DepartmentFacultyTable departmentName={departmentName} />
          </div>
        </div>
      </div>
    </TenantRoleLayout>
  );
}
