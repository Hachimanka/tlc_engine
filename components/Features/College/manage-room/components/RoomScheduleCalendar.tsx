"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, RotateCcw } from "lucide-react";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import { supabase } from "@/lib/supabaseClient";

type RoomOption = {
  id: string;
  name: string;
  building: string;
  type: string;
  capacity: number;
  status: string;
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
    type?: string;
  } | null;
};

const allBuildingsValue = "all-buildings";
const allSubjectsValue = "all-subjects";
const scheduleDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultScheduleTimeSlots = [
  "7:30-8:30",
  "8:30-9:30",
  "9:30-10:30",
  "10:30-11:30",
  "11:30-12:30",
  "12:30-1:30",
  "1:30-2:30",
  "2:30-3:30",
  "3:30-4:30",
  "4:30-5:30",
];

const parseTimeToMinutes = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
};

const formatClockTime = (value: string) => {
  const minutes = parseTimeToMinutes(value);

  if (minutes === null) {
    return value;
  }

  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

  return `${hour12}:${String(minute).padStart(2, "0")}`;
};

const formatAssignmentTime = (assignment: Pick<Assignment, "startTime" | "endTime">) =>
  `${formatClockTime(assignment.startTime)}-${formatClockTime(assignment.endTime)}`;

const getTimeSlotStart = (slot: string) => {
  const start = slot.split("-")[0] ?? "";
  const [hourValue = "0", minuteValue = "0"] = start.split(":");
  let hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (hour > 0 && hour < 7) {
    hour += 12;
  }

  return hour * 60 + minute;
};

const getScheduleType = (assignment: Assignment) =>
  assignment.room?.type?.toLowerCase().includes("lab") ? "LAB" : "LEC";

