"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, X } from "lucide-react";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import { supabase } from "@/lib/supabaseClient";

type RoomStatus = "available" | "occupied" | "under_maintenance";

type Room = {
  id: string;
  name: string;
  building: string;
  type: string;
  capacity: number;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
};

type RoomForm = {
  name: string;
  building: string;
  type: string;
  capacity: string;
  status: RoomStatus;
};

const emptyForm: RoomForm = {
  name: "",
  building: "",
  type: "Lecture Room",
  capacity: "30",
  status: "available",
};

const roomTypes = ["Lecture Room", "Laboratory", "Seminar Room"];

const statusLabels: Record<RoomStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  under_maintenance: "Under Maintenance",
};

const statusClasses: Record<RoomStatus, string> = {
  available: "bg-[#ecfdf3] text-[#027a48]",
  occupied: "bg-amber-50 text-amber-700",
  under_maintenance: "bg-[#f2f4f7] text-[#667085]",
};

export default function RoomsTable() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("All Buildings");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Your session expired. Please log in again.");
      return;
    }

    const response = await fetch("/api/tenant/rooms", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload: { rooms?: Room[]; canManage?: boolean; error?: string } = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      setIsLoading(false);
      setLoadError(payload.error || "Unable to load rooms.");
      return;
    }

    setRooms(payload.rooms ?? []);
    setCanManage(Boolean(payload.canManage));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showForm]);

  const buildings = useMemo(
    () => ["All Buildings", ...Array.from(new Set(rooms.map((room) => room.building)))],
    [rooms],
  );

  const filteredRooms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesSearch =
        !normalizedSearch ||
        room.name.toLowerCase().includes(normalizedSearch) ||
        room.building.toLowerCase().includes(normalizedSearch) ||
        room.type.toLowerCase().includes(normalizedSearch);
      const matchesBuilding =
        buildingFilter === "All Buildings" || room.building === buildingFilter;

      return matchesSearch && matchesBuilding;
    });
  }, [buildingFilter, rooms, search]);

  const openCreateForm = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setSaveError("");
    setShowForm(true);
  };

  const openEditForm = (room: Room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      building: room.building,
      type: room.type,
      capacity: String(room.capacity),
      status: room.status,
    });
    setSaveError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRoom(null);
    setForm(emptyForm);
    setSaveError("");
    setIsSaving(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError("");

    if (!form.name.trim() || !form.building.trim() || Number(form.capacity) <= 0) {
      setSaveError("Room name, building, and capacity are required.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setSaveError("Your session expired. Please log in again.");
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/tenant/rooms", {
      method: editingRoom ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: editingRoom?.id,
        name: form.name,
        building: form.building,
        type: form.type,
        capacity: Number(form.capacity),
        status: form.status,
      }),
    });
    const payload: { room?: Room; error?: string } = await response.json().catch(() => ({}));
    setIsSaving(false);

    if (!response.ok || !payload.room) {
      setSaveError(payload.error || "Unable to save room.");
      return;
    }

    setRooms((current) =>
      editingRoom
        ? current.map((room) => (room.id === payload.room?.id ? payload.room : room))
        : [payload.room as Room, ...current],
    );
    closeForm();
  };

  if (isLoading) {
    return (
      <TenantLoadingScreen
        className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        label="Loading rooms"
        useStoredBranding
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-high-emphasis)]">
            Room Management
          </h1>
          <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
            {rooms.length} database-backed room{rooms.length === 1 ? "" : "s"}
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Room
          </button>
        ) : null}
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {showForm ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={closeForm}
        >
          <section
            className="w-full max-w-[720px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 bg-[var(--color-primary)] px-5 py-4">
              <h2 id="room-form-title" className="text-base font-bold text-white">
                {editingRoom ? "Edit Room" : "Add Room"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md p-1 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close room form</span>
              </button>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5">
              {saveError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {saveError}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Room Name
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="e.g., Room 703"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Building
                  </span>
                  <input
                    value={form.building}
                    onChange={(event) => setForm((current) => ({ ...current, building: event.target.value }))}
                    placeholder="e.g., CEA Building"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Room Type
                  </span>
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  >
                    {roomTypes.map((roomType) => (
                      <option key={roomType}>{roomType}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Capacity
                  </span>
                  <input
                    value={form.capacity}
                    type="number"
                    min={1}
                    onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))}
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1 lg:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Status
                  </span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as RoomStatus,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex justify-end gap-3 pt-2 lg:col-span-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-md border border-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : editingRoom ? "Save Changes" : "Add Room"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      ) : null}

      <section className="rounded-lg border border-[var(--color-default)] bg-white p-4 shadow-level-1">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
            <span className="sr-only">Search rooms</span>
            <input
              type="search"
              placeholder="Search room, building, or type..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
            />
          </label>

          <select
            value={buildingFilter}
            onChange={(event) => setBuildingFilter(event.target.value)}
            className="h-10 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
            aria-label="Filter by building"
          >
            {buildings.map((building) => (
              <option key={building}>{building}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--color-default)] bg-white shadow-level-1">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-[var(--color-primary)] text-white">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold">Room Name</th>
                <th className="px-4 py-3 text-xs font-semibold">Building</th>
                <th className="px-4 py-3 text-xs font-semibold">Room Type</th>
                <th className="px-4 py-3 text-xs font-semibold">Capacity</th>
                <th className="px-4 py-3 text-xs font-semibold">Status</th>
                {canManage ? <th className="px-4 py-3 text-right text-xs font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-default)] bg-white">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="px-4 py-10 text-center text-sm text-[var(--color-low-emphasis)]"
                  >
                    No rooms found.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="transition hover:bg-[#ecf8f6]">
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--color-high-emphasis)]">
                      {room.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {room.building}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {room.type}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {room.capacity}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`rounded-full px-2 py-1 font-semibold ${statusClasses[room.status]}`}>
                        {statusLabels[room.status]}
                      </span>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditForm(room)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
