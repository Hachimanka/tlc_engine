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
      <div className="bg-white rounded-xl w-[480px] shadow-xl">

        {/* Header */}
        <div className="bg-[#006B5F] text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="font-semibold text-base">Computer Engineering Department</h2>
            <p className="text-sm text-white/70 mt-0.5">Adding new Faculty</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4 rounded-b-xl">
          <div>
            <label className="text-sm font-medium text-[#1F2125] mb-1 block">
              Select Faculty<span className="text-red-500">*</span>
            </label>

            {/* Inline Dropdown — no absolute positioning */}
            <div className="border border-[#006B5F] rounded-lg overflow-hidden">
              <button
                onClick={() => setOpen(!open)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-sm bg-white"
              >
                <span className={selected ? "text-gray-800" : "text-gray-400"}>
                  {selected || "Select Faculty"}
                </span>
                <ChevronUp
                  size={16}
                  className={`transition-transform duration-200 text-[#006B5F] ${open ? "" : "rotate-180"}`}
                />
              </button>

              {/* Options render inline, pushing the modal down */}
              {open && (
                <div className="border-t border-gray-200">
                  {availableFaculty.map((name) => (
                    <button
                      key={name}
                      onClick={() => { setSelected(name); setOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#C5EEEA]/40 transition"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              disabled={!selected}
              className="px-4 py-2 text-sm bg-[#006B5F] text-white rounded-lg hover:bg-[#005549] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Faculty
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}