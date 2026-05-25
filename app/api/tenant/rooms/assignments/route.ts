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
  type AcademicRoomRow,
  type AcademicSubjectOptionRow,
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
const roomAssignmentTables = ["academic_room_assignment", "academic_room_assignments"];

type RawRoomAssignmentRow = {
  id: string;
  subject_id: string;
  room_id: string;
  section: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};

const assignmentSelect =
  "id, subject_id, room_id, section, day_of_week, start_time, end_time, created_at, updated_at";

const getAssignmentValues = (payload: AssignmentRequest) => ({
  roomId: normalizeText(payload.roomId),
  subjectId: normalizeText(payload.subjectId),
  section: normalizeText(payload.section),
  dayOfWeek: normalizeText(payload.dayOfWeek),
  startTime: normalizeTime(payload.startTime),
  endTime: normalizeTime(payload.endTime),
});

const normalizeSectionKey = (value: unknown) => normalizeText(value).toLowerCase();

const isMissingTableError = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === "42P01" ||
  error?.message?.toLowerCase().includes("schema cache") ||
  error?.message?.toLowerCase().includes("does not exist");

async function withRoomAssignmentTable<T>(
  operation: (tableName: string) => Promise<{ data: T; error: { code?: string; message?: string } | null }>,
) {
  let lastError: { code?: string; message?: string } | null = null;

  for (const tableName of roomAssignmentTables) {
    const result = await operation(tableName);

    if (!result.error) {
      return result;
    }

    lastError = result.error;

    if (!isMissingTableError(result.error)) {
      break;
    }
  }

  return { data: null as T, error: lastError };
}

