"use client";

import { useState } from "react";
import { Search, Plus, Filter } from "lucide-react";
import CreateSubjectForm from "./CreateSubjectForm";

type Subject = {
  id: number;
  title: string;
  code: string;
  department: string;
  lecHours: number;
  labHours: number;
  units: number;
  dateCreated: string;
  status: "Pending" | "Approved" | "Rejected";
  description: string;
  level: string;
};

const mockSubjects: Subject[] = [
  { id: 1, title: "Data Structures and Algorithm", code: "CPE 264", department: "Computer Engineering", lecHours: 3, labHours: 3, units: 4, dateCreated: "3/20/2026", status: "Pending", description: "Description", level: "Second Year" },
  { id: 2, title: "Computer Networks and Security", code: "CPE 364", department: "Computer Engineering", lecHours: 3, labHours: 3, units: 4, dateCreated: "3/20/2026", status: "Approved", description: "Description", level: "Third Year" },
  { id: 3, title: "Fundamentals of Mixed Signals and Sensors", code: "CPE 368", department: "Computer Engineering", lecHours: 3, labHours: 3, units: 4, dateCreated: "3/20/2026", status: "Rejected", description: "Description", level: "Third Year" },
];

const statusColor: Record<Subject["status"], string> = {
  Pending: "text-orange-500",
  Approved: "text-[#006B5F]",
  Rejected: "text-red-500",
};

export default function SubjectManagementTable() {
  const [search, setSearch] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
  const [showForm, setShowForm] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [levelFilter, setLevelFilter] = useState("All Levels");

  const filtered = subjects.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = departmentFilter === "All Departments" || s.department === departmentFilter;
    const matchLevel = levelFilter === "All Levels" || s.level === levelFilter;
    return matchSearch && matchDept && matchLevel;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1F2125] mb-6">Subject Management</h1>

      {/* Show form or table */}
      {showForm ? (
        <CreateSubjectForm
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            setSubjects((prev) => [...prev, { id: Date.now(), ...data }]);
            setShowForm(false);
          }}
        />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[500px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717182]" />
              <input
                type="text"
                placeholder="Search subject by code or name...."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md border border-[#C5EEEA] bg-white text-sm text-[#1F2125] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
              />
            </div>

            {/* Filter icon */}
            <button className="p-2 border border-[#C5EEEA] rounded-md bg-white text-[#717182] hover:bg-[#C5EEEA]/20">
              <Filter size={16} />
            </button>

            {/* Department filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white text-[#1F2125] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
            >
              <option>All Departments</option>
              <option>Computer Engineering</option>
              <option>Civil Engineering</option>
              <option>Electrical Engineering</option>
            </select>

            {/* Level filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white text-[#1F2125] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
            >
              <option>All Levels</option>
              <option>First Year</option>
              <option>Second Year</option>
              <option>Third Year</option>
              <option>Fourth Year</option>
            </select>

            {/* Create button */}
            <button
              onClick={() => setShowForm(true)}
              className="ml-auto flex items-center gap-2 bg-[#006B5F] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005a4f] transition-colors"
            >
              <Plus size={16} />
              Create Subject
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#C5EEEA] overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1.5fr_80px_80px_70px_110px_100px_1.5fr] bg-[#006B5F] text-white text-xs font-semibold px-4 py-3">
              <span>Subject Title</span>
              <span>Subject Code</span>
              <span>Department</span>
              <span>Lec Hours</span>
              <span>Lab Hours</span>
              <span>Units</span>
              <span>Date Created</span>
              <span>Status</span>
              <span>Description</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center text-[#717182] text-sm">No subjects found.</div>
            ) : (
              filtered.map((subject, i) => (
                <div
                  key={subject.id}
                  className={`grid grid-cols-[2fr_1fr_1.5fr_80px_80px_70px_110px_100px_1.5fr] px-4 py-3 text-sm text-[#1F2125] border-b border-[#C5EEEA]/60 items-center
                    ${i % 2 === 1 ? "bg-[#C5EEEA]/10" : "bg-white"} hover:bg-[#C5EEEA]/20 transition-colors`}
                >
                  <span>{subject.title}</span>
                  <span>{subject.code}</span>
                  <span>{subject.department}</span>
                  <span>{subject.lecHours}</span>
                  <span>{subject.labHours}</span>
                  <span>{subject.units}</span>
                  <span className="text-[#717182]">{subject.dateCreated}</span>
                  <span className={`font-medium ${statusColor[subject.status]}`}>{subject.status}</span>
                  <span className="text-[#717182] truncate">{subject.description}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}