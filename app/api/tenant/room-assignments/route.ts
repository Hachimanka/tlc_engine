import { NextResponse } from "next/server";
import {
  canManageRoomAssignments,
  canUseHigherEdRooms,
  jsonError,
  mapAssignment,
  mapRoom,
  normalizeText,
  normalizeTime,
  parseTimeToMinutes,
  rangesOverlap,
  validDays,
  type AcademicAssignmentRow,
  type AcademicRoomRow,
} from "@/lib/academicRooms";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type AssignmentRequest = {
  subjectId?: string;
  roomId?: string;
  section?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
};

type SubjectRow = {
  id: string;
  subject_title: string;
  subject_code: string;
  department: string;
  year_level?: string | null;
  units?: number | string | null;
};

const assignmentSelect = `
  id,
  section,
  day_of_week,
  start_time,
  end_time,
  created_at,
  updated_at,
  subject:academic_subjects!academic_room_assignments_subject_id_fkey(
    id,
    subject_title,
    subject_code,
    department
  ),
  room:academic_rooms!academic_room_assignments_room_id_fkey(
    id,
    room_name,
    building,
    room_type
  )
`;

const mapSubjectOption = (row: SubjectRow) => ({
  id: row.id,
  title: row.subject_title,
  code: row.subject_code,
  department: row.department,
  yearLevel: row.year_level ?? "",
  units: Number(row.units ?? 0),
});

async function loadAssignment(orgId: string, assignmentId: string) {
  const { data, error } = await supabaseAdmin
    .from("academic_room_assignments")
    .select(assignmentSelect)
    .eq("id", assignmentId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Assignment not found.");
  }

  return mapAssignment(data as unknown as AcademicAssignmentRow);
}

export async function GET(req: Request) {
  const result = await loadTenantContext(req);
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdRooms(context)) {
    return jsonError("Subject-room assignment is available for Higher Ed institutions only.", 400);
  }

  const [subjectsResult, roomsResult, assignmentsResult] = await Promise.all([
    supabaseAdmin
      .from("academic_subjects")
      .select("id, subject_title, subject_code, department, year_level, units")
      .eq("org_id", context.org.id)
      .order("subject_code", { ascending: true }),
    supabaseAdmin
      .from("academic_rooms")
      .select("id, room_name, building, room_type, capacity, status, created_at, updated_at")
      .eq("org_id", context.org.id)
      .order("room_name", { ascending: true }),
    supabaseAdmin
      .from("academic_room_assignments")
      .select(assignmentSelect)
      .eq("org_id", context.org.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (subjectsResult.error) {
    return jsonError(subjectsResult.error.message || "Failed to load subjects.", 500);
  }

  if (roomsResult.error) {
    return jsonError(roomsResult.error.message || "Failed to load rooms.", 500);
  }

  if (assignmentsResult.error) {
    return jsonError(assignmentsResult.error.message || "Failed to load assignments.", 500);
  }

  return NextResponse.json({
    subjects: ((subjectsResult.data ?? []) as SubjectRow[]).map(mapSubjectOption),
    rooms: ((roomsResult.data ?? []) as AcademicRoomRow[]).map(mapRoom),
    assignments: ((assignmentsResult.data ?? []) as unknown as AcademicAssignmentRow[]).map(
      mapAssignment,
    ),
    canAssign: canManageRoomAssignments(context),
  });
}

export async function POST(req: Request) {
  const result = await loadTenantContext(req);
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdRooms(context)) {
    return jsonError("Subject-room assignment is available for Higher Ed institutions only.", 400);
  }

  if (!canManageRoomAssignments(context)) {
    return jsonError("Only subject-room assigners or org admins can create assignments.", 403);
  }

  let payload: AssignmentRequest = {};
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const subjectId = normalizeText(payload.subjectId);
  const roomId = normalizeText(payload.roomId);
  const section = normalizeText(payload.section);
  const dayOfWeek = normalizeText(payload.dayOfWeek);
  const startMinutes = parseTimeToMinutes(payload.startTime);
  const endMinutes = parseTimeToMinutes(payload.endTime);

  if (
    !subjectId ||
    !roomId ||
    !section ||
    !validDays.has(dayOfWeek) ||
    startMinutes === null ||
    endMinutes === null
  ) {
    return jsonError("Subject, room, section, day, start time, and end time are required.", 400);
  }

  if (startMinutes >= endMinutes) {
    return jsonError("End time must be later than start time.", 400);
  }

  const [subjectResult, roomResult] = await Promise.all([
    supabaseAdmin
      .from("academic_subjects")
      .select("id")
      .eq("id", subjectId)
      .eq("org_id", context.org.id)
      .maybeSingle(),
    supabaseAdmin
      .from("academic_rooms")
      .select("id")
      .eq("id", roomId)
      .eq("org_id", context.org.id)
      .maybeSingle(),
  ]);

  if (subjectResult.error || !subjectResult.data?.id) {
    return jsonError("Approved subject not found in this organization.", 404);
  }

  if (roomResult.error || !roomResult.data?.id) {
    return jsonError("Room not found in this organization.", 404);
  }

  const { data: dayAssignments, error: dayAssignmentsError } = await supabaseAdmin
    .from("academic_room_assignments")
    .select("id, room_id, start_time, end_time")
    .eq("org_id", context.org.id)
    .eq("day_of_week", dayOfWeek);

  if (dayAssignmentsError) {
    return jsonError(dayAssignmentsError.message || "Failed to check schedule conflicts.", 500);
  }

  for (const assignment of dayAssignments ?? []) {
    const existingStart = parseTimeToMinutes((assignment as { start_time?: string }).start_time);
    const existingEnd = parseTimeToMinutes((assignment as { end_time?: string }).end_time);

    if (existingStart === null || existingEnd === null) {
      continue;
    }

    if (!rangesOverlap(startMinutes, endMinutes, existingStart, existingEnd)) {
      continue;
    }

    if ((assignment as { room_id?: string }).room_id === roomId) {
      return jsonError("This room already has an assignment during that time.", 409);
    }
  }

  const now = new Date().toISOString();
  const { data: created, error: createError } = await supabaseAdmin
    .from("academic_room_assignments")
    .insert([
      {
        org_id: context.org.id,
        subject_id: subjectId,
        room_id: roomId,
        section,
        day_of_week: dayOfWeek,
        start_time: normalizeTime(payload.startTime as string),
        end_time: normalizeTime(payload.endTime as string),
        created_by_org_user_id: context.orgUser.id,
        created_at: now,
        updated_at: now,
      },
    ])
    .select("id")
    .single();

  if (createError || !created?.id) {
    return jsonError(createError?.message || "Failed to create assignment.", 500);
  }

  try {
    const assignment = await loadAssignment(context.org.id, created.id);
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load created assignment.",
      500,
    );
  }
}

export async function DELETE(req: Request) {
  const result = await loadTenantContext(req);
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdRooms(context)) {
    return jsonError("Subject-room assignment is available for Higher Ed institutions only.", 400);
  }

  if (!canManageRoomAssignments(context)) {
    return jsonError("Only subject-room assigners or org admins can delete assignments.", 403);
  }

  const assignmentId = normalizeText(new URL(req.url).searchParams.get("id"));
  if (!assignmentId) {
    return jsonError("Assignment id is required.", 400);
  }

  const { error } = await supabaseAdmin
    .from("academic_room_assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("org_id", context.org.id);

  if (error) {
    return jsonError(error.message || "Failed to delete assignment.", 500);
  }

  return NextResponse.json({ ok: true });
}
