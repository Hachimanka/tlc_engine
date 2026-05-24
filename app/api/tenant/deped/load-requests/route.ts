import { NextResponse } from "next/server";
import { loadTenantContext } from "@/lib/tenantAccess";
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

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const requestTypeLabels: Record<string, string> = {
  "load-concern": "Load Concern",
  "schedule-conflict": "Schedule Conflict",
  "subject-assignment": "Subject Assignment",
  clarification: "Clarification / Question",
  other: "Other",
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
