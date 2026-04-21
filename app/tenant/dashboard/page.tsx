import HeaderTenant from "@/components/Global/HeaderTenant";
import SidePanel from "@/components/tenant-page/SidePanel";

export default function Dashboard() {
  return (
    <main className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <HeaderTenant />
      <div className="flex flex-1">
        <SidePanel />
        <div className="flex-1 bg-[var(--color-background)]" />
      </div>
    </main>
  );
}
