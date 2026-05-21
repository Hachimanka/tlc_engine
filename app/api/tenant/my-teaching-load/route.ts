import { NextResponse } from "next/server";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type FacultyLoadAssignmentRow = {
  id: string;
  room_assignment: {
    id: string;
    section: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    subject: {
      id: string;
      subject_title: string;
      subject_code: string;
      units: number | string | null;
    } | null;
    room: {
      id: string;
      room_name: string;
      building: string;
    } | null;
  } | null;
};

type TeachingLoadRow = {
  id: string;
  subjectId: string;
  subjectTitle: string;
  subjectCode: string;
  schedule: string;
  room: string;
  section: string;
  students: number;
  units: number;
};

const dayLabels: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const formatDisplayTime = (value: string) => {
  const [hourValue = "0", minuteValue = "00"] = value.split(":");
  const hour24 = Number(hourValue);
  const minute = minuteValue.padStart(2, "0").slice(0, 2);
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute}${suffix}`;
};

const normalizeSection = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, " ");
  const parts = cleaned.split(/\s*-\s*/).filter(Boolean);
  return parts.at(-1) ?? cleaned;
};

const uniqueJoin = (values: string[], separator = ", ") =>
  Array.from(new Set(values.filter(Boolean))).join(separator);

const mapAssignment = (row: FacultyLoadAssignmentRow) => {
  const assignment = row.room_assignment;

  if (!assignment?.subject?.id) {
    return null;
  }

  const dayLabel = dayLabels[assignment.day_of_week] ?? assignment.day_of_week;

  return {
    id: assignment.id,
    subjectId: assignment.subject.id,
    subjectTitle: assignment.subject.subject_title,
    subjectCode: assignment.subject.subject_code,
    schedule: `${dayLabel} ${formatDisplayTime(assignment.start_time)} - ${formatDisplayTime(
      assignment.end_time,
    )}`,
    room: assignment.room?.room_name ?? "",
    section: normalizeSection(assignment.section),
    students: 0,
    units: Number(assignment.subject.units ?? 0),
  };
};

const groupAssignments = (rows: FacultyLoadAssignmentRow[]) => {
  const grouped = new Map<string, TeachingLoadRow>();

  for (const row of rows) {
    const mapped = mapAssignment(row);

    if (!mapped) {
      continue;
    }

    const key = `${mapped.subjectId}|${mapped.section.toLowerCase()}`;
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, mapped);
      continue;
    }

    grouped.set(key, {
      ...current,
      id: `${current.id}|${mapped.id}`,
      schedule: uniqueJoin([current.schedule, mapped.schedule], " / "),
      room: uniqueJoin([current.room, mapped.room]),
    });
  }

  return Array.from(grouped.values()).map((row) => ({
    id: row.id,
    subjectTitle: row.subjectTitle,
    subjectCode: row.subjectCode,
    schedule: row.schedule,
    room: row.room,
    section: row.section,
    students: row.students,
  }));
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  const { data, error } = await supabaseAdmin
    .from("academic_faculty_load_assignments")
    .select(
      `
        id,
        room_assignment:academic_room_assignments!academic_faculty_load_assignments_room_assignment_id_fkey(
          id,
          section,
          day_of_week,
          start_time,
          end_time,
          subject:academic_subjects!academic_room_assignments_subject_id_fkey(
            id,
            subject_title,
            subject_code,
            units
          ),
          room:academic_rooms!academic_room_assignments_room_id_fkey(
            id,
            room_name,
            building
          )
        )
      `,
    )
    .eq("org_id", context.org.id)
    .eq("faculty_org_user_id", context.orgUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load teaching load." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    rows: groupAssignments((data ?? []) as unknown as FacultyLoadAssignmentRow[]),
  });
}
