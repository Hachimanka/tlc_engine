"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import AddRoomForm from "./AddRoomForm";
import AssignClassForm from "./AssignClassForm";
import ScheduleTable from "./ScheduleTable";

type Room = {
  id: number;
  name: string;
  building: string;
  type: string;
  capacity: string;
  status: "Available" | "Occupied" | "Under Maintenance";
};

const mockRooms: Room[] = [
  { id: 1, name: "Room 703", building: "GLE Building", type: "Lecture Room", capacity: "40", status: "Available" },
  { id: 2, name: "Room 704", building: "GLE Building", type: "Lecture Room", capacity: "40", status: "Available" },
  { id: 3, name: "Room 705", building: "GLE Building", type: "Lecture Room", capacity: "40", status: "Available" },
  { id: 4, name: "LAB 101",  building: "CEA Building", type: "Laboratory",   capacity: "30", status: "Available" },
];

export default function RoomsTable() {
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("All Buildings");
  const [rooms] = useState<Room[]>(mockRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const buildings = ["All Buildings", ...Array.from(new Set(rooms.map((r) => r.building)))];

  const filtered = rooms.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchBuilding = buildingFilter === "All Buildings" || r.building === buildingFilter;
    return matchSearch && matchBuilding;
  });

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-[#1F2125]">Room Management</h1>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white appearance-none pr-8 focus:outline-none focus:border-[#006B5F]"
          >
            {buildings.map((b) => <option key={b}>{b}</option>)}
          </select>
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" stroke="currentColor" strokeWidth={1.8}>
            <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white w-56">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="search"
            placeholder="Search room...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm w-full outline-none bg-transparent placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-[#1F2125]">Rooms ({filtered.length})</span>
          <button
            onClick={() => setShowAddRoom(true)}
            className="bg-[#006B5F] text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-[#005a4f] transition"
          >
            Add Room
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#006B5F] text-white">
                <th className="px-4 py-3 font-medium text-xs">Room Name</th>
                <th className="px-4 py-3 font-medium text-xs">Building</th>
                <th className="px-4 py-3 font-medium text-xs">Room Type</th>
                <th className="px-4 py-3 font-medium text-xs">Capacity</th>
                <th className="px-4 py-3 font-medium text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                return (
                  <tr
                    key={room.id}
                    onClick={() => setSelectedRoom(isSelected ? null : room)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-[#C5EEEA]/30" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-[#1F2125]">{room.name}</td>
                    <td className="px-4 py-3 text-sm text-[#1F2125]">{room.building}</td>
                    <td className="px-4 py-3 text-sm text-[#1F2125]">{room.type}</td>
                    <td className="px-4 py-3 text-sm text-[#1F2125]">{room.capacity}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#006B5F]">{room.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Room Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-base font-semibold text-[#1F2125]">Selected Room</span>
          <button
            onClick={() => setShowAssign(true)}
            className="bg-[#006B5F] text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-[#005a4f] transition"
          >
            Assign
          </button>
        </div>
        <ScheduleTable />
      </div>

      
{showAddRoom && (
  <AddRoomForm
    onClose={() => setShowAddRoom(false)}
    onSave={(data) => {
      console.log("Room saved:", data); // replace with your actual save logic
      setShowAddRoom(false);
    }}
  />
)}


{showAssign && <AssignClassForm onClose={() => setShowAssign(false)} />}
    </div>
  );
}