import { NextResponse } from "next/server";
import {
  canManageRooms,
  canUseHigherEdRooms,
  jsonError,
  mapRoomAssignment,
  normalizeText,
  normalizeTime,
  parseTimeToMinutes,
  rangesOverlap,
  validRoomScheduleDays,
  type AcademicRoomAssignmentRow,
} from "@/lib/academicRooms";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type AssignmentRequest = {
  id?: string;
  roomId?: string;
  subjectId?: string;
  section?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
};

const scheduleStart = 7 * 60;
const scheduleEnd = 21 * 60;

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
    department,
    year_level,
    units
  ),
  room:academic_rooms!academic_room_assignments_room_id_fkey(
    id,
    room_name,
    building,
    room_type
  )
`;

const getAssignmentValues = (payload: AssignmentRequest) => ({
  roomId: normalizeText(payload.roomId),
  subjectId: normalizeText(payload.subjectId),
  section: normalizeText(payload.section),
  dayOfWeek: normalizeText(payload.dayOfWeek),
  startTime: normalizeTime(payload.startTime),
  endTime: normalizeTime(payload.endTime),
});

export async function POST(req: Request) {
  const result = await loadTenantContext(req);
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdRooms(context)) {
    return jsonError("Room schedules are available for Higher Ed institutions only.", 400);
  }

  if (!canManageRooms(context)) {
    return jsonError("Only room managers or org admins can assign subjects to rooms.", 403);
  }

  let payload: AssignmentRequest = {};
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const values = getAssignmentValues(payload);

  if (
    !values.roomId ||
    !values.subjectId ||
    !values.section ||
    !validRoomScheduleDays.has(values.dayOfWeek) ||
    !values.startTime ||
    !values.endTime
  ) {
    return jsonError("Subject, room, section, day, start time, and end time are required.", 400);
  }

  const startMinutes = parseTimeToMinutes(values.startTime);
  const endMinutes = parseTimeToMinutes(values.endTime);

  if (
    startMinutes === null ||
    endMinutes === null ||
    startMinutes >= endMinutes ||
    startMinutes < scheduleStart ||
    endMinutes > scheduleEnd
  ) {
    return jsonError("Schedule time must be between 7:00 AM and 9:00 PM.", 400);
  }

  const [roomResult, subjectResult] = await Promise.all([
    supabaseAdmin
      .from("academic_rooms")
      .select("id")
      .eq("id", values.roomId)
      .eq("org_id", context.org.id)
      .maybeSingle(),
    supabaseAdmin
      .from("academic_subjects")
      .select("id")
      .eq("id", values.subjectId)
      .eq("org_id", context.org.id)
      .maybeSingle(),
  ]);

  if (roomResult.error) {
    return jsonError(roomResult.error.message || "Failed to verify room.", 500);
  }

  if (!roomResult.data) {
    return jsonError("Room not found.", 404);
  }

  if (subjectResult.error) {
    return jsonError(subjectResult.error.message || "Failed to verify subject.", 500);
  }

  if (!subjectResult.data) {
    return jsonError("Only approved subjects can be assigned to rooms.", 400);
  }

  const { data: existingAssignments, error: conflictError } = await supabaseAdmin
    .from("academic_room_assignments")
    .select(assignmentSelect)
    .eq("org_id", context.org.id)
    .eq("room_id", values.roomId)
    .eq("day_of_week", values.dayOfWeek);

  if (conflictError) {
    return jsonError(conflictError.message || "Failed to check room schedule conflicts.", 500);
  }

  const conflict = ((existingAssignments ?? []) as AcademicRoomAssignmentRow[]).find(
    (assignment) => {
      const existingStart = parseTimeToMinutes(assignment.start_time);
      const existingEnd = parseTimeToMinutes(assignment.end_time);

      return (
        existingStart !== null &&
        existingEnd !== null &&
        rangesOverlap(startMinutes, endMinutes, existingStart, existingEnd)
      );
    },
  );

  if (conflict) {
    const mappedConflict = mapRoomAssignment(conflict);
    return jsonError(
      `Room conflict: ${mappedConflict.subject?.code ?? "Subject"} is already assigned from ${
        mappedConflict.startTime
      } to ${mappedConflict.endTime}.`,
      409,
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("academic_room_assignments")
    .insert([
      {
        org_id: context.org.id,
        room_id: values.roomId,
        subject_id: values.subjectId,
        section: values.section,
        day_of_week: values.dayOfWeek,
        start_time: values.startTime,
        end_time: values.endTime,
        created_by_org_user_id: context.orgUser.id,
        created_at: now,
        updated_at: now,
      },
    ])
    .select(assignmentSelect)
    .single();

  if (error || !data) {
    return jsonError(error?.message || "Failed to assign subject to room.", 500);
  }

  return NextResponse.json(
    { assignment: mapRoomAssignment(data as AcademicRoomAssignmentRow) },
    { status: 201 },
  );
}

export async function DELETE(req: Request) {
  const result = await loadTenantContext(req);
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdRooms(context)) {
    return jsonError("Room schedules are available for Higher Ed institutions only.", 400);
  }

  if (!canManageRooms(context)) {
    return jsonError("Only room managers or org admins can remove room assignments.", 403);
  }

  const url = new URL(req.url);
  const assignmentId = normalizeText(url.searchParams.get("id"));

  if (!assignmentId) {
    return jsonError("Assignment id is required.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("academic_room_assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("org_id", context.org.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return jsonError(error.message || "Failed to remove room assignment.", 500);
  }

  if (!data?.id) {
    return jsonError("Room assignment not found.", 404);
  }

  return NextResponse.json({ ok: true, id: data.id });
}
