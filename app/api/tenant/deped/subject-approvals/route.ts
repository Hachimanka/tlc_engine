import { NextResponse } from "next/server";
import { normalizeRoleKey } from "@/features/tenant-role-catalog";
import {
  SUBJECT_APPROVAL_TYPE,
  buildDecisionHistory,
  type AcademicApprovalRow,
  type ApprovalStatus,
} from "@/lib/academicApprovals";
import { loadTenantContext, type TenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type OrgUserLookup = {
  id: string;
  full_name: string;
  email: string;
};

type ReviewRequest = {
  subjectId?: string;
  decision?: "approve" | "return" | "reject";
  remarks?: string;
};

const reviewerRoleKeys = new Set(["org_admin", "school_head", "principal"]);
const closedStatuses = new Set<ApprovalStatus>(["approved", "returned", "rejected"]);
const statusLabel: Record<string, "Pending Principal" | "Approved" | "Returned" | "Rejected"> = {
  pending_dean: "Pending Principal",
  pending_vpaa: "Pending Principal",
  approved: "Approved",
  returned: "Returned",
  rejected: "Rejected",
};

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const canReviewDepedSubjects = (context: TenantContext) =>
  context.institutionType === "deped" &&
  (reviewerRoleKeys.has(normalizeRoleKey(context.role.key)) ||
    reviewerRoleKeys.has(normalizeRoleKey(context.role.name)) ||
    context.enabledFeatureKeys.includes("deped-subject-approvals"));

const formatDisplayDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US");
};

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

const isDuplicateSubjectError = (error: { code?: string; message?: string }) =>
  error.code === "23505" ||
  error.message?.toLowerCase().includes("duplicate") ||
  error.message?.toLowerCase().includes("unique");

const normalizeSubjectKey = (value: unknown) => normalizeText(value).toLowerCase();

const getYearLevelCodeSuffix = (yearLevel: string) => {
  const gradeMatch = yearLevel.match(/\d+/);

  if (gradeMatch) {
    return `G${gradeMatch[0]}`;
  }

  return yearLevel
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8);
};

