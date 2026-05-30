"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle, Clock, Eye, RotateCcw, X, XCircle } from "lucide-react";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import { supabase } from "@/lib/supabaseClient";

type ApprovalStatus =
  | "pending_chairman"
  | "pending_dean"
  | "pending_vpaa"
  | "approved"
  | "returned"
  | "rejected";

type Decision = "approve" | "return" | "reject";

type DepedLoadRequestPayload = {
  subjectConcerned?: string;
  requestType?: string;
  requestTypeLabel?: string;
  description?: string;
  departmentName?: string;
  teacherName?: string;
};

type DepedLoadRequest = {
  id: string;
  status: ApprovalStatus;
  title: string;
  targetLabel: string | null;
  payload: DepedLoadRequestPayload;
  submittedBy: { id: string; name: string; email: string } | null;
  chairmanRemarks: string | null;
  submittedAt: string;
  updatedAt: string;
  canAct: boolean;
  hasReviewHistory?: boolean;
};

const closedStatuses = new Set<ApprovalStatus>(["approved", "returned", "rejected"]);

const statusLabel: Record<ApprovalStatus, string> = {
  pending_chairman: "Pending Department Head",
  pending_dean: "Pending Dean",
  pending_vpaa: "Pending VPAA",
  approved: "Approved",
  returned: "Returned",
  rejected: "Rejected",
};

