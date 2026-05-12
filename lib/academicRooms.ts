import "server-only";

import { NextResponse } from "next/server";
import type { TenantContext } from "@/lib/tenantAccess";

export type RoomStatus = "available" | "occupied" | "under_maintenance";

export type AcademicRoomRow = {
  id: string;
  room_name: string;
  building: string;
  room_type: string;
  capacity: number | string | null;
  status: RoomStatus | string | null;
  created_at: string;
  updated_at: string;
};

export type AcademicAssignmentRow = {
  id: string;
  section: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  subject?: {
    id: string;
    subject_title: string;
    subject_code: string;
    department: string;
  } | null;
  room?: {
    id: string;
    room_name: string;
    building: string;
    room_type?: string | null;
  } | null;
};

const roomManagerRoles = new Set(["room_manager", "subject_room_manager"]);
const assignmentManagerRoles = new Set(["subject_room_assigner", "subject_room_manager"]);

export const validDays = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

export const canUseHigherEdRooms = (context: TenantContext) =>
  context.institutionType === "higher_ed";

export const canManageRooms = (context: TenantContext) =>
  context.isOrgAdmin || roomManagerRoles.has(context.role.key);

export const canManageRoomAssignments = (context: TenantContext) =>
  context.isOrgAdmin || assignmentManagerRoles.has(context.role.key);

export const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

export const normalizeRoomStatus = (value: unknown): RoomStatus => {
  const normalized = normalizeText(value).toLowerCase().replace(/[\s-]+/g, "_");

  if (
    normalized === "available" ||
    normalized === "occupied" ||
    normalized === "under_maintenance"
  ) {
    return normalized;
  }

  return "available";
};

export const parsePositiveInteger = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseTimeToMinutes = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
};

export const normalizeTime = (value: string) => {
  const [hours = "00", minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
};

export const rangesOverlap = (
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
) => leftStart < rightEnd && rightStart < leftEnd;

export const mapRoom = (row: AcademicRoomRow) => ({
  id: row.id,
  name: row.room_name,
  building: row.building,
  type: row.room_type,
  capacity: parsePositiveInteger(row.capacity, 1),
  status: normalizeRoomStatus(row.status),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapAssignment = (row: AcademicAssignmentRow) => ({
  id: row.id,
  section: row.section,
  dayOfWeek: row.day_of_week,
  startTime: row.start_time?.slice(0, 5) ?? "",
  endTime: row.end_time?.slice(0, 5) ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  subject: row.subject
    ? {
        id: row.subject.id,
        title: row.subject.subject_title,
        code: row.subject.subject_code,
        department: row.subject.department,
      }
    : null,
  room: row.room
    ? {
        id: row.room.id,
        name: row.room.room_name,
        building: row.room.building,
        type: row.room.room_type ?? "",
      }
    : null,
});
