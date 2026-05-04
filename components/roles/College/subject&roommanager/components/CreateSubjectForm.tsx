"use client";

import { useState } from "react";
import { X } from "lucide-react";

type SubjectFormData = {
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

type Props = {
  onClose: () => void;
  onSave: (data: SubjectFormData) => void;
};

const departments = [
  "Computer Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
];

const levels = ["First Year", "Second Year", "Third Year", "Fourth Year"];

export default function CreateSubjectForm({ onClose, onSave }: Props) {
  const [form, setForm] = useState({
    title: "",
    code: "",
    department: "",
    lecHours: 0,
    labHours: 0,
    units: 0,
    description: "",
    level: "First Year",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const numFields = ["lecHours", "labHours", "units"];
    setForm((prev) => ({
      ...prev,
      [name]: numFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.code || !form.department) return;
    onSave({
      ...form,
      status: "Pending",
      dateCreated: new Date().toLocaleDateString(),
    });
  };

  const inputClass =
    "w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30";
  const labelClass = "block text-sm font-medium text-[#1F2125] mb-1";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      {/* Modal — wide, capped height so it never overflows the viewport */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-[#006B5F] px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold text-lg">Create Subject</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

          {/* Row 1 — Subject Title (full width) */}
          <div>
            <label className={labelClass}>Subject Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Data Structures and Algorithms"
              className={inputClass}
            />
          </div>

          {/* Row 2 — Code | Units | Department (3 columns) */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Subject Code *</label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g., CS401"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Units *</label>
              <input
                name="units"
                type="number"
                min={0}
                value={form.units}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Department *</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3 — Lec Hours | Lab Hours | Year Level (3 columns) */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Lecture Hours/Week</label>
              <input
                name="lecHours"
                type="number"
                min={0}
                value={form.lecHours}
                onChange={handleChange}
                placeholder="e.g., 2"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Laboratory Hours/Week</label>
              <input
                name="labHours"
                type="number"
                min={0}
                value={form.labHours}
                onChange={handleChange}
                placeholder="e.g., 3"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Year Level</label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className={inputClass}
              >
                {levels.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4 — Description (full width) */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description of the subject"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-[#F3F3F1] flex justify-end gap-3 shrink-0 border-t border-[#C5EEEA]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-[#C5EEEA] text-[#717182] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title || !form.code || !form.department}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit for approval
          </button>
        </div>

      </div>
    </div>
  );
}