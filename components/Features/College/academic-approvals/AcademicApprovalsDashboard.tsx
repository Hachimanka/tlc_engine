"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CheckCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import { supabase } from "@/lib/supabaseClient";

type ApprovalRequestType =
  | "subject"
  | "teaching_load"
  | "schedule_conflict"
  | "overload_exception"
  | "adjustment_request";

type ApprovalStatus =
  | "pending_dean"
  | "pending_vpaa"
  | "approved"
  | "returned"
  | "rejected";

type ApprovalRequest = {
  id: string;
  requestType: ApprovalRequestType;
  status: ApprovalStatus;
  title: string;
  targetLabel: string | null;
  payload: unknown;
  submittedBy: { id: string; name: string; email: string } | null;
  deanRemarks: string | null;
  vpaaRemarks: string | null;
  decisionHistory: unknown[];
  submittedAt: string;
  updatedAt: string;
  canAct: boolean;
};

type Decision = "approve" | "return" | "reject";

const categories: { key: ApprovalRequestType | "history"; label: string; empty: string }[] = [
  {
    key: "subject",
    label: "Subject Approvals",
    empty: "No subject approvals are waiting yet.",
  },
  {
    key: "teaching_load",
    label: "Teaching Load Approvals",
    empty: "Teaching load approval requests will appear here once load modules submit them.",
  },
  {
    key: "schedule_conflict",
    label: "Schedule Conflicts",
    empty: "Schedule conflict requests will appear here once schedule modules submit them.",
  },
  {
    key: "overload_exception",
    label: "Overload Exceptions",
    empty: "Overload exception requests will appear here once load modules submit them.",
  },
  {
    key: "adjustment_request",
    label: "Adjustment Requests",
    empty: "Adjustment requests will appear here once request modules submit them.",
  },
  {
    key: "history",
    label: "Approval History",
    empty: "No closed approval requests yet.",
  },
];

const closedStatuses = new Set<ApprovalStatus>(["approved", "returned", "rejected"]);

const statusLabel: Record<ApprovalStatus, string> = {
  pending_dean: "Pending Dean",
  pending_vpaa: "Pending VPAA",
  approved: "Approved",
  returned: "Returned",
  rejected: "Rejected",
};

const statusClass: Record<ApprovalStatus, string> = {
  pending_dean: "bg-amber-50 text-amber-700 border border-amber-200",
  pending_vpaa: "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-green-50 text-green-700 border border-green-200",
  returned: "bg-orange-50 text-orange-700 border border-orange-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
};

const decisionMeta: Record<Decision, { label: string; icon: ReactNode; buttonClass: string }> = {
  approve: {
    label: "Approve",
    icon: <CheckCircle className="h-4 w-4" aria-hidden="true" />,
    buttonClass: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-light-primary)]",
  },
  return: {
    label: "Return",
    icon: <RotateCcw className="h-4 w-4" aria-hidden="true" />,
    buttonClass: "bg-amber-500 text-white hover:bg-amber-600",
  },
  reject: {
    label: "Reject",
    icon: <XCircle className="h-4 w-4" aria-hidden="true" />,
    buttonClass: "bg-red-600 text-white hover:bg-red-700",
  },
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toText = (value: unknown) => (typeof value === "string" ? value : "");

