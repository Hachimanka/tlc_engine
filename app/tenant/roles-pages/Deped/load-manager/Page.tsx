import DepartmentFacultyTable from "@/components/roles/Deped/load-manager/components/DepartmentFacultyTable";

export default function TenantPage() {
  return (
    <main className="min-h-screen bg-[#f5faf9] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        
        <DepartmentFacultyTable />
      </div>
    </main>
  );
}