const resolveApprovedSubjectCode = async ({
  orgId,
  subjectTitle,
  subjectCode,
  yearLevel,
}: {
  orgId: string;
  subjectTitle: string;
  subjectCode: string;
  yearLevel: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("academic_subjects")
    .select("id, subject_title, subject_code, year_level")
    .eq("org_id", orgId);

  if (error) {
    throw new Error(error.message || "Failed to check subject uniqueness.");
  }

  const subjects = data ?? [];
  const normalizedTitle = normalizeSubjectKey(subjectTitle);
  const normalizedCode = normalizeSubjectKey(subjectCode);
  const normalizedYearLevel = normalizeSubjectKey(yearLevel);
  const duplicateInSameYearLevel = subjects.find(
    (subject) =>
      normalizeSubjectKey(subject.year_level) === normalizedYearLevel &&
      (normalizeSubjectKey(subject.subject_title) === normalizedTitle ||
        normalizeSubjectKey(subject.subject_code) === normalizedCode),
  );

  if (duplicateInSameYearLevel) {
    throw new Error("An approved subject with this name or code already exists for this year level.");
  }

  const usedCodes = new Set(subjects.map((subject) => normalizeSubjectKey(subject.subject_code)));

  if (!usedCodes.has(normalizedCode)) {
    return subjectCode;
  }

  const suffix = getYearLevelCodeSuffix(yearLevel);
  const scopedCodeBase = suffix ? `${subjectCode}-${suffix}` : subjectCode;
  let nextCode = scopedCodeBase;
  let counter = 2;

  while (usedCodes.has(normalizeSubjectKey(nextCode))) {
    nextCode = `${scopedCodeBase}-${counter}`;
    counter += 1;
  }

  return nextCode;
};

const buildSubjectInsertPayload = ({
  request,
  subjectTitle,
  subjectCode,
  department,
  yearLevel,
  payload,
  approvedByOrgUserId,
  now,
}: {
  request: AcademicApprovalRow;
  subjectTitle: string;
  subjectCode: string;
  department: string;
  yearLevel: string;
  payload: Record<string, unknown>;
  approvedByOrgUserId: string;
  now: string;
}) => ({
  org_id: request.org_id,
  approval_request_id: request.id,
  subject_title: subjectTitle,
  subject_code: subjectCode,
  department,
  year_level: yearLevel || null,
  lecture_hours: toNumber(payload.lectureHours),
  lab_hours: toNumber(payload.labHours, toNumber(payload.classDurationMinutes)),
  meetings_per_week: toNumber(payload.meetingsPerWeek, 1),
  units: toNumber(payload.units),
  description: toText(payload.description) || null,
  created_by_org_user_id: request.submitted_by_org_user_id,
  approved_by_org_user_id: approvedByOrgUserId,
  approved_at: now,
  created_at: now,
  updated_at: now,
});

const mapSubjectApproval = (
  row: AcademicApprovalRow,
  submittersById: Map<string, OrgUserLookup>,
  reviewersById: Map<string, OrgUserLookup>,
) => {
  const payload = asRecord(row.payload);
  const submittedBy = row.submitted_by_org_user_id
    ? submittersById.get(row.submitted_by_org_user_id)
    : null;
  const reviewedById = row.reviewed_by_vpaa_org_user_id ?? row.reviewed_by_dean_org_user_id;
  const reviewedBy = reviewedById ? reviewersById.get(reviewedById) : null;
  const reviewedAt = row.vpaa_reviewed_at ?? row.dean_reviewed_at;
  const dateCreated = toText(payload.dateCreated, row.submitted_at.slice(0, 10));

  return {
  id: row.id,
  requestType: "subject" as const,
  status:
    row.status === "approved" || row.status === "returned" || row.status === "rejected"
      ? row.status
      : "pending",
  statusLabel: statusLabel[row.status] ?? "Pending Principal",
  title: toText(payload.subjectTitle, row.title),
  targetLabel: row.title,
  payload: {
    subjectTitle: toText(payload.subjectTitle, row.title),
    department: toText(payload.department),
    yearLevel: toText(payload.yearLevel),
    classDuration: `${toNumber(payload.classDurationMinutes)} minutes`,
    dateCreated: formatDisplayDate(dateCreated),
    description: toText(payload.description),
  },
  submittedBy: submittedBy
    ? {
        id: submittedBy.id,
        name: submittedBy.full_name,
        email: submittedBy.email,
      }
    : null,
  principalRemarks: row.vpaa_remarks ?? row.dean_remarks,
  reviewedBy: reviewedBy?.full_name ?? null,
  submittedAt: row.submitted_at,
  reviewedAt,
  canAct: row.status === "pending_vpaa" || row.status === "pending_dean",
  };
};

const createApprovedSubject = async (
  request: AcademicApprovalRow,
  approvedByOrgUserId: string,
  now: string,
) => {
  const payload = asRecord(request.payload);
  const subjectTitle = toText(payload.subjectTitle, request.title);
  const subjectCode = toText(payload.subjectCode, subjectTitle).toUpperCase();
  const department = toText(payload.department);
  const yearLevel = toText(payload.yearLevel);

  if (!subjectTitle || !subjectCode || !department) {
    throw new Error("Subject approval payload is incomplete.");
  }

  const approvedSubjectCode = await resolveApprovedSubjectCode({
    orgId: request.org_id,
    subjectTitle,
    subjectCode,
    yearLevel,
  });

  const insertPayload = buildSubjectInsertPayload({
    request,
    subjectTitle,
    subjectCode: approvedSubjectCode,
    department,
    yearLevel,
    payload,
    approvedByOrgUserId,
    now,
  });

  let { error } = await supabaseAdmin.from("academic_subjects").insert([insertPayload]);

  if (error && isDuplicateSubjectError(error) && approvedSubjectCode === subjectCode) {
    const retrySubjectCode = await resolveApprovedSubjectCode({
      orgId: request.org_id,
      subjectTitle,
      subjectCode,
      yearLevel,
    });

    if (retrySubjectCode !== approvedSubjectCode) {
      const retryPayload = buildSubjectInsertPayload({
        request,
        subjectTitle,
        subjectCode: retrySubjectCode,
        department,
        yearLevel,
        payload,
        approvedByOrgUserId,
        now,
      });
      const retryResult = await supabaseAdmin.from("academic_subjects").insert([retryPayload]);
      error = retryResult.error;
    }
  }

  if (error) {
    throw new Error(
      isDuplicateSubjectError(error)
        ? "An approved subject with this name or code already exists."
        : error.message || "Failed to create approved subject.",
    );
  }
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canReviewDepedSubjects(context)) {
    return NextResponse.json(
      { error: "Only the Principal or School Head can review DepEd subjects." },
      { status: 403 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("academic_approval_requests")
    .select("*")
    .eq("org_id", context.org.id)
    .eq("request_type", SUBJECT_APPROVAL_TYPE)
    .eq("target_label", "deped_subject")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load DepEd subject approvals." },
      { status: 500 },
    );
  }

  const requests = (data ?? []) as AcademicApprovalRow[];
  const userIds = Array.from(
    new Set(
      requests
        .flatMap((request) => [
          request.submitted_by_org_user_id,
          request.reviewed_by_dean_org_user_id,
          request.reviewed_by_vpaa_org_user_id,
        ])
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const usersById = new Map<string, OrgUserLookup>();

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabaseAdmin
      .from("org_users")
      .select("id, full_name, email")
      .eq("org_id", context.org.id)
      .in("id", userIds);

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message || "Failed to load approval users." },
        { status: 500 },
      );
    }

    for (const user of (users ?? []) as OrgUserLookup[]) {
      usersById.set(user.id, user);
    }
  }

  return NextResponse.json({
    requests: requests.map((request) => mapSubjectApproval(request, usersById, usersById)),
  });
}