const formatDate = (value: string) => {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "Unknown date";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getSubjectDetails = (payload: unknown) => {
  const subject = asRecord(payload);

  return [
    ["Subject Code", toText(subject.subjectCode)],
    ["Subject Title", toText(subject.subjectTitle)],
    ["Department", toText(subject.department)],
    ["Year Level", toText(subject.yearLevel)],
    ["Units", String(subject.units ?? "")],
    ["Lecture Hours", String(subject.lectureHours ?? "")],
    ["Laboratory Hours", String(subject.labHours ?? "")],
    ["Meetings/Week", String(subject.meetingsPerWeek ?? "")],
  ].filter(([, value]) => value);
};

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-default)] bg-white px-4 py-3 shadow-level-1">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-high-emphasis)]">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-default)] text-[var(--color-primary)]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AcademicApprovalsDashboard() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<ApprovalRequestType | "history">("subject");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionRequest, setActionRequest] = useState<ApprovalRequest | null>(null);
  const [decision, setDecision] = useState<Decision>("approve");
  const [remarks, setRemarks] = useState("");
  const [actionError, setActionError] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadApprovals = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError("Your session expired. Please log in again.");
        setRequests([]);
        return;
      }

      const response = await fetch("/api/tenant/academic-approvals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload: { requests?: ApprovalRequest[]; error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Unable to load approval requests.");
        setRequests([]);
        return;
      }

      setRequests(payload.requests || []);
    } catch {
      setError("Unable to load approval requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const filteredRequests = useMemo(() => {
    if (activeTab === "history") {
      return requests.filter((request) => closedStatuses.has(request.status));
    }

    return requests.filter((request) => request.requestType === activeTab);
  }, [activeTab, requests]);

  const stats = useMemo(
    () => ({
      dean: requests.filter((request) => request.status === "pending_dean").length,
      vpaa: requests.filter((request) => request.status === "pending_vpaa").length,
      approved: requests.filter((request) => request.status === "approved").length,
      exceptions: requests.filter((request) => request.status === "returned" || request.status === "rejected").length,
    }),
    [requests],
  );

  const openDecisionModal = (request: ApprovalRequest, nextDecision: Decision) => {
    setActionRequest(request);
    setDecision(nextDecision);
    setRemarks("");
    setActionError("");
  };

  const closeDecisionModal = () => {
    setActionRequest(null);
    setDecision("approve");
    setRemarks("");
    setActionError("");
    setSubmittingAction(false);
  };

  const handleDecisionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!actionRequest) {
      return;
    }

    if ((decision === "return" || decision === "reject") && !remarks.trim()) {
      setActionError("Remarks are required for this decision.");
      return;
    }

    setSubmittingAction(true);
    setActionError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setActionError("Your session expired. Please log in again.");
        return;
      }

      const response = await fetch(`/api/tenant/academic-approvals/${actionRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          remarks,
        }),
      });
      const payload: { error?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        setActionError(payload.error || "Unable to save decision.");
        return;
      }

      closeDecisionModal();
      await loadApprovals();
    } catch {
      setActionError("Unable to save decision.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const activeCategory = categories.find((category) => category.key === activeTab) ?? categories[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold text-[var(--color-high-emphasis)]">
          Academic Approval Center
        </h1>
        <p className="text-sm text-[var(--color-low-emphasis)]">
          Review subjects, loads, schedules, and academic exceptions assigned to your role.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Pending Dean" value={stats.dean} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Pending VPAA" value={stats.vpaa} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="Returned / Rejected" value={stats.exceptions} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => setActiveTab(category.key)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === category.key
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-default)] bg-white text-[var(--color-high-emphasis)] hover:bg-[#ecf8f6]"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-[var(--color-default)] bg-white shadow-level-1">
        <div className="border-b border-[var(--color-default)] px-5 py-4">
          <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
            {activeCategory.label}
          </h2>
        </div>

        <div className="divide-y divide-[var(--color-default)]">
          {loading ? (
            <div className="space-y-4 px-5 py-5" role="status" aria-label="Loading approval requests">
              <span className="sr-only">Loading approval requests</span>
              {[0, 1, 2].map((item) => (
                <div key={item} className="animate-pulse space-y-3 rounded-lg border border-[var(--color-default)] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <BrandedSkeletonBlock className="h-4 w-48" />
                    <BrandedSkeletonBlock className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <BrandedSkeletonBlock className="h-3" />
                    <BrandedSkeletonBlock className="h-3" />
                    <BrandedSkeletonBlock className="h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--color-low-emphasis)]">{activeCategory.empty}</p>
          ) : (
            filteredRequests.map((request) => {
              const details = getSubjectDetails(request.payload);

              return (
                <article key={request.id} className="px-5 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-[var(--color-high-emphasis)]">
                          {request.title}
                        </h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass[request.status]}`}>
                          {statusLabel[request.status]}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        {details.map(([label, value]) => (
                          <div key={label}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                              {label}
                            </p>
                            <p className="text-[var(--color-high-emphasis)]">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--color-low-emphasis)]">
                        <span>Submitted: {formatDate(request.submittedAt)}</span>
                        <span>By: {request.submittedBy?.name || "Unknown submitter"}</span>
                        {request.deanRemarks ? <span>Dean remarks: {request.deanRemarks}</span> : null}
                        {request.vpaaRemarks ? <span>VPAA remarks: {request.vpaaRemarks}</span> : null}
                      </div>
                    </div>

                    {request.canAct ? (
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {(Object.keys(decisionMeta) as Decision[]).map((nextDecision) => (
                          <button
                            key={nextDecision}
                            type="button"
                            onClick={() => openDecisionModal(request, nextDecision)}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${decisionMeta[nextDecision].buttonClass}`}
                          >
                            {decisionMeta[nextDecision].icon}
                            {decisionMeta[nextDecision].label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {actionRequest ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleDecisionSubmit}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-level-2"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-default)] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">
                  {decisionMeta[decision].label} Request
                </h2>
                <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
                  {actionRequest.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDecisionModal}
                className="rounded-full p-2 text-[var(--color-low-emphasis)] hover:bg-[var(--color-default)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 px-6 py-5">
              <label htmlFor="approval-remarks" className="text-sm font-semibold text-[var(--color-high-emphasis)]">
                Remarks {decision === "approve" ? <span className="text-[var(--color-low-emphasis)]">(optional)</span> : <span className="text-red-500">*</span>}
              </label>
              <textarea
                id="approval-remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={4}
                placeholder="Add review notes..."
                className="w-full resize-none rounded-lg border border-[var(--color-default)] px-3 py-2 text-sm text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)]"
              />
              {actionError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {actionError}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--color-default)] px-6 py-4">
              <button
                type="button"
                onClick={closeDecisionModal}
                className="rounded-lg border border-[var(--color-default)] px-4 py-2 text-sm font-semibold text-[var(--color-high-emphasis)] hover:bg-[#ecf8f6]"
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${decisionMeta[decision].buttonClass}`}
                disabled={submittingAction}
              >
                {decisionMeta[decision].icon}
                {submittingAction ? "Saving..." : decisionMeta[decision].label}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
