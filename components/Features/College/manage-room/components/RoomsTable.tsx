"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Pencil, Plus, Search, X } from "lucide-react";
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

type SubjectOption = {
  id: string;
  title: string;
  code: string;
  department: string;
  yearLevel: string;
  units: number;
};

type RoomAssignment = {
  id: string;
  section: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  subject: SubjectOption | null;
  room: Pick<Room, "id" | "name" | "building" | "type"> | null;
};

type RoomForm = {
  name: string;
  building: string;
  type: string;
  capacity: string;
  status: RoomStatus;
};

type AssignmentForm = {
  department: string;
  subjectId: string;
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
  department: "",
  subjectId: "",
  section: "",
  dayOfWeek: "Monday",
  startTime: "07:00",
  endTime: "08:00",
};

const addNewBuildingValue = "__add_new_building__";
const roomTypes = ["Lecture Room", "Laboratory", "Seminar Room"];
const scheduleDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const scheduleStart = 7 * 60;
const scheduleEnd = 21 * 60;
const scheduleRowHeight = 68;

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

const timeSlots = Array.from(
  { length: (scheduleEnd - scheduleStart) / 60 },
  (_, index) => scheduleStart + index * 60,
);

const parseTimeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const rangesOverlap = (
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
) => firstStart < secondEnd && secondStart < firstEnd;

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const minutePart = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${String(displayHour).padStart(2, "0")}:${String(minutePart).padStart(
    2,
    "0",
  )} ${period}`;
};

const getRoomScheduleTag = (roomType?: string) =>
  roomType?.toLowerCase().includes("lab") ? "LAB" : "LEC";

function RoomScheduleGrid({
  assignments,
  room,
}: {
  assignments: RoomAssignment[];
  room: Room;
}) {
  const bodyHeight = timeSlots.length * scheduleRowHeight;
  const assignmentsByDay = useMemo(() => {
    const grouped = new Map<string, RoomAssignment[]>();

    scheduleDays.forEach((day) => grouped.set(day, []));
    assignments.forEach((assignment) => {
      grouped.get(assignment.dayOfWeek)?.push(assignment);
    });

    return grouped;
  }, [assignments]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1220px] overflow-hidden rounded-lg border border-[var(--color-primary)] bg-white">
        <div
          className="grid bg-[var(--color-primary)] text-xs font-bold text-white"
          style={{ gridTemplateColumns: "150px repeat(7, minmax(145px, 1fr))" }}
        >
          <div className="sticky left-0 z-20 border-r border-white/30 bg-[var(--color-primary)] px-3 py-4 text-center">
            Time
          </div>
          {scheduleDays.map((day) => (
            <div key={day} className="border-r border-white/20 px-3 py-4 text-center last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "150px repeat(7, minmax(145px, 1fr))",
            minHeight: bodyHeight,
          }}
        >
          <div className="sticky left-0 z-10 bg-white shadow-[2px_0_0_var(--color-default)]">
            {timeSlots.map((slot) => (
              <div
                key={slot}
                className="flex items-center justify-center border-b border-[var(--color-default)] bg-[#f8fafc] px-2 text-center text-[11px] font-semibold text-[var(--color-high-emphasis)] last:border-b-0"
                style={{ height: scheduleRowHeight }}
              >
                {formatMinutes(slot)} - {formatMinutes(slot + 60)}
              </div>
            ))}
          </div>

          {scheduleDays.map((day) => {
            const dayAssignments = assignmentsByDay.get(day) ?? [];

            return (
              <div
                key={day}
                className="relative border-r border-[var(--color-default)] last:border-r-0"
                style={{ height: bodyHeight }}
              >
                {timeSlots.map((slot) => (
                  <div
                    key={slot}
                    className="border-b border-[var(--color-default)] last:border-b-0"
                    style={{ height: scheduleRowHeight }}
                  />
                ))}

                {dayAssignments.map((assignment) => {
                  const start = parseTimeToMinutes(assignment.startTime) ?? scheduleStart;
                  const end = parseTimeToMinutes(assignment.endTime) ?? start + 60;
                  const clampedStart = Math.max(scheduleStart, start);
                  const clampedEnd = Math.min(scheduleEnd, Math.max(end, clampedStart + 15));
                  const top = ((clampedStart - scheduleStart) / 60) * scheduleRowHeight;
                  const height = ((clampedEnd - clampedStart) / 60) * scheduleRowHeight;
                  const subjectCode = assignment.subject?.code ?? "Subject";
                  const usageTag = getRoomScheduleTag(assignment.room?.type ?? room.type);

                  return (
                    <div
                      key={assignment.id}
                      className="absolute left-2 right-2 flex min-h-10 flex-col items-center justify-center overflow-hidden rounded-md bg-[var(--color-primary)] px-2 py-1 text-center text-white shadow-sm"
                      style={{ top, height: Math.max(height - 6, 42) }}
                      title={`${subjectCode} ${assignment.section} ${assignment.startTime}-${assignment.endTime}`}
                    >
                      <span className="max-w-full truncate text-xs font-bold">{subjectCode}</span>
                      <span className="mt-1 flex max-w-full items-center gap-1 text-[11px] font-semibold">
                        <span className="rounded bg-white/20 px-1.5 py-0.5">{usageTag}</span>
                        <span className="truncate">{assignment.section}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function RoomsTable() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("All Buildings");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [buildingSelection, setBuildingSelection] = useState(addNewBuildingValue);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>(emptyAssignmentForm);
  const [saveError, setSaveError] = useState("");
  const [assignmentSaveError, setAssignmentSaveError] = useState("");
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

    const response = await fetch("/api/tenant/rooms", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload: {
      rooms?: Room[];
      subjects?: SubjectOption[];
      assignments?: RoomAssignment[];
      canManage?: boolean;
      error?: string;
    } = await response.json().catch(() => ({}));

    if (!response.ok) {
      setIsLoading(false);
      setLoadError(payload.error || "Unable to load rooms.");
      return;
    }

    const nextRooms = payload.rooms ?? [];
    setRooms(nextRooms);
    setSubjects(payload.subjects ?? []);
    setAssignments(payload.assignments ?? []);
    setCanManage(Boolean(payload.canManage));
    setSelectedRoomId((current) =>
      current && nextRooms.some((room) => room.id === current)
        ? current
        : nextRooms[0]?.id ?? "",
    );
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

  const registeredBuildings = useMemo(
    () =>
      Array.from(new Set(rooms.map((room) => room.building).filter(Boolean))).sort((left, right) =>
        left.localeCompare(right),
      ),
    [rooms],
  );

  const buildings = useMemo(() => ["All Buildings", ...registeredBuildings], [registeredBuildings]);

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

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  const selectedRoomAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.room?.id === selectedRoomId),
    [assignments, selectedRoomId],
  );

  const subjectDepartments = useMemo(
    () =>
      Array.from(
        new Set(subjects.map((subject) => subject.department.trim()).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right)),
    [subjects],
  );

  const filteredAssignmentSubjects = useMemo(() => {
    if (!assignmentForm.department) {
      return subjects;
    }

    return subjects.filter(
      (subject) => subject.department.trim() === assignmentForm.department,
    );
  }, [assignmentForm.department, subjects]);

  const assignmentConflict = useMemo(() => {
    const start = parseTimeToMinutes(assignmentForm.startTime);
    const end = parseTimeToMinutes(assignmentForm.endTime);

    if (start === null || end === null || start >= end) {
      return null;
    }

    return (
      selectedRoomAssignments.find((assignment) => {
        if (assignment.dayOfWeek !== assignmentForm.dayOfWeek) {
          return false;
        }

        const existingStart = parseTimeToMinutes(assignment.startTime);
        const existingEnd = parseTimeToMinutes(assignment.endTime);

        return (
          existingStart !== null &&
          existingEnd !== null &&
          rangesOverlap(start, end, existingStart, existingEnd)
        );
      }) ?? null
    );
  }, [
    assignmentForm.dayOfWeek,
    assignmentForm.endTime,
    assignmentForm.startTime,
    selectedRoomAssignments,
  ]);

  const openCreateForm = () => {
    const defaultBuilding = registeredBuildings[0] ?? "";
    setEditingRoom(null);
    setBuildingSelection(defaultBuilding || addNewBuildingValue);
    setForm({ ...emptyForm, building: defaultBuilding });
    setSaveError("");
    setShowForm(true);
  };

  const openEditForm = (room: Room) => {
    const knownBuilding = registeredBuildings.includes(room.building);
    setEditingRoom(room);
    setBuildingSelection(knownBuilding ? room.building : addNewBuildingValue);
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
    setBuildingSelection(addNewBuildingValue);
    setSaveError("");
    setIsSaving(false);
  };

  const openAssignForm = () => {
    if (!selectedRoom) {
      return;
    }

    const defaultDepartment = subjectDepartments[0] ?? "";
    const defaultSubjects = defaultDepartment
      ? subjects.filter((subject) => subject.department.trim() === defaultDepartment)
      : subjects;

    setAssignmentForm({
      ...emptyAssignmentForm,
      department: defaultDepartment,
      subjectId: defaultSubjects[0]?.id ?? "",
    });
    setAssignmentSaveError("");
    setShowAssignForm(true);
  };

  const closeAssignForm = () => {
    setShowAssignForm(false);
    setAssignmentForm(emptyAssignmentForm);
    setAssignmentSaveError("");
    setIsAssigning(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError("");

    const roomName = form.name.trim();
    const building = form.building.trim();

    if (!roomName || !building || Number(form.capacity) <= 0) {
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
        name: roomName,
        building,
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
    setAssignmentSaveError("");

    const start = parseTimeToMinutes(assignmentForm.startTime);
    const end = parseTimeToMinutes(assignmentForm.endTime);

    if (!selectedRoom) {
      setAssignmentSaveError("Select a room first.");
      return;
    }

    if (!assignmentForm.subjectId || !assignmentForm.section.trim()) {
      setAssignmentSaveError("Subject and section are required.");
      return;
    }

    if (start === null || end === null || start >= end || start < scheduleStart || end > scheduleEnd) {
      setAssignmentSaveError("Schedule time must be between 7:00 AM and 9:00 PM.");
      return;
    }

    if (assignmentConflict) {
      setAssignmentSaveError(
        `${assignmentConflict.subject?.code ?? "A subject"} already uses this room at that time.`,
      );
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setAssignmentSaveError("Your session expired. Please log in again.");
      return;
    }

    setIsAssigning(true);
    const response = await fetch("/api/tenant/rooms/assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomId: selectedRoom.id,
        subjectId: assignmentForm.subjectId,
        section: assignmentForm.section,
        dayOfWeek: assignmentForm.dayOfWeek,
        startTime: assignmentForm.startTime,
        endTime: assignmentForm.endTime,
      }),
    });
    const payload: { assignment?: RoomAssignment; error?: string } = await response
      .json()
      .catch(() => ({}));
    setIsAssigning(false);

    if (!response.ok || !payload.assignment) {
      setAssignmentSaveError(payload.error || "Unable to assign subject to room.");
      return;
    }

    setAssignments((current) => [...current, payload.assignment as RoomAssignment]);
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
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="e.g., Room 703"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                      Building
                    </span>
                    <select
                      value={buildingSelection}
                      onChange={(event) => {
                        const nextSelection = event.target.value;
                        setBuildingSelection(nextSelection);
                        setForm((current) => ({
                          ...current,
                          building:
                            nextSelection === addNewBuildingValue ? "" : nextSelection,
                        }));
                      }}
                      className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    >
                      {registeredBuildings.map((building) => (
                        <option key={building} value={building}>
                          {building}
                        </option>
                      ))}
                      <option value={addNewBuildingValue}>Add new building</option>
                    </select>
                  </label>

                  {buildingSelection === addNewBuildingValue ? (
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                        New Building
                      </span>
                      <input
                        value={form.building}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, building: event.target.value }))
                        }
                        placeholder="e.g., CEA Building"
                        className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                    </label>
                  ) : null}
                </div>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Room Type
                  </span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, type: event.target.value }))
                    }
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
                    onChange={(event) =>
                      setForm((current) => ({ ...current, capacity: event.target.value }))
                    }
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
            className="w-full max-w-[720px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 bg-[var(--color-primary)] px-5 py-4">
              <div>
                <h2 id="assignment-form-title" className="text-base font-bold text-white">
                  Assign Subject
                </h2>
                <p className="mt-0.5 text-xs font-medium text-white/80">
                  {selectedRoom?.name} - {selectedRoom?.building}
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
              {assignmentSaveError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {assignmentSaveError}
                </div>
              ) : null}

              {assignmentConflict ? (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Possible conflict with {assignmentConflict.subject?.code ?? "a subject"} from{" "}
                  {assignmentConflict.startTime} to {assignmentConflict.endTime}.
                </div>
              ) : null}

              <form onSubmit={handleAssignSubmit} className="grid gap-4 lg:grid-cols-2">
                <label className="space-y-1 lg:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Department
                  </span>
                  <select
                    value={assignmentForm.department}
                    onChange={(event) => {
                      const nextDepartment = event.target.value;
                      const nextSubjects = nextDepartment
                        ? subjects.filter(
                            (subject) => subject.department.trim() === nextDepartment,
                          )
                        : subjects;

                      setAssignmentForm((current) => ({
                        ...current,
                        department: nextDepartment,
                        subjectId: nextSubjects[0]?.id ?? "",
                      }));
                    }}
                    disabled={subjectDepartments.length === 0}
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[var(--color-low-emphasis)]"
                  >
                    {subjectDepartments.length === 0 ? (
                      <option value="">No departments available</option>
                    ) : null}
                    {subjectDepartments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>

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
                    disabled={filteredAssignmentSubjects.length === 0}
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[var(--color-low-emphasis)]"
                  >
                    {filteredAssignmentSubjects.length === 0 ? (
                      <option value="">No approved subjects in this department</option>
                    ) : null}
                    {filteredAssignmentSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} - {subject.title}
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
                    placeholder="e.g., H1"
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

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Start Time
                  </span>
                  <input
                    value={assignmentForm.startTime}
                    type="time"
                    min="07:00"
                    max="21:00"
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
                    value={assignmentForm.endTime}
                    type="time"
                    min="07:00"
                    max="21:00"
                    onChange={(event) =>
                      setAssignmentForm((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

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
                    disabled={isAssigning || filteredAssignmentSubjects.length === 0}
                    className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAssigning ? "Assigning..." : "Assign Subject"}
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
                  const isSelected = selectedRoomId === room.id;

                  return (
                    <tr
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`cursor-pointer transition ${
                        isSelected ? "bg-[#d9f5f1]" : "hover:bg-[#ecf8f6]"
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

      <section className="space-y-4 rounded-lg border border-[var(--color-default)] bg-white p-4 shadow-level-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-high-emphasis)]">
                {selectedRoom ? `${selectedRoom.name} Schedule` : "Selected Room"}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
                {selectedRoom
                  ? `${selectedRoom.building} - ${selectedRoom.type}`
                  : "Click a room row to view its schedule."}
              </p>
            </div>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={openAssignForm}
              disabled={!selectedRoom || subjects.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Assign Subject
            </button>
          ) : null}
        </div>

        {selectedRoom ? (
          <RoomScheduleGrid assignments={selectedRoomAssignments} room={selectedRoom} />
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--color-default)] px-4 py-12 text-center text-sm text-[var(--color-low-emphasis)]">
            Select a room to preview its weekly schedule.
          </div>
        )}

        {canManage && selectedRoom && subjects.length === 0 ? (
          <p className="text-sm text-[var(--color-low-emphasis)]">
            Approved subjects will appear here after Dean and VPAA approval.
          </p>
        ) : null}
      </section>
    </div>
  );
}
