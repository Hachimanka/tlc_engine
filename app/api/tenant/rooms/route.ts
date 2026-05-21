import { NextResponse } from "next/server";
import {
  mapRoomAssignment,
  mapSubjectOption,
  canManageRooms,
  canUseHigherEdRooms,
  jsonError,
  mapRoom,
  normalizeRoomStatus,
  normalizeText,
  parsePositiveInteger,
  type AcademicRoomAssignmentRow,
  type AcademicRoomRow,
  type AcademicSubjectOptionRow,
} from "@/lib/academicRooms";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type RoomRequest = {
  id?: string;
  name?: string;
  building?: string;
  type?: string;
  capacity?: number | string;
  status?: string;
};

const roomSelect = "id, room_name, building, room_type, capacity, status, created_at, updated_at";
const subjectSelect = "id, subject_title, subject_code, department, year_level, meetings_per_week, units";
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
    meetings_per_week,
    units
  ),
  room:academic_rooms!academic_room_assignments_room_id_fkey(
    id,
    room_name,
    building,
    room_type
  )
`;

const getRoomValues = (payload: RoomRequest) => ({
  name: normalizeText(payload.name),
  building: normalizeText(payload.building),
  type: normalizeText(payload.type) || "Lecture Room",
  capacity: parsePositiveInteger(payload.capacity),
  status: normalizeRoomStatus(payload.status),
});

async function hasDuplicateRoom(
  orgId: string,
  roomName: string,
  building: string,
  excludeId?: string,
) {
  let query = supabaseAdmin
    .from("academic_rooms")
    .select("id")
    .eq("org_id", orgId)
    .ilike("room_name", roomName)
    .ilike("building", building);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to check room uniqueness.");
  }

  return Boolean(data?.id);
}

export async function GET(req: Request) {
  const result = await loadTenantContext(req);
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdRooms(context)) {
    return jsonError("Room management is available for Higher Ed institutions only.", 400);
  }

  const [roomsResult, subjectsResult, assignmentsResult] = await Promise.all([
    supabaseAdmin
      .from("academic_rooms")
      .select(roomSelect)
      .eq("org_id", context.org.id)
      .order("room_name", { ascending: true }),
    supabaseAdmin
      .from("academic_subjects")
      .select(subjectSelect)
      .eq("org_id", context.org.id)
      .order("subject_code", { ascending: true }),
    supabaseAdmin
      .from("academic_room_assignments")
      .select(assignmentSelect)
      .eq("org_id", context.org.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (roomsResult.error) {
    return jsonError(roomsResult.error.message || "Failed to load rooms.", 500);
  }

  if (subjectsResult.error) {
    return jsonError(subjectsResult.error.message || "Failed to load approved subjects.", 500);
  }

  if (assignmentsResult.error) {
    return jsonError(assignmentsResult.error.message || "Failed to load room schedules.", 500);
  }

  return NextResponse.json({
    rooms: ((roomsResult.data ?? []) as AcademicRoomRow[]).map(mapRoom),
    subjects: ((subjectsResult.data ?? []) as AcademicSubjectOptionRow[]).map(mapSubjectOption),
    assignments: ((assignmentsResult.data ?? []) as AcademicRoomAssignmentRow[]).map(
      mapRoomAssignment,
    ),
    canManage: canManageRooms(context),
  });
}

export async function POST(req: Request) {
  const result = await loadTenantContext(req);
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdRooms(context)) {
    return jsonError("Room management is available for Higher Ed institutions only.", 400);
  }

  if (!canManageRooms(context)) {
    return jsonError("Only room managers or org admins can create rooms.", 403);
  }

  let payload: RoomRequest = {};
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const values = getRoomValues(payload);

  if (!values.name || !values.building || values.capacity <= 0) {
    return jsonError("Room name, building, and capacity are required.", 400);
  }

  try {
    if (await hasDuplicateRoom(context.org.id, values.name, values.building)) {
      return jsonError("A room with this name already exists in this building.", 409);
    }
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to check room uniqueness.",
      500,
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("academic_rooms")
    .insert([
      {
        org_id: context.org.id,
        room_name: values.name,
        building: values.building,
        room_type: values.type,
        capacity: values.capacity,
        status: values.status,
        created_by_org_user_id: context.orgUser.id,
        created_at: now,
        updated_at: now,
      },
    ])
    .select(roomSelect)
    .single();

  if (error || !data) {
    return jsonError(error?.message || "Failed to create room.", 500);
  }

  return NextResponse.json({ room: mapRoom(data as AcademicRoomRow) }, { status: 201 });
}

export async function PATCH(req: Request) {
  const result = await loadTenantContext(req);
  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdRooms(context)) {
    return jsonError("Room management is available for Higher Ed institutions only.", 400);
  }

  if (!canManageRooms(context)) {
    return jsonError("Only room managers or org admins can update rooms.", 403);
  }

  let payload: RoomRequest = {};
  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const roomId = normalizeText(payload.id);
  if (!roomId) {
    return jsonError("Room id is required.", 400);
  }

  const values = getRoomValues(payload);

  if (!values.name || !values.building || values.capacity <= 0) {
    return jsonError("Room name, building, and capacity are required.", 400);
  }

  try {
    if (await hasDuplicateRoom(context.org.id, values.name, values.building, roomId)) {
      return jsonError("A room with this name already exists in this building.", 409);
    }
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to check room uniqueness.",
      500,
    );
  }

  const { data, error } = await supabaseAdmin
    .from("academic_rooms")
    .update({
      room_name: values.name,
      building: values.building,
      room_type: values.type,
      capacity: values.capacity,
      status: values.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("org_id", context.org.id)
    .select(roomSelect)
    .maybeSingle();

  if (error || !data) {
    return jsonError(error?.message || "Room not found.", error ? 500 : 404);
  }

  return NextResponse.json({ room: mapRoom(data as AcademicRoomRow) });
}