const statusClass: Record<ApprovalStatus, string> = {
  pending_chairman: "border border-amber-200 bg-amber-50 text-amber-700",
  pending_dean: "border border-amber-200 bg-amber-50 text-amber-700",
  pending_vpaa: "border border-blue-200 bg-blue-50 text-blue-700",
  approved: "border border-green-200 bg-green-50 text-green-700",
  returned: "border border-orange-200 bg-orange-50 text-orange-700",
  rejected: "border border-red-200 bg-red-50 text-red-700",
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

export default function LoadRequestsPanel() {
  const [requests, setRequests] = useState<DepedLoadRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<DepedLoadRequest | null>(null);
  const [decision, setDecision] = useState<Decision>("approve");
  const [remarks, setRemarks] = useState("");
  const [actionError, setActionError] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadRequests = async () => {
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

      const response = await fetch("/api/tenant/deped/load-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload: { requests?: DepedLoadRequest[]; error?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Unable to load teacher requests.");
        setRequests([]);
        return;
      }

      setRequests(payload.requests || []);
    } catch {
      setError("Unable to load teacher requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const stats = useMemo(
    () => ({
      pending: requests.filter((request) => !closedStatuses.has(request.status)).length,
      approved: requests.filter((request) => request.status === "approved").length,
      exceptions: requests.filter(
        (request) => request.status === "returned" || request.status === "rejected",
      ).length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    if (activeTab === "history") {
      return requests.filter(
        (request) => closedStatuses.has(request.status) || request.hasReviewHistory,
      );
    }

    return requests.filter((request) => !closedStatuses.has(request.status) && request.canAct);
  }, [activeTab, requests]);

  const openRequestModal = (request: DepedLoadRequest, nextDecision: Decision = "approve") => {
    setSelectedRequest(request);
    setDecision(nextDecision);
    setRemarks("");
    setActionError("");
    setSuccessMessage("");
  };

  const closeRequestModal = () => {
    setSelectedRequest(null);
    setDecision("approve");
    setRemarks("");
    setActionError("");
    setSubmittingAction(false);
  };

  const handleDecisionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRequest) {
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

      const response = await fetch("/api/tenant/deped/load-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          decision,
          remarks,
        }),
      });
      const payload: { error?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        setActionError(payload.error || "Unable to save decision.");
        return;
      }

      closeRequestModal();
      setActiveTab("history");
      setSuccessMessage(
        decision === "approve"
          ? "Approved. The request was saved to history."
          : decision === "return"
            ? "Returned. The request was saved to history."
            : "Rejected. The request was saved to history.",
      );
      await loadRequests();
    } catch {
      setActionError("Unable to save decision.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-high-emphasis)]">
          Teacher Load Requests
        </h2>
        <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
          Requests sent by teachers are routed to their assigned department head.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Pending Review" value={stats.pending} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="Returned / Rejected" value={stats.exceptions} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "pending" as const, label: "Pending Requests" },
          { key: "history" as const, label: "Request History" },
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

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          {successMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[var(--color-default)] bg-white shadow-level-1">
        <div className="border-b border-[var(--color-default)] px-5 py-4">
          <h3 className="text-lg font-bold text-[var(--color-high-emphasis)]">
            {activeTab === "pending" ? "Pending Requests" : "Request History"}
          </h3>
        </div>

        <div className="divide-y divide-[var(--color-default)]">
          {loading ? (
            <div className="space-y-4 px-5 py-5" role="status" aria-label="Loading load requests">
              <span className="sr-only">Loading load requests</span>
              {[0, 1].map((item) => (
                <div key={item} className="space-y-3 rounded-lg border border-[var(--color-default)] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <BrandedSkeletonBlock className="h-4 w-48" />
                    <BrandedSkeletonBlock className="h-5 w-28 rounded-full" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <BrandedSkeletonBlock className="h-3" />
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
                ? "No teacher load requests are waiting yet."
                : "No reviewed teacher load requests yet."}
            </p>
          ) : (
            filteredRequests.map((request) => (
              <article key={request.id} className="px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-[var(--color-high-emphasis)]">
                        {request.payload.requestTypeLabel || request.title}
                      </h4>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass[request.status]}`}>
                        {statusLabel[request.status]}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ["Teacher", request.payload.teacherName || request.submittedBy?.name || "Unknown"],
                        ["Department", request.payload.departmentName || "-"],
                        ["Subject", request.payload.subjectConcerned || request.targetLabel || "-"],
                        ["Submitted", formatDate(request.submittedAt)],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                            {label}
                          </p>
                          <p className="text-[var(--color-high-emphasis)]">{value}</p>
                        </div>
                      ))}
                    </div>

                    <p className="line-clamp-2 text-sm text-[var(--color-low-emphasis)]">
                      {request.payload.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => openRequestModal(request)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-default)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </button>
                    {request.canAct ? (
                      (Object.keys(decisionMeta) as Decision[]).map((nextDecision) => (
                        <button
                          key={nextDecision}
                          type="button"
                          onClick={() => openRequestModal(request, nextDecision)}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${decisionMeta[nextDecision].buttonClass}`}
                        >
                          {decisionMeta[nextDecision].icon}
                          {decisionMeta[nextDecision].label}
                        </button>
                      ))
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleDecisionSubmit}
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-level-2"
          >
            <div className="flex items-start justify-between gap-4 bg-[var(--color-primary)] px-6 py-5 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
                  DepEd teacher request
                </p>
                <h2 className="text-[22px] font-semibold leading-tight">
                  {selectedRequest.payload.requestTypeLabel || selectedRequest.title}
                </h2>
                <p className="mt-1 text-sm text-white/85">
                  {selectedRequest.payload.teacherName || selectedRequest.submittedBy?.name || "Unknown teacher"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRequestModal}
                className="rounded-full p-2 text-white/85 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Status", statusLabel[selectedRequest.status]],
                  ["Department", selectedRequest.payload.departmentName || "-"],
                  ["Subject Concerned", selectedRequest.payload.subjectConcerned || selectedRequest.targetLabel || "-"],
                  ["Submitted", formatDate(selectedRequest.submittedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[var(--color-default)] bg-[var(--color-background)] px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                      {label}
                    </p>
                    <p className="mt-1 text-[var(--color-high-emphasis)]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-[var(--color-default)] bg-white p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                  Teacher Message
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[var(--color-high-emphasis)]">
                  {selectedRequest.payload.description || "No description provided."}
                </p>
              </div>

              {selectedRequest.chairmanRemarks ? (
                <div className="rounded-lg border border-[var(--color-default)] bg-[var(--color-background)] p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                    Department Head Remarks
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[var(--color-high-emphasis)]">
                    {selectedRequest.chairmanRemarks}
                  </p>
                </div>
              ) : null}

              {selectedRequest.canAct ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(decisionMeta) as Decision[]).map((nextDecision) => (
                      <button
                        key={nextDecision}
                        type="button"
                        onClick={() => {
                          setDecision(nextDecision);
                          setActionError("");
                        }}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          decision === nextDecision
                            ? decisionMeta[nextDecision].buttonClass
                            : "border border-[var(--color-default)] bg-white text-[var(--color-high-emphasis)] hover:bg-[var(--color-primary-soft)]"
                        }`}
                      >
                        {decisionMeta[nextDecision].icon}
                        {decisionMeta[nextDecision].label}
                      </button>
                    ))}
                  </div>

                  <label htmlFor="deped-load-request-remarks" className="block text-sm font-semibold text-[var(--color-high-emphasis)]">
                    Remarks {decision === "approve" ? <span className="text-[var(--color-low-emphasis)]">(optional)</span> : <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    id="deped-load-request-remarks"
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
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--color-default)] px-6 py-4">
              <button
                type="button"
                onClick={closeRequestModal}
                className="rounded-lg border border-[var(--color-default)] px-4 py-2 text-sm font-semibold text-[var(--color-high-emphasis)] hover:bg-[var(--color-primary-soft)]"
                disabled={submittingAction}
              >
                Close
              </button>
              {selectedRequest.canAct ? (
                <button
                  type="submit"
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${decisionMeta[decision].buttonClass}`}
                  disabled={submittingAction}
                >
                  {decisionMeta[decision].icon}
                  {submittingAction ? "Saving..." : decisionMeta[decision].label}
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
