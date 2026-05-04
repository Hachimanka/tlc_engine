"use client";

import { X, BookPlus, Info, GraduationCap, Clock } from "lucide-react";
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
    <div className="fixed inset-0 bg-[#1F2125]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#006B5F] px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BookPlus className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl tracking-tight">Create Subject</h2>
              <p className="text-[#C5EEEA] text-xs opacity-90 font-medium">Add to the TLC Engine Curriculum</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Subject Title */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">
              <Info size={14} className="text-[#006B5F]" /> Subject Title *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Data Structures and Algorithms"
              className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Subject Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Subject Code *</label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g., CPE 211"
                className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all"
              />
            </div>

            {/* Units */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Total Units *</label>
              <input
                name="units"
                type="number"
                value={form.units}
                onChange={handleChange}
                className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">
              <GraduationCap size={14} className="text-[#006B5F]" /> Department *
            </label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="">Select Institutional Department</option>
              <option>Computer Engineering</option>
              <option>Civil Engineering</option>
              <option>Electrical Engineering</option>
              <option>Mechanical Engineering</option>
            </select>
          </div>

          {/* Hours Allocation */}
          <div className="bg-[#C5EEEA]/20 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-[#006B5F] uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Weekly Hour Allocation
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#1F2125]">Lecture Hours</label>
                <input
                  name="lecHours"
                  type="number"
                  value={form.lecHours}
                  onChange={handleChange}
                  className="w-full border border-[#C5EEEA] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#1F2125]">Laboratory Hours</label>
                <input
                  name="labHours"
                  type="number"
                  value={form.labHours}
                  onChange={handleChange}
                  className="w-full border border-[#C5EEEA] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#717182] uppercase tracking-wider ml-1">Subject Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the scope and learning outcomes..."
              rows={3}
              className="w-full border border-[#C5EEEA] rounded-xl px-4 py-2.5 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/20 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-[#F3F3F1]/50 border-t border-[#C5EEEA]/60 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!form.title || !form.code || !form.department}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#006B5F] text-white hover:bg-[#005a4f] shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit for Validation
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold border border-[#006B5F] text-[#006B5F] hover:bg-white transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}