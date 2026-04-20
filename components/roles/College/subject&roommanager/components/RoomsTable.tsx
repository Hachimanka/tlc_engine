"use client";

import { useState } from "react";
import { Search } from "lucide-react";

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
  const [rooms] = useState<Room[]>(mockRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", building: "", type: "Lecture Room", capacity: 30 });

  const buildings = ["All Buildings", ...Array.from(new Set(rooms.map((r) => r.building)))];

  const filtered = rooms.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchBuilding = buildingFilter === "All Buildings" || r.building === buildingFilter;
    return matchSearch && matchBuilding;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1F2125] mb-6">Room Management</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white text-[#1F2125] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
        >
          {buildings.map((b) => <option key={b}>{b}</option>)}
        </select>

        <div className="relative flex-1 max-w-[400px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717182]" />
          <input
            type="text"
            placeholder="Search room...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-[#C5EEEA] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
          />
        </div>
      </div>

      {/* Rooms count + Add button */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#1F2125] font-medium">Rooms ({filtered.length})</p>
        <button
          onClick={() => setShowAddRoom(true)}
          className="bg-[#006B5F] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005a4f] transition-colors"
        >
          Add Room
        </button>
      </div>

      {/* Add Room Form */}
      {showAddRoom && (
        <div className="bg-white rounded-xl border border-[#C5EEEA] p-5 mb-4">
          <h3 className="font-semibold text-[#1F2125] mb-4">Add New Room</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2125] mb-1">Room Name</label>
              <input value={newRoom.name} onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Room 703"
                className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2125] mb-1">Building</label>
              <input value={newRoom.building} onChange={(e) => setNewRoom((p) => ({ ...p, building: e.target.value }))}
                placeholder="e.g. GLE Building"
                className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2125] mb-1">Room Type</label>
              <select value={newRoom.type} onChange={(e) => setNewRoom((p) => ({ ...p, type: e.target.value }))}
                className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30">
                <option>Lecture Room</option>
                <option>Laboratory</option>
                <option>Seminar Room</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2125] mb-1">Capacity</label>
              <input type="number" value={newRoom.capacity} onChange={(e) => setNewRoom((p) => ({ ...p, capacity: Number(e.target.value) }))}
                className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-[#F3F3F1] focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowAddRoom(false)}
              className="px-4 py-2 rounded-lg text-sm border border-[#C5EEEA] text-[#717182] hover:bg-white transition-colors">
              Cancel
            </button>
            <button onClick={() => setShowAddRoom(false)}
              className="px-4 py-2 rounded-lg text-sm bg-[#006B5F] text-white hover:bg-[#005a4f] transition-colors">
              Add Room
            </button>
          </div>
        </div>
      )}

      {/* Rooms Table */}
      <div className="bg-white rounded-xl border border-[#C5EEEA] overflow-hidden mb-6">
        <div className="grid grid-cols-[2fr_2fr_2fr_1fr_1fr] bg-[#006B5F] text-white text-sm font-semibold px-4 py-3">
          <span>Room Name</span>
          <span>Building</span>
          <span>Room Type</span>
          <span>Capacity</span>
          <span>Status</span>
        </div>
        {filtered.map((room, i) => (
          <div
            key={room.id}
            onClick={() => setSelectedRoom(room.id === selectedRoom?.id ? null : room)}
            className={`grid grid-cols-[2fr_2fr_2fr_1fr_1fr] px-4 py-3 text-sm text-[#1F2125] border-b border-[#C5EEEA]/60 items-center cursor-pointer transition-colors
              ${room.id === selectedRoom?.id ? "bg-[#C5EEEA]/40" : i % 2 === 1 ? "bg-[#C5EEEA]/10" : "bg-white"} hover:bg-[#C5EEEA]/25`}
          >
            <span className="font-medium">{room.name}</span>
            <span>{room.building}</span>
            <span>{room.type}</span>
            <span>{room.capacity}</span>
            <span className="text-[#006B5F] font-medium">{room.status}</span>
          </div>
        ))}
      </div>

      {/* Selected Room Schedule */}
      {selectedRoom && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-[#1F2125]">Selected Room</h2>
            <button className="bg-[#006B5F] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005a4f] transition-colors">
              Assign
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#C5EEEA] overflow-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-[#006B5F] text-white">
                  <th className="px-4 py-3 text-left font-semibold w-[140px]">Time</th>
                  {days.map((day) => (
                    <th key={day} className="px-4 py-3 text-left font-semibold">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, i) => (
                  <tr key={slot} className={`border-b border-[#C5EEEA]/60 ${i % 2 === 1 ? "bg-[#C5EEEA]/10" : "bg-white"}`}>
                    <td className="px-4 py-3 text-[#717182] text-xs whitespace-nowrap">{slot}</td>
                    {days.map((day) => (
                      <td key={day} className="px-2 py-3 border-l border-[#C5EEEA]/40">
                        <div className="h-6" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}