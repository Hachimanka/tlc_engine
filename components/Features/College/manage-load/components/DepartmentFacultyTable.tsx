"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import { supabase } from "@/lib/supabaseClient";

type SubjectAssignment = {
  id: string;
  subjectTitle: string;
  subjectCode: string;
  section: string;
  schedule: string;
  room: string;
  units: number;
};

type VersionHistoryItem = {
  id: string;
  version: string;
  changedBy: string;
  changedAt: string;
  action: string;
};

type AvailableSubject = {
  id: string;
  subjectId: string;
  subjectTitle: string;
  subjectCode: string;
  department: string;
  yearLevel: string;
  schedule: string;
  room: string;
  section: string;
  units: number;
};

type FacultyLoad = {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  major: string;
  roleName: string;
  employmentType: string;
  assignedUnits: string;
  subjects: SubjectAssignment[];
  history?: VersionHistoryItem[];
};

type FacultyLoadsPayload = {
  department?: string;
  faculty?: FacultyLoad[];
  availableSubjects?: AvailableSubject[];
  message?: string;
  error?: string;
};

const emptySubjects: SubjectAssignment[] = [];
const emptyHistory: VersionHistoryItem[] = [];

type ScheduleSegment = {
  day: string;
  startMinutes: number;
  endMinutes: number;
};

type ScheduleConflict = {
  subjectCode: string;
  day: string;
  startMinutes: number;
  endMinutes: number;
};

const scheduleSegmentPattern =
  /\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi;

const dayLabels: Record<string, string> = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
  sun: "Sunday",
  sunday: "Sunday",
};

function parseTimeToMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  if (period === "PM" && hours !== 12) {
    hours += 12;
  }

  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function formatTime(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, "0")}${period}`;
}

function parseScheduleSegments(schedule: string): ScheduleSegment[] {
  const segments: ScheduleSegment[] = [];

  for (const match of schedule.matchAll(scheduleSegmentPattern)) {
    const day = dayLabels[match[1].toLowerCase()];
    const startMinutes = parseTimeToMinutes(match[2]);
    const endMinutes = parseTimeToMinutes(match[3]);

    if (!day || startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      continue;
    }

    segments.push({ day, startMinutes, endMinutes });
  }

  return segments;
}

function rangesOverlap(first: ScheduleSegment, second: ScheduleSegment) {
  return first.day === second.day && first.startMinutes < second.endMinutes && first.endMinutes > second.startMinutes;
}

function getScheduleConflict(
  candidate: AvailableSubject,
  assignedSubjects: SubjectAssignment[],
): ScheduleConflict | null {
  const candidateSegments = parseScheduleSegments(candidate.schedule);

  for (const assignedSubject of assignedSubjects) {
    const assignedSegments = parseScheduleSegments(assignedSubject.schedule);

    for (const candidateSegment of candidateSegments) {
      const conflictingSegment = assignedSegments.find((segment) =>
        rangesOverlap(candidateSegment, segment),
      );

      if (conflictingSegment) {
        return {
          subjectCode: assignedSubject.subjectCode,
          day: candidateSegment.day,
          startMinutes: Math.max(candidateSegment.startMinutes, conflictingSegment.startMinutes),
          endMinutes: Math.min(candidateSegment.endMinutes, conflictingSegment.endMinutes),
        };
      }
    }
  }

  return null;
}

function formatConflictMessage(subject: AvailableSubject, conflict: ScheduleConflict) {
  return `${subject.subjectCode} conflicts with ${conflict.subjectCode} on ${conflict.day} from ${formatTime(
    conflict.startMinutes,
  )} to ${formatTime(conflict.endMinutes)}.`;
}

export default function DepartmentFacultyTable() {
  const [department, setDepartment] = useState("");
  const [facultyRows, setFacultyRows] = useState<FacultyLoad[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [assignError, setAssignError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedAvailableSubjectId, setSelectedAvailableSubjectId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingSubjectId, setRemovingSubjectId] = useState("");

  const loadFaculty = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    setEmptyMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setIsLoading(false);
      setLoadError("Your session expired. Please log in again.");
      return;
    }

    const response = await fetch("/api/tenant/faculty-loads", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload: FacultyLoadsPayload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setIsLoading(false);
      setLoadError(payload.error || "Unable to load department faculty.");
      return;
    }

    const nextFacultyRows = payload.faculty ?? [];
    setDepartment(payload.department ?? "");
    setFacultyRows(nextFacultyRows);
    setAvailableSubjects(payload.availableSubjects ?? []);
    setSelectedFacultyId((current) =>
      current && nextFacultyRows.some((faculty) => faculty.id === current)
        ? current
        : nextFacultyRows[0]?.id ?? "",
    );
    setEmptyMessage(payload.message ?? "");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFaculty();
  }, [loadFaculty]);

  useEffect(() => {
    if (!isHistoryOpen && !isAssignOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAssignOpen, isHistoryOpen]);

  const selectedFaculty = useMemo(
    () => facultyRows.find((faculty) => faculty.id === selectedFacultyId) ?? facultyRows[0] ?? null,
    [facultyRows, selectedFacultyId],
  );
  const selectedSubjects = selectedFaculty?.subjects ?? emptySubjects;
  const selectedHistory = selectedFaculty?.history ?? emptyHistory;
  const subjectConflictById = useMemo(() => {
    const conflicts = new Map<string, string>();

    availableSubjects.forEach((subject) => {
      const conflict = getScheduleConflict(subject, selectedSubjects);

      if (conflict) {
        conflicts.set(subject.id, formatConflictMessage(subject, conflict));
      }
    });

    return conflicts;
  }, [availableSubjects, selectedSubjects]);
  const selectedSubjectConflict = selectedAvailableSubjectId
    ? subjectConflictById.get(selectedAvailableSubjectId) ?? ""
    : "";

  const openAssignModal = () => {
    setAssignError("");
    setSelectedAvailableSubjectId(
      availableSubjects.find((subject) => !subjectConflictById.has(subject.id))?.id ?? "",
    );
    setIsAssignOpen(true);
  };

  const closeAssignModal = () => {
    setAssignError("");
    setSelectedAvailableSubjectId("");
    setIsAssigning(false);
    setIsAssignOpen(false);
  };

  const handleAssignSubject = async () => {
    if (!selectedFaculty) {
      setAssignError("Select a teacher before assigning a subject.");
      return;
    }

    const selectedSubject = availableSubjects.find(
      (subject) => subject.id === selectedAvailableSubjectId,
    );

    if (!selectedSubject) {
      setAssignError("Select one available subject.");
      return;
    }

    const conflictMessage = subjectConflictById.get(selectedSubject.id);

    if (conflictMessage) {
      setAssignError(conflictMessage);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setAssignError("Your session expired. Please log in again.");
      return;
    }

    setIsAssigning(true);
    setAssignError("");

    const response = await fetch("/api/tenant/faculty-loads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        facultyId: selectedFaculty.id,
        assignmentIds: selectedSubject.id.split("|"),
      }),
    });
    const payload: { error?: string } = await response.json().catch(() => ({}));

    if (!response.ok) {
      setIsAssigning(false);
      setAssignError(payload.error || "Unable to assign subject to this teacher.");
      return;
    }

    await loadFaculty();
    setIsAssigning(false);
    closeAssignModal();
  };

  const handleDeleteSubject = async (subject: SubjectAssignment) => {
    if (!selectedFaculty) {
      setLoadError("Select a teacher before removing a subject.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${subject.subjectCode} from ${selectedFaculty.name}'s teaching load?`,
    );

    if (!confirmed) {
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setLoadError("Your session expired. Please log in again.");
      return;
    }

    setRemovingSubjectId(subject.id);
    setLoadError("");

    const response = await fetch("/api/tenant/faculty-loads", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        facultyId: selectedFaculty.id,
        assignmentId: subject.id,
      }),
    });
    const payload: { error?: string } = await response.json().catch(() => ({}));

    if (!response.ok) {
      setLoadError(payload.error || "Unable to remove assigned subject.");
      setRemovingSubjectId("");
      return;
    }

    await loadFaculty();
    setRemovingSubjectId("");
  };

  if (isLoading) {
    return (
      <TenantLoadingScreen
        className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-level-1"
        label="Loading department faculty"
        useStoredBranding
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h1 className="text-[24px] font-bold leading-tight text-[var(--color-primary)]">
          Teaching Load Assignment
        </h1>

        {loadError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <section>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-bold text-[var(--color-high-emphasis)]">
              {department ? `${department} Department Faculty` : "Department Faculty"}
            </h2>
          </div>

          <div className="overflow-hidden rounded-md border border-[var(--color-default)] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[var(--color-primary)] text-white">
                  <tr>
                    <th className="px-3 py-3 text-[11px] font-medium">Faculty Name</th>
                    <th className="px-3 py-3 text-[11px] font-medium">Major</th>
                    <th className="px-3 py-3 text-[11px] font-medium">Employment Type</th>
                    <th className="px-3 py-3 text-[11px] font-medium">Assigned Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-default)] bg-white">
                  {facultyRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-8 text-center text-sm text-[var(--color-low-emphasis)]"
                      >
                        {emptyMessage || "No teachers found for this department."}
                      </td>
                    </tr>
                  ) : (
                    facultyRows.map((faculty) => {
                      const isSelected = faculty.id === selectedFaculty?.id;

                      return (
                        <tr
                          key={faculty.id}
                          onClick={() => setSelectedFacultyId(faculty.id)}
                          aria-selected={isSelected}
                          className={`cursor-pointer transition hover:bg-[var(--color-primary)]/10 ${
                            isSelected ? "bg-[var(--color-primary)]/15" : "bg-white"
                          }`}
                        >
                          <td className="px-3 py-3 text-[11px] font-bold text-[var(--color-high-emphasis)]">
                            {faculty.name}
                          </td>
                          <td className="px-3 py-3 text-[11px] text-[var(--color-high-emphasis)]">
                            {faculty.major || faculty.department || "-"}
                          </td>
                          <td className="px-3 py-3 text-[11px] text-[var(--color-high-emphasis)]">
                            {faculty.employmentType}
                          </td>
                          <td className="px-3 py-3 text-[11px] text-[var(--color-high-emphasis)]">
                            {faculty.assignedUnits}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="pt-1">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-[var(--color-primary)]">
              {selectedFaculty?.name ?? "Selected Faculty"}
            </h2>
            <button
              type="button"
              onClick={openAssignModal}
              disabled={!selectedFaculty}
              className="inline-flex h-8 items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 text-[11px] font-semibold text-white transition hover:bg-[var(--color-light-primary)]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Assign Subject
            </button>
          </div>

          <div className="overflow-hidden rounded-md border border-[var(--color-default)] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[var(--color-primary)] text-white">
                  <tr>
                    <th className="px-3 py-3 text-[11px] font-medium">Subject Title</th>
                    <th className="px-3 py-3 text-[11px] font-medium">Subject Code</th>
                    <th className="px-3 py-3 text-[11px] font-medium">Schedule</th>
                    <th className="px-3 py-3 text-[11px] font-medium">Room</th>
                    <th className="px-3 py-3 text-[11px] font-medium">Units</th>
                    <th className="px-3 py-3 text-[11px] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-default)] bg-white">
                  {selectedSubjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-sm text-[var(--color-low-emphasis)]"
                      >
                        No subjects assigned to this teacher yet.
                      </td>
                    </tr>
                  ) : (
                    selectedSubjects.map((subject) => (
                      <tr key={subject.id} className="transition hover:bg-[var(--color-primary)]/10">
                        <td className="px-3 py-3 text-[11px] font-bold text-[var(--color-high-emphasis)]">
                          {subject.subjectTitle}
                        </td>
                        <td className="px-3 py-3 text-[11px] text-[var(--color-high-emphasis)]">
                          {subject.subjectCode}
                        </td>
                        <td className="px-3 py-3 text-[11px] leading-4 text-[var(--color-high-emphasis)]">
                          {subject.schedule}
                        </td>
                        <td className="px-3 py-3 text-[11px] text-[var(--color-high-emphasis)]">
                          {subject.room}
                        </td>
                        <td className="px-3 py-3 text-[11px] text-[var(--color-high-emphasis)]">
                          {subject.units}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(subject)}
                            disabled={removingSubjectId === subject.id}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {removingSubjectId === subject.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              disabled={!selectedFaculty}
              className="min-h-8 rounded-md px-2 text-[12px] font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              View Edit History
            </button>
          </div>
        </section>
      </div>

      {isAssignOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={closeAssignModal}
        >
          <section
            className="flex h-[min(680px,calc(100vh-2rem))] w-full max-w-[980px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_18px_50px_rgba(15,23,42,0.24)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-subject-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-[var(--color-primary)] px-6 py-5 text-white">
              <h2 id="assign-subject-title" className="text-[20px] font-bold">
                Assign Subject to {selectedFaculty?.name ?? "Faculty"}
              </h2>
              <p className="mt-2 text-sm text-white/90">{department || "Department"}</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-6 py-6">
              <h3 className="text-[18px] font-bold text-[var(--color-high-emphasis)]">
                Available Subjects
              </h3>

              {assignError ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {assignError}
                </div>
              ) : null}

              {subjectConflictById.size > 0 ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Conflicting schedules are disabled for this teacher.
                </div>
              ) : null}

              <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--color-default)] bg-white">
                <div className="overflow-auto">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[var(--color-primary)] text-white">
                      <tr>
                        <th className="px-4 py-4 text-center text-[12px] font-medium">Select</th>
                        <th className="px-4 py-4 text-[12px] font-medium">Subject Title</th>
                        <th className="px-4 py-4 text-[12px] font-medium">Year Level</th>
                        <th className="px-4 py-4 text-[12px] font-medium">Schedule</th>
                        <th className="px-4 py-4 text-[12px] font-medium">Room</th>
                        <th className="px-4 py-4 text-[12px] font-medium">Section</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-default)] bg-white">
                      {availableSubjects.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12 text-center text-sm text-[var(--color-low-emphasis)]"
                          >
                            No approved scheduled subjects found for this department.
                          </td>
                        </tr>
                      ) : (
                        availableSubjects.map((subject) => {
                          const isSelected = selectedAvailableSubjectId === subject.id;
                          const conflictMessage = subjectConflictById.get(subject.id);
                          const isDisabled = Boolean(conflictMessage);

                          return (
                            <tr
                              key={subject.id}
                              onClick={() => {
                                if (!isDisabled) {
                                  setSelectedAvailableSubjectId(subject.id);
                                }
                              }}
                              aria-selected={isSelected}
                              aria-disabled={isDisabled}
                              className={`transition ${
                                isDisabled
                                  ? "cursor-not-allowed bg-slate-50 text-slate-400 opacity-70"
                                  : "cursor-pointer hover:bg-[var(--color-primary)]/10"
                              } ${
                                isSelected && !isDisabled
                                  ? "bg-[var(--color-primary)]/10"
                                  : isDisabled
                                    ? ""
                                    : "bg-white"
                              }`}
                            >
                              <td className="px-4 py-4 text-center">
                                <label
                                  className={`inline-flex h-6 w-6 items-center justify-center ${
                                    isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="available-subject"
                                    checked={isSelected && !isDisabled}
                                    disabled={isDisabled}
                                    onChange={() => {
                                      if (!isDisabled) {
                                        setSelectedAvailableSubjectId(subject.id);
                                      }
                                    }}
                                    className="sr-only"
                                    aria-label={
                                      conflictMessage ??
                                      `Select ${subject.subjectTitle}`
                                    }
                                  />
                                  <span
                                    aria-hidden="true"
                                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                                      isDisabled
                                        ? "border-slate-300 bg-slate-100"
                                        : isSelected
                                        ? "border-[var(--color-primary)]"
                                        : "border-[var(--color-primary)] bg-white"
                                    }`}
                                  >
                                    {isSelected && !isDisabled ? (
                                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                                    ) : null}
                                  </span>
                                </label>
                              </td>
                              <td className="px-4 py-4 text-[13px] text-[var(--color-high-emphasis)]">
                                {subject.subjectTitle}
                              </td>
                              <td className="px-4 py-4 text-[13px] text-[var(--color-high-emphasis)]">
                                {subject.yearLevel || "-"}
                              </td>
                              <td className="px-4 py-4 text-[13px] text-[var(--color-high-emphasis)]">
                                <div>{subject.schedule}</div>
                                {conflictMessage ? (
                                  <div className="mt-1 text-[11px] font-medium text-red-600">
                                    {conflictMessage}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-4 py-4 text-[13px] text-[var(--color-high-emphasis)]">
                                {subject.room || "-"}
                              </td>
                              <td className="px-4 py-4 text-[13px] text-[var(--color-high-emphasis)]">
                                {subject.section || "-"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="h-10 rounded-md border border-[var(--color-primary)] bg-white px-5 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-[var(--color-primary)]/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignSubject}
                  disabled={!selectedAvailableSubjectId || Boolean(selectedSubjectConflict) || isAssigning}
                  className="h-10 rounded-md bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAssigning ? "Assigning..." : "Assign Subject"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {isHistoryOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsHistoryOpen(false)}
        >
          <section
            className="w-full max-w-[760px] overflow-hidden rounded-lg bg-white shadow-[0_18px_50px_rgba(15,23,42,0.24)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-history-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 bg-[var(--color-primary)] px-5 py-4">
              <div>
                <h2 id="version-history-title" className="text-base font-bold text-white">
                  Version History
                </h2>
                <p className="mt-0.5 text-xs text-white/80">
                  {selectedFaculty?.name ?? "Selected faculty"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-md p-1 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close version history</span>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-5">
              <div className="overflow-hidden rounded-md border border-[var(--color-default)]">
                <table className="min-w-full border-collapse text-left">
                  <thead className="bg-[var(--color-primary)] text-white">
                    <tr>
                      <th className="px-3 py-3 text-[11px] font-medium">Version</th>
                      <th className="px-3 py-3 text-[11px] font-medium">Changed By</th>
                      <th className="px-3 py-3 text-[11px] font-medium">Date & Time</th>
                      <th className="px-3 py-3 text-[11px] font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-default)] bg-white">
                    {selectedHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-8 text-center text-sm text-[var(--color-low-emphasis)]"
                        >
                          No version history recorded for this teacher yet.
                        </td>
                      </tr>
                    ) : (
                      selectedHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-3 py-3 text-[11px] font-bold text-[var(--color-high-emphasis)]">
                            {entry.version}
                          </td>
                          <td className="px-3 py-3 text-[11px] text-[var(--color-high-emphasis)]">
                            {entry.changedBy}
                          </td>
                          <td className="px-3 py-3 text-[11px] text-[var(--color-high-emphasis)]">
                            {entry.changedAt}
                          </td>
                          <td className="px-3 py-3 text-[11px] text-[var(--color-high-emphasis)]">
                            {entry.action}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
