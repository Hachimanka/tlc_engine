"use client";

import { useState } from "react";
import { Filter, Plus, X, CheckCircle } from "lucide-react";
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
  { id: 1, title: "Data Structures and Algorithm", code: "CPE 264", department: "Computer Engineering", lecHours: 3, labHours: 3, units: 4, dateCreated: "3/20/2026", status: "Pending",  description: "Description", level: "Second Year" },
  { id: 2, title: "Computer Networks and Security", code: "CPE 364", department: "Computer Engineering", lecHours: 3, labHours: 3, units: 4, dateCreated: "3/20/2026", status: "Approved", description: "Description", level: "Third Year"  },
  { id: 3, title: "Fundamentals of Mixed Signals and Sensors", code: "CPE 368", department: "Computer Engineering", lecHours: 3, labHours: 3, units: 4, dateCreated: "3/20/2026", status: "Rejected", description: "Description", level: "Third Year"  },
];

const statusColor: Record<Subject["status"], string> = {
  Pending:  "text-orange-400",
  Approved: "text-[#006B5F]",
  Rejected: "text-red-500",
};

const departmentOptions = ["All Departments", "Computer Engineering", "Civil Engineering", "Electrical Engineering"];
const levelOptions = ["All Levels", "First Year", "Second Year", "Third Year", "Fourth Year"];

export default function SubjectManagementTable() {
  const [search, setSearch] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [levelFilter, setLevelFilter] = useState("All Levels");
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<Subject | null>(null);

  const filtered = subjects.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase());
    const matchDept  = departmentFilter === "All Departments" || s.department === departmentFilter;
    const matchLevel = levelFilter === "All Levels" || s.level === levelFilter;
    return matchSearch && matchDept && matchLevel;
  });

  const handleSave = (data: Omit<Subject, "id">) => {
    // Store the data and show confirmation modal
    setPendingData({ id: Date.now(), ...data });
    setShowForm(false);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (!pendingData) return;
    setSubjects((prev) => [...prev, pendingData]);
    setPendingData(null);
    setShowConfirm(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1F2125] mb-6">Subject Management</h1>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px] flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-gray-400" stroke="currentColor" strokeWidth={1.8}>
            <path d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="search"
            placeholder="Search subject by code or name...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        <button className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50">
          <Filter size={16} />
        </button>

        <div className="relative flex items-center rounded-lg border border-gray-200 bg-white px-3 h-10">
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
            className="appearance-none bg-transparent pr-6 text-sm font-medium text-[#1F2125] outline-none">
            {departmentOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400" stroke="currentColor" strokeWidth={1.8}>
            <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="relative flex items-center rounded-lg border border-gray-200 bg-white px-3 h-10">
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
            className="appearance-none bg-transparent pr-6 text-sm font-medium text-[#1F2125] outline-none">
            {levelOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400" stroke="currentColor" strokeWidth={1.8}>
            <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#006B5F] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005a4f] transition h-10"
        >
          <Plus size={16} /> Create Subject
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#006B5F] text-white">
                {["Subject Title", "Subject Code", "Department", "Lec Hours", "Lab Hours", "Units", "Date Created", "Status", "Description", "Year Level"].map((col) => (
                  <th key={col} className="px-4 py-3 text-xs font-medium whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">No subjects found.</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-[#1F2125]">{s.title}</td>
                    <td className="px-4 py-3 text-xs text-[#1F2125]">{s.code}</td>
                    <td className="px-4 py-3 text-xs text-[#1F2125]">{s.department}</td>
                    <td className="px-4 py-3 text-xs text-[#1F2125]">{s.lecHours}</td>
                    <td className="px-4 py-3 text-xs text-[#1F2125]">{s.labHours}</td>
                    <td className="px-4 py-3 text-xs text-[#1F2125]">{s.units}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{s.dateCreated}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${statusColor[s.status]}`}>{s.status}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{s.description}</td>
                    <td className="px-4 py-3 text-xs text-[#1F2125]">{s.level}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Subject Modal ── */}
      {showForm && (
        <CreateSubjectForm
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {/* ── Confirm Submission Modal ── */}
      {showConfirm && pendingData && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e6f4f2] flex items-center justify-center shrink-0">
                  <CheckCircle size={22} className="text-[#006B5F]" />
                </div>
                <h2 className="text-lg font-bold text-[#1F2125]">Submit for Approval</h2>
              </div>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm font-medium text-[#1F2125] mb-3">You are about to submit the following subject for approval:</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-1">
              <p className="text-sm text-[#1F2125]"><span className="font-medium">Subject Code:</span> {pendingData.code}</p>
              <p className="text-sm text-[#1F2125]"><span className="font-medium">Subject Name:</span> {pendingData.title}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-700">
                <span className="font-semibold">Note:</span> Once submitted, this subject will be sent to the higher up for review. You will not be able to edit it until it is approved or returned.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-[#1F2125] hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f]">
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}