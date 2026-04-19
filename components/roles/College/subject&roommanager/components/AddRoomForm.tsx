"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type Room = {
  id?: number;
  roomNumber: string;
  building: string;
  capacity: number;
  type: "Lecture" | "Laboratory" | "Seminar";
  status: "Available" | "Occupied" | "Under Maintenance";
};

type Props = {
  room?: Room | null;
  onClose: () => void;
  onSave: (data: Omit<Room, "id">) => void;
};

export default function AddRoomForm({ room, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    roomNumber: "",
    building: "",
    capacity: 30,
    type: "Lecture" as "Lecture" | "Laboratory" | "Seminar",
    status: "Available" as "Available" | "Occupied" | "Under Maintenance",
  });

  useEffect(() => {
    if (room) setForm(room);
  }, [room]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "capacity" ? Number(value) : value }));
  };

  const handleSubmit = () => {
    if (!form.roomNumber || !form.building) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-[#006B5F] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            {room ? "Edit Room" : "Add New Room"}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2125] mb-1">Room Number</label>
              <input
                name="roomNumber"
                value={form.roomNumber}
                onChange={handleChange}
                placeholder="e.g. CEA 101"
                className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2125] mb-1">Building</label>
              <input
                name="building"
                value={form.building}
                onChange={handleChange}
                placeholder="e.g. CEA Building"
                className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2125] mb-1">Capacity</label>
              <input
                name="capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={handleChange}
                className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2125] mb-1">Room Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
              >
                <option>Lecture</option>
                <option>Laboratory</option>
                <option>Seminar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2125] mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
            >
              <option>Available</option>
              <option>Occupied</option>
              <option>Under Maintenance</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F3F3F1] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-[#C5EEEA] text-[#717182] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f] transition-colors"
          >
            {room ? "Save Changes" : "Add Room"}
          </button>
        </div>
      </div>
    </div>
  );
}