"use client";

import { useState } from "react";

export type Faculty = {
  id: number;
  name: string;
  department: string;
  position: string;
  regularLoad: number;
  extraLoad: number;
  totalLoad: number;
  status: "Active" | "Inactive" | "On Leave";
};

const MOCK_FACULTY: Faculty[] = [
  { id: 1, name: "Dr. Maria Santos",   department: "Computer Science", position: "Professor",        regularLoad: 18, extraLoad: 3,  totalLoad: 21, status: "Active"   },
  { id: 2, name: "Prof. Juan Dela Cruz",department: "Information Technology", position: "Assoc. Professor", regularLoad: 15, extraLoad: 6,  totalLoad: 21, status: "Active"   },
  { id: 3, name: "Dr. Ana Reyes",      department: "Computer Science", position: "Asst. Professor",  regularLoad: 18, extraLoad: 0,  totalLoad: 18, status: "On Leave" },
  { id: 4, name: "Mr. Carlo Mendoza",  department: "Information Technology", position: "Instructor I",       regularLoad: 21, extraLoad: 0,  totalLoad: 21, status: "Active"   },
  { id: 5, name: "Ms. Liza Flores",    department: "Computer Science", position: "Instructor II",      regularLoad: 21, extraLoad: 3,  totalLoad: 24, status: "Active"   },
  { id: 6, name: "Dr. Ramon Cruz",     department: "Mathematics",       position: "Professor",        regularLoad: 12, extraLoad: 0,  totalLoad: 12, status: "Inactive" },
];

const STATUS_STYLES: Record<Faculty["status"], string> = {
  Active:    "bg-teal-100 text-teal-800",
  Inactive:  "bg-gray-100 text-gray-600",
  "On Leave":"bg-amber-100 text-amber-700",
};

interface FacultyTableProps {
  onSelectFaculty?: (faculty: Faculty) => void;
  onAddFaculty?: () => void;
}

export default function FacultyTable({ onSelectFaculty, onAddFaculty }: FacultyTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const departments = ["All", ...Array.from(new Set(MOCK_FACULTY.map(f => f.department)))];

  const filtered = MOCK_FACULTY.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                        f.department.toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptFilter === "All" || f.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Faculty Load Overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">Academic Year 2024–2025 · Semester 2</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search faculty..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-44"
            />
          </div>
          {/* Department filter */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-600"
          >
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
          {/* Add button */}
          <button
            onClick={onAddFaculty}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Faculty
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3 text-left font-medium">Faculty Name</th>
              <th className="px-4 py-3 text-left font-medium">Department</th>
              <th className="px-4 py-3 text-left font-medium">Position</th>
              <th className="px-4 py-3 text-center font-medium">Regular Load</th>
              <th className="px-4 py-3 text-center font-medium">Extra Load</th>
              <th className="px-4 py-3 text-center font-medium">Total</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-gray-400 text-xs">
                  No faculty found.
                </td>
              </tr>
            ) : (
              filtered.map(faculty => (
                <tr key={faculty.id} className="hover:bg-teal-50/40 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {faculty.name.split(" ").slice(-1)[0][0]}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{faculty.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 text-xs">{faculty.department}</td>
                  <td className="px-4 py-3.5 text-gray-600 text-xs">{faculty.position}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-gray-700 font-medium text-sm">{faculty.regularLoad}</span>
                    <span className="text-gray-400 text-xs ml-0.5">hrs</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`font-medium text-sm ${faculty.extraLoad > 0 ? "text-amber-600" : "text-gray-400"}`}>
                      {faculty.extraLoad > 0 ? `+${faculty.extraLoad}` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`font-semibold text-sm ${faculty.totalLoad > 21 ? "text-rose-600" : "text-teal-700"}`}>
                      {faculty.totalLoad}
                    </span>
                    <span className="text-gray-400 text-xs ml-0.5">hrs</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[faculty.status]}`}>
                      {faculty.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => onSelectFaculty?.(faculty)}
                      className="text-teal-700 hover:text-teal-900 text-xs font-medium hover:underline"
                    >
                      View Load
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
        <span>Showing <span className="font-medium text-gray-700">{filtered.length}</span> of {MOCK_FACULTY.length} faculty</span>
        <div className="flex items-center gap-4">
          <span>Total active: <span className="font-medium text-teal-700">{MOCK_FACULTY.filter(f => f.status === "Active").length}</span></span>
          <span>Overloaded: <span className="font-medium text-rose-600">{MOCK_FACULTY.filter(f => f.totalLoad > 21).length}</span></span>
        </div>
      </div>
    </div>
  );
}