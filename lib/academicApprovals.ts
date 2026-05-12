import "server-only";

import { NextResponse } from "next/server";
import type { TenantContext } from "@/lib/tenantAccess";

export type ApprovalRequestType =
  | "subject"
  | "teaching_load"
  | "schedule_conflict"
  | "overload_exception"
  | "adjustment_request";

export type ApprovalStatus =
  | "pending_dean"
  | "pending_vpaa"
  | "approved"
  | "returned"
  | "rejected";

export type SubjectPayload = {
  subjectTitle: string;
  subjectCode: string;
  department: string;
  yearLevel: string;
  lectureHours: number;
  labHours: number;
  units: number;
  description: string;
};

export type AcademicApprovalRow = {
  id: string;
  org_id: string;
  request_type: ApprovalRequestType;
  status: ApprovalStatus;
  title: string;
  target_label: string | null;
  payload: unknown;
  submitted_by_org_user_id: string | null;
  reviewed_by_dean_org_user_id: string | null;
  reviewed_by_vpaa_org_user_id: string | null;
  dean_remarks: string | null;
  vpaa_remarks: string | null;
  decision_history: unknown;
  submitted_at: string;
  dean_reviewed_at: string | null;
  vpaa_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const SUBJECT_APPROVAL_TYPE: ApprovalRequestType = "subject";

export const ACTIVE_SUBJECT_APPROVAL_STATUSES: ApprovalStatus[] = [
  "pending_dean",
  "pending_vpaa",
];

export const finalStatuses = new Set<ApprovalStatus>([
  "approved",
  "returned",
  "rejected",
]);

export const allowedSubjectSubmitterRoles = new Set([
  "org_admin",
  "subject_room_manager",
  "department_head",
]);

export const canUseHigherEdApprovals = (context: TenantContext) =>
  context.institutionType === "higher_ed";

export const canSubmitSubject = (context: TenantContext) =>
  context.isOrgAdmin || allowedSubjectSubmitterRoles.has(context.role.key);

export const canViewApprovals = (context: TenantContext) =>
  context.isOrgAdmin || context.role.key === "dean" || context.role.key === "vpaa";

export const canReviewStatus = (
  context: TenantContext,
  status: ApprovalStatus,
) => {
  if (context.isOrgAdmin) {
    return status === "pending_dean" || status === "pending_vpaa";
  }

  if (status === "pending_dean") {
    return context.role.key === "dean";
  }

  if (status === "pending_vpaa") {
    return context.role.key === "vpaa";
  }

  return false;
};

export const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toText = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeSubjectCode = (value: string) =>
  value.trim().replace(/\s+/g, " ").toUpperCase();

export const getSubjectPayload = (value: unknown): SubjectPayload => {
  const payload = asRecord(value);

  return {
    subjectTitle: toText(payload.subjectTitle),
    subjectCode: normalizeSubjectCode(toText(payload.subjectCode)),
    department: toText(payload.department),
    yearLevel: toText(payload.yearLevel, "Second Year"),
    lectureHours: toNumber(payload.lectureHours),
    labHours: toNumber(payload.labHours),
    units: toNumber(payload.units),
    description: toText(payload.description),
  };
};

export const buildDecisionHistory = (
  currentHistory: unknown,
  nextEntry: Record<string, unknown>,
) => {
  const history = Array.isArray(currentHistory) ? currentHistory : [];

  return [
    ...history.filter((entry) => typeof entry === "object" && entry !== null),
    nextEntry,
  ];
};

export const mapApprovalRequest = (
  request: AcademicApprovalRow,
  context: TenantContext,
) => ({
  id: request.id,
  requestType: request.request_type,
  status: request.status,
  title: request.title,
  targetLabel: request.target_label,
  payload: request.payload,
  submittedByOrgUserId: request.submitted_by_org_user_id,
  deanRemarks: request.dean_remarks,
  vpaaRemarks: request.vpaa_remarks,
  decisionHistory: Array.isArray(request.decision_history)
    ? request.decision_history
    : [],
  submittedAt: request.submitted_at,
  createdAt: request.created_at,
  updatedAt: request.updated_at,
  canAct: canReviewStatus(context, request.status),
});
