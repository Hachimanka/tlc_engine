import { NextResponse } from "next/server";
import {
  SUBJECT_APPROVAL_TYPE,
  buildDecisionHistory,
  canReviewApprovalRequest,
  canViewAcademicApprovals,
  canUseHigherEdApprovals,
  finalStatuses,
  getAcademicApprovalWorkflow,
  getNextApprovalStatus,
  getSubjectPayload,
  jsonError,
  type AcademicApprovalRow,
  type ApprovalStatus,
} from "@/lib/academicApprovals";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ReviewRequest = {
  decision?: "approve" | "return" | "reject";
  remarks?: string;
};

const isDuplicateError = (error: { code?: string; message?: string }) =>
  error.code === "23505" ||
  error.message?.toLowerCase().includes("duplicate") ||
  error.message?.toLowerCase().includes("unique");

const createApprovedSubject = async (
  request: AcademicApprovalRow,
  approvedByOrgUserId: string,
  now: string,
) => {
  const payload = getSubjectPayload(request.payload);

  if (!payload.subjectTitle || !payload.subjectCode || !payload.department) {
    throw new Error("Subject approval payload is incomplete.");
  }

  const { error } = await supabaseAdmin.from("academic_subjects").insert([
    {
      org_id: request.org_id,
      approval_request_id: request.id,
      subject_title: payload.subjectTitle,
      subject_code: payload.subjectCode,
      department: payload.department,
      year_level: payload.yearLevel || null,
      lecture_hours: payload.lectureHours,
      lab_hours: payload.labHours,
      meetings_per_week: payload.meetingsPerWeek,
      units: payload.units,
      description: payload.description || null,
      created_by_org_user_id: request.submitted_by_org_user_id,
      approved_by_org_user_id: approvedByOrgUserId,
      approved_at: now,
      created_at: now,
      updated_at: now,
    },
  ]);

  if (error) {
    const message = isDuplicateError(error)
      ? "An approved subject with this code already exists."
      : error.message || "Failed to create approved subject.";

    throw new Error(message);
  }
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ approvalId: string }> },
) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdApprovals(context)) {
    return jsonError("Academic approvals are available for Higher Ed institutions only.", 400);
  }

  if (!(await canViewAcademicApprovals(context))) {
    return jsonError("Only assigned Chairmen, Deans, VPAA, or org admins can review academic approvals.", 403);
  }

  const { approvalId } = await params;

  if (!approvalId) {
    return jsonError("Missing approval request id.", 400);
  }

  let payload: ReviewRequest = {};

  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const decision = payload.decision;
  const remarks = payload.remarks?.trim() || "";

  if (!decision || !["approve", "return", "reject"].includes(decision)) {
    return jsonError("Decision must be approve, return, or reject.", 400);
  }

  if ((decision === "return" || decision === "reject") && !remarks) {
    return jsonError("Remarks are required when returning or rejecting a request.", 400);
  }

  const { data: request, error: requestError } = await supabaseAdmin
    .from("academic_approval_requests")
    .select("*")
    .eq("id", approvalId)
    .eq("org_id", context.org.id)
    .maybeSingle<AcademicApprovalRow>();

  if (requestError || !request?.id) {
    return jsonError(requestError?.message || "Approval request not found.", 404);
  }

  if (finalStatuses.has(request.status)) {
    return jsonError("This approval request is already closed.", 400);
  }

  if (!(await canReviewApprovalRequest(context, request))) {
    return jsonError("Your role cannot review this approval step.", 403);
  }

  const now = new Date().toISOString();
  const reviewerIsChairmanStep = request.status === "pending_chairman";
  const reviewerIsDeanStep = request.status === "pending_dean";
  const workflow = getAcademicApprovalWorkflow(context.org.onboarding_config);
  let nextStatus: ApprovalStatus;

  if (decision === "approve") {
    nextStatus = getNextApprovalStatus(workflow, request.status);
  } else {
    nextStatus = decision === "return" ? "returned" : "rejected";
  }

  if (
    decision === "approve" &&
    nextStatus === "approved" &&
    request.request_type === SUBJECT_APPROVAL_TYPE
  ) {
    try {
      await createApprovedSubject(request, context.orgUser.id, now);
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : "Failed to approve subject.",
        error instanceof Error && error.message.includes("already exists") ? 409 : 500,
      );
    }
  }

  const history = buildDecisionHistory(request.decision_history, {
    action: decision,
    from_status: request.status,
    to_status: nextStatus,
    actor_org_user_id: context.orgUser.id,
    actor_name: context.orgUser.full_name,
    actor_role: context.orgUser.role_label ?? context.role.name,
    remarks: remarks || null,
    at: now,
  });

  const reviewUpdate = reviewerIsDeanStep
    ? {
        status: nextStatus,
        reviewed_by_dean_org_user_id: context.orgUser.id,
        dean_remarks: remarks || null,
        dean_reviewed_at: now,
        decision_history: history,
        updated_at: now,
      }
    : reviewerIsChairmanStep
    ? {
        status: nextStatus,
        reviewed_by_chairman_org_user_id: context.orgUser.id,
        chairman_remarks: remarks || null,
        chairman_reviewed_at: now,
        decision_history: history,
        updated_at: now,
      }
    : {
        status: nextStatus,
        reviewed_by_vpaa_org_user_id: context.orgUser.id,
        vpaa_remarks: remarks || null,
        vpaa_reviewed_at: now,
        decision_history: history,
        updated_at: now,
      };

  const { data: updatedRequest, error: updateError } = await supabaseAdmin
    .from("academic_approval_requests")
    .update(reviewUpdate)
    .eq("id", request.id)
    .eq("org_id", context.org.id)
    .select("*")
    .single<AcademicApprovalRow>();

  if (updateError || !updatedRequest) {
    return jsonError(updateError?.message || "Failed to update approval request.", 500);
  }

  return NextResponse.json({ request: updatedRequest });
}
