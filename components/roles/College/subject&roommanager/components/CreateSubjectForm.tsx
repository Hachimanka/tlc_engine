"use client";

import { X } from "lucide-react";
import { useState } from "react";

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
    setForm((prev) => ({ ...prev, [name]: numFields.includes(name) ? Number(value) : value }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.code || !form.department) return;
    onSave({
      ...form,
      status: "Pending",
      dateCreated: new Date().toLocaleDateString(),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#C5EEEA] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#1F2125]">Create Subject</h2>
        <button onClick={onClose} className="text-[#717182] hover:text-[#1F2125] transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Subject Title */}
        <div>
          <label className="block text-sm font-medium text-[#1F2125] mb-1">Subject Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g., Data Structures and Algorithms"
            className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
          />
        </div>

        {/* Subject Code */}
        <div>
          <label className="block text-sm font-medium text-[#1F2125] mb-1">Subject Code *</label>
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="e.g., CS401"
            className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-[#1F2125] mb-1">Department *</label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
          >
            <option value="">Select Department</option>
            <option>Computer Engineering</option>
            <option>Civil Engineering</option>
            <option>Electrical Engineering</option>
          </select>
        </div>

        {/* Units */}
        <div>
          <label className="block text-sm font-medium text-[#1F2125] mb-1">Units *</label>
          <input
            name="units"
            type="number"
            value={form.units}
            onChange={handleChange}
            placeholder="e.g., 3"
            className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
          />
        </div>

        {/* Lec Hours + Lab Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1F2125] mb-1">Lecture Hours/Week</label>
            <input
              name="lecHours"
              type="number"
              value={form.lecHours}
              onChange={handleChange}
              placeholder="e.g., 2"
              className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1F2125] mb-1">Laboratory Hours/Week</label>
            <input
              name="labHours"
              type="number"
              value={form.labHours}
              onChange={handleChange}
              placeholder="e.g., 3"
              className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#1F2125] mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description of the subject"
            rows={3}
            className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30 resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <button
          onClick={handleSubmit}
          className="py-3 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f] transition-colors"
        >
          Submit for approval
        </button>
        <button
          onClick={onClose}
          className="py-3 rounded-lg text-sm font-medium border border-[#006B5F] text-[#006B5F] hover:bg-[#C5EEEA]/20 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}