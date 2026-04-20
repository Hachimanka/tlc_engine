"use client";

import { useState } from "react";
import { X, ChevronUp } from "lucide-react";

const availableFaculty = [
  "John Michael Montero Inoc",
  "John Michael Inoc",
  "Michael Inoc",
];

type Props = { onClose: () => void };

export default function AddFacultyModal({ onClose }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[480px] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#006B5F] text-white px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-base">Computer Engineering Department</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <p className="text-sm text-gray-500">Adding new Faculty</p>

          <div>
            <label className="text-sm font-medium text-[#1F2125] mb-1 block">
              Select Faculty<span className="text-red-500">*</span>
            </label>

            {/* Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="w-full border border-[#006B5F] rounded-lg px-4 py-2.5 flex items-center justify-between text-sm text-gray-600 bg-white"
              >
                <span>{selected || "Select Faculty"}</span>
                <ChevronUp size={16} className={`transition-transform ${open ? "" : "rotate-180"}`} />
              </button>

              {open && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-lg shadow z-10">
                  {availableFaculty.map((name) => (
                    <button
                      key={name}
                      onClick={() => { setSelected(name); setOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#C5EEEA]/30 transition"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              disabled={!selected}
              className="px-4 py-2 text-sm bg-[#006B5F] text-white rounded-lg hover:bg-[#005549] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Faculty
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}