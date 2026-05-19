"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Plus, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type SubjectStatus =
  | "pending_dean"
  | "pending_vpaa"
  | "approved"
  | "returned"
  | "rejected";

type Subject = {
  id: string;
  source: "catalog" | "approval_request";
  approvalRequestId: string | null;
  title: string;
  code: string;
  department: string;
  lecHours: number;
  labHours: number;
  units: number;
  dateCreated: string;
  status: SubjectStatus;
  description: string;
  level: string;
  updatedAt: string;
  deanRemarks: string | null;
  vpaaRemarks: string | null;
};

type FormData = {
  title: string;
  code: string;
  department: string;
  units: string;
  lecHours: string;
  labHours: string;
  description: string;
  level: string;
};

const emptyForm: FormData = {
  title: "",
  code: "",
  department: "",
  units: "",
  lecHours: "",
  labHours: "",
  description: "",
  level: "Second Year",
};

const departmentOptions = ["All Departments", "Computer Engineering", "Civil Engineering", "Electrical Engineering", "Information Technology"];
const levelOptions = ["All Levels", "First Year", "Second Year", "Third Year", "Fourth Year"];
const departmentSelectOptions = departmentOptions.filter((option) => option !== "All Departments");
const levelSelectOptions = levelOptions.filter((option) => option !== "All Levels");

const statusLabel: Record<SubjectStatus, string> = {
  pending_dean: "Pending Dean",
  pending_vpaa: "Pending VPAA",
  approved: "Approved",
  returned: "Returned",
  rejected: "Rejected",
};

const statusColor: Record<SubjectStatus, string> = {
  pending_dean: "text-amber-600",
  pending_vpaa: "text-blue-600",
  approved: "text-[var(--color-primary)]",
  returned: "text-orange-600",
  rejected: "text-red-500",
};

const formatDate = (value: string) => {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return value || "Unknown";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
};

export default function SubjectManagementTable() {
  const [search, setSearch] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [levelFilter, setLevelFilter] = useState("All Levels");
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canSubmitSubject, setCanSubmitSubject] = useState(false);

  const loadSubjects = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError("Your session expired. Please log in again.");
        setSubjects([]);
        setCanSubmitSubject(false);
        return;
      }

      const response = await fetch("/api/tenant/subjects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload: { subjects?: Subject[]; canSubmit?: boolean; error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Unable to load subjects.");
        setSubjects([]);
        setCanSubmitSubject(false);
        return;
      }

      setSubjects(payload.subjects || []);
      setCanSubmitSubject(Boolean(payload.canSubmit));
    } catch {
      setError("Unable to load subjects.");
      setSubjects([]);
      setCanSubmitSubject(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!showForm && !showConfirm) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showConfirm, showForm]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      const matchSearch =
        !normalizedSearch ||
        subject.title.toLowerCase().includes(normalizedSearch) ||
        subject.code.toLowerCase().includes(normalizedSearch);
      const matchDept = departmentFilter === "All Departments" || subject.department === departmentFilter;
      const matchLevel = levelFilter === "All Levels" || subject.level === levelFilter;

      return matchSearch && matchDept && matchLevel;
    });
  }, [departmentFilter, levelFilter, search, subjects]);

  const handleSubmit = () => {
    setSubmitError("");

    if (!canSubmitSubject) {
      setSubmitError("Your role can view subjects but cannot submit new subject approvals.");
      return;
    }

    if (!form.title || !form.code || !form.department || !form.units) {
      setSubmitError("Subject title, code, department, and units are required.");
      return;
    }

    if (Number(form.units) <= 0) {
      setSubmitError("Units must be greater than zero.");
      return;
    }

    setShowConfirm(true);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSubmitError("");
    setShowForm(false);
    setShowConfirm(false);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setSubmitError("Your session expired. Please log in again.");
        return;
      }

      const response = await fetch("/api/tenant/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectTitle: form.title,
          subjectCode: form.code,
          department: form.department,
          units: Number(form.units),
          lectureHours: Number(form.lecHours || 0),
          labHours: Number(form.labHours || 0),
          description: form.description,
          yearLevel: form.level,
        }),
      });
      const payload: { subject?: Subject; error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !payload.subject) {
        setSubmitError(payload.error || "Unable to submit subject for approval.");
        return;
      }

      setSubjects((current) => [payload.subject as Subject, ...current]);
      resetForm();
    } catch {
      setSubmitError("Unable to submit subject for approval.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-high-emphasis)]">
          Subject Management
        </h1>
        <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
          Create subjects and track Dean/VPAA approval status.
        </p>
      </div>

      {showForm ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-[760px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-subject-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 bg-[var(--color-primary)] px-5 py-4">
              <h2 id="create-subject-title" className="text-base font-bold text-white">
                Create Subject
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md p-1 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close create subject form</span>
              </button>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5">
              {submitError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submitError}
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="space-y-1 lg:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Subject Title <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="e.g., Data Structures and Algorithms"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Subject Code <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                    placeholder="e.g., CS401"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm uppercase outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Department <span className="text-red-500">*</span>
                  </span>
                  <select
                    value={form.department}
                    onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">Select Department</option>
                    {departmentSelectOptions.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Units <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={form.units}
                    type="number"
                    min="0"
                    onChange={(event) => setForm((current) => ({ ...current, units: event.target.value }))}
                    placeholder="e.g., 3"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Year Level
                  </span>
                  <select
                    value={form.level}
                    onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  >
                    {levelSelectOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Lecture Hours/Week
                  </span>
                  <input
                    value={form.lecHours}
                    type="number"
                    min="0"
                    onChange={(event) => setForm((current) => ({ ...current, lecHours: event.target.value }))}
                    placeholder="e.g., 2"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Laboratory Hours/Week
                  </span>
                  <input
                    value={form.labHours}
                    type="number"
                    min="0"
                    onChange={(event) => setForm((current) => ({ ...current, labHours: event.target.value }))}
                    placeholder="e.g., 3"
                    className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1 lg:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-high-emphasis)]">
                    Description
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Brief description of the subject"
                    rows={3}
                    className="w-full resize-none rounded-md border border-[var(--color-default)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)]"
                >
                  Submit for Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-[var(--color-default)] bg-white p-4 shadow-level-1">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
            <span className="sr-only">Search subjects</span>
            <input
              type="search"
              placeholder="Search subject by code or name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
            />
          </label>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="h-10 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
            aria-label="Filter by department"
          >
            {departmentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            className="h-10 rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
            aria-label="Filter by year level"
          >
            {levelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          {canSubmitSubject ? (
            <button
              type="button"
              onClick={() => {
                setSubmitError("");
                setShowForm(true);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Subject
            </button>
          ) : null}
        </div>
      </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-[var(--color-default)] bg-white shadow-level-1">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[var(--color-primary)] text-white">
                  <tr>
                    {["Subject Title", "Subject Code", "Department", "Lec Hours", "Lab Hours", "Units", "Date Created", "Status", "Description", "Year Level"].map((col) => (
                      <th key={col} className="whitespace-nowrap px-4 py-3 text-xs font-semibold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-default)] bg-white">
                  {loading ? (
                    <>
                      {[0, 1, 2, 3, 4].map((row) => (
                        <tr key={row} className="animate-pulse">
                          {Array.from({ length: 10 }).map((_, column) => (
                            <td key={column} className="px-4 py-3">
                              <div className="h-3 w-full min-w-16 rounded bg-[var(--color-default)]" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-sm text-[var(--color-low-emphasis)]">No subjects found.</td>
                    </tr>
                  ) : (
                    filtered.map((subject) => (
                      <tr key={`${subject.source}-${subject.id}`} className="transition-colors hover:bg-[#ecf8f6]">
                        <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">{subject.title}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-[var(--color-high-emphasis)]">{subject.code}</td>
                        <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">{subject.department}</td>
                        <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">{subject.lecHours}</td>
                        <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">{subject.labHours}</td>
                        <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">{subject.units}</td>
                        <td className="px-4 py-3 text-xs text-[var(--color-low-emphasis)]">{formatDate(subject.dateCreated)}</td>
                        <td className={`px-4 py-3 text-xs font-medium ${statusColor[subject.status]}`}>
                          {statusLabel[subject.status]}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-xs text-[var(--color-low-emphasis)]" title={subject.description}>
                          {subject.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-high-emphasis)]">{subject.level || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      {showConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between bg-[var(--color-primary)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle size={22} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Submit for Approval</h2>
              </div>
              <button onClick={() => setShowConfirm(false)} className="text-white/75 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="mb-3 text-sm font-medium text-[var(--color-high-emphasis)]">
                You are about to submit the following subject for Dean approval:
              </p>

              <div className="mb-4 space-y-1 rounded-lg bg-[var(--color-background)] p-4">
                <p className="text-sm text-[var(--color-high-emphasis)]"><span className="font-medium">Subject Code:</span> {form.code}</p>
                <p className="text-sm text-[var(--color-high-emphasis)]"><span className="font-medium">Subject Name:</span> {form.title}</p>
              </div>

              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">Note:</span> After Dean approval, this subject will move to VPAA for final approval.
                </p>
              </div>

              {submitError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submitError}
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-lg border border-[var(--color-default)] py-2.5 text-sm font-medium text-[var(--color-high-emphasis)] hover:bg-[var(--color-background)]"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-light-primary)] disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Confirm Submission"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
