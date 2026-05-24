import "server-only";

import { NextResponse } from "next/server";
import type { TenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type ApprovalRequestType =
  | "subject"
  | "teaching_load"
  | "schedule_conflict"
  | "overload_exception"
  | "adjustment_request";

export type ApprovalStatus =
  | "pending_chairman"
  | "pending_dean"
  | "pending_vpaa"
  | "approved"
  | "returned"
  | "rejected";

export type AcademicApprovalWorkflow =
  | "dean_vpaa"
  | "vpaa_dean"
  | "chairman_only"
  | "chairman_dean"
  | "chairman_dean_vpaa";

export type SubjectPayload = {
  subjectTitle: string;
  subjectCode: string;
  department: string;
  departmentId: string | null;
  yearLevel: string;
  lectureHours: number;
  labHours: number;
  meetingsPerWeek: number;
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
  reviewed_by_chairman_org_user_id: string | null;
  reviewed_by_dean_org_user_id: string | null;
  reviewed_by_vpaa_org_user_id: string | null;
  chairman_remarks: string | null;
  dean_remarks: string | null;
  vpaa_remarks: string | null;
  decision_history: unknown;
  submitted_at: string;
  chairman_reviewed_at: string | null;
  dean_reviewed_at: string | null;
  vpaa_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const SUBJECT_APPROVAL_TYPE: ApprovalRequestType = "subject";

export const ACTIVE_SUBJECT_APPROVAL_STATUSES: ApprovalStatus[] = [
  "pending_chairman",
  "pending_dean",
  "pending_vpaa",
];

export const approvalWorkflowLabels: Record<AcademicApprovalWorkflow, string> = {
  dean_vpaa: "Dean -> VPAA",
  vpaa_dean: "VPAA -> Dean",
  chairman_only: "Chairman only",
  chairman_dean: "Chairman -> Dean",
  chairman_dean_vpaa: "Chairman -> Dean -> VPAA",
};

export const finalStatuses = new Set<ApprovalStatus>([
  "approved",
  "returned",
  "rejected",
]);

export const allowedSubjectSubmitterRoles = new Set([
  "org_admin",
  "subject_manager",
  "subject_room_manager",
  "department_head",
]);

export const canUseHigherEdApprovals = (context: TenantContext) =>
  context.institutionType === "higher_ed";

const normalizeRoleTag = (value?: string | null) =>
  (value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

const roleTagIncludesAny = (
  context: TenantContext,
  keywords: string[],
) => {
  const roleTag = normalizeRoleTag(context.orgUser.role_label ?? context.role.name);
  const roleKey = normalizeRoleTag(context.role.key);

  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeRoleTag(keyword);
    return roleTag.includes(normalizedKeyword) || roleKey.includes(normalizedKeyword);
  });
};

const hasChairmanReviewerTag = (context: TenantContext) =>
  roleTagIncludesAny(context, ["chairman", "department head", "program chair", "chair"]);

const hasDeanReviewerTag = (context: TenantContext) =>
  roleTagIncludesAny(context, ["dean"]);

const hasVpaaReviewerTag = (context: TenantContext) =>
  roleTagIncludesAny(context, ["vpaa", "vice president academic affairs"]);

export const canSubmitSubject = (context: TenantContext) =>
  context.isOrgAdmin ||
  allowedSubjectSubmitterRoles.has(context.role.key) ||
  context.enabledFeatureKeys.includes("higher-subject-management");

export const canViewApprovals = (context: TenantContext) =>
  context.isOrgAdmin ||
  hasChairmanReviewerTag(context) ||
  hasDeanReviewerTag(context) ||
  hasVpaaReviewerTag(context) ||
  context.enabledFeatureKeys.includes("higher-dean-vpaa-approvals");

export const canReviewStatus = (
  context: TenantContext,
  status: ApprovalStatus,
) => {
  if (context.isOrgAdmin) {
    return status === "pending_chairman" || status === "pending_dean" || status === "pending_vpaa";
  }

  if (status === "pending_chairman") {
    return hasChairmanReviewerTag(context);
  }

  if (status === "pending_dean") {
    return hasDeanReviewerTag(context);
  }

  if (status === "pending_vpaa") {
    return hasVpaaReviewerTag(context);
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

export const normalizeAcademicApprovalWorkflow = (
  value: unknown,
): AcademicApprovalWorkflow => {
  if (
    value === "dean_vpaa" ||
    value === "vpaa_dean" ||
    value === "chairman_only" ||
    value === "chairman_dean" ||
    value === "chairman_dean_vpaa"
  ) {
    return value;
  }

  return "dean_vpaa";
};

export const getAcademicApprovalWorkflow = (
  onboardingConfigValue: unknown,
): AcademicApprovalWorkflow => {
  const onboardingConfig = asRecord(onboardingConfigValue);
  const policies = asRecord(onboardingConfig.policies);
  const approvals = asRecord(policies.approvals);

  return normalizeAcademicApprovalWorkflow(approvals.workflow);
};

const workflowSteps: Record<AcademicApprovalWorkflow, ApprovalStatus[]> = {
  dean_vpaa: ["pending_dean", "pending_vpaa"],
  vpaa_dean: ["pending_vpaa", "pending_dean"],
  chairman_only: ["pending_chairman"],
  chairman_dean: ["pending_chairman", "pending_dean"],
  chairman_dean_vpaa: ["pending_chairman", "pending_dean", "pending_vpaa"],
};

export const getApprovalWorkflowSteps = (
  workflow: AcademicApprovalWorkflow,
): ApprovalStatus[] => workflowSteps[workflow] ?? workflowSteps.dean_vpaa;

export const getInitialApprovalStatus = (
  workflow: AcademicApprovalWorkflow,
): ApprovalStatus => getApprovalWorkflowSteps(workflow)[0] ?? "pending_vpaa";

export const getNextApprovalStatus = (
  workflow: AcademicApprovalWorkflow,
  currentStatus: ApprovalStatus,
): ApprovalStatus => {
  const steps = getApprovalWorkflowSteps(workflow);
  const currentIndex = steps.indexOf(currentStatus);

  if (currentIndex < 0 || currentIndex === steps.length - 1) {
    return "approved";
  }

  return steps[currentIndex + 1] ?? "approved";
};

const normalizeLookupValue = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const getRequestDepartment = (request: AcademicApprovalRow) => {
  if (request.request_type === SUBJECT_APPROVAL_TYPE) {
    return getSubjectPayload(request.payload).department;
  }

  const payload = asRecord(request.payload);
  return toText(payload.department || payload.departmentName || payload.departmentCode);
};

const loadDepartmentForRequest = async (request: AcademicApprovalRow) => {
  const subjectPayload = request.request_type === SUBJECT_APPROVAL_TYPE
    ? getSubjectPayload(request.payload)
    : null;

  if (subjectPayload?.departmentId) {
    const { data: department, error } = await supabaseAdmin
      .from("org_departments")
      .select("id, name, code, college_id, chair_user_id")
      .eq("id", subjectPayload.departmentId)
      .eq("org_id", request.org_id)
      .maybeSingle<{
        id: string;
        name: string | null;
        code: string | null;
        college_id: string | null;
        chair_user_id: string | null;
      }>();

    if (error) {
      throw new Error(error.message || "Failed to load department reviewer.");
    }

    if (department?.id) {
      return department;
    }
  }

  const departmentLabel = normalizeLookupValue(getRequestDepartment(request));

  if (!departmentLabel) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("org_departments")
    .select("id, name, code, college_id, chair_user_id")
    .eq("org_id", request.org_id);

  if (error) {
    throw new Error(error.message || "Failed to load department reviewer.");
  }

  return (data ?? []).find((department) => {
    const name = normalizeLookupValue(String(department.name ?? ""));
    const code = normalizeLookupValue(String(department.code ?? ""));
    return name === departmentLabel || code === departmentLabel;
  }) ?? null;
};

const isAssignedDeanForRequest = async (
  context: TenantContext,
  request: AcademicApprovalRow,
) => {
  const department = await loadDepartmentForRequest(request);

  if (!department?.college_id) {
    return hasDeanReviewerTag(context);
  }

  const { data: college, error } = await supabaseAdmin
    .from("org_colleges")
    .select("id, dean_user_id")
    .eq("id", department.college_id)
    .eq("org_id", request.org_id)
    .maybeSingle<{ id: string; dean_user_id: string | null }>();

  if (error) {
    throw new Error(error.message || "Failed to load dean reviewer.");
  }

  if (college?.dean_user_id) {
    return college.dean_user_id === context.orgUser.id;
  }

  return hasDeanReviewerTag(context);
};

const isSameDepartmentForRequest = async (
  context: TenantContext,
  request: AcademicApprovalRow,
) => {
  const department = await loadDepartmentForRequest(request);

  if (!department) {
    return false;
  }

  if (context.orgUser.department_id) {
    return context.orgUser.department_id === department.id;
  }

  const userDepartmentLabel = normalizeLookupValue(context.orgUser.department ?? "");

  if (!userDepartmentLabel) {
    return false;
  }

  return (
    userDepartmentLabel === normalizeLookupValue(String(department.name ?? "")) ||
    userDepartmentLabel === normalizeLookupValue(String(department.code ?? ""))
  );
};

const isAssignedChairmanForRequest = async (
  context: TenantContext,
  request: AcademicApprovalRow,
) => {
  const department = await loadDepartmentForRequest(request);
  return department?.chair_user_id === context.orgUser.id;
};

export const canViewAcademicApprovals = async (context: TenantContext) => {
  if (canViewApprovals(context)) {
    return true;
  }

  const [chairedDepartment, deanCollege] = await Promise.all([
    supabaseAdmin
      .from("org_departments")
      .select("id")
      .eq("org_id", context.org.id)
      .eq("chair_user_id", context.orgUser.id)
      .limit(1),
    supabaseAdmin
      .from("org_colleges")
      .select("id")
      .eq("org_id", context.org.id)
      .eq("dean_user_id", context.orgUser.id)
      .limit(1),
  ]);

  if (chairedDepartment.error || deanCollege.error) {
    return false;
  }

  return Boolean(chairedDepartment.data?.[0]?.id || deanCollege.data?.[0]?.id);
};

export const canReviewApprovalRequest = async (
  context: TenantContext,
  request: AcademicApprovalRow,
) => {
  if (context.isOrgAdmin) {
    return request.status === "pending_chairman" ||
      request.status === "pending_dean" ||
      request.status === "pending_vpaa";
  }

  if (request.status === "pending_chairman") {
    if (await isAssignedChairmanForRequest(context, request)) {
      return true;
    }

    return hasChairmanReviewerTag(context) && (await isSameDepartmentForRequest(context, request));
  }

  if (request.status === "pending_dean") {
    return await isAssignedDeanForRequest(context, request);
  }

  if (request.status === "pending_vpaa") {
    return hasVpaaReviewerTag(context);
  }

  return false;
};

export const normalizeSubjectCode = (value: string) =>
  value.trim().replace(/\s+/g, " ").toUpperCase();

export const getSubjectPayload = (value: unknown): SubjectPayload => {
  const payload = asRecord(value);

  return {
    subjectTitle: toText(payload.subjectTitle),
    subjectCode: normalizeSubjectCode(toText(payload.subjectCode)),
    department: toText(payload.department),
    departmentId: toText(payload.departmentId) || null,
    yearLevel: toText(payload.yearLevel, "Second Year"),
    lectureHours: toNumber(payload.lectureHours),
    labHours: toNumber(payload.labHours),
    meetingsPerWeek: toNumber(payload.meetingsPerWeek, 2),
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
  canAct = false,
) => ({
  id: request.id,
  requestType: request.request_type,
  status: request.status,
  title: request.title,
  targetLabel: request.target_label,
  payload: request.payload,
  submittedByOrgUserId: request.submitted_by_org_user_id,
  chairmanRemarks: request.chairman_remarks,
  deanRemarks: request.dean_remarks,
  vpaaRemarks: request.vpaa_remarks,
  decisionHistory: Array.isArray(request.decision_history)
    ? request.decision_history
    : [],
  submittedAt: request.submitted_at,
  createdAt: request.created_at,
  updatedAt: request.updated_at,
  canAct,
});
