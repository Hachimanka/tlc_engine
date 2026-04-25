"use client";

import { useState } from "react";

type Assignment = {
  id: number;
  subject: string;
  teacher: string;
  room: string;
  day: string;
  timeStart: string;
  timeEnd: string;
  section: string;
};

const mockAssignments: Assignment[] = [
  { id: 1, subject: "CS101 - Introduction to Computing", teacher: "Juan Dela Cruz", room: "CEA 101", day: "Monday", timeStart: "07:30", timeEnd: "09:00", section: "BSCE 1-A" },
  { id: 2, subject: "CS102 - Computer Programming 1", teacher: "Maria Santos", room: "CEA LAB 1", day: "Tuesday", timeStart: "09:00", timeEnd: "12:00", section: "BSCE 1-B" },
  { id: 3, subject: "CS201 - Data Structures", teacher: "Jose Reyes", room: "CEA 102", day: "Wednesday", timeStart: "13:00", timeEnd: "14:30", section: "BSCE 2-A" },
];

export default function AssignClassForm() {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    teacher: "",
    room: "",
    day: "Monday",
    timeStart: "",
    timeEnd: "",
    section: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.subject || !form.teacher || !form.room || !form.section) return;
    setAssignments((prev) => [...prev, { id: Date.now(), ...form }]);
    setForm({ subject: "", teacher: "", room: "", day: "Monday", timeStart: "", timeEnd: "", section: "" });
    setShowForm(false);
  };

  const handleDelete = (id: number) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2125]">Assign Class</h1>
          <p className="text-sm text-[#717182] mt-1">Assign subjects, teachers, and rooms to class sections</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#006B5F] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005a4f] transition-colors"
        >
          + Assign Class
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#C5EEEA] overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_80px] bg-[#006B5F] text-white text-sm font-semibold px-4 py-3">
          <span>Subject</span>
          <span>Teacher</span>
          <span>Room</span>
          <span>Day</span>
          <span>Time</span>
          <span>Section</span>
          <span className="text-center">Actions</span>
        </div>

        {assignments.length === 0 ? (
          <div className="py-12 text-center text-[#717182] text-sm">No assignments yet.</div>
        ) : (
          assignments.map((a, i) => (
            <div
              key={a.id}
              className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_80px] px-4 py-3 text-sm text-[#1F2125] border-b border-[#C5EEEA]/60 items-center
                ${i % 2 === 1 ? "bg-[#C5EEEA]/15" : "bg-white"} hover:bg-[#C5EEEA]/25 transition-colors`}
            >
              <span className="font-medium text-[#006B5F] truncate">{a.subject}</span>
              <span className="truncate">{a.teacher}</span>
              <span>{a.room}</span>
              <span>{a.day}</span>
              <span className="text-[#717182]">{a.timeStart} - {a.timeEnd}</span>
              <span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#C5EEEA] text-[#006B5F]">
                  {a.section}
                </span>
              </span>
              <span className="flex items-center justify-center">
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 rounded-md hover:bg-red-100 text-red-500 transition-colors"
                >
                  🗑
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-[#006B5F] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">Assign Class</h2>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2125] mb-1">Subject</label>
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. CS101 - Introduction to Computing"
                  className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2125] mb-1">Teacher</label>
                <input name="teacher" value={form.teacher} onChange={handleChange} placeholder="e.g. Juan Dela Cruz"
                  className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2125] mb-1">Room</label>
                  <input name="room" value={form.room} onChange={handleChange} placeholder="e.g. CEA 101"
                    className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2125] mb-1">Section</label>
                  <input name="section" value={form.section} onChange={handleChange} placeholder="e.g. BSCE 1-A"
                    className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2125] mb-1">Day</label>
                <select name="day" value={form.day} onChange={handleChange}
                  className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30">
                  {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2125] mb-1">Time Start</label>
                  <input type="time" name="timeStart" value={form.timeStart} onChange={handleChange}
                    className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2125] mb-1">Time End</label>
                  <input type="time" name="timeEnd" value={form.timeEnd} onChange={handleChange}
                    className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F3F3F1] flex justify-end gap-3">
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium border border-[#C5EEEA] text-[#717182] hover:bg-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f] transition-colors">
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}