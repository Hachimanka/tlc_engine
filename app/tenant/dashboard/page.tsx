import HeaderTenant from "@/components/Global/HeaderTenant";
import SidePanel from "@/components/Features/Tenant/SidePanel";
import TenantRolePermissionsPanel from "@/components/Features/Tenant/TenantRolePermissionsPanel";

export default function Dashboard() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <HeaderTenant />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SidePanel />
        <section className="min-w-0 flex-1 overflow-hidden bg-[var(--color-background)] p-6">
          <TenantRolePermissionsPanel />
        </section>
      </div>
    </main>
  );
}
