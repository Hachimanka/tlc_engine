import { NextResponse } from "next/server";
import { normalizeRoleKey } from "@/features/tenant-role-catalog";
import {
  SUBJECT_APPROVAL_TYPE,
  normalizeSubjectCode,
  type AcademicApprovalRow,
} from "@/lib/academicApprovals";
import { loadTenantContext, type TenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type CreateDepedSubjectRequest = {
  subjectTitle?: string;
  department?: string;
  yearLevel?: string;
  classDurationMinutes?: number | string;
  dateCreated?: string;
  description?: string;
};

const managerRoleKeys = new Set(["org_admin", "subject_manager", "subject_room_manager"]);
const validStatuses: Record<string, "Pending" | "Approved" | "Returned" | "Rejected"> = {
  pending_dean: "Pending",
  pending_vpaa: "Pending",
  approved: "Approved",
  returned: "Returned",
  rejected: "Rejected",
};

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const parsePositiveInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};

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

const createDepedSubjectCode = (subjectTitle: string) => {
  const compact = subjectTitle
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 4))
    .join("");

  return normalizeSubjectCode(compact || `DEPED-${Date.now()}`);
};

const mapSubject = (row: AcademicApprovalRow) => {
  const payload = asRecord(row.payload);
  const dateCreated = toText(payload.dateCreated, row.submitted_at.slice(0, 10));

  return {
  id: row.id,
  subjectTitle: toText(payload.subjectTitle, row.title),
  department: toText(payload.department),
  yearLevel: toText(payload.yearLevel),
  classDuration: `${toNumber(payload.classDurationMinutes)} minutes`,
  dateCreated: formatDisplayDate(dateCreated),
  status: validStatuses[row.status] ?? "Pending",
  description: toText(payload.description),
  };
};

const canManageDepedSubjects = (context: TenantContext) =>
  context.institutionType === "deped" &&
      (managerRoleKeys.has(normalizeRoleKey(context.role.key)) ||
        context.enabledFeatureKeys.includes("deped-subject-management"));

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canManageDepedSubjects(context)) {
    return NextResponse.json(
      { error: "DepEd Subject Management is not available for this account." },
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
      { error: error.message || "Failed to load DepEd subjects." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    subjects: ((data ?? []) as AcademicApprovalRow[]).map(mapSubject),
  });
}

export async function POST(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canManageDepedSubjects(context)) {
    return NextResponse.json(
      { error: "Only DepEd subject managers can create subjects." },
      { status: 403 },
    );
  }

  let payload: CreateDepedSubjectRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const subjectTitle = normalizeText(payload.subjectTitle);
  const department = normalizeText(payload.department);
  const yearLevel = normalizeText(payload.yearLevel);
  const classDurationMinutes = parsePositiveInteger(payload.classDurationMinutes);
  const dateCreated = normalizeText(payload.dateCreated) || new Date().toISOString().slice(0, 10);
  const description = normalizeText(payload.description);

  if (!subjectTitle || !department || !yearLevel || classDurationMinutes <= 0) {
    return NextResponse.json(
      { error: "Subject title, department, year level, and class duration are required." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const subjectCode = createDepedSubjectCode(subjectTitle);
  const { data, error } = await supabaseAdmin
    .from("academic_approval_requests")
    .insert([
      {
        org_id: context.org.id,
        request_type: SUBJECT_APPROVAL_TYPE,
        status: "pending_vpaa",
        title: subjectTitle,
        target_label: "deped_subject",
        payload: {
          subjectTitle,
          subjectCode,
          department,
          yearLevel,
          classDurationMinutes,
          dateCreated,
          description,
          lectureHours: 0,
          labHours: classDurationMinutes,
          meetingsPerWeek: 1,
          units: 0,
          institutionType: "deped",
        },
        submitted_by_org_user_id: context.orgUser.id,
        submitted_at: now,
        created_at: now,
        updated_at: now,
      },
    ])
    .select("*")
    .single<AcademicApprovalRow>();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Failed to create DepEd subject." },
      { status: 500 },
    );
  }

  return NextResponse.json({ subject: mapSubject(data) }, { status: 201 });
}
