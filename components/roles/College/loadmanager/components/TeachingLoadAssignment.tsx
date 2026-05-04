"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddFacultyModal from "./AddFacultyModal";
import SubjectAssignmentModal from "./SubjectAssignmentModal";

type Faculty = {
  id: number;
  name: string;
  major: string;
  employmentType: string;
  assignedUnits: string;
};

type Subject = {
  id: number;
  title: string;
  code: string;
  schedule: string;
  room: string;
  units: number;
};

const mockFaculty: Faculty[] = [
  { id: 1, name: "John Michael Montero Inoc", major: "Software Engineering", employmentType: "Full Time", assignedUnits: "18/24" },
  { id: 2, name: "Michael Montero", major: "Computer Engineering", employmentType: "Full Time", assignedUnits: "12/24" },
  { id: 3, name: "Michael Inoc", major: "Computer Science", employmentType: "Full Time", assignedUnits: "16/24" },
  { id: 4, name: "John Michael", major: "Information Technology", employmentType: "Part Time", assignedUnits: "6/9" },
];

const mockSubjects: Record<number, Subject[]> = {
  2: [
    { id: 1, title: "Data Structures and Algorithm", code: "CPE264", schedule: "Monday 7:30-10:30/Wednesday 07:30-10:30", room: "GLE 703, GLE 604", units: 4 },
    { id: 2, title: "Fundamentals of Mixed Signals and Sensors", code: "CPE368", schedule: "Monday 03:00-06:00/Thursday 03:00-06:00", room: "GLE 703, GLE 604", units: 4 },
    { id: 3, title: "Data Structures and Algorithm", code: "CPE264", schedule: "Monday 10:30-01:30/Thursday 10:30-01:30", room: "GLE 705, GLE 605", units: 4 },
  ],
};

export default function TeachingLoadAssignment() {
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(mockFaculty[1]);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [showAssignSubject, setShowAssignSubject] = useState(false);
  const [facultyList, setFacultyList] = useState(mockFaculty);

  const subjects = selectedFaculty ? (mockSubjects[selectedFaculty.id] ?? []) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#006B5F]">Teaching Load Assignment</h1>

      {/* Faculty Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1F2125]">Computer Engineering Department Faculty</h2>
          <button
            onClick={() => setShowAddFaculty(true)}
            className="flex items-center gap-2 bg-[#006B5F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#005549] transition"
          >
            <Plus size={16} /> Add Faculty
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[#006B5F] text-white">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Faculty Name</th>
              <th className="text-left px-6 py-3 font-medium">Major</th>
              <th className="text-left px-6 py-3 font-medium">Employment Type</th>
              <th className="text-left px-6 py-3 font-medium">Assigned Units</th>
            </tr>
          </thead>
          <tbody>
            {facultyList.map((f, i) => (
              <tr
                key={f.id}
                onClick={() => setSelectedFaculty(f)}
                className={`cursor-pointer border-b border-gray-100 transition
                  ${selectedFaculty?.id === f.id
                    ? "bg-[#C5EEEA]/40"
                    : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-[#F9F9F9] hover:bg-gray-100"
                  }`}
              >
                <td className="px-6 py-3">{f.name}</td>
                <td className="px-6 py-3">{f.major}</td>
                <td className="px-6 py-3">{f.employmentType}</td>
                <td className="px-6 py-3">{f.assignedUnits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Faculty Subjects */}
      {selectedFaculty && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold text-[#006B5F]">{selectedFaculty.name}</h2>
            <button
              onClick={() => setShowAssignSubject(true)}
              className="flex items-center gap-2 bg-[#006B5F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#005549] transition"
            >
              <Plus size={16} /> Assign Subject
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-[#006B5F] text-white">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Subject Title</th>
                <th className="text-left px-6 py-3 font-medium">Subject Code</th>
                <th className="text-left px-6 py-3 font-medium">Schedule</th>
                <th className="text-left px-6 py-3 font-medium">Room</th>
                <th className="text-left px-6 py-3 font-medium">Units</th>
                <th className="text-left px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No subjects assigned yet.</td>
                </tr>
              ) : (
                subjects.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3">{s.title}</td>
                    <td className="px-6 py-3">{s.code}</td>
                    <td className="px-6 py-3">{s.schedule}</td>
                    <td className="px-6 py-3">{s.room}</td>
                    <td className="px-6 py-3">{s.units}</td>
                    <td className="px-6 py-3">
                      <button className="text-red-500 hover:underline text-sm">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-end px-6 py-3">
            <button className="text-[#006B5F] text-sm hover:underline">View Edit History</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddFaculty && (
        <AddFacultyModal onClose={() => setShowAddFaculty(false)} />
      )}
      {showAssignSubject && selectedFaculty && (
        <SubjectAssignmentModal
          facultyName={selectedFaculty.name}
          onClose={() => setShowAssignSubject(false)}
        />
      )}
    </div>
  );
}