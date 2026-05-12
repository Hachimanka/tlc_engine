"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Filter, Plus, X } from "lucide-react";
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

    setShowForm(false);
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
    <div>
      <h1 className="mb-6 text-[28px] font-bold text-[#1F2125]">Subject Management</h1>

      {showForm ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1F2125]">Create Subject</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 transition-colors hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          {submitError ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-[#1F2125]">
                Subject Title <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g., Data Structures and Algorithms"
                className="w-full rounded-lg border border-[#C5EEEA] bg-white px-3 py-2.5 text-sm focus:border-[#006B5F] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#1F2125]">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder="e.g., CS401"
                className="w-full rounded-lg border border-[#C5EEEA] bg-white px-3 py-2.5 text-sm uppercase focus:border-[#006B5F] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#1F2125]">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={form.department}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                className="w-full rounded-lg border border-[#C5EEEA] bg-white px-3 py-2.5 text-sm focus:border-[#006B5F] focus:outline-none"
              >
                <option value="">Select Department</option>
                {departmentSelectOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-[#1F2125]">
                  Units <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.units}
                  type="number"
                  min="0"
                  onChange={(event) => setForm((current) => ({ ...current, units: event.target.value }))}
                  placeholder="e.g., 3"
                  className="w-full rounded-lg border border-[#C5EEEA] bg-white px-3 py-2.5 text-sm focus:border-[#006B5F] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#1F2125]">Year Level</label>
                <select
                  value={form.level}
                  onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
                  className="w-full rounded-lg border border-[#C5EEEA] bg-white px-3 py-2.5 text-sm focus:border-[#006B5F] focus:outline-none"
                >
                  {levelSelectOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-[#1F2125]">Lecture Hours/Week</label>
                <input
                  value={form.lecHours}
                  type="number"
                  min="0"
                  onChange={(event) => setForm((current) => ({ ...current, lecHours: event.target.value }))}
                  placeholder="e.g., 2"
                  className="w-full rounded-lg border border-[#C5EEEA] bg-white px-3 py-2.5 text-sm focus:border-[#006B5F] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#1F2125]">Laboratory Hours/Week</label>
                <input
                  value={form.labHours}
                  type="number"
                  min="0"
                  onChange={(event) => setForm((current) => ({ ...current, labHours: event.target.value }))}
                  placeholder="e.g., 3"
                  className="w-full rounded-lg border border-[#C5EEEA] bg-white px-3 py-2.5 text-sm focus:border-[#006B5F] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#1F2125]">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Brief description of the subject"
                rows={3}
                className="w-full resize-none rounded-lg border border-[#C5EEEA] bg-white px-3 py-2.5 text-sm focus:border-[#006B5F] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 rounded-lg bg-[#006B5F] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#005a4f]"
            >
              Submit for approval
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-[#006B5F] py-2.5 text-sm font-medium text-[#006B5F] transition-colors hover:bg-[#f0faf9]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-gray-400" stroke="currentColor" strokeWidth={1.8}>
                <path d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="search"
                placeholder="Search subject by code or name...."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-full w-full bg-transparent text-sm text-[#1F2125] outline-none placeholder:text-gray-400"
              />
            </div>

            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50">
              <Filter size={16} />
            </button>

            <div className="relative flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3">
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="appearance-none bg-transparent pr-6 text-sm font-medium text-[#1F2125] outline-none"
              >
                {departmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3">
              <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
                className="appearance-none bg-transparent pr-6 text-sm font-medium text-[#1F2125] outline-none"
              >
                {levelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {canSubmitSubject ? (
              <button
                type="button"
                onClick={() => {
                  setSubmitError("");
                  setShowForm(true);
                }}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#006B5F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#005a4f]"
              >
                <Plus size={16} /> Create Subject
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#006B5F] text-white">
                    {["Subject Title", "Subject Code", "Department", "Lec Hours", "Lab Hours", "Units", "Date Created", "Status", "Description", "Year Level"].map((col) => (
                      <th key={col} className="whitespace-nowrap px-4 py-3 text-xs font-semibold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">Loading subjects...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">No subjects found.</td>
                    </tr>
                  ) : (
                    filtered.map((subject) => (
                      <tr key={`${subject.source}-${subject.id}`} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-[#1F2125]">{subject.title}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#1F2125]">{subject.code}</td>
                        <td className="px-4 py-3 text-xs text-[#1F2125]">{subject.department}</td>
                        <td className="px-4 py-3 text-xs text-[#1F2125]">{subject.lecHours}</td>
                        <td className="px-4 py-3 text-xs text-[#1F2125]">{subject.labHours}</td>
                        <td className="px-4 py-3 text-xs text-[#1F2125]">{subject.units}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatDate(subject.dateCreated)}</td>
                        <td className={`px-4 py-3 text-xs font-medium ${statusColor[subject.status]}`}>
                          {statusLabel[subject.status]}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-xs text-gray-400" title={subject.description}>
                          {subject.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#1F2125]">{subject.level || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6f4f2]">
                  <CheckCircle size={22} className="text-[#006B5F]" />
                </div>
                <h2 className="text-lg font-bold text-[#1F2125]">Submit for Approval</h2>
              </div>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <p className="mb-3 text-sm font-medium text-[#1F2125]">
              You are about to submit the following subject for Dean approval:
            </p>

            <div className="mb-4 space-y-1 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-[#1F2125]"><span className="font-medium">Subject Code:</span> {form.code}</p>
              <p className="text-sm text-[#1F2125]"><span className="font-medium">Subject Name:</span> {form.title}</p>
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
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-[#1F2125] hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-[#006B5F] py-2.5 text-sm font-medium text-white hover:bg-[#005a4f] disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Confirm Submission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
