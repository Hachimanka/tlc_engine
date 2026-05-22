import { NextResponse } from "next/server";
import {
  ACTIVE_SUBJECT_APPROVAL_STATUSES,
  SUBJECT_APPROVAL_TYPE,
  canSubmitSubject,
  canUseHigherEdApprovals,
  getAcademicApprovalWorkflow,
  getInitialApprovalStatus,
  getSubjectPayload,
  jsonError,
  normalizeSubjectCode,
  type AcademicApprovalRow,
  type SubjectPayload,
} from "@/lib/academicApprovals";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type CreateSubjectRequest = Partial<SubjectPayload>;

type AcademicSubjectRow = {
  id: string;
  subject_title: string;
  subject_code: string;
  department: string;
  year_level: string | null;
  lecture_hours: number | string | null;
  lab_hours: number | string | null;
  meetings_per_week: number | string | null;
  units: number | string | null;
  description: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

const isApprovalWorkflowMigrationMissingError = (
  error: { code?: string; message?: string; details?: string } | null | undefined,
) => {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();

  return (
    error?.code === "23514" &&
    message.includes("academic_approval_requests_status_check")
  );
};

const toNumber = (value: number | string | null | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapApprovedSubject = (row: AcademicSubjectRow) => ({
  id: row.id,
  source: "catalog" as const,
  approvalRequestId: null,
  title: row.subject_title,
  code: row.subject_code,
  department: row.department,
  lecHours: toNumber(row.lecture_hours),
  labHours: toNumber(row.lab_hours),
  meetingsPerWeek: toNumber(row.meetings_per_week, 2),
  units: toNumber(row.units),
  dateCreated: row.approved_at ?? row.created_at,
  status: "approved" as const,
  description: row.description ?? "",
  level: row.year_level ?? "",
  updatedAt: row.updated_at,
  chairmanRemarks: null,
  deanRemarks: null,
  vpaaRemarks: null,
});

const mapSubjectRequest = (row: AcademicApprovalRow) => {
  const payload = getSubjectPayload(row.payload);

  return {
    id: row.id,
    source: "approval_request" as const,
    approvalRequestId: row.id,
    title: payload.subjectTitle,
    code: payload.subjectCode,
    department: payload.department,
    lecHours: payload.lectureHours,
    labHours: payload.labHours,
    meetingsPerWeek: payload.meetingsPerWeek,
    units: payload.units,
    dateCreated: row.submitted_at,
    status: row.status,
    description: payload.description,
    level: payload.yearLevel,
    updatedAt: row.updated_at,
    chairmanRemarks: row.chairman_remarks,
    deanRemarks: row.dean_remarks,
    vpaaRemarks: row.vpaa_remarks,
  };
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdApprovals(context)) {
    return jsonError("Academic approvals are available for Higher Ed institutions only.", 400);
  }

  const { data: approvedSubjects, error: approvedError } = await supabaseAdmin
    .from("academic_subjects")
    .select(
      "id, subject_title, subject_code, department, year_level, lecture_hours, lab_hours, meetings_per_week, units, description, approved_at, created_at, updated_at",
    )
    .eq("org_id", context.org.id)
    .order("created_at", { ascending: false });

  if (approvedError) {
    return jsonError(approvedError.message || "Failed to load subjects.", 500);
  }

  const { data: subjectRequests, error: requestsError } = await supabaseAdmin
    .from("academic_approval_requests")
    .select("*")
    .eq("org_id", context.org.id)
    .eq("request_type", SUBJECT_APPROVAL_TYPE)
    .neq("status", "approved")
    .order("created_at", { ascending: false });

  if (requestsError) {
    return jsonError(requestsError.message || "Failed to load subject approvals.", 500);
  }

  const subjects = [
    ...(subjectRequests ?? []).map((row) => mapSubjectRequest(row as AcademicApprovalRow)),
    ...(approvedSubjects ?? []).map((row) => mapApprovedSubject(row as AcademicSubjectRow)),
  ].sort((a, b) => {
    const aTime = new Date(a.dateCreated).getTime();
    const bTime = new Date(b.dateCreated).getTime();
    return bTime - aTime;
  });

  return NextResponse.json({ subjects, canSubmit: canSubmitSubject(context) });
}

export async function POST(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdApprovals(context)) {
    return jsonError("Academic approvals are available for Higher Ed institutions only.", 400);
  }

  if (!canSubmitSubject(context)) {
    return jsonError("Only subject managers, department heads, or org admins can submit subjects.", 403);
  }

  let payload: CreateSubjectRequest = {};

  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const subjectPayload = getSubjectPayload(payload);
  const subjectCode = normalizeSubjectCode(subjectPayload.subjectCode);

  if (!subjectPayload.subjectTitle || !subjectCode || !subjectPayload.department) {
    return jsonError("Subject title, code, and department are required.", 400);
  }

  if (subjectPayload.units <= 0) {
    return jsonError("Units must be greater than zero.", 400);
  }

  if (subjectPayload.meetingsPerWeek <= 0) {
    return jsonError("Meetings per week must be greater than zero.", 400);
  }

  const { data: existingSubject, error: existingSubjectError } = await supabaseAdmin
    .from("academic_subjects")
    .select("id")
    .eq("org_id", context.org.id)
    .eq("subject_code", subjectCode)
    .maybeSingle();

  if (existingSubjectError) {
    return jsonError(existingSubjectError.message || "Failed to check subject uniqueness.", 500);
  }

  if (existingSubject?.id) {
    return jsonError("An approved subject with this code already exists.", 409);
  }

  const { data: activeRequests, error: activeRequestsError } = await supabaseAdmin
    .from("academic_approval_requests")
    .select("id, payload, status")
    .eq("org_id", context.org.id)
    .eq("request_type", SUBJECT_APPROVAL_TYPE)
    .in("status", ACTIVE_SUBJECT_APPROVAL_STATUSES);

  if (activeRequestsError) {
    return jsonError(activeRequestsError.message || "Failed to check active approvals.", 500);
  }

  const hasActiveDuplicate = (activeRequests ?? []).some((request) => {
    const existingPayload = getSubjectPayload(
      (request as { payload?: unknown }).payload,
    );
    return existingPayload.subjectCode === subjectCode;
  });

  if (hasActiveDuplicate) {
    return jsonError("A pending approval for this subject code already exists.", 409);
  }

  const now = new Date().toISOString();
  const requestPayload: SubjectPayload = {
    ...subjectPayload,
    subjectCode,
  };
  const workflow = getAcademicApprovalWorkflow(context.org.onboarding_config);
  const initialStatus = getInitialApprovalStatus(workflow);

  const { data: createdRequest, error: createError } = await supabaseAdmin
    .from("academic_approval_requests")
    .insert([
      {
        org_id: context.org.id,
        request_type: SUBJECT_APPROVAL_TYPE,
        status: initialStatus,
        title: requestPayload.subjectTitle,
        target_label: requestPayload.subjectCode,
        payload: requestPayload,
        submitted_by_org_user_id: context.orgUser.id,
        decision_history: [
          {
            action: "submitted",
            status: initialStatus,
            workflow,
            actor_org_user_id: context.orgUser.id,
            actor_name: context.orgUser.full_name,
            actor_role: context.role.key,
            remarks: null,
            at: now,
          },
        ],
        submitted_at: now,
        created_at: now,
        updated_at: now,
      },
    ])
    .select("*")
    .single();

  if (createError || !createdRequest) {
    if (isApprovalWorkflowMigrationMissingError(createError)) {
      return jsonError(
        "Academic approval workflow migration is missing. Run scripts/db/20260522_academic_approval_workflows.sql in Supabase.",
        500,
      );
    }

    return jsonError(createError?.message || "Failed to submit subject for approval.", 500);
  }

  return NextResponse.json(
    { subject: mapSubjectRequest(createdRequest as AcademicApprovalRow) },
    { status: 201 },
  );
}
