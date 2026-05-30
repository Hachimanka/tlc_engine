"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle, Clock, RotateCcw, X, XCircle } from "lucide-react";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import { supabase } from "@/lib/supabaseClient";

type ApprovalStatus = "pending" | "approved" | "returned" | "rejected";
type Decision = "approve" | "return" | "reject";

type DepedSubjectApproval = {
  id: string;
  status: ApprovalStatus;
  statusLabel: string;
  title: string;
  payload: {
    subjectTitle: string;
    department: string;
    yearLevel: string;
    classDuration: string;
    dateCreated: string;
    description: string;
  };
  submittedBy: { id: string; name: string; email: string } | null;
  principalRemarks: string | null;
  reviewedBy: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  canAct: boolean;
};

const closedStatuses = new Set<ApprovalStatus>(["approved", "returned", "rejected"]);

const statusClass: Record<ApprovalStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
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

const formatDate = (value: string | null) => {
  if (!value) {
    return "Not reviewed";
  }

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

export default function DepedSubjectApprovalsDashboard() {
  const [requests, setRequests] = useState<DepedSubjectApproval[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionRequest, setActionRequest] = useState<DepedSubjectApproval | null>(null);
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

      const response = await fetch("/api/tenant/deped/subject-approvals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload: { requests?: DepedSubjectApproval[]; error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Unable to load subject approvals.");
        setRequests([]);
        return;
      }

      setRequests(payload.requests || []);
    } catch {
      setError("Unable to load subject approvals.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const stats = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === "pending").length,
      approved: requests.filter((request) => request.status === "approved").length,
      exceptions: requests.filter(
        (request) => request.status === "returned" || request.status === "rejected",
      ).length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    if (activeTab === "history") {
      return requests.filter((request) => closedStatuses.has(request.status));
    }

    return requests.filter((request) => request.status === "pending");
  }, [activeTab, requests]);

  const openDecisionModal = (request: DepedSubjectApproval, nextDecision: Decision) => {
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

      const response = await fetch("/api/tenant/deped/subject-approvals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: actionRequest.id,
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold text-[var(--color-high-emphasis)]">
          Subject Approval Center
        </h1>
        <p className="text-sm text-[var(--color-low-emphasis)]">
          Review DepEd subjects submitted by subject managers before they become approved.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Pending Principal" value={stats.pending} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="Returned / Rejected" value={stats.exceptions} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "pending" as const, label: "Subject Approvals" },
          { key: "history" as const, label: "Approval History" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-default)] bg-white text-[var(--color-high-emphasis)] hover:bg-[var(--color-primary-soft)]"
            }`}
          >
            {tab.label}
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
            {activeTab === "pending" ? "Subject Approvals" : "Approval History"}
          </h2>
        </div>

        <div className="divide-y divide-[var(--color-default)]">
          {loading ? (
            <div className="space-y-4 px-5 py-5" role="status" aria-label="Loading subject approvals">
              <span className="sr-only">Loading subject approvals</span>
              {[0, 1, 2].map((item) => (
                <div key={item} className="space-y-3 rounded-lg border border-[var(--color-default)] px-4 py-4">
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
            <p className="px-5 py-8 text-sm text-[var(--color-low-emphasis)]">
              {activeTab === "pending"
                ? "No subject approvals are waiting yet."
                : "No closed subject approvals yet."}
            </p>
          ) : (
            filteredRequests.map((request) => (
              <article key={request.id} className="px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[var(--color-high-emphasis)]">
                        {request.title}
                      </h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass[request.status]}`}>
                        {request.statusLabel}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["Subject Title", request.payload.subjectTitle],
                        ["Department", request.payload.department],
                        ["Year Level", request.payload.yearLevel],
                        ["Class Duration", request.payload.classDuration],
                        ["Date Created", request.payload.dateCreated],
                        ["Description", request.payload.description || "-"],
                      ].map(([label, value]) => (
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
                      {request.principalRemarks ? <span>Principal remarks: {request.principalRemarks}</span> : null}
                      {request.reviewedAt ? <span>Reviewed: {formatDate(request.reviewedAt)}</span> : null}
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
            ))
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
                  {decisionMeta[decision].label} Subject
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
                className="rounded-lg border border-[var(--color-default)] px-4 py-2 text-sm font-semibold text-[var(--color-high-emphasis)] hover:bg-[var(--color-primary-soft)]"
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
