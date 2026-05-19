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

type Assignment = {
  id: string;
  section: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: {
    id: string;
    title: string;
    code: string;
    department: string;
  } | null;
  room: {
    id: string;
    name: string;
    building: string;
  } | null;
};

type SubjectOption = {
  id: string;
  title: string;
  code: string;
  department: string;
  yearLevel: string;
  units: number;
};

type RoomForm = {
  name: string;
  building: string;
  type: string;
  capacity: string;
  status: RoomStatus;
};

type AssignmentForm = {
  subjectId: string;
  roomId: string;
  section: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

const emptyForm: RoomForm = {
  name: "",
  building: "",
  type: "Lecture Room",
  capacity: "30",
  status: "available",
};

const emptyAssignmentForm: AssignmentForm = {
  subjectId: "",
  roomId: "",
  section: "",
  dayOfWeek: "Monday",
  startTime: "",
  endTime: "",
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

const scheduleDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const scheduleTimeSlots = [
  { label: "07:00 - 08:00 AM", start: "07:00" },
  { label: "08:00 - 09:00 AM", start: "08:00" },
  { label: "09:00 - 10:00 AM", start: "09:00" },
  { label: "10:00 - 11:00 AM", start: "10:00" },
  { label: "11:00 - 12:00 PM", start: "11:00" },
  { label: "12:00 - 01:00 PM", start: "12:00" },
  { label: "01:00 - 02:00 PM", start: "13:00" },
  { label: "02:00 - 03:00 PM", start: "14:00" },
  { label: "03:00 - 04:00 PM", start: "15:00" },
  { label: "04:00 - 05:00 PM", start: "16:00" },
  { label: "05:00 - 06:00 PM", start: "17:00" },
  { label: "06:00 - 07:00 PM", start: "18:00" },
];

const normalizeTimeStart = (value: string) => value.slice(0, 5);

export default function RoomsTable() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [canAssignSubjects, setCanAssignSubjects] = useState(false);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("All Buildings");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>(emptyAssignmentForm);
  const [saveError, setSaveError] = useState("");
  const [assignError, setAssignError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

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

    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const [roomsResponse, assignmentsResponse] = await Promise.all([
      fetch("/api/tenant/rooms", { headers }),
      fetch("/api/tenant/room-assignments", { headers }),
    ]);
    const roomsPayload: { rooms?: Room[]; canManage?: boolean; error?: string } = await roomsResponse
      .json()
      .catch(() => ({}));
    const assignmentsPayload: {
      subjects?: SubjectOption[];
      assignments?: Assignment[];
      canAssign?: boolean;
      error?: string;
    } = await assignmentsResponse
      .json()
      .catch(() => ({}));

    if (!roomsResponse.ok) {
      setIsLoading(false);
      setLoadError(roomsPayload.error || "Unable to load rooms.");
      return;
    }

    if (!assignmentsResponse.ok) {
      setIsLoading(false);
      setLoadError(assignmentsPayload.error || "Unable to load room schedules.");
      return;
    }

    const nextRooms = roomsPayload.rooms ?? [];
    setRooms(nextRooms);
    setSubjects(assignmentsPayload.subjects ?? []);
    setAssignments(assignmentsPayload.assignments ?? []);
    setSelectedRoomId((currentRoomId) =>
      currentRoomId && nextRooms.some((room) => room.id === currentRoomId)
        ? currentRoomId
        : nextRooms[0]?.id ?? "",
    );
    setCanManage(Boolean(roomsPayload.canManage));
    setCanAssignSubjects(Boolean(assignmentsPayload.canAssign));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!showForm && !showAssignForm) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showAssignForm, showForm]);

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

  useEffect(() => {
    if (
      filteredRooms.length > 0 &&
      !filteredRooms.some((room) => room.id === selectedRoomId)
    ) {
      setSelectedRoomId(filteredRooms[0].id);
    }
  }, [filteredRooms, selectedRoomId]);

  const selectedRoom =
    rooms.find((room) => room.id === selectedRoomId) ?? filteredRooms[0] ?? null;
  const selectedRoomAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.room?.id === selectedRoom?.id),
    [assignments, selectedRoom?.id],
  );
  const assignmentsByCell = useMemo(() => {
    const nextAssignments = new Map<string, Assignment[]>();

    for (const assignment of selectedRoomAssignments) {
      const key = `${assignment.dayOfWeek}|${normalizeTimeStart(assignment.startTime)}`;
      const currentAssignments = nextAssignments.get(key) ?? [];
      currentAssignments.push(assignment);
      nextAssignments.set(key, currentAssignments);
    }

    return nextAssignments;
  }, [selectedRoomAssignments]);

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

  const openAssignForm = () => {
    setAssignError("");
    setAssignmentForm({
      ...emptyAssignmentForm,
      roomId: selectedRoom?.id ?? "",
      subjectId: subjects[0]?.id ?? "",
    });
    setShowAssignForm(true);
  };

  const closeAssignForm = () => {
    setShowAssignForm(false);
    setAssignmentForm(emptyAssignmentForm);
    setAssignError("");
    setIsAssigning(false);
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
    setSelectedRoomId(payload.room.id);
    closeForm();
  };

  const handleAssignSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAssignError("");

    if (
      !assignmentForm.subjectId ||
      !assignmentForm.roomId ||
      !assignmentForm.section.trim() ||
      !assignmentForm.dayOfWeek ||
      !assignmentForm.startTime ||
      !assignmentForm.endTime
    ) {
      setAssignError("Subject, room, section, day, start time, and end time are required.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setAssignError("Your session expired. Please log in again.");
      return;
    }

    setIsAssigning(true);
    const response = await fetch("/api/tenant/room-assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(assignmentForm),
    });
    const payload: { assignment?: Assignment; error?: string } = await response
      .json()
      .catch(() => ({}));
    setIsAssigning(false);

    if (!response.ok || !payload.assignment) {
      setAssignError(payload.error || "Unable to assign subject to room.");
      return;
    }

    setAssignments((current) => [payload.assignment as Assignment, ...current]);
    setSelectedRoomId(payload.assignment.room?.id ?? assignmentForm.roomId);
    closeAssignForm();
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

      {showAssignForm ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={closeAssignForm}
        >
          <section
            className="w-full max-w-[760px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-room-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 bg-[var(--color-primary)] px-5 py-4">
              <div>
                <h2 id="assign-room-title" className="text-base font-bold text-white">
                  Assign Subject to Room
                </h2>
                <p className="mt-0.5 text-xs text-white/80">
                  {selectedRoom ? `${selectedRoom.name} - ${selectedRoom.building}` : "Selected room"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAssignForm}
                className="rounded-md p-1 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close assignment form</span>
              </button>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5">
              {assignError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {assignError}
                </div>
              ) : null}

              <form onSubmit={handleAssignSubmit} className="grid gap-4 lg:grid-cols-2">
                <label className="space-y-1 lg:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Approved Subject
                  </span>
                  <select
                    value={assignmentForm.subjectId}
                    onChange={(event) =>
                      setAssignmentForm((current) => ({
                        ...current,
                        subjectId: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} - {subject.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Room
                  </span>
                  <select
                    value={assignmentForm.roomId}
                    onChange={(event) =>
                      setAssignmentForm((current) => ({
                        ...current,
                        roomId: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">Select room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} - {room.building}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Section
                  </span>
                  <input
                    value={assignmentForm.section}
                    onChange={(event) =>
                      setAssignmentForm((current) => ({
                        ...current,
                        section: event.target.value,
                      }))
                    }
                    placeholder="e.g., CPE363 - H1"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Day
                  </span>
                  <select
                    value={assignmentForm.dayOfWeek}
                    onChange={(event) =>
                      setAssignmentForm((current) => ({
                        ...current,
                        dayOfWeek: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  >
                    {scheduleDays.map((day) => (
                      <option key={day}>{day}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                      Start Time
                    </span>
                    <input
                      type="time"
                      value={assignmentForm.startTime}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          startTime: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                      End Time
                    </span>
                    <input
                      type="time"
                      value={assignmentForm.endTime}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          endTime: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2 lg:col-span-2">
                  <button
                    type="button"
                    onClick={closeAssignForm}
                    className="rounded-md border border-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAssigning ? "Assigning..." : "Assign"}
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
                filteredRooms.map((room) => {
                  const isSelected = room.id === selectedRoom?.id;

                  return (
                  <tr
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    aria-selected={isSelected}
                    className={`cursor-pointer transition hover:bg-[var(--color-primary)]/10 ${
                      isSelected ? "bg-[var(--color-primary)]/10" : "bg-white"
                    }`}
                  >
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
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditForm(room);
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-default)] px-3 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </button>
                      </td>
                    ) : null}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
              Selected Room
            </h2>
            <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
              {selectedRoom
                ? `${selectedRoom.name} - ${selectedRoom.building}`
                : "Select a room row to view its schedule."}
            </p>
          </div>
          {canAssignSubjects ? (
            <button
              type="button"
              onClick={openAssignForm}
              disabled={!selectedRoom}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Assign
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--color-primary)] bg-white shadow-level-1">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse text-left">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr>
                  <th className="w-[145px] border border-[var(--color-primary)] px-3 py-3 text-xs font-semibold">
                    Time
                  </th>
                  {scheduleDays.map((day) => (
                    <th
                      key={day}
                      className="border border-[var(--color-primary)] px-3 py-3 text-xs font-semibold"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleTimeSlots.map((timeSlot) => (
                  <tr key={timeSlot.start}>
                    <td className="h-14 border border-[var(--color-primary)] bg-white px-3 py-2 text-[11px] font-medium text-[var(--color-high-emphasis)]">
                      {timeSlot.label}
                    </td>
                    {scheduleDays.map((day) => {
                      const cellAssignments =
                        assignmentsByCell.get(`${day}|${timeSlot.start}`) ?? [];

                      return (
                        <td
                          key={`${day}-${timeSlot.start}`}
                          className="h-14 border border-[var(--color-primary)] bg-white p-1 align-top"
                        >
                          {cellAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="rounded bg-[var(--color-primary)] px-2 py-1 text-center text-white"
                            >
                              <div className="truncate text-[11px] font-bold">
                                {assignment.subject?.code ?? "Subject"}
                              </div>
                              <div className="truncate text-[10px] font-medium">
                                {assignment.section}
                              </div>
                              <div className="truncate text-[10px] text-white/85">
                                {normalizeTimeStart(assignment.startTime)} - {normalizeTimeStart(assignment.endTime)}
                              </div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
