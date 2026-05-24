import { NextResponse } from "next/server";
import { normalizeRoleKey } from "@/features/tenant-role-catalog";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type OrgUserRow = {
  id: string;
  full_name: string;
  email: string;
  department?: string | null;
  department_id?: string | null;
  role_label?: string | null;
  roles?: { key?: string | null; name?: string | null } | { key?: string | null; name?: string | null }[] | null;
};

type RawRoomAssignmentRow = {
  id: string;
  subject_id: string;
  room_id: string;
  section: string | null;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
};

type SubjectRow = {
  id: string;
  subject_title: string;
  subject_code: string;
  department: string | null;
  year_level: string | null;
};

type RoomRow = {
  id: string;
  room_name: string;
  building: string | null;
  room_type: string | null;
};

const rawAssignmentSelect =
  "id, subject_id, room_id, section, day_of_week, start_time, end_time, created_at, updated_at";
const roomAssignmentTables = ["academic_room_assignment", "academic_room_assignments"];

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const normalizeDepartmentKey = (value: unknown) => {
  const key = normalizeRoleKey(normalizeText(value).replace(/\s+department$/i, ""));

  if (key === "math") {
    return "mathematics";
  }

  return key;
};

const isMissingTableError = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === "42P01" ||
  error?.message?.toLowerCase().includes("schema cache") ||
  error?.message?.toLowerCase().includes("does not exist");

const normalizeJoinedRole = (role: OrgUserRow["roles"]) => {
  if (Array.isArray(role)) {
    return role[0] ?? null;
  }

  return role ?? null;
};

const isTeacherAccount = (user: OrgUserRow) => {
  const role = normalizeJoinedRole(user.roles);
  const label = normalizeRoleKey(user.role_label ?? "");
  const roleKey = normalizeRoleKey(role?.key ?? "");
  const roleName = normalizeRoleKey(role?.name ?? "");
  const combined = `${label} ${roleKey} ${roleName}`;

  return combined.includes("teacher") || combined.includes("faculty");
};

const belongsToDepartment = (
  user: Pick<OrgUserRow, "department" | "department_id">,
  departmentId: string,
  departmentName: string,
) => {
  if (departmentId && user.department_id === departmentId) {
    return true;
  }

  return (
    Boolean(departmentName) &&
    normalizeDepartmentKey(user.department ?? "") === normalizeDepartmentKey(departmentName)
  );
};

const parseTimeParts = (value: unknown) => {
  const normalized = normalizeText(value);
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
};

const formatTimeLabel = (value: unknown) => {
  const parts = parseTimeParts(value);

  if (!parts) {
    return normalizeText(value);
  }

  const hour12 = parts.hours % 12 || 12;
  const suffix = parts.hours >= 12 ? "PM" : "AM";

  return `${hour12}:${String(parts.minutes).padStart(2, "0")} ${suffix}`;
};

const getDurationMinutes = (startTime: unknown, endTime: unknown) => {
  const start = parseTimeParts(startTime);
  const end = parseTimeParts(endTime);

  if (!start || !end) {
    return 0;
  }

  return Math.max(0, end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes));
};

