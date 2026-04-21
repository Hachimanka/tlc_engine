"use client";

import { useState } from "react";
import AssignClassForm from "./AssignClassForm";
import ScheduleTable from "./ScheduleTable";

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--color-high-emphasis)]">Room Management</h1>

      {/* Filters row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]">
              <path d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="search"
              placeholder="Search room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
            />
          </div>
        </div>

        <div className="relative flex items-center rounded-lg border border-[var(--color-default)] bg-white px-3 py-2 shadow-level-1">
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="appearance-none bg-transparent pr-6 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
          >
            {buildings.map((b) => <option key={b}>{b}</option>)}
          </select>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--color-low-emphasis)]">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="overflow-hidden rounded-[8px] border border-[var(--color-default)] bg-white shadow-level-1">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-default)] px-4 py-2.5">
          <p className="text-[13px] font-semibold text-[var(--color-high-emphasis)]">Rooms ({filtered.length})</p>
          <button
            type="button"
            onClick={() => setShowAddRoom(true)}
            className="inline-flex items-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)]"
          >
            Add Room
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr>
                {["Room Name", "Building", "Room Type", "Capacity", "Status"].map((col) => (
                  <th key={col} className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-default)] bg-white">
              {filtered.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                return (
                  <tr
                    key={room.id}
                    onClick={() => setSelectedRoom(isSelected ? null : room)}
                    className={`cursor-pointer transition-colors hover:bg-[#ecf8f6] ${isSelected ? "bg-[#e0f4f1]" : ""}`}
                  >
                    <td className="px-4 py-3 text-[12px] font-medium text-[var(--color-high-emphasis)]">{room.name}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">{room.building}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">{room.type}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">{room.capacity}</td>
                    <td className="px-4 py-3 text-[12px] font-medium text-[var(--color-primary)]">{room.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Room Form */}
      {showAddRoom && (
        <div className="overflow-hidden rounded-[8px] border border-[var(--color-default)] bg-white shadow-level-1 p-6">
          <h3 className="text-sm font-semibold text-[var(--color-high-emphasis)] mb-4">Add New Room</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Room Name", key: "name", placeholder: "e.g. Room 703", type: "text" },
              { label: "Building", key: "building", placeholder: "e.g. GLE Building", type: "text" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[var(--color-high-emphasis)] mb-1">{label}</label>
                <input
                  type={type}
                  value={(newRoom as any)[key]}
                  onChange={(e) => setNewRoom((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-[var(--color-high-emphasis)] mb-1">Room Type</label>
              <select
                value={newRoom.type}
                onChange={(e) => setNewRoom((p) => ({ ...p, type: e.target.value }))}
                className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)]"
              >
                <option>Lecture Room</option>
                <option>Laboratory</option>
                <option>Seminar Room</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-high-emphasis)] mb-1">Capacity</label>
              <input
                type="number"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom((p) => ({ ...p, capacity: Number(e.target.value) }))}
                className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowAddRoom(false)}
              className="min-w-[120px] rounded-md border border-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[#ecf8f6] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowAddRoom(false)}
              className="min-w-[120px] rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-light-primary)] transition-colors"
            >
              Add Room
            </button>
          </div>
        </div>
      )}

      {/* Schedule Table — always visible below rooms */}
      <ScheduleTable />

      {/* Assign Class Form — always visible at the bottom */}
      <AssignClassForm />
    </div>
  );
}