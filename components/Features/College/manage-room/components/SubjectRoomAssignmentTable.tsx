"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import { supabase } from "@/lib/supabaseClient";

type SubjectOption = {
  id: string;
  title: string;
  code: string;
  department: string;
  yearLevel: string;
  units: number;
};

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
  } | null;
};

type AssignmentForm = {
  subjectId: string;
  roomId: string;
  section: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

const emptyForm: AssignmentForm = {
  subjectId: "",
  roomId: "",
  section: "",
  dayOfWeek: "Monday",
  startTime: "",
  endTime: "",
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

const rangesOverlap = (
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
) => leftStart < rightEnd && rightStart < leftEnd;

export default function SubjectRoomAssignmentTable() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadAssignments = useCallback(async () => {
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
      subjects?: SubjectOption[];
      rooms?: RoomOption[];
      assignments?: Assignment[];
      canAssign?: boolean;
      error?: string;
    } = await response.json().catch(() => ({}));

    if (!response.ok) {
      setIsLoading(false);
      setLoadError(payload.error || "Unable to load subject-room assignments.");
      return;
    }

    setSubjects(payload.subjects ?? []);
    setRooms(payload.rooms ?? []);
    setAssignments(payload.assignments ?? []);
    setCanAssign(Boolean(payload.canAssign));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssignments();
  }, [loadAssignments]);

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

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const haystack = [
        assignment.subject?.title,
        assignment.subject?.code,
        assignment.room?.name,
        assignment.room?.building,
        assignment.section,
        assignment.dayOfWeek,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [assignments, search]);

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setSaveError("");
    setIsSaving(false);
  };

  const openForm = () => {
    setSaveError("");
    setForm(emptyForm);
    setShowForm(true);
  };

  const formConflict = useMemo(() => {
    if (!form.roomId || !form.dayOfWeek || !form.startTime || !form.endTime) {
      return null;
    }

    const startMinutes = parseTimeToMinutes(form.startTime);
    const endMinutes = parseTimeToMinutes(form.endTime);

    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
      return null;
    }

    return (
      assignments.find((assignment) => {
        if (assignment.room?.id !== form.roomId || assignment.dayOfWeek !== form.dayOfWeek) {
          return false;
        }

        const assignmentStart = parseTimeToMinutes(assignment.startTime);
        const assignmentEnd = parseTimeToMinutes(assignment.endTime);

        return (
          assignmentStart !== null &&
          assignmentEnd !== null &&
          rangesOverlap(startMinutes, endMinutes, assignmentStart, assignmentEnd)
        );
      }) ?? null
    );
  }, [assignments, form.dayOfWeek, form.endTime, form.roomId, form.startTime]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError("");

    if (
      !form.subjectId ||
      !form.roomId ||
      !form.section.trim() ||
      !form.startTime ||
      !form.endTime
    ) {
      setSaveError("Subject, room, section, day, start time, and end time are required.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setSaveError("Your session expired. Please log in again.");
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/tenant/room-assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    const payload: { assignment?: Assignment; error?: string } = await response
      .json()
      .catch(() => ({}));
    setIsSaving(false);

    if (!response.ok || !payload.assignment) {
      setSaveError(payload.error || "Unable to save assignment.");
      return;
    }

    setAssignments((current) => [payload.assignment as Assignment, ...current]);
    closeForm();
  };

  const handleDelete = async (assignmentId: string) => {
    setDeletingId(assignmentId);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setLoadError("Your session expired. Please log in again.");
      setDeletingId("");
      return;
    }

    const response = await fetch(`/api/tenant/room-assignments?id=${encodeURIComponent(assignmentId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload: { error?: string } = await response.json().catch(() => ({}));
    setDeletingId("");

    if (!response.ok) {
      setLoadError(payload.error || "Unable to delete assignment.");
      return;
    }

    setAssignments((current) => current.filter((assignment) => assignment.id !== assignmentId));
  };

  if (isLoading) {
    return (
      <TenantLoadingScreen
        className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        label="Loading subject-room assignments"
        useStoredBranding
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-high-emphasis)]">
            Subject-Room Assignment
          </h1>
          <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
            Assign approved subjects to rooms and schedule blocks.
          </p>
        </div>

        {canAssign ? (
          <button
            type="button"
            onClick={openForm}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Assign Subject
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
            className="w-full max-w-[760px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-subject-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 bg-[var(--color-primary)] px-5 py-4">
              <h2 id="assign-subject-title" className="text-base font-bold text-white">
                Assign Subject to Room
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md p-1 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close assignment form</span>
              </button>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5">
              {saveError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {saveError}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
                <label className="space-y-1 lg:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Approved Subject
                  </span>
                  <select
                    value={form.subjectId}
                    onChange={(event) => setForm((current) => ({ ...current, subjectId: event.target.value }))}
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
                    value={form.roomId}
                    onChange={(event) => setForm((current) => ({ ...current, roomId: event.target.value }))}
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
                    value={form.section}
                    onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}
                    placeholder="e.g., BSCE 1-A"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Day
                  </span>
                  <select
                    value={form.dayOfWeek}
                    onChange={(event) => setForm((current) => ({ ...current, dayOfWeek: event.target.value }))}
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
                      value={form.startTime}
                      onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                      className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                      End Time
                    </span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                      className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>
                </div>

                {formConflict ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 lg:col-span-2">
                    Possible conflict: {formConflict.subject?.code ?? "A subject"} is already
                    assigned to this room on {formConflict.dayOfWeek}, {formConflict.startTime} -{" "}
                    {formConflict.endTime}.
                  </div>
                ) : null}

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
                    {isSaving ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      ) : null}

      <section className="rounded-lg border border-[var(--color-default)] bg-white p-4 shadow-level-1">
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
          <span className="sr-only">Search assignments</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search subject, room, section, or day..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
          />
        </label>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--color-default)] bg-white shadow-level-1">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-[var(--color-primary)] text-white">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold">Subject</th>
                <th className="px-4 py-3 text-xs font-semibold">Room</th>
                <th className="px-4 py-3 text-xs font-semibold">Section</th>
                <th className="px-4 py-3 text-xs font-semibold">Day</th>
                <th className="px-4 py-3 text-xs font-semibold">Time</th>
                {canAssign ? <th className="px-4 py-3 text-right text-xs font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-default)] bg-white">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={canAssign ? 6 : 5}
                    className="px-4 py-10 text-center text-sm text-[var(--color-low-emphasis)]"
                  >
                    No subject-room assignments found.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="transition hover:bg-[#ecf8f6]">
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      <div className="font-semibold text-[var(--color-primary)]">
                        {assignment.subject?.code ?? "-"}
                      </div>
                      <div>{assignment.subject?.title ?? "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      <div className="font-medium">{assignment.room?.name ?? "-"}</div>
                      <div className="text-[var(--color-low-emphasis)]">
                        {assignment.room?.building ?? "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {assignment.section}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {assignment.dayOfWeek}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">
                      {assignment.startTime} - {assignment.endTime}
                    </td>
                    {canAssign ? (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(assignment.id)}
                          disabled={deletingId === assignment.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {deletingId === assignment.id ? "Deleting..." : "Delete"}
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
