import { NextResponse } from "next/server";
import {
  canManageRooms,
  canUseHigherEdRooms,
  jsonError,
  mapRoom,
  normalizeRoomStatus,
  normalizeText,
  parsePositiveInteger,
  type AcademicRoomRow,
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

  const { data, error } = await supabaseAdmin
    .from("academic_rooms")
    .select("id, room_name, building, room_type, capacity, status, created_at, updated_at")
    .eq("org_id", context.org.id)
    .order("room_name", { ascending: true });

  if (error) {
    return jsonError(error.message || "Failed to load rooms.", 500);
  }

  return NextResponse.json({
    rooms: ((data ?? []) as AcademicRoomRow[]).map(mapRoom),
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
    .select("id, room_name, building, room_type, capacity, status, created_at, updated_at")
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
    .select("id, room_name, building, room_type, capacity, status, created_at, updated_at")
    .maybeSingle();

  if (error || !data) {
    return jsonError(error?.message || "Room not found.", error ? 500 : 404);
  }

  return NextResponse.json({ room: mapRoom(data as AcademicRoomRow) });
}