export async function PATCH(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canReviewDepedSubjects(context)) {
    return NextResponse.json(
      { error: "Only the Principal or School Head can review DepEd subjects." },
      { status: 403 },
    );
  }

  let payload: ReviewRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const subjectId = normalizeText(payload.subjectId);
  const decision = payload.decision;
  const remarks = normalizeText(payload.remarks);

  if (!subjectId || !decision || !["approve", "return", "reject"].includes(decision)) {
    return NextResponse.json(
      { error: "Subject and review decision are required." },
      { status: 400 },
    );
  }

  if ((decision === "return" || decision === "reject") && !remarks) {
    return NextResponse.json(
      { error: "Remarks are required when returning or rejecting a subject." },
      { status: 400 },
    );
  }

  const { data: currentSubject, error: currentSubjectError } = await supabaseAdmin
    .from("academic_approval_requests")
    .select("*")
    .eq("id", subjectId)
    .eq("org_id", context.org.id)
    .eq("request_type", SUBJECT_APPROVAL_TYPE)
    .eq("target_label", "deped_subject")
    .maybeSingle<AcademicApprovalRow>();

  if (currentSubjectError || !currentSubject?.id) {
    return NextResponse.json(
      { error: currentSubjectError?.message || "Subject approval not found." },
      { status: 404 },
    );
  }

  if (closedStatuses.has(currentSubject.status)) {
    return NextResponse.json(
      { error: "This subject approval is already closed." },
      { status: 400 },
    );
  }

  const nextStatus: ApprovalStatus =
    decision === "approve" ? "approved" : decision === "return" ? "returned" : "rejected";
  const now = new Date().toISOString();

  if (decision === "approve") {
    try {
      await createApprovedSubject(currentSubject, context.orgUser.id, now);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to approve subject." },
        { status: error instanceof Error && error.message.includes("already exists") ? 409 : 500 },
      );
    }
  }

  const history = buildDecisionHistory(currentSubject.decision_history, {
    action: decision,
    from_status: currentSubject.status,
    to_status: nextStatus,
    actor_org_user_id: context.orgUser.id,
    actor_name: context.orgUser.full_name,
    actor_role: context.role.key,
    remarks: remarks || null,
    at: now,
  });

  const { data, error } = await supabaseAdmin
    .from("academic_approval_requests")
    .update({
      status: nextStatus,
      reviewed_by_vpaa_org_user_id: context.orgUser.id,
      vpaa_remarks: remarks || null,
      vpaa_reviewed_at: now,
      decision_history: history,
      updated_at: now,
    })
    .eq("id", subjectId)
    .eq("org_id", context.org.id)
    .select("*")
    .single<AcademicApprovalRow>();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Failed to save subject review." },
      { status: 500 },
    );
  }

  const usersById = new Map<string, OrgUserLookup>([
    [
      context.orgUser.id,
      {
        id: context.orgUser.id,
        full_name: context.orgUser.full_name,
        email: context.orgUser.email,
      },
    ],
  ]);

  return NextResponse.json({
    request: mapSubjectApproval(data, usersById, usersById),
  });
}