export default function RoomScheduleCalendar() {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [buildingFilter, setBuildingFilter] = useState(allBuildingsValue);
  const [subjectFilter, setSubjectFilter] = useState(allSubjectsValue);
  const [sectionSearch, setSectionSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Your session expired. Please log in again.");
      return;
    }

    const response = await fetch("/api/tenant/room-assignments", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload: {
      rooms?: RoomOption[];
      assignments?: Assignment[];
      error?: string;
    } = await response.json().catch(() => ({}));

    if (!response.ok) {
      setIsLoading(false);
      setLoadError(payload.error || "Unable to load room schedules.");
      return;
    }

    const nextRooms = payload.rooms ?? [];

    setRooms(nextRooms);
    setAssignments(payload.assignments ?? []);
    setSelectedRoomId((currentRoomId) =>
      currentRoomId && nextRooms.some((room) => room.id === currentRoomId)
        ? currentRoomId
        : nextRooms[0]?.id ?? "",
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSchedule();
  }, [loadSchedule]);

  const buildingOptions = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.building))).sort(),
    [rooms],
  );
  const subjectOptions = useMemo(() => {
    const subjectMap = new Map<string, NonNullable<Assignment["subject"]>>();

    for (const assignment of assignments) {
      if (assignment.subject) {
        subjectMap.set(assignment.subject.id, assignment.subject);
      }
    }

    return Array.from(subjectMap.values()).sort((left, right) =>
      left.code.localeCompare(right.code),
    );
  }, [assignments]);
  const filteredRooms = useMemo(
    () =>
      buildingFilter === allBuildingsValue
        ? rooms
        : rooms.filter((room) => room.building === buildingFilter),
    [buildingFilter, rooms],
  );
  const selectedRoom =
    filteredRooms.find((room) => room.id === selectedRoomId) ?? filteredRooms[0] ?? null;
  const activeRoomId = selectedRoom?.id ?? "";
  const roomAssignments = useMemo(() => {
    const normalizedSectionSearch = sectionSearch.trim().toLowerCase();

    return assignments.filter((assignment) => {
      if (assignment.room?.id !== activeRoomId) {
        return false;
      }

      if (subjectFilter !== allSubjectsValue && assignment.subject?.id !== subjectFilter) {
        return false;
      }

      if (
        normalizedSectionSearch &&
        !assignment.section.toLowerCase().includes(normalizedSectionSearch)
      ) {
        return false;
      }

      return true;
    });
  }, [activeRoomId, assignments, sectionSearch, subjectFilter]);
  const timeSlots = useMemo(() => {
    const slots = new Set(defaultScheduleTimeSlots);

    for (const assignment of roomAssignments) {
      slots.add(formatAssignmentTime(assignment));
    }

    return Array.from(slots).sort((left, right) => getTimeSlotStart(left) - getTimeSlotStart(right));
  }, [roomAssignments]);

  const clearFilters = () => {
    setBuildingFilter(allBuildingsValue);
    setSubjectFilter(allSubjectsValue);
    setSectionSearch("");
    setSelectedRoomId(rooms[0]?.id ?? "");
  };
  const assignmentsByCell = useMemo(() => {
    const nextAssignments = new Map<string, Assignment[]>();

    for (const assignment of roomAssignments) {
      const key = `${assignment.dayOfWeek}|${formatAssignmentTime(assignment)}`;
      const currentAssignments = nextAssignments.get(key) ?? [];
      currentAssignments.push(assignment);
      nextAssignments.set(key, currentAssignments);
    }

    return nextAssignments;
  }, [roomAssignments]);

  if (isLoading) {
    return (
      <TenantLoadingScreen
        className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        label="Loading room schedule"
        useStoredBranding
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-high-emphasis)]">
            Room Schedule Calendar
          </h1>
          <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
            View weekly subject schedules by room before assigning new blocks.
          </p>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Clear Filters
        </button>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <section className="rounded-lg border border-[var(--color-default)] bg-white p-4 shadow-level-1">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
              Building
            </span>
            <select
              value={buildingFilter}
              onChange={(event) => {
                setBuildingFilter(event.target.value);
                setSelectedRoomId("");
              }}
              className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
            >
              <option value={allBuildingsValue}>All buildings</option>
              {buildingOptions.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
              Room
            </span>
            <select
              value={activeRoomId}
              onChange={(event) => setSelectedRoomId(event.target.value)}
              className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
            >
              {filteredRooms.length === 0 ? <option value="">No rooms available</option> : null}
              {filteredRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
              Subject
            </span>
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
            >
              <option value={allSubjectsValue}>All subjects</option>
              {subjectOptions.map((subject) => (
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
              type="search"
              value={sectionSearch}
              onChange={(event) => setSectionSearch(event.target.value)}
              placeholder="Search section"
              className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-black bg-white shadow-level-1">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)] text-white">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--color-high-emphasis)]">
                {selectedRoom?.name ?? "No room selected"}
              </h2>
              <p className="truncate text-sm text-[var(--color-low-emphasis)]">
                {selectedRoom
                  ? `${selectedRoom.building} - ${roomAssignments.length} visible block${
                      roomAssignments.length === 1 ? "" : "s"
                    }`
                  : "Create a room first to view its calendar."}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed border-collapse text-center">
            <thead>
              <tr>
                <th className="w-[140px] border border-black bg-[#f8fafc] px-4 py-3 text-[15px] font-bold text-black">
                  Time
                </th>
                {scheduleDays.map((day) => (
                  <th
                    key={day}
                    className="border border-black bg-[#f8fafc] px-4 py-3 text-[15px] font-bold text-black"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot}>
                  <td className="border border-black bg-[#f8fafc] px-4 py-4 text-[15px] font-bold text-black">
                    {timeSlot}
                  </td>
                  {scheduleDays.map((day) => {
                    const cellAssignments = assignmentsByCell.get(`${day}|${timeSlot}`) ?? [];

                    return (
                      <td
                        key={`${timeSlot}-${day}`}
                        className="h-[68px] border border-black bg-white p-0 align-middle"
                      >
                      {cellAssignments.length > 0 ? (
                          <div className="flex min-h-[68px] w-full flex-col gap-1">
                            {cellAssignments.map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex min-h-[68px] w-full flex-col items-center justify-center bg-[var(--color-primary)] px-2 py-1 text-center text-white"
                              >
                                <p className="max-w-full truncate text-[13px] font-bold leading-4">
                                  {assignment.subject?.code ?? "Subject"}
                                </p>
                                <div className="mt-1 flex max-w-full flex-wrap items-center justify-center gap-1">
                                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                                    {getScheduleType(assignment)}
                                  </span>
                                  <span className="max-w-[110px] truncate text-[12px] font-semibold leading-4">
                                    {assignment.section}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="min-h-[68px]" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
