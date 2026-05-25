import { NextResponse } from "next/server";
import { normalizeRoleKey } from "@/features/tenant-role-catalog";
import { parseTimeToMinutes, rangesOverlap } from "@/lib/academicRooms";
import { loadTenantContext, type TenantContext } from "@/lib/tenantAccess";
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

type FacultyLoadAssignmentRow = {
  id: string;
  faculty_org_user_id: string;
  created_at: string;
  created_by: {
    full_name: string;
  } | null;
  room_assignment: SubjectRoomAssignmentRow | null;
};

type AssignFacultyLoadRequest = {
  facultyId?: string;
  assignmentIds?: string[];
};

type DeleteFacultyLoadRequest = {
  facultyId?: string;
  assignmentId?: string;
  assignmentIds?: string[];
};

const facultyRoleKeys = new Set(["faculty", "teacher"]);
const managerRoleKeys = new Set([
  "org_admin",
  "dean",
  "department_head",
  "program_chair",
  "chair",
  "chairman",
  "load_manager",
]);

const hasFacultyLoadManagerRole = (context: TenantContext) =>
  [context.role.key, context.role.name, context.orgUser.role_label].some((value) =>
    managerRoleKeys.has(normalizeRoleKey(value ?? "")),
  );

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

const splitGroupedIds = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeSubjectSectionKey = (
  subjectTitle?: string | null,
  section?: string | null,
) => `${(subjectTitle ?? "").trim().toLowerCase()}|${normalizeSection(section ?? "").toLowerCase()}`;

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

const groupFacultyAssignments = (rows: FacultyLoadAssignmentRow[]) => {
  const grouped = new Map<
    string,
    ReturnType<typeof mapAvailableSubject> & {
      facultyId: string;
      assignmentRowIds: string[];
      createdAt: string;
      changedBy: string;
    }
  >();

  for (const row of rows) {
    const roomAssignment = row.room_assignment;

    if (!roomAssignment?.subject?.id || !row.faculty_org_user_id) {
      continue;
    }

    const mapped = mapAvailableSubject(roomAssignment);
    const key = `${row.faculty_org_user_id}|${mapped.subjectId}|${mapped.section.toLowerCase()}`;
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        ...mapped,
        facultyId: row.faculty_org_user_id,
        assignmentRowIds: [row.id],
        createdAt: row.created_at,
        changedBy: row.created_by?.full_name ?? "System",
      });
      continue;
    }

    grouped.set(key, {
      ...current,
      id: `${current.id}|${mapped.id}`,
      schedule: uniqueJoin([current.schedule, mapped.schedule], " / "),
      room: uniqueJoin([current.room, mapped.room]),
      assignmentRowIds: [...current.assignmentRowIds, row.id],
      createdAt:
        new Date(row.created_at).getTime() > new Date(current.createdAt).getTime()
          ? row.created_at
          : current.createdAt,
      changedBy: current.changedBy || row.created_by?.full_name || "System",
    });
  }

  return Array.from(grouped.values()).map((subject) => ({
    ...subject,
    schedule: subject.schedule.split(" / ").slice(0, 2).join(" / "),
  }));
};

const mapAssignedSubject = (subject: ReturnType<typeof groupFacultyAssignments>[number]) => ({
  id: subject.id,
  subjectTitle: subject.subjectTitle,
  subjectCode: subject.subjectCode,
  section: subject.section,
  schedule: subject.schedule,
  room: subject.room,
  units: subject.units,
});

const buildHistory = (subjects: ReturnType<typeof groupFacultyAssignments>) =>
  subjects
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((subject, index) => ({
      id: subject.assignmentRowIds[0] ?? `${subject.id}-${index}`,
      version: `v${subjects.length - index}`,
      changedBy: subject.changedBy,
      changedAt: new Date(subject.createdAt).toLocaleString(),
      action: `Assigned ${subject.subjectCode}`,
    }));

const findScheduleConflict = (
  candidates: SubjectRoomAssignmentRow[],
  existingAssignments: SubjectRoomAssignmentRow[],
) => {
  for (const candidate of candidates) {
    const candidateStart = parseTimeToMinutes(candidate.start_time);
    const candidateEnd = parseTimeToMinutes(candidate.end_time);

    if (candidateStart === null || candidateEnd === null) {
      continue;
    }

    const conflict = existingAssignments.find((existing) => {
      if (existing.id === candidate.id || existing.day_of_week !== candidate.day_of_week) {
        return false;
      }

      const existingStart = parseTimeToMinutes(existing.start_time);
      const existingEnd = parseTimeToMinutes(existing.end_time);

      return (
        existingStart !== null &&
        existingEnd !== null &&
        rangesOverlap(candidateStart, candidateEnd, existingStart, existingEnd)
      );
    });

    if (conflict) {
      return { candidate, conflict };
    }
  }

  return null;
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const roleKey = normalizeRoleKey(context.role.key);

  if (!hasFacultyLoadManagerRole(context)) {
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

  const [facultyResult, availableSubjectsResult, facultyAssignmentsResult] = await Promise.all([
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
    supabaseAdmin
      .from("academic_faculty_load_assignments")
      .select(
        `
          id,
          faculty_org_user_id,
          created_at,
          created_by:org_users!academic_faculty_load_assignments_created_by_org_user_id_fkey(
            full_name
          ),
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
              department,
              year_level,
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
      .order("created_at", { ascending: false }),
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

  if (facultyAssignmentsResult.error) {
    return NextResponse.json(
      {
        error:
          facultyAssignmentsResult.error.message || "Failed to load saved faculty assignments.",
      },
      { status: 500 },
    );
  }

  const groupedAssignments = groupFacultyAssignments(
    (facultyAssignmentsResult.data ?? []) as unknown as FacultyLoadAssignmentRow[],
  );

  const assignmentsByFaculty = groupedAssignments.reduce<
    Record<string, ReturnType<typeof groupFacultyAssignments>>
  >((groups, assignment) => {
    groups[assignment.facultyId] = [...(groups[assignment.facultyId] ?? []), assignment];
    return groups;
  }, {});

  const faculty = ((facultyResult.data ?? []) as FacultyUserRow[])
    .filter((row) => {
      const role = getRole(row.roles);
      return facultyRoleKeys.has(normalizeRoleKey(role?.key ?? ""));
    })
    .map((row) => {
      const baseFaculty = mapFaculty(row);
      const assignedSubjects = assignmentsByFaculty[row.id] ?? [];
      const assignedUnits = assignedSubjects.reduce((sum, subject) => sum + subject.units, 0);

      return {
        ...baseFaculty,
        assignedUnits: `${assignedUnits}/24`,
        subjects: assignedSubjects.map(mapAssignedSubject),
        history: buildHistory(assignedSubjects),
      };
    });

  const availableSubjects = ((availableSubjectsResult.data ?? []) as unknown as SubjectRoomAssignmentRow[])
    .filter((row) => row.subject?.id && (!department || sameDepartment(row.subject.department, department)))
    .reduce<SubjectRoomAssignmentRow[]>((rows, row) => [...rows, row], []);

  return NextResponse.json({
    department: department || "All Departments",
    faculty,
    availableSubjects: groupAvailableSubjects(availableSubjects),
  });
}

export async function POST(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const roleKey = normalizeRoleKey(context.role.key);

  if (!hasFacultyLoadManagerRole(context)) {
    return NextResponse.json(
      { error: "Only load managers, program chairs, deans, or admins can assign faculty loads." },
      { status: 403 },
    );
  }

  let payload: AssignFacultyLoadRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const facultyId = typeof payload.facultyId === "string" ? payload.facultyId.trim() : "";
  const assignmentIds = Array.isArray(payload.assignmentIds)
    ? Array.from(new Set(payload.assignmentIds.flatMap((id) => splitGroupedIds(String(id)))))
    : [];

  if (!facultyId || assignmentIds.length === 0) {
    return NextResponse.json(
      { error: "Faculty and subject assignment are required." },
      { status: 400 },
    );
  }

  const department = context.orgUser.department?.trim() ?? "";

  if (!department && roleKey !== "org_admin" && roleKey !== "dean") {
    return NextResponse.json(
      { error: "Your account has no department assigned yet." },
      { status: 403 },
    );
  }

  const { data: facultyUser, error: facultyError } = await supabaseAdmin
    .from("org_users")
    .select("id, department, status, roles(key)")
    .eq("id", facultyId)
    .eq("org_id", context.org.id)
    .maybeSingle<FacultyUserRow>();

  if (facultyError) {
    return NextResponse.json(
      { error: facultyError.message || "Failed to verify faculty user." },
      { status: 500 },
    );
  }

  const facultyRole = getRole(facultyUser?.roles);

  if (
    !facultyUser?.id ||
    facultyUser.status !== "active" ||
    !facultyRoleKeys.has(normalizeRoleKey(facultyRole?.key ?? ""))
  ) {
    return NextResponse.json({ error: "Faculty user not found." }, { status: 404 });
  }

  if (department && !sameDepartment(facultyUser.department, department)) {
    return NextResponse.json(
      { error: "You can only assign loads within your department." },
      { status: 403 },
    );
  }

  const { data: roomAssignments, error: roomAssignmentsError } = await supabaseAdmin
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
          department
        ),
        room:academic_rooms!academic_room_assignments_room_id_fkey(
          id,
          room_name,
          building
        )
      `,
    )
    .eq("org_id", context.org.id)
    .in("id", assignmentIds);

  if (roomAssignmentsError) {
    return NextResponse.json(
      { error: roomAssignmentsError.message || "Failed to verify scheduled subject." },
      { status: 500 },
    );
  }

  const verifiedAssignments = (roomAssignments ?? []) as unknown as Array<{
    id: string;
    section: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    subject: {
      id: string;
      subject_title: string;
      subject_code: string;
      department: string | null;
      year_level: string | null;
      units: number | string | null;
    } | null;
    room: { id: string; room_name: string; building: string } | null;
  }> as SubjectRoomAssignmentRow[];

  if (verifiedAssignments.length !== assignmentIds.length) {
    return NextResponse.json(
      { error: "One or more scheduled subjects could not be found." },
      { status: 404 },
    );
  }

  if (
    department &&
    verifiedAssignments.some((assignment) => !sameDepartment(assignment.subject?.department, department))
  ) {
    return NextResponse.json(
      { error: "You can only assign subjects within your department." },
      { status: 403 },
    );
  }

  const { data: subjectSectionAssignments, error: subjectSectionAssignmentsError } =
    await supabaseAdmin
      .from("academic_faculty_load_assignments")
      .select(
        `
          faculty_org_user_id,
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
              department,
              year_level,
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
      .eq("org_id", context.org.id);

  if (subjectSectionAssignmentsError) {
    return NextResponse.json(
      {
        error:
          subjectSectionAssignmentsError.message ||
          "Failed to check existing subject assignments.",
      },
      { status: 500 },
    );
  }

  const selectedSubjectSectionKeys = new Set(
    verifiedAssignments.map((assignment) =>
      normalizeSubjectSectionKey(assignment.subject?.subject_title, assignment.section),
    ),
  );
  const subjectAssignedToOtherFaculty = (
    (subjectSectionAssignments ?? []) as unknown as FacultyLoadAssignmentRow[]
  ).find((assignment) => {
    if (assignment.faculty_org_user_id === facultyId) {
      return false;
    }

    const roomAssignment = assignment.room_assignment;

    if (!roomAssignment?.subject?.subject_title) {
      return false;
    }

    return selectedSubjectSectionKeys.has(
      normalizeSubjectSectionKey(roomAssignment.subject.subject_title, roomAssignment.section),
    );
  });

  if (subjectAssignedToOtherFaculty?.room_assignment?.subject?.subject_title) {
    const subject = subjectAssignedToOtherFaculty.room_assignment.subject;
    const section = normalizeSection(subjectAssignedToOtherFaculty.room_assignment.section) || "-";

    return NextResponse.json(
      {
        error: `${subject.subject_title} section ${section} is already assigned to another teacher.`,
      },
      { status: 409 },
    );
  }

  const selectedConflict = findScheduleConflict(verifiedAssignments, verifiedAssignments);

  if (selectedConflict) {
    return NextResponse.json(
      {
        error: `${selectedConflict.candidate.subject?.subject_code ?? "Selected subject"} conflicts with ${
          selectedConflict.conflict.subject?.subject_code ?? "another selected subject"
        } on ${selectedConflict.candidate.day_of_week} from ${formatDisplayTime(
          selectedConflict.candidate.start_time,
        )} to ${formatDisplayTime(selectedConflict.candidate.end_time)}.`,
      },
      { status: 409 },
    );
  }

  const { data: existingFacultyAssignments, error: existingFacultyAssignmentsError } =
    await supabaseAdmin
      .from("academic_faculty_load_assignments")
      .select(
        `
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
              department,
              year_level,
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
      .eq("faculty_org_user_id", facultyId);

  if (existingFacultyAssignmentsError) {
    return NextResponse.json(
      {
        error:
          existingFacultyAssignmentsError.message ||
          "Failed to check teacher schedule conflicts.",
      },
      { status: 500 },
    );
  }

  const existingScheduledAssignments = (
    (existingFacultyAssignments ?? []) as unknown as FacultyLoadAssignmentRow[]
  )
    .map((assignment) => assignment.room_assignment)
    .filter((assignment): assignment is SubjectRoomAssignmentRow => Boolean(assignment?.id));
  const existingConflict = findScheduleConflict(
    verifiedAssignments,
    existingScheduledAssignments,
  );

  if (existingConflict) {
    return NextResponse.json(
      {
        error: `${existingConflict.candidate.subject?.subject_code ?? "Selected subject"} conflicts with ${
          existingConflict.conflict.subject?.subject_code ?? "an assigned subject"
        } on ${existingConflict.candidate.day_of_week} from ${formatDisplayTime(
          existingConflict.candidate.start_time,
        )} to ${formatDisplayTime(existingConflict.candidate.end_time)}.`,
      },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const { error: insertError } = await supabaseAdmin
    .from("academic_faculty_load_assignments")
    .upsert(
      verifiedAssignments.map((assignment) => ({
        org_id: context.org.id,
        faculty_org_user_id: facultyId,
        room_assignment_id: assignment.id,
        created_by_org_user_id: context.orgUser.id,
        created_at: now,
        updated_at: now,
      })),
      { onConflict: "org_id,faculty_org_user_id,room_assignment_id" },
    );

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message || "Failed to assign subject to faculty." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const roleKey = normalizeRoleKey(context.role.key);

  if (!hasFacultyLoadManagerRole(context)) {
    return NextResponse.json(
      { error: "Only load managers, program chairs, deans, or admins can remove faculty loads." },
      { status: 403 },
    );
  }

  let payload: DeleteFacultyLoadRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const facultyId = typeof payload.facultyId === "string" ? payload.facultyId.trim() : "";
  const assignmentIds = Array.from(
    new Set(
      [
        ...(Array.isArray(payload.assignmentIds) ? payload.assignmentIds : []),
        ...(typeof payload.assignmentId === "string" ? [payload.assignmentId] : []),
      ].flatMap((id) => splitGroupedIds(String(id))),
    ),
  );

  if (!facultyId || assignmentIds.length === 0) {
    return NextResponse.json(
      { error: "Faculty and subject assignment are required." },
      { status: 400 },
    );
  }

  const department = context.orgUser.department?.trim() ?? "";

  if (!department && roleKey !== "org_admin" && roleKey !== "dean") {
    return NextResponse.json(
      { error: "Your account has no department assigned yet." },
      { status: 403 },
    );
  }

  const { data: facultyUser, error: facultyError } = await supabaseAdmin
    .from("org_users")
    .select("id, department, status, roles(key)")
    .eq("id", facultyId)
    .eq("org_id", context.org.id)
    .maybeSingle<FacultyUserRow>();

  if (facultyError) {
    return NextResponse.json(
      { error: facultyError.message || "Failed to verify faculty user." },
      { status: 500 },
    );
  }

  const facultyRole = getRole(facultyUser?.roles);

  if (
    !facultyUser?.id ||
    facultyUser.status !== "active" ||
    !facultyRoleKeys.has(normalizeRoleKey(facultyRole?.key ?? ""))
  ) {
    return NextResponse.json({ error: "Faculty user not found." }, { status: 404 });
  }

  if (department && !sameDepartment(facultyUser.department, department)) {
    return NextResponse.json(
      { error: "You can only remove loads within your department." },
      { status: 403 },
    );
  }

  if (department) {
    const { data: roomAssignments, error: roomAssignmentsError } = await supabaseAdmin
      .from("academic_room_assignments")
      .select(
        `
          id,
          subject:academic_subjects!academic_room_assignments_subject_id_fkey(
            department
          )
        `,
      )
      .eq("org_id", context.org.id)
      .in("id", assignmentIds);

    if (roomAssignmentsError) {
      return NextResponse.json(
        { error: roomAssignmentsError.message || "Failed to verify subject assignment." },
        { status: 500 },
      );
    }

    const verifiedAssignments = (roomAssignments ?? []) as unknown as Array<{
      id: string;
      subject: { department: string | null } | null;
    }>;

    if (
      verifiedAssignments.length !== assignmentIds.length ||
      verifiedAssignments.some((assignment) => !sameDepartment(assignment.subject?.department, department))
    ) {
      return NextResponse.json(
        { error: "You can only remove subjects within your department." },
        { status: 403 },
      );
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("academic_faculty_load_assignments")
    .delete()
    .eq("org_id", context.org.id)
    .eq("faculty_org_user_id", facultyId)
    .in("room_assignment_id", assignmentIds);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message || "Failed to remove assigned subject." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
