"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Props = {
  roomName?: string;
  buildingName?: string;
  onClose: () => void;
  onAssign: (data: AssignFormData) => void;
};

type AssignFormData = {
  subject: string;
  subjectCode: string;
  room: string;
  timeStart: string;
  timeEnd: string;
};

export default function AssignClassForm({
  roomName = "Room 301",
  buildingName = "Engineering Building",
  onClose,
  onAssign,
}: Props) {
  const [form, setForm] = useState<AssignFormData>({
    subject: "",
    subjectCode: "",
    room: "",
    timeStart: "",
    timeEnd: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.subject || !form.subjectCode || !form.room) return;
    onAssign(form);
  };

  const inputClass =
    "w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30 focus:bg-white transition-all";
  const labelClass = "block text-sm font-medium text-[#1F2125] mb-1";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header — teal, matching CreateSubjectForm */}
        <div className="bg-[#006B5F] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Assign Class to Room</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Subject */}
          <div>
            <label className={labelClass}>Subject *</label>
            <select
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select Subject</option>
              <option>CS101 - Introduction to Computing</option>
              <option>CS102 - Computer Programming 1</option>
              <option>CS201 - Data Structures</option>
              <option>CPE264 - Data Structures and Algorithm</option>
              <option>CPE364 - Computer Networks and Security</option>
            </select>
          </div>

          {/* Subject Code */}
          <div>
            <label className={labelClass}>Subject Code *</label>
            <select
              name="subjectCode"
              value={form.subjectCode}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Subject Code e.g. CPE264</option>
              <option>CS101</option>
              <option>CS102</option>
              <option>CS201</option>
              <option>CPE264</option>
              <option>CPE364</option>
            </select>
          </div>

          {/* Room */}
          <div>
            <label className={labelClass}>Room *</label>
            <select
              name="room"
              value={form.room}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">e.g., GLE 605</option>
              <option>GLE 301</option>
              <option>GLE 605</option>
              <option>CEA 101</option>
              <option>CEA LAB 1</option>
            </select>
          </div>

          {/* Start Time + End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Time *</label>
              <input
                type="text"
                name="timeStart"
                value={form.timeStart}
                onChange={handleChange}
                placeholder="e.g., 7:30 AM"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>End Time *</label>
              <input
                type="text"
                name="timeEnd"
                value={form.timeEnd}
                onChange={handleChange}
                placeholder="e.g., 10:30 AM"
                className={inputClass}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-[#C5EEEA] text-[#717182] hover:bg-[#F3F3F1] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.subject || !form.subjectCode || !form.room}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign Schedule
          </button>
        </div>

      </div>
    </div>
  );
}