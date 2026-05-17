import { NextResponse } from "next/server";
import { normalizeRoleKey } from "@/features/tenant-role-catalog";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type RoleShape = {
  key?: string | null;
  name?: string | null;
};

type FacultyUserRow = {
  id: string;
  full_name: string;
  email: string;
  employee_id: string | null;
  department: string | null;
  status: string | null;
  roles?: RoleShape | RoleShape[] | null;
};

type SubjectRoomAssignmentRow = {
  id: string;
  section: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: {
    id: string;
    subject_title: string;
    subject_code: string;
    department: string;
    year_level: string | null;
    units: number | string | null;
  } | null;
  room: {
    id: string;
    room_name: string;
    building: string;
  } | null;
};

const facultyRoleKeys = new Set(["faculty", "teacher"]);
const managerRoleKeys = new Set([
  "org_admin",
  "dean",
  "department_head",
  "load_manager",
]);

const getRole = (roles: FacultyUserRow["roles"]) => {
  if (Array.isArray(roles)) {
    return roles[0] ?? null;
  }

  return roles ?? null;
};

const sameDepartment = (left?: string | null, right?: string | null) =>
  (left ?? "").trim().toLowerCase() === (right ?? "").trim().toLowerCase();

const mapFaculty = (row: FacultyUserRow) => {
  const role = getRole(row.roles);

  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    employeeId: row.employee_id ?? "-",
    department: row.department ?? "",
    major: row.department ?? "",
    roleName: role?.name ?? "Faculty",
    employmentType: "Faculty",
    totalTeachingHours: "0/30",
    assignedUnits: "0/24",
    subjects: [],
    history: [],
  };
};

const normalizeSection = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, " ");
  const parts = cleaned.split(/\s*-\s*/).filter(Boolean);
  return parts.at(-1) ?? cleaned;
};

const dayLabels: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thursday",
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

const formatSchedule = (row: SubjectRoomAssignmentRow) => {
  const dayLabel = dayLabels[row.day_of_week] ?? row.day_of_week;
  return `${dayLabel} ${formatDisplayTime(row.start_time)} - ${formatDisplayTime(row.end_time)}`;
};

const mapAvailableSubject = (row: SubjectRoomAssignmentRow) => ({
  id: row.id,
  subjectId: row.subject?.id ?? "",
  subjectTitle: row.subject?.subject_title ?? "",
  subjectCode: row.subject?.subject_code ?? "",
  department: row.subject?.department ?? "",
  yearLevel: row.subject?.year_level ?? "",
  schedule: formatSchedule(row),
  room: row.room?.room_name ?? "",
  section: normalizeSection(row.section),
  units: Number(row.subject?.units ?? 0),
});

const uniqueJoin = (values: string[], separator = ", ") =>
  Array.from(new Set(values.filter(Boolean))).join(separator);

const groupAvailableSubjects = (rows: SubjectRoomAssignmentRow[]) => {
  const grouped = new Map<string, ReturnType<typeof mapAvailableSubject>>();

  for (const row of rows) {
    if (!row.subject?.id) {
      continue;
    }

    const mapped = mapAvailableSubject(row);
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

  return Array.from(grouped.values()).map((subject) => ({
    ...subject,
    schedule: subject.schedule.split(" / ").slice(0, 2).join(" / "),
  }));
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const roleKey = normalizeRoleKey(context.role.key);

  if (!managerRoleKeys.has(roleKey)) {
    return NextResponse.json(
      { error: "Only load managers, program chairs, deans, or admins can view faculty loads." },
      { status: 403 },
    );
  }

  const department = context.orgUser.department?.trim() ?? "";

  if (!department && roleKey !== "org_admin" && roleKey !== "dean") {
    return NextResponse.json({
      department: "",
      faculty: [],
      message: "Your account has no department assigned yet.",
    });
  }

  let query = supabaseAdmin
    .from("org_users")
    .select("id, full_name, email, employee_id, department, status, roles(key, name)")
    .eq("org_id", context.org.id)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (department) {
    query = query.ilike("department", department);
  }

  const [facultyResult, availableSubjectsResult] = await Promise.all([
    query,
    supabaseAdmin
      .from("academic_room_assignments")
      .select(
        `
          id,
          section,
          day_of_week,
          start_time,
          end_time,
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
            building
          )
        `,
      )
      .eq("org_id", context.org.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (facultyResult.error) {
    return NextResponse.json(
      { error: facultyResult.error.message || "Failed to load department faculty." },
      { status: 500 },
    );
  }

  if (availableSubjectsResult.error) {
    return NextResponse.json(
      { error: availableSubjectsResult.error.message || "Failed to load available subjects." },
      { status: 500 },
    );
  }

  const faculty = ((facultyResult.data ?? []) as FacultyUserRow[])
    .filter((row) => {
      const role = getRole(row.roles);
      return facultyRoleKeys.has(normalizeRoleKey(role?.key ?? ""));
    })
    .map(mapFaculty);

  const availableSubjects = ((availableSubjectsResult.data ?? []) as unknown as SubjectRoomAssignmentRow[])
    .filter((row) => row.subject?.id && (!department || sameDepartment(row.subject.department, department)))
    .reduce<SubjectRoomAssignmentRow[]>((rows, row) => [...rows, row], []);

  return NextResponse.json({
    department: department || "All Departments",
    faculty,
    availableSubjects: groupAvailableSubjects(availableSubjects),
  });
}
