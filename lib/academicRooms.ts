import "server-only";

import { NextResponse } from "next/server";
import { normalizeRoleKey } from "@/features/tenant-role-catalog";
import type { TenantContext } from "@/lib/tenantAccess";

export type RoomStatus = "available" | "occupied" | "under_maintenance";

export type AcademicRoomRow = {
  id: string;
  room_name: string;
  building: string;
  room_type: string;
  capacity: number | string | null;
  status: RoomStatus | string | null;
  section?: string | null;
  year_level?: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademicSubjectOptionRow = {
  id: string;
  subject_title: string;
  subject_code: string;
  department: string | null;
  year_level: string | null;
  meetings_per_week?: number | string | null;
  units: number | string | null;
};

export type AcademicRoomAssignmentRow = {
  id: string;
  section: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  subject: AcademicSubjectOptionRow | AcademicSubjectOptionRow[] | null;
  room:
    | Pick<AcademicRoomRow, "id" | "room_name" | "building" | "room_type">
    | Pick<AcademicRoomRow, "id" | "room_name" | "building" | "room_type">[]
    | null;
};

const roomManagerRoles = new Set([
  "room_manager",
  "manage_rooms",
  "room_management",
  "subject_room_manager",
]);

export const validRoomScheduleDays = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

export const canUseHigherEdRooms = (context: TenantContext) =>
  context.institutionType === "higher_ed" || context.institutionType === "deped";

export const canManageRooms = (context: TenantContext) =>
  context.isOrgAdmin ||
  roomManagerRoles.has(normalizeRoleKey(context.role.key)) ||
  context.enabledFeatureKeys.includes("higher-room-schedule-management") ||
  context.enabledFeatureKeys.includes("deped-room-management");

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

export const normalizeTime = (value: unknown) => {
  const normalized = normalizeText(value);
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return "";
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return "";
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const parseTimeToMinutes = (value: unknown) => {
  const normalized = normalizeTime(value);

  if (!normalized) {
    return null;
  }

  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
};

export const rangesOverlap = (
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
) => firstStart < secondEnd && secondStart < firstEnd;

export const mapRoom = (row: AcademicRoomRow) => ({
  id: row.id,
  name: row.room_name,
  building: row.building,
  type: row.room_type,
  capacity: parsePositiveInteger(row.capacity, 1),
  status: normalizeRoomStatus(row.status),
  section: row.section ?? "",
  yearLevel: row.year_level ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapSubjectOption = (row: AcademicSubjectOptionRow) => ({
  id: row.id,
  title: row.subject_title,
  code: row.subject_code,
  department: row.department ?? "",
  yearLevel: row.year_level ?? "",
  meetingsPerWeek: Number(row.meetings_per_week ?? 2),
  units: Number(row.units ?? 0),
});

const firstOrNull = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

export const mapRoomAssignment = (row: AcademicRoomAssignmentRow) => {
  const subject = firstOrNull(row.subject);
  const room = firstOrNull(row.room);

  return {
    id: row.id,
    section: row.section,
    dayOfWeek: row.day_of_week,
    startTime: normalizeTime(row.start_time),
    endTime: normalizeTime(row.end_time),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subject: subject
      ? {
          id: subject.id,
          title: subject.subject_title,
          code: subject.subject_code,
          department: subject.department ?? "",
          yearLevel: subject.year_level ?? "",
          meetingsPerWeek: Number(subject.meetings_per_week ?? 2),
          units: Number(subject.units ?? 0),
        }
      : null,
    room: room
      ? {
          id: room.id,
          name: room.room_name,
          building: room.building,
          type: room.room_type,
        }
      : null,
  };
};
