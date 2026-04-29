 "use client";

import { useState } from "react";
import HeaderTenant from "@/components/Global/HeaderTenant";
import Employee from "@/components/Features/Tenant/Employee";
import Policies from "@/components/Features/Tenant/Policies";
import SidePanel from "@/components/Features/Tenant/SidePanel";
import TenantRolePermissionsPanel from "@/components/Features/Tenant/TenantRolePermissionsPanel";
import { type TenantAdminView } from "@/config";

export default function TenantPage() {
  const [activeView, setActiveView] = useState<TenantAdminView>("policies");

  const content = {
    policies: <Policies />,
    "manage-users": <TenantRolePermissionsPanel />,
    employees: <Employee />,
  }[activeView];

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <HeaderTenant />
      <div className="flex min-h-0 flex-1">
        <SidePanel activeView={activeView} onViewChange={setActiveView} />
        <section className="min-w-0 flex-1 bg-[var(--color-background)] p-6">
          {content}
        </section>
      </div>
    </main>
  );
}
