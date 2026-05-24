import { NextResponse } from "next/server";
import {
  canReviewApprovalRequest,
  canUseHigherEdApprovals,
  canViewAcademicApprovals,
  finalStatuses,
  getAcademicApprovalWorkflow,
  getApprovalWorkflowSteps,
  getInitialApprovalStatus,
  jsonError,
  mapApprovalRequest,
  type AcademicApprovalRow,
} from "@/lib/academicApprovals";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type OrgUserLookup = {
  id: string;
  full_name: string;
  email: string;
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

  if (!(await canViewAcademicApprovals(context))) {
    return jsonError("Only assigned Chairmen, Deans, VPAA, or org admins can view academic approvals.", 403);
  }

  const url = new URL(req.url);
  const requestType = url.searchParams.get("type");

  let query = supabaseAdmin
    .from("academic_approval_requests")
    .select("*")
    .eq("org_id", context.org.id)
    .order("updated_at", { ascending: false });

  if (requestType) {
    query = query.eq("request_type", requestType);
  }

  const { data: requests, error: requestsError } = await query;

  if (requestsError) {
    return jsonError(requestsError.message || "Failed to load academic approvals.", 500);
  }

  const workflow = getAcademicApprovalWorkflow(context.org.onboarding_config);
  const workflowSteps = getApprovalWorkflowSteps(workflow);
  const wasReviewedByCurrentUser = (request: AcademicApprovalRow) =>
    request.reviewed_by_chairman_org_user_id === context.orgUser.id ||
    request.reviewed_by_dean_org_user_id === context.orgUser.id ||
    request.reviewed_by_vpaa_org_user_id === context.orgUser.id;
  const canViewRequestHistory = (request: AcademicApprovalRow) =>
    finalStatuses.has(request.status) || wasReviewedByCurrentUser(request);

  const submittedByIds = Array.from(
    new Set(
      (requests ?? [])
        .map((request) => (request as AcademicApprovalRow).submitted_by_org_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const submittersById = new Map<string, OrgUserLookup>();

  if (submittedByIds.length > 0) {
    const { data: submitters, error: submittersError } = await supabaseAdmin
      .from("org_users")
      .select("id, full_name, email")
      .eq("org_id", context.org.id)
      .in("id", submittedByIds);

    if (submittersError) {
      return jsonError(submittersError.message || "Failed to load submitter details.", 500);
    }

    for (const submitter of (submitters ?? []) as OrgUserLookup[]) {
      submittersById.set(submitter.id, submitter);
    }
  }

  const mappedRequests = await Promise.all((requests ?? []).map(async (row) => {
      const request = row as AcademicApprovalRow;
      const submitter = request.submitted_by_org_user_id
        ? submittersById.get(request.submitted_by_org_user_id)
        : undefined;
      const canAct = await canReviewApprovalRequest(context, request);

      return {
        canView: context.isOrgAdmin || canAct || canViewRequestHistory(request),
        hasReviewHistory: context.isOrgAdmin || wasReviewedByCurrentUser(request),
        ...mapApprovalRequest(request, canAct),
        submittedBy: submitter
          ? {
              id: submitter.id,
              name: submitter.full_name,
              email: submitter.email,
            }
          : null,
      };
    }));

  return NextResponse.json({
    workflow,
    workflowSteps,
    requests: mappedRequests
      .filter((request) => request.canView)
      .map(({ canView, ...request }) => {
        void canView;
        return request;
      }),
  });
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

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const requestTypeValue = String(body.requestType ?? "").trim();
  const description = String(body.description ?? "").trim();
  const otherDetails = String(body.otherDetails ?? "").trim();
  const subjectId = String(body.subjectId ?? "").trim();
  const subjectTitle = String(body.subjectTitle ?? "").trim();
  const subjectCode = String(body.subjectCode ?? "").trim();
  const section = String(body.section ?? "").trim();
  const room = String(body.room ?? "").trim();
  const schedule = String(body.schedule ?? "").trim();

  const requestTypeMap: Record<string, string> = {
    "load-concern": "teaching_load",
    "schedule-conflict": "schedule_conflict",
    "subject-assignment": "adjustment_request",
    clarification: "adjustment_request",
    other: "adjustment_request",
  };

  const requestTypeLabelMap: Record<string, string> = {
    "load-concern": "Load Concern",
    "schedule-conflict": "Schedule Conflict",
    "subject-assignment": "Subject Assignment",
    clarification: "Clarification",
    other: "Other",
  };

  const requestType = requestTypeMap[requestTypeValue];

  if (!requestType) {
    return jsonError("Invalid request type.", 400);
  }

  const workflow = getAcademicApprovalWorkflow(context.org.onboarding_config);
  const initialStatus = getInitialApprovalStatus(workflow);

  if (initialStatus === "pending_dean") {
    const { data: colleges } = await supabaseAdmin
      .from("org_colleges")
      .select("id")
      .eq("org_id", context.org.id)
      .limit(1);

    if (!colleges || colleges.length === 0) {
      return jsonError(
        "No College is available to review requests. Please contact your administrator to configure colleges and assign a Dean.",
        400,
      );
    }
  }

  if (initialStatus === "pending_chairman") {
    const { data: departments } = await supabaseAdmin
      .from("org_departments")
      .select("id")
      .eq("org_id", context.org.id)
      .limit(1);

    if (!departments || departments.length === 0) {
      return jsonError(
        "No Department is available to review requests. Please contact your administrator to configure departments and assign a Chairman.",
        400,
      );
    }
  }

  const now = new Date().toISOString();
  const title = `${requestTypeLabelMap[requestTypeValue] ?? "Request"} for ${
    subjectCode || subjectTitle || "selected subject"
  }`;
  const targetLabel = subjectCode || subjectTitle || "Other";

  const payload = {
    subjectId: subjectId || null,
    subjectTitle: subjectTitle || null,
    subjectCode: subjectCode || null,
    section: section || null,
    room: room || null,
    schedule: schedule || null,
    requestType: requestTypeValue,
    description,
    otherDetails,
    submittedAt: now,
  };

  const { data: createdRequest, error: createError } = await supabaseAdmin
    .from("academic_approval_requests")
    .insert([
      {
        org_id: context.org.id,
        request_type: requestType,
        status: initialStatus,
        title,
        target_label: targetLabel,
        payload,
        submitted_by_org_user_id: context.orgUser.id,
        decision_history: [
          {
            action: "submitted",
            status: initialStatus,
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

  if (createError) {
    return jsonError(createError.message || "Failed to submit the request.", 500);
  }

  return NextResponse.json(
    { request: mapApprovalRequest(createdRequest as AcademicApprovalRow) },
    { status: 201 },
  );
}
