"use client";

import { useState } from "react";
import { Trash2, X, Plus, Calendar, Clock, MapPin, BookOpen, User, Users } from "lucide-react";

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

type Props = {
  onClose: () => void;
};

const mockAssignments: Assignment[] = [
  { id: 1, subject: "CS101 - Introduction to Computing", teacher: "Juan Dela Cruz", room: "CEA 101", day: "Monday", timeStart: "07:30", timeEnd: "09:00", section: "BSCE 1-A" },
  { id: 2, subject: "CS102 - Computer Programming 1", teacher: "Maria Santos", room: "CEA LAB 1", day: "Tuesday", timeStart: "09:00", timeEnd: "12:00", section: "BSCE 1-B" },
  { id: 3, subject: "CS201 - Data Structures", teacher: "Jose Reyes", room: "CEA 102", day: "Wednesday", timeStart: "13:00", timeEnd: "14:30", section: "BSCE 2-A" },
];

export default function AssignClassForm({ onClose }: Props) {
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
    <div className="fixed inset-0 bg-[#1F2125]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#006B5F] px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl tracking-tight">Assign Class</h2>
            <p className="text-[#C5EEEA] text-xs mt-0.5 opacity-90">Manage academic schedules and resource allocation</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Add Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#006B5F] text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-[#005a4f] transition-all active:scale-95"
            >
              <Plus size={18} />
              Assign Class
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#C5EEEA] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#006B5F] text-white text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Teacher</th>
                    <th className="px-6 py-4">Room</th>
                    <th className="px-6 py-4">Schedule</th>
                    <th className="px-6 py-4">Section</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C5EEEA]/60">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center text-[#717182]">
                          <BookOpen size={40} className="mb-2 opacity-20" />
                          <p className="text-sm">No class assignments found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    assignments.map((a, i) => (
                      <tr
                        key={a.id}
                        className={`group hover:bg-[#C5EEEA]/10 transition-colors ${
                          i % 2 === 1 ? "bg-[#F3F3F1]/30" : "bg-white"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#006B5F] text-sm">{a.subject}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1F2125]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#006B5F]/10 flex items-center justify-center text-[#006B5F]">
                              <User size={14} />
                            </div>
                            {a.teacher}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1F2125]">
                          <div className="flex items-center gap-1.5 text-[#717182]">
                            <MapPin size={14} />
                            <span className="text-[#1F2125]">{a.room}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[#006B5F] font-medium">
                              <Calendar size={13} />
                              {a.day}
                            </div>
                            <div className="flex items-center gap-1.5 text-[#717182] text-xs">
                              <Clock size={13} />
                              {a.timeStart} - {a.timeEnd}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C5EEEA] text-[#006B5F]">
                            <Users size={12} />
                            {a.section}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-[#717182] hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Assignment"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#F3F3F1]/50 border-t border-[#C5EEEA]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-[#C5EEEA] text-[#717182] hover:bg-white hover:text-[#1F2125] transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Inner Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#1F2125]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#006B5F] px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-xl tracking-tight">Assign New Class</h2>
                <p className="text-[#C5EEEA] text-xs mt-0.5 opacity-90">Fill in the details to schedule a section</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Subject Name</label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. CS101 - Introduction to Computing"
                  className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Instructor</label>
                <input
                  name="teacher"
                  value={form.teacher}
                  onChange={handleChange}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Room</label>
                  <input
                    name="room"
                    value={form.room}
                    onChange={handleChange}
                    placeholder="CEA 101"
                    className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Section</label>
                  <input
                    name="section"
                    value={form.section}
                    onChange={handleChange}
                    placeholder="BSCE 1-A"
                    className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Day of Week</label>
                <select
                  name="day"
                  value={form.day}
                  onChange={handleChange}
                  className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Starts At</label>
                  <input
                    type="time"
                    name="timeStart"
                    value={form.timeStart}
                    onChange={handleChange}
                    className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Ends At</label>
                  <input
                    type="time"
                    name="timeEnd"
                    value={form.timeEnd}
                    onChange={handleChange}
                    className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-[#F3F3F1]/50 border-t border-[#C5EEEA]/60 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-[#C5EEEA] text-[#717182] hover:bg-white hover:text-[#1F2125] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.subject || !form.teacher}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#006B5F] text-white hover:bg-[#005a4f] shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}