"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
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

  const openAssignModal = () => {
    setAssignError("");
    setSelectedAvailableSubjectId(availableSubjects[0]?.id ?? "");
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
                            className="text-[11px] font-medium text-red-600 transition hover:text-red-700"
                          >
                            Delete
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

                          return (
                            <tr
                              key={subject.id}
                              onClick={() => setSelectedAvailableSubjectId(subject.id)}
                              aria-selected={isSelected}
                              className={`cursor-pointer transition hover:bg-[var(--color-primary)]/10 ${
                                isSelected ? "bg-[var(--color-primary)]/10" : "bg-white"
                              }`}
                            >
                              <td className="px-4 py-4 text-center">
                                <label className="inline-flex h-6 w-6 cursor-pointer items-center justify-center">
                                  <input
                                    type="radio"
                                    name="available-subject"
                                    checked={isSelected}
                                    onChange={() => setSelectedAvailableSubjectId(subject.id)}
                                    className="sr-only"
                                    aria-label={`Select ${subject.subjectTitle}`}
                                  />
                                  <span
                                    aria-hidden="true"
                                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                                      isSelected
                                        ? "border-[var(--color-primary)]"
                                        : "border-[var(--color-primary)] bg-white"
                                    }`}
                                  >
                                    {isSelected ? (
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
                                {subject.schedule}
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
                  disabled={!selectedAvailableSubjectId || isAssigning}
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