async function loadRoomAssignments(orgId: string) {
  let lastError: { code?: string; message?: string } | null = null;

  for (const tableName of roomAssignmentTables) {
    const result = await supabaseAdmin
      .from(tableName)
      .select(rawAssignmentSelect)
      .eq("org_id", orgId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (!result.error) {
      return {
        data: (result.data ?? []) as RawRoomAssignmentRow[],
        error: null,
      };
    }

    lastError = result.error;

    if (!isMissingTableError(result.error)) {
      break;
    }
  }

  return { data: [] as RawRoomAssignmentRow[], error: lastError };
}

async function loadAssignedSubjects(orgId: string, departmentName: string) {
  const assignmentsResult = await loadRoomAssignments(orgId);

  if (assignmentsResult.error) {
    throw new Error(assignmentsResult.error.message || "Failed to load room-assigned subjects.");
  }

  const assignments = assignmentsResult.data;

  if (assignments.length === 0) {
    return [];
  }

  const subjectIds = Array.from(new Set(assignments.map((assignment) => assignment.subject_id)));
  const roomIds = Array.from(new Set(assignments.map((assignment) => assignment.room_id)));

  const [subjectsResult, roomsResult] = await Promise.all([
    supabaseAdmin
      .from("academic_subjects")
      .select("id, subject_title, subject_code, department, year_level")
      .eq("org_id", orgId)
      .in("id", subjectIds),
    supabaseAdmin
      .from("academic_rooms")
      .select("id, room_name, building, room_type")
      .eq("org_id", orgId)
      .in("id", roomIds),
  ]);

  if (subjectsResult.error) {
    throw new Error(subjectsResult.error.message || "Failed to load assigned subjects.");
  }

  if (roomsResult.error) {
    throw new Error(roomsResult.error.message || "Failed to load assigned subject rooms.");
  }

  const subjectsById = new Map(
    ((subjectsResult.data ?? []) as SubjectRow[]).map((subject) => [subject.id, subject]),
  );
  const roomsById = new Map(
    ((roomsResult.data ?? []) as RoomRow[]).map((room) => [room.id, room]),
  );
  const activeDepartmentKey = normalizeDepartmentKey(departmentName);

  return assignments
    .map((assignment) => {
      const subject = subjectsById.get(assignment.subject_id);

      if (!subject || normalizeDepartmentKey(subject.department) !== activeDepartmentKey) {
        return null;
      }

      const room = roomsById.get(assignment.room_id);
      const startLabel = formatTimeLabel(assignment.start_time);
      const endLabel = formatTimeLabel(assignment.end_time);
      const durationMinutes = getDurationMinutes(assignment.start_time, assignment.end_time);

      return {
        id: assignment.id,
        subjectTitle: subject.subject_title,
        department: subject.department ?? departmentName,
        yearLevel: subject.year_level ?? "",
        schedule: `${normalizeText(assignment.day_of_week)} ${startLabel} - ${endLabel}`,
        room: room?.room_name ?? "",
        section: normalizeText(assignment.section) || "N/A",
        hoursPerDay: `${durationMinutes} minutes`,
        status: "Approved" as const,
      };
    })
    .filter(Boolean);
}

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (
    context.institutionType !== "deped" ||
    (!context.isOrgAdmin && !context.enabledFeatureKeys.includes("deped-teacher-load-assignment"))
  ) {
    return NextResponse.json(
      { error: "DepEd teacher load assignment is not available for this account." },
      { status: 403 },
    );
  }

  const { data: currentUser, error: currentUserError } = await supabaseAdmin
    .from("org_users")
    .select("id, department, department_id")
    .eq("id", context.orgUser.id)
    .eq("org_id", context.org.id)
    .maybeSingle<{ id: string; department?: string | null; department_id?: string | null }>();

  if (currentUserError) {
    return NextResponse.json(
      { error: currentUserError.message || "Failed to load department context." },
      { status: 500 },
    );
  }

  const departmentName = normalizeText(currentUser?.department ?? context.orgUser.department);
  const departmentId = normalizeText(currentUser?.department_id);

  if (!departmentName && !departmentId) {
    return NextResponse.json({ departmentName: "", faculty: [], subjects: [] });
  }

  const { data: users, error: usersError } = await supabaseAdmin
    .from("org_users")
    .select(
      "id, full_name, email, department, department_id, role_label, roles(key, name)",
    )
    .eq("org_id", context.org.id)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (usersError) {
    return NextResponse.json(
      { error: usersError.message || "Failed to load department faculty." },
      { status: 500 },
    );
  }

  const faculty = ((users ?? []) as OrgUserRow[])
    .filter((user) => belongsToDepartment(user, departmentId, departmentName))
    .filter(isTeacherAccount)
    .map((user) => ({
      id: user.id,
      accountId: user.id,
      name: user.full_name,
      email: user.email,
      department: user.department ?? departmentName,
      specialization: normalizeText(user.department) || departmentName || "Teacher",
      employmentType: "Full Time",
    }));

  let subjects = [];
  try {
    subjects = await loadAssignedSubjects(context.org.id, departmentName);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load room-assigned subjects.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    departmentName,
    faculty,
    subjects,
  });
}
