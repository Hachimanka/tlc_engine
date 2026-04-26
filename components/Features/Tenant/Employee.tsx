"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { tenantEmployees } from "./employeeData";

export default function Employee() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");

  const departments = useMemo(
    () => ["All Departments", ...Array.from(new Set(tenantEmployees.map((employee) => employee.department)))],
    [],
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tenantEmployees.filter((employee) => {
      const matchesDepartment =
        departmentFilter === "All Departments" || employee.department === departmentFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        employee.id.toLowerCase().includes(normalizedSearch) ||
        employee.name.toLowerCase().includes(normalizedSearch) ||
        employee.email.toLowerCase().includes(normalizedSearch) ||
        employee.department.toLowerCase().includes(normalizedSearch) ||
        employee.employmentType.toLowerCase().includes(normalizedSearch);

      return matchesDepartment && matchesSearch;
    });
  }, [departmentFilter, search]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="text-[28px] font-bold leading-none text-[var(--color-high-emphasis)]">
          Employees
        </h1>

        <button
          type="button"
          className="mt-[52px] inline-flex h-9 items-center rounded-md bg-[var(--color-primary)] px-3 text-xs font-medium text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        >
          + Add Employee
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
          <span className="sr-only">Search employees</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee, email, ID, or department..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
          />
        </label>

        <label className="relative flex h-10 items-center rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
          <span className="sr-only">Filter by department</span>
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="h-full min-w-[220px] appearance-none bg-transparent pr-8 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
          >
            {departments.map((department) => (
              <option key={department}>{department}</option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--color-low-emphasis)]"
            aria-hidden="true"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--color-default)] bg-white">
        <div className="h-full overflow-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[var(--color-primary)] text-white">
              <tr>
                <th className="w-[18%] px-5 py-4 text-sm font-semibold">ID No.</th>
                <th className="w-[22%] px-5 py-4 text-sm font-semibold">Name</th>
                <th className="w-[26%] px-5 py-4 text-sm font-semibold">Email</th>
                <th className="w-[20%] px-5 py-4 text-sm font-semibold">Department</th>
                <th className="w-[14%] px-5 py-4 text-sm font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-default)] bg-white">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={`transition hover:bg-[#ecf8f6] ${
                      index === 0 ? "bg-[#dff3f1]" : ""
                    }`}
                  >
                    <td className="px-5 py-4 text-sm font-medium text-[var(--color-high-emphasis)]">
                      {employee.id}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                      {employee.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                      {employee.email}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-high-emphasis)]">
                      {employee.department}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[var(--color-primary)]">
                      {employee.employmentType}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
