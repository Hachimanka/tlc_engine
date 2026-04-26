import Employee from "@/components/Features/Tenant/Employee";
import SidePanel from "@/components/Features/Tenant/SidePanel";
import HeaderTenant from "@/components/Global/HeaderTenant";

export default function EmployeesPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <HeaderTenant />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SidePanel />
        <section className="min-w-0 flex-1 overflow-hidden bg-[var(--color-background)] p-6">
          <Employee />
        </section>
      </div>
    </main>
  );
}
