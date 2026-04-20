"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Subject = {
  id: number;
  title: string;
  code: string;
  schedule: string;
  room: string;
  units: number;
};

const availableSubjects: Subject[] = [
  { id: 1, title: "Data Structures and Algorithm", code: "CPE 264", schedule: "Monday 7:30-10:30/Wednesday 07:30-10:30", room: "GLE 703, GLE 604", units: 4 },
  { id: 2, title: "Computer Networks and Security", code: "CPE 364", schedule: "Monday 10:30-01:30/Thursday 10:30-01:30", room: "GLE 703, GLE 604", units: 4 },
  { id: 3, title: "Fundamentals of Mixed Signals and Sensors", code: "CPE 368", schedule: "Monday 03:00-06:00/Thursday 03:00-06:00", room: "GLE 705, GLE 605", units: 4 },
];

type Props = { facultyName: string; onClose: () => void };

export default function SubjectAssignmentModal({ facultyName, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[700px] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#006B5F] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Assign Subject to {facultyName}</h2>
            <button onClick={onClose}><X size={18} /></button>
          </div>
          <p className="text-sm text-white/80 mt-0.5">Computer Engineering Department</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <h3 className="font-semibold text-[#1F2125] mb-4">Available Subjects</h3>

          <table className="w-full text-sm">
            <thead className="bg-[#006B5F] text-white">
              <tr>
                <th className="px-4 py-3 text-center font-medium w-16">Select</th>
                <th className="px-4 py-3 text-left font-medium">Subject Title</th>
                <th className="px-4 py-3 text-left font-medium">Subject Code</th>
                <th className="px-4 py-3 text-left font-medium">Schedule</th>
                <th className="px-4 py-3 text-left font-medium">Room</th>
                <th className="px-4 py-3 text-left font-medium">Units</th>
              </tr>
            </thead>
            <tbody>
              {availableSubjects.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className="border-b border-gray-100 cursor-pointer hover:bg-[#C5EEEA]/20"
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="radio"
                      checked={selectedId === s.id}
                      onChange={() => setSelectedId(s.id)}
                      className="accent-[#006B5F] w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">{s.title}</td>
                  <td className="px-4 py-3">{s.code}</td>
                  <td className="px-4 py-3">{s.schedule}</td>
                  <td className="px-4 py-3">{s.room}</td>
                  <td className="px-4 py-3">{s.units}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end gap-3 pt-6">
            <button onClick={onClose} className="px-5 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              disabled={!selectedId}
              className="px-5 py-2 text-sm bg-[#006B5F] text-white rounded-lg hover:bg-[#005549] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Subject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}