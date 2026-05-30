import { NextResponse } from "next/server";
import {
  buildDecisionHistory,
  canReviewApprovalRequest,
  finalStatuses,
  jsonError,
  mapApprovalRequest,
  type AcademicApprovalRow,
  type ApprovalStatus,
} from "@/lib/academicApprovals";
import { loadTenantContext, type TenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type LoadRequestPayload = {
  subjectConcerned?: string;
  requestType?: string;
  description?: string;
};

type DepartmentRow = {
  id: string;
  name: string;
  chair_user_id: string | null;
};

type OrgUserLookup = {
  id: string;
  full_name: string;
  email: string;
};

type ReviewRequest = {
  decision?: "approve" | "return" | "reject";
  remarks?: string;
};

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const requestTypeLabels: Record<string, string> = {
  "load-concern": "Load Concern",
  "schedule-conflict": "Schedule Conflict",
  "subject-assignment": "Subject Assignment",
  clarification: "Clarification / Question",
  other: "Other",
};

const isDepedLoadRequest = (request: AcademicApprovalRow) => {
  const payload = request.payload;

  return (
    typeof payload === "object" &&
    payload !== null &&
    !Array.isArray(payload) &&
    (payload as Record<string, unknown>).source === "deped_teacher_load_request"
  );
};

const canViewDepedLoadRequests = async (context: TenantContext) => {
  if (
    context.isOrgAdmin ||
    context.enabledFeatureKeys.includes("deped-department-load") ||
    context.enabledFeatureKeys.includes("deped-teacher-load-assignment")
  ) {
    return true;
  }

  const { data, error } = await supabaseAdmin
    .from("org_departments")
    .select("id")
    .eq("org_id", context.org.id)
    .eq("chair_user_id", context.orgUser.id)
    .limit(1);

  return !error && Boolean(data?.[0]?.id);
};

async function loadTeacherDepartment(orgId: string, departmentId?: string | null, departmentName?: string | null) {
  if (departmentId) {
    const { data, error } = await supabaseAdmin
      .from("org_departments")
      .select("id, name, chair_user_id")
      .eq("id", departmentId)
      .eq("org_id", orgId)
      .maybeSingle<DepartmentRow>();

    if (error) {
      throw new Error(error.message || "Failed to load teacher department.");
    }

    if (data?.id) {
      return data;
    }
  }

  const normalizedDepartment = normalizeText(departmentName);

  if (!normalizedDepartment) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("org_departments")
    .select("id, name, chair_user_id")
    .eq("org_id", orgId)
    .ilike("name", normalizedDepartment)
    .maybeSingle<DepartmentRow>();

  if (error) {
    throw new Error(error.message || "Failed to load teacher department.");
  }

  return data ?? null;
}

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (context.institutionType !== "deped") {
    return NextResponse.json(
      { error: "Load requests are only available for DepEd accounts." },
      { status: 403 },
    );
  }

  if (!(await canViewDepedLoadRequests(context))) {
    return NextResponse.json(
      { error: "Only assigned department heads or load managers can view load requests." },
      { status: 403 },
    );
  }

  const { data: requests, error: requestsError } = await supabaseAdmin
    .from("academic_approval_requests")
    .select("*")
    .eq("org_id", context.org.id)
    .eq("request_type", "adjustment_request")
    .order("updated_at", { ascending: false });

  if (requestsError) {
    return NextResponse.json(
      { error: requestsError.message || "Failed to load DepEd load requests." },
      { status: 500 },
    );
  }

  const depedRequests = ((requests ?? []) as AcademicApprovalRow[]).filter(isDepedLoadRequest);
  const submittedByIds = Array.from(
    new Set(
      depedRequests
        .map((request) => request.submitted_by_org_user_id)
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
      return NextResponse.json(
        { error: submittersError.message || "Failed to load teacher details." },
        { status: 500 },
      );
    }

    for (const submitter of (submitters ?? []) as OrgUserLookup[]) {
      submittersById.set(submitter.id, submitter);
    }
  }

  const mappedRequests = await Promise.all(
    depedRequests.map(async (request) => {
      const canAct = await canReviewApprovalRequest(context, request);
      const wasReviewedByCurrentUser =
        request.reviewed_by_chairman_org_user_id === context.orgUser.id ||
        request.reviewed_by_dean_org_user_id === context.orgUser.id ||
        request.reviewed_by_vpaa_org_user_id === context.orgUser.id;
      const canView =
        context.isOrgAdmin ||
        canAct ||
        wasReviewedByCurrentUser ||
        finalStatuses.has(request.status);
      const submitter = request.submitted_by_org_user_id
        ? submittersById.get(request.submitted_by_org_user_id)
        : undefined;

      return {
        canView,
        hasReviewHistory: context.isOrgAdmin || wasReviewedByCurrentUser,
        ...mapApprovalRequest(request, canAct),
        submittedBy: submitter
          ? {
              id: submitter.id,
              name: submitter.full_name,
              email: submitter.email,
            }
          : null,
      };
    }),
  );

  return NextResponse.json({
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

  if (context.institutionType !== "deped") {
    return NextResponse.json(
      { error: "Load requests are only available for DepEd accounts." },
      { status: 403 },
    );
  }

  let payload: LoadRequestPayload = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const subjectConcerned = normalizeText(payload.subjectConcerned);
  const requestType = normalizeText(payload.requestType);
  const description = normalizeText(payload.description);

  if (!subjectConcerned || !requestType || !description) {
    return NextResponse.json(
      { error: "Subject, request type, and description are required." },
      { status: 400 },
    );
  }

  let department: DepartmentRow | null = null;

  try {
    department = await loadTeacherDepartment(
      context.org.id,
      context.orgUser.department_id,
      context.orgUser.department,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to find your department head.",
      },
      { status: 500 },
    );
  }

  if (!department?.id) {
    return NextResponse.json(
      { error: "Your account is not assigned to a department yet." },
      { status: 400 },
    );
  }

  if (!department.chair_user_id) {
    return NextResponse.json(
      { error: "Your department does not have an assigned department head yet." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const requestTypeLabel = requestTypeLabels[requestType] ?? requestType;
  const { data, error } = await supabaseAdmin
    .from("academic_approval_requests")
    .insert([
      {
        org_id: context.org.id,
        request_type: "adjustment_request",
        status: "pending_chairman",
        title: requestTypeLabel,
        target_label: subjectConcerned,
        payload: {
          source: "deped_teacher_load_request",
          subjectConcerned,
          requestType,
          requestTypeLabel,
          description,
          departmentId: department.id,
          departmentName: department.name,
          recipientOrgUserId: department.chair_user_id,
          teacherOrgUserId: context.orgUser.id,
          teacherName: context.orgUser.full_name,
        },
        submitted_by_org_user_id: context.orgUser.id,
        submitted_at: now,
        created_at: now,
        updated_at: now,
      },
    ])
    .select("id")
    .single();

  if (error || !data?.id) {
    return NextResponse.json(
      { error: error?.message || "Failed to send load request." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, requestId: data.id }, { status: 201 });
}

export async function PATCH(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (context.institutionType !== "deped") {
    return jsonError("Load requests are only available for DepEd accounts.", 403);
  }

  let payload: ReviewRequest & { requestId?: string } = {};

  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const requestId = payload.requestId?.trim();
  const decision = payload.decision;
  const remarks = payload.remarks?.trim() || "";

  if (!requestId) {
    return jsonError("Missing load request id.", 400);
  }

  if (!decision || !["approve", "return", "reject"].includes(decision)) {
    return jsonError("Decision must be approve, return, or reject.", 400);
  }

  if ((decision === "return" || decision === "reject") && !remarks) {
    return jsonError("Remarks are required when returning or rejecting a request.", 400);
  }

  const { data: request, error: requestError } = await supabaseAdmin
    .from("academic_approval_requests")
    .select("*")
    .eq("id", requestId)
    .eq("org_id", context.org.id)
    .maybeSingle<AcademicApprovalRow>();

  if (requestError || !request?.id) {
    return jsonError(requestError?.message || "Load request not found.", 404);
  }

  if (!isDepedLoadRequest(request)) {
    return jsonError("This is not a DepEd teacher load request.", 400);
  }

  if (finalStatuses.has(request.status)) {
    return jsonError("This load request is already closed.", 400);
  }

  if (!(await canReviewApprovalRequest(context, request))) {
    return jsonError("Your role cannot review this load request.", 403);
  }

  const now = new Date().toISOString();
  const nextStatus: ApprovalStatus =
    decision === "approve" ? "approved" : decision === "return" ? "returned" : "rejected";
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

  const { data: updatedRequest, error: updateError } = await supabaseAdmin
    .from("academic_approval_requests")
    .update({
      status: nextStatus,
      reviewed_by_chairman_org_user_id: context.orgUser.id,
      chairman_remarks: remarks || null,
      chairman_reviewed_at: now,
      decision_history: history,
      updated_at: now,
    })
    .eq("id", request.id)
    .eq("org_id", context.org.id)
    .select("*")
    .single<AcademicApprovalRow>();

  if (updateError || !updatedRequest) {
    return jsonError(updateError?.message || "Failed to update load request.", 500);
  }

  return NextResponse.json({ request: mapApprovalRequest(updatedRequest) });
}
