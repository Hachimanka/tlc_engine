"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Room = {
  id: number;
  name: string;
  building: string;
  type: string;
  capacity: number;
  status: "Available" | "Occupied" | "Under Maintenance";
};

const mockRooms: Room[] = [
  { id: 1, name: "Room 703", building: "GLE Building", type: "Lecture Room", capacity: 40, status: "Available" },
  { id: 2, name: "Room 704", building: "GLE Building", type: "Lecture Room", capacity: 40, status: "Available" },
  { id: 3, name: "Room 705", building: "GLE Building", type: "Lecture Room", capacity: 40, status: "Available" },
  { id: 4, name: "LAB 101", building: "CEA Building", type: "Laboratory", capacity: 30, status: "Available" },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = [
  "07:00 - 8:00 AM", "08:00 - 9:00 AM", "09:00 - 10:00 AM",
  "10:00 - 11:00 AM", "11:00 - 12:00 PM", "12:00 - 01:00 PM",
  "01:00 - 02:00 PM", "02:00 - 03:00 PM", "03:00 - 04:00 PM",
  "04:00 - 05:00 PM",
];

export default function RoomsTable() {
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("All Buildings");
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", building: "", type: "Lecture Room", capacity: "" });
  const [assignForm, setAssignForm] = useState({ subject: "", subjectCode: "", room: "", startTime: "", endTime: "" });

  const buildings = ["All Buildings", ...Array.from(new Set(rooms.map((r) => r.building)))];
  const filtered = rooms.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchBuilding = buildingFilter === "All Buildings" || r.building === buildingFilter;
    return matchSearch && matchBuilding;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-bold text-[#1F2125]">Room Management</h1>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Building filter */}
        <div className="relative flex items-center rounded-lg border border-gray-200 bg-white px-3 h-10">
          <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}
            className="appearance-none bg-transparent pr-6 text-sm font-medium text-[#1F2125] outline-none">
            {buildings.map((b) => <option key={b}>{b}</option>)}
          </select>
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400" stroke="currentColor" strokeWidth={1.8}>
            <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Search */}
        <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 min-w-[240px]">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-gray-400" stroke="currentColor" strokeWidth={1.8}>
            <path d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input type="search" placeholder="Search room...." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-full w-full bg-transparent text-sm text-[#1F2125] outline-none placeholder:text-gray-400" />
        </div>
      </div>

      {/* Rooms count + Add */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#1F2125]">Rooms ({filtered.length})</p>
        <button onClick={() => setShowAddRoom(true)}
          className="bg-[#006B5F] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005a4f] transition-colors">
          Add Room
        </button>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#006B5F] text-white">
              {["Room Name", "Building", "Room Type", "Capacity", "Status"].map((col) => (
                <th key={col} className="px-4 py-3 text-xs font-semibold">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <tr key={room.id} onClick={() => setSelectedRoom(isSelected ? null : room)}
                  className={`cursor-pointer transition-colors hover:bg-[#f0faf9] ${isSelected ? "bg-[#e6f4f2]" : ""}`}>
                  <td className="px-4 py-3 text-xs font-semibold text-[#1F2125]">{room.name}</td>
                  <td className="px-4 py-3 text-xs text-[#1F2125]">{room.building}</td>
                  <td className="px-4 py-3 text-xs text-[#1F2125]">{room.type}</td>
                  <td className="px-4 py-3 text-xs text-[#1F2125]">Capacity</td>
                  <td className="px-4 py-3 text-xs font-medium text-[#006B5F]">{room.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Room + Schedule — matches Figma */}
      {selectedRoom && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-bold text-[#1F2125]">Selected Room</h2>
            <button onClick={() => setShowAssignModal(true)}
              className="bg-[#006B5F] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005a4f] transition-colors">
              Assign
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-[#006B5F] text-white">
                  <th className="px-4 py-3 text-xs font-semibold text-left w-[140px]">Time</th>
                  {days.map((day) => (
                    <th key={day} className="px-4 py-3 text-xs font-semibold text-left">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot} className="border-b border-[#C5EEEA]/50">
                    <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">{slot}</td>
                    {days.map((day) => (
                      <td key={day} className="border-l border-[#C5EEEA]/50 px-4 py-4">
                        <div className="h-5" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Room Modal — matches Frame 92 */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1F2125]">Add Room</h2>
            <p className="text-sm text-gray-400 mb-5">Adding new rooms</p>

            <div className="space-y-4">
              {[
                { label: "Room Name", key: "name", placeholder: "e.g., GLE 301" },
                { label: "Building Name", key: "building", placeholder: "e.g., GLE Building" },
                { label: "Room Type", key: "type", placeholder: "e.g., Lecture" },
                { label: "Capacity", key: "capacity", placeholder: "e.g., 45" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[#1F2125] mb-1">{label}</label>
                  <input value={(newRoom as any)[key]} onChange={(e) => setNewRoom((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#006B5F]" />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddRoom(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-[#1F2125] hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => {
                if (newRoom.name && newRoom.building) {
                  setRooms((p) => [...p, { id: Date.now(), name: newRoom.name, building: newRoom.building, type: newRoom.type, capacity: Number(newRoom.capacity) || 0, status: "Available" }]);
                  setNewRoom({ name: "", building: "", type: "Lecture Room", capacity: "" });
                  setShowAddRoom(false);
                }
              }} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f]">
                Assign Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Class to Room Modal — matches Frame 93 */}
      {showAssignModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1F2125]">Assign Class to Room</h2>
            <p className="text-sm text-gray-400 mb-5">Schedule a class for {selectedRoom.name} in {selectedRoom.building}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2125] mb-1">Subject <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={assignForm.subject} onChange={(e) => setAssignForm((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full border border-[#C5EEEA] rounded-lg px-3 py-2.5 text-sm bg-white appearance-none focus:outline-none focus:border-[#006B5F]">
                    <option value="">Select Subject</option>
                    {mockRooms.map((_, i) => <option key={i}>CS10{i + 1}</option>)}
                  </select>
                  <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2125] mb-1">Subject Code <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input value={assignForm.subjectCode} onChange={(e) => setAssignForm((p) => ({ ...p, subjectCode: e.target.value }))}
                    placeholder="Subject Code e.g. CPE264"
                    className="w-full border border-[#C5EEEA] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#006B5F]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2125] mb-1">Room <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input value={selectedRoom.name} readOnly
                    className="w-full border border-[#C5EEEA] rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2125] mb-1">Start Time <span className="text-red-500">*</span></label>
                  <input type="time" value={assignForm.startTime} onChange={(e) => setAssignForm((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-full border border-[#C5EEEA] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#006B5F]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2125] mb-1">End Time <span className="text-red-500">*</span></label>
                  <input type="time" value={assignForm.endTime} onChange={(e) => setAssignForm((p) => ({ ...p, endTime: e.target.value }))}
                    className="w-full border border-[#C5EEEA] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#006B5F]" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAssignModal(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-[#1F2125] hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => setShowAssignModal(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f]">
                Assign Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}