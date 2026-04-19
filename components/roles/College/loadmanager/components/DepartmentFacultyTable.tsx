"use client";

import { useState } from "react";

type DeptFaculty = {
  id: number;
  name: string;
  position: string;
  subjects: number;
  load: number;
  maxLoad: number;
};

type Department = {
  name: string;
  chair: string;
  faculty: DeptFaculty[];
};

const DEPARTMENTS: Department[] = [
  {
    name: "Computer Science",
    chair: "Dr. Maria Santos",
    faculty: [
      { id: 1, name: "Dr. Maria Santos",   position: "Professor",        subjects: 3, load: 21, maxLoad: 21 },
      { id: 2, name: "Dr. Ana Reyes",      position: "Asst. Professor",  subjects: 2, load: 18, maxLoad: 21 },
      { id: 3, name: "Ms. Liza Flores",    position: "Instructor II",    subjects: 4, load: 24, maxLoad: 21 },
    ],
  },
  {
    name: "Information Technology",
    chair: "Prof. Juan Dela Cruz",
    faculty: [
      { id: 4, name: "Prof. Juan Dela Cruz", position: "Assoc. Professor", subjects: 4, load: 21, maxLoad: 21 },
      { id: 5, name: "Mr. Carlo Mendoza",    position: "Instructor I",     subjects: 3, load: 21, maxLoad: 21 },
    ],
  },
  {
    name: "Mathematics",
    chair: "Dr. Ramon Cruz",
    faculty: [
      { id: 6, name: "Dr. Ramon Cruz",  position: "Professor",   subjects: 2, load: 12, maxLoad: 21 },
    ],
  },
];

function LoadBar({ load, maxLoad }: { load: number; maxLoad: number }) {
  const pct = Math.min((load / maxLoad) * 100, 100);
  const color = load > maxLoad ? "bg-rose-500" : load === maxLoad ? "bg-teal-600" : "bg-teal-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-14 text-right ${load > maxLoad ? "text-rose-600" : "text-teal-700"}`}>
        {load}/{maxLoad}
      </span>
    </div>
  );
}

export default function DepartmentFacultyTable() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (dept: string) =>
    setCollapsed(prev => ({ ...prev, [dept]: !prev[dept] }));

  return (
    <div className="space-y-4">
      {DEPARTMENTS.map(dept => {
        const isOpen = !collapsed[dept.name];
        const totalLoad = dept.faculty.reduce((s, f) => s + f.load, 0);
        const overloaded = dept.faculty.filter(f => f.load > f.maxLoad).length;

        return (
          <div key={dept.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Department header */}
            <button
              onClick={() => toggle(dept.name)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 text-sm">{dept.name}</p>
                  <p className="text-xs text-gray-400">Chair: {dept.chair}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                  <span><span className="font-semibold text-gray-700">{dept.faculty.length}</span> Faculty</span>
                  <span><span className="font-semibold text-teal-700">{totalLoad}</span> Total hrs</span>
                  {overloaded > 0 && (
                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                      {overloaded} Overloaded
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Faculty rows */}
            {isOpen && (
              <div className="border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="px-6 py-2.5 text-left font-medium">Name</th>
                      <th className="px-4 py-2.5 text-left font-medium">Position</th>
                      <th className="px-4 py-2.5 text-center font-medium">Subjects</th>
                      <th className="px-4 py-2.5 text-left font-medium w-48">Load</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dept.faculty.map(f => (
                      <tr key={f.id} className="hover:bg-teal-50/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-800 text-sm">{f.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{f.position}</td>
                        <td className="px-4 py-3 text-center text-gray-700 text-sm font-medium">{f.subjects}</td>
                        <td className="px-4 py-3 w-48">
                          <LoadBar load={f.load} maxLoad={f.maxLoad} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}