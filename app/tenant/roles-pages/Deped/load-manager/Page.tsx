import DepartmentFacultyTable from "@/components/roles/Deped/load-manager/components/DepartmentFacultyTable";

export default function TenantPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-2 font-ibm-plex-sans">
        <h1 className="text-heading-h3 text-[var(--color-primary)]">
          Teaching Load Assignment
        </h1>
        <DepartmentFacultyTable />
      </div>
    </main>
  );
}