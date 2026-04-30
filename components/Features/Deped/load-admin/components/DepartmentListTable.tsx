"use client";

import { useState } from "react";

// Updated Type to match your request
type DepartmentRow = {
  id: string;
  departmentName: string;
  departmentHead: string;
};

const departmentRows: DepartmentRow[] = [
  {
    id: "dept-1",
    departmentName: "Filipino Department",
    departmentHead: "John Michael Montero Inoc",
  },
  {
    id: "dept-2",
    departmentName: "Mathematics Department",
    departmentHead: "Michael Montero",
  },
  {
    id: "dept-3",
    departmentName: "Science Department",
    departmentHead: "Michael Inoc",
  },
  {
    id: "dept-4",
    departmentName: "English Department",
    departmentHead: "John Michael",
  },
];

export default function DepartmentFacultyTable() {
  const [, setIsAddFacultyOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-[18px] border border-[color:var(--color-default)] bg-[var(--color-card)] shadow-level-1">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--color-default)] px-4 py-3 sm:px-5">
          <div>
            <h1 className="text-2xl text-[var(--color-high-emphasis)]">
              Departments Overview
            </h1>
            <p className="mt-1 text-body-small text-[var(--color-low-emphasis)]">
              Click a row to view specific department details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddFacultyOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-label-button text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)]"
          >
            <span className="text-base leading-none">+</span>
            Add Department
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                  Department Name
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                  Department Head in Charge
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-default)] bg-white">
              {departmentRows.map((dept) => {
                return (
                  <tr
                    key={dept.id}
                    className="group cursor-pointer transition-colors hover:bg-[var(--color-default)]/35"
                  >
                    <td className="p-0" colSpan={2}>
                      <a
                        href={`/tenant/deped/load-admin/facultytable/${dept.id}`}
                        className="grid grid-cols-2 w-full px-4 py-3 no-underline"
                      >
                        <span className="text-body-small font-semibold text-[var(--color-high-emphasis)]">
                          {dept.departmentName}
                        </span>
                        <span className="text-body-small text-[var(--color-low-emphasis)]">
                          {dept.departmentHead}
                        </span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