const hydrateAssignment = (
  assignment: RawRoomAssignmentRow,
  subject: AcademicSubjectOptionRow | null,
  room: Pick<AcademicRoomRow, "id" | "room_name" | "building" | "room_type"> | null,
): AcademicRoomAssignmentRow => ({
  id: assignment.id,
  section: assignment.section,
  day_of_week: assignment.day_of_week,
  start_time: assignment.start_time,
  end_time: assignment.end_time,
  created_at: assignment.created_at,
  updated_at: assignment.updated_at,
  subject,
  room,
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
      .select("id, room_name, building, room_type")
      .eq("id", values.roomId)
      .eq("org_id", context.org.id)
      .maybeSingle<Pick<AcademicRoomRow, "id" | "room_name" | "building" | "room_type">>(),
    supabaseAdmin
      .from("academic_subjects")
      .select("id, subject_title, subject_code, department, year_level, meetings_per_week, units")
      .eq("id", values.subjectId)
      .eq("org_id", context.org.id)
      .maybeSingle<AcademicSubjectOptionRow>(),
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

  const meetingsPerWeek = Number(
    (subjectResult.data as { meetings_per_week?: number | string | null }).meetings_per_week ?? 2,
  );

  if (!Number.isFinite(meetingsPerWeek) || meetingsPerWeek <= 0) {
    return jsonError("Subject meetings per week must be greater than zero.", 400);
  }

  const { data: subjectMeetingCount, error: subjectMeetingCountError } =
    await withRoomAssignmentTable<number | null>(async (tableName) => {
      const { count, error } = await supabaseAdmin
        .from(tableName)
        .select("id", { count: "exact", head: true })
        .eq("org_id", context.org.id)
        .eq("subject_id", values.subjectId)
        .ilike("section", values.section);

      return { data: count ?? 0, error };
    });

  if (subjectMeetingCountError) {
    return jsonError(
      subjectMeetingCountError.message || "Failed to check subject meeting limit.",
      500,
    );
  }

  if ((subjectMeetingCount ?? 0) >= meetingsPerWeek) {
    const subjectCode =
      (subjectResult.data as { subject_code?: string | null }).subject_code ?? "This subject";

    return jsonError(
      `${subjectCode} section ${values.section} already reached its ${meetingsPerWeek} meeting${
        meetingsPerWeek === 1 ? "" : "s"
      } per week limit.`,
      409,
    );
  }

  const { data: existingAssignments, error: conflictError } =
    await withRoomAssignmentTable<unknown[] | null>(async (tableName) => {
      const result = await supabaseAdmin
        .from(tableName)
        .select(assignmentSelect)
        .eq("org_id", context.org.id)
        .eq("room_id", values.roomId)
        .eq("day_of_week", values.dayOfWeek);

      return { data: result.data, error: result.error };
    });

  if (conflictError) {
    return jsonError(conflictError.message || "Failed to check room schedule conflicts.", 500);
  }

  const conflict = ((existingAssignments ?? []) as RawRoomAssignmentRow[]).find(
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
    const { data: conflictSubject } = await supabaseAdmin
      .from("academic_subjects")
      .select("subject_code")
      .eq("id", conflict.subject_id)
      .eq("org_id", context.org.id)
      .maybeSingle<{ subject_code: string | null }>();

    return jsonError(
      `Room conflict: ${conflictSubject?.subject_code ?? "Subject"} is already assigned from ${
        conflict.start_time
      } to ${conflict.end_time}.`,
      409,
    );
  }

  const { data: sectionAssignments, error: sectionConflictError } =
    await withRoomAssignmentTable<unknown[] | null>(async (tableName) => {
      const result = await supabaseAdmin
        .from(tableName)
        .select(assignmentSelect)
        .eq("org_id", context.org.id)
        .ilike("section", values.section)
        .eq("day_of_week", values.dayOfWeek);

      return { data: result.data, error: result.error };
    });

  if (sectionConflictError) {
    return jsonError(
      sectionConflictError.message || "Failed to check section schedule conflicts.",
      500,
    );
  }

  const sectionConflict = ((sectionAssignments ?? []) as RawRoomAssignmentRow[]).find(
    (assignment) => {
      if (normalizeSectionKey(assignment.section) !== normalizeSectionKey(values.section)) {
        return false;
      }

      const existingStart = parseTimeToMinutes(assignment.start_time);
      const existingEnd = parseTimeToMinutes(assignment.end_time);

      return (
        existingStart !== null &&
        existingEnd !== null &&
        rangesOverlap(startMinutes, endMinutes, existingStart, existingEnd)
      );
    },
  );

  if (sectionConflict) {
    const { data: conflictSubject } = await supabaseAdmin
      .from("academic_subjects")
      .select("subject_code")
      .eq("id", sectionConflict.subject_id)
      .eq("org_id", context.org.id)
      .maybeSingle<{ subject_code: string | null }>();

    return jsonError(
      `Section conflict: ${values.section} already has ${
        conflictSubject?.subject_code ?? "a subject"
      } from ${sectionConflict.start_time} to ${sectionConflict.end_time}.`,
      409,
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await withRoomAssignmentTable<unknown | null>(async (tableName) => {
    const result = await supabaseAdmin
      .from(tableName)
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

    return { data: result.data, error: result.error };
  });

  if (error || !data) {
    return jsonError(error?.message || "Failed to assign subject to room.", 500);
  }

  return NextResponse.json(
    {
      assignment: mapRoomAssignment(
        hydrateAssignment(
          data as RawRoomAssignmentRow,
          subjectResult.data as AcademicSubjectOptionRow,
          roomResult.data as Pick<AcademicRoomRow, "id" | "room_name" | "building" | "room_type">,
        ),
      ),
    },
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

  const { data, error } = await withRoomAssignmentTable<{ id: string } | null>(async (tableName) => {
    const result = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq("id", assignmentId)
      .eq("org_id", context.org.id)
      .select("id")
      .maybeSingle();

    return { data: result.data, error: result.error };
  });

  if (error) {
    return jsonError(error.message || "Failed to remove room assignment.", 500);
  }

  if (!data?.id) {
    return jsonError("Room assignment not found.", 404);
  }

  return NextResponse.json({ ok: true, id: data.id });
}
