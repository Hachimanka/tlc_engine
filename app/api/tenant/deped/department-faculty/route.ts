import { NextResponse } from "next/server";
import { normalizeRoleKey } from "@/features/tenant-role-catalog";
import { parseTimeToMinutes, rangesOverlap } from "@/lib/academicRooms";
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

type JoinedRoomAssignmentRow = RawRoomAssignmentRow & {
  subject?: SubjectRow | SubjectRow[] | null;
  room?: RoomRow | RoomRow[] | null;
};

type FacultyLoadAssignmentRow = {
  id: string;
  faculty_org_user_id: string;
  room_assignment_id?: string | null;
  created_at: string;
  created_by?: { full_name?: string | null } | { full_name?: string | null }[] | null;
  room_assignment?: JoinedRoomAssignmentRow | JoinedRoomAssignmentRow[] | null;
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

type AssignFacultyRequest = {
  facultyId?: string;
  assignmentId?: string;
  assignmentIds?: string[];
  departmentName?: string;
};

type DeleteFacultyRequest = AssignFacultyRequest;

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

const firstOrNull = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

const splitGroupedIds = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeSubjectSectionKey = (subjectTitle?: string | null, section?: string | null) =>
  `${normalizeText(subjectTitle).toLowerCase()}|${normalizeText(section || "N/A").toLowerCase()}`;

const getDurationMinutes = (startTime: unknown, endTime: unknown) => {
  const start = parseTimeParts(startTime);
  const end = parseTimeParts(endTime);

  if (!start || !end) {
    return 0;
  }

  return Math.max(0, end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes));
};

const mapJoinedAssignmentToSubject = (
  assignment: JoinedRoomAssignmentRow,
  subject: SubjectRow,
  room?: RoomRow | null,
) => {
  const startLabel = formatTimeLabel(assignment.start_time);
  const endLabel = formatTimeLabel(assignment.end_time);
  const durationMinutes = getDurationMinutes(assignment.start_time, assignment.end_time);

  return {
    id: assignment.id,
    subjectTitle: subject.subject_title,
    subjectCode: subject.subject_code,
    department: subject.department ?? "",
    yearLevel: subject.year_level ?? "",
    schedule: `${normalizeText(assignment.day_of_week)} ${startLabel} - ${endLabel}`,
    room: room?.room_name ?? "",
    section: normalizeText(assignment.section) || "N/A",
    hoursPerDay: `${durationMinutes} minutes`,
    status: "Approved" as const,
  };
};

const findScheduleConflict = (
  candidates: JoinedRoomAssignmentRow[],
  existingAssignments: JoinedRoomAssignmentRow[],
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

const getAssignmentSubject = (assignment: JoinedRoomAssignmentRow) =>
  firstOrNull(assignment.subject);

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
        subjectCode: subject.subject_code,
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

async function loadSavedAssignments(orgId: string, facultyIds: string[]) {
  if (facultyIds.length === 0) {
    return {
      subjectsByFaculty: new Map<string, ReturnType<typeof mapJoinedAssignmentToSubject>[]>(),
      historyByFaculty: new Map<string, Array<{ id: string; version: string; changedBy: string; changedAt: string; action: string }>>(),
    };
  }

  const { data, error } = await supabaseAdmin
    .from("academic_faculty_load_assignments")
    .select(
      `
        id,
        faculty_org_user_id,
        room_assignment_id,
        created_at,
        created_by:org_users!academic_faculty_load_assignments_created_by_org_user_id_fkey(
          full_name
        ),
        room_assignment:academic_room_assignments!academic_faculty_load_assignments_room_assignment_id_fkey(
          id,
          subject_id,
          room_id,
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
            year_level
          ),
          room:academic_rooms!academic_room_assignments_room_id_fkey(
            id,
            room_name,
            building,
            room_type
          )
        )
      `,
    )
    .eq("org_id", orgId)
    .in("faculty_org_user_id", facultyIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load saved teacher assignments.");
  }

  const subjectsByFaculty = new Map<string, ReturnType<typeof mapJoinedAssignmentToSubject>[]>();
  const historyByFaculty = new Map<string, Array<{ id: string; version: string; changedBy: string; changedAt: string; action: string }>>();
  const rows = (data ?? []) as unknown as FacultyLoadAssignmentRow[];

  rows.forEach((row) => {
    const roomAssignment = firstOrNull(row.room_assignment);
    const subject = roomAssignment ? getAssignmentSubject(roomAssignment) : null;

    if (!roomAssignment || !subject) {
      return;
    }

    const room = firstOrNull(roomAssignment.room);
    const mappedSubject = mapJoinedAssignmentToSubject(roomAssignment, subject, room);
    const createdBy = firstOrNull(row.created_by)?.full_name ?? "System";
    const facultySubjects = subjectsByFaculty.get(row.faculty_org_user_id) ?? [];
    const facultyHistory = historyByFaculty.get(row.faculty_org_user_id) ?? [];

    subjectsByFaculty.set(row.faculty_org_user_id, [...facultySubjects, mappedSubject]);
    historyByFaculty.set(row.faculty_org_user_id, [
      ...facultyHistory,
      {
        id: row.id,
        version: `v${facultyHistory.length + 1}`,
        changedBy: createdBy,
        changedAt: new Date(row.created_at).toLocaleString(),
        action: `Assigned ${subject.subject_code || subject.subject_title}`,
      },
    ]);
  });

  return { subjectsByFaculty, historyByFaculty };
}

async function resolveDepartmentContext(
  orgId: string,
  currentUserId: string,
  requestedDepartmentName?: string | null,
) {
  if (requestedDepartmentName) {
    const normalizedRequestedDepartment = normalizeText(requestedDepartmentName);

    const { data: department } = await supabaseAdmin
      .from("org_departments")
      .select("id, name")
      .eq("org_id", orgId)
      .ilike("name", normalizedRequestedDepartment)
      .maybeSingle<{ id: string; name: string }>();

    return {
      departmentName: department?.name ?? normalizedRequestedDepartment,
      departmentId: department?.id ?? "",
    };
  }

  const { data: currentUser, error: currentUserError } = await supabaseAdmin
    .from("org_users")
    .select("id, department, department_id")
    .eq("id", currentUserId)
    .eq("org_id", orgId)
    .maybeSingle<{ id: string; department?: string | null; department_id?: string | null }>();

  if (currentUserError) {
    throw new Error(currentUserError.message || "Failed to load department context.");
  }

  return {
    departmentName: normalizeText(currentUser?.department),
    departmentId: normalizeText(currentUser?.department_id),
  };
}

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const requestedDepartmentName = new URL(req.url).searchParams.get("departmentName");

  if (
    context.institutionType !== "deped" ||
    (!context.isOrgAdmin && !context.enabledFeatureKeys.includes("deped-teacher-load-assignment"))
  ) {
    return NextResponse.json(
      { error: "DepEd teacher load assignment is not available for this account." },
      { status: 403 },
    );
  }

  let departmentName = "";
  let departmentId = "";

  try {
    const resolvedDepartment = await resolveDepartmentContext(
      context.org.id,
      context.orgUser.id,
      requestedDepartmentName,
    );
    departmentName = resolvedDepartment.departmentName;
    departmentId = resolvedDepartment.departmentId;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load department context.",
      },
      { status: 500 },
    );
  }

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
  let savedAssignments = {
    subjectsByFaculty: new Map<string, ReturnType<typeof mapJoinedAssignmentToSubject>[]>(),
    historyByFaculty: new Map<string, Array<{ id: string; version: string; changedBy: string; changedAt: string; action: string }>>(),
  };

  try {
    const [availableSubjects, persistedAssignments] = await Promise.all([
      loadAssignedSubjects(context.org.id, departmentName),
      loadSavedAssignments(
        context.org.id,
        faculty.map((teacher) => teacher.id),
      ),
    ]);
    subjects = availableSubjects;
    savedAssignments = persistedAssignments;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load room-assigned subjects and teacher assignments.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    departmentName,
    faculty: faculty.map((teacher) => ({
      ...teacher,
      subjects: savedAssignments.subjectsByFaculty.get(teacher.id) ?? [],
      history: savedAssignments.historyByFaculty.get(teacher.id) ?? [],
    })),
    subjects,
  });
}

export async function POST(req: Request) {
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

  let payload: AssignFacultyRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const facultyId = normalizeText(payload.facultyId);
  const assignmentIds = Array.from(
    new Set(
      [
        ...(Array.isArray(payload.assignmentIds) ? payload.assignmentIds : []),
        ...(payload.assignmentId ? [payload.assignmentId] : []),
      ].flatMap((id) => splitGroupedIds(String(id))),
    ),
  );

  if (!facultyId || assignmentIds.length === 0) {
    return NextResponse.json(
      { error: "Teacher and subject assignment are required." },
      { status: 400 },
    );
  }

  const { departmentName, departmentId } = await resolveDepartmentContext(
    context.org.id,
    context.orgUser.id,
    payload.departmentName,
  );

  if (!departmentName && !departmentId) {
    return NextResponse.json(
      { error: "Your account has no department assigned yet." },
      { status: 403 },
    );
  }

  const { data: facultyUser, error: facultyError } = await supabaseAdmin
    .from("org_users")
    .select("id, full_name, department, department_id, role_label, roles(key, name), status")
    .eq("id", facultyId)
    .eq("org_id", context.org.id)
    .maybeSingle<OrgUserRow & { status?: string | null }>();

  if (facultyError) {
    return NextResponse.json(
      { error: facultyError.message || "Failed to verify teacher." },
      { status: 500 },
    );
  }

  if (!facultyUser?.id || facultyUser.status !== "active" || !isTeacherAccount(facultyUser)) {
    return NextResponse.json({ error: "Teacher was not found." }, { status: 404 });
  }

  if (!belongsToDepartment(facultyUser, departmentId, departmentName)) {
    return NextResponse.json(
      { error: "You can only assign subjects within this department." },
      { status: 403 },
    );
  }

  const { data: roomAssignments, error: roomAssignmentsError } = await supabaseAdmin
    .from("academic_room_assignments")
    .select(
      `
        id,
        subject_id,
        room_id,
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
          year_level
        ),
        room:academic_rooms!academic_room_assignments_room_id_fkey(
          id,
          room_name,
          building,
          room_type
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

  const verifiedAssignments = (roomAssignments ?? []) as unknown as JoinedRoomAssignmentRow[];

  if (verifiedAssignments.length !== assignmentIds.length) {
    return NextResponse.json(
      { error: "One or more scheduled subjects could not be found." },
      { status: 404 },
    );
  }

  const invalidDepartmentAssignment = verifiedAssignments.find((assignment) => {
    const subject = getAssignmentSubject(assignment);
    return normalizeDepartmentKey(subject?.department) !== normalizeDepartmentKey(departmentName);
  });

  if (invalidDepartmentAssignment) {
    return NextResponse.json(
      { error: "You can only assign subjects within this department." },
      { status: 403 },
    );
  }

  const selectedConflict = findScheduleConflict(verifiedAssignments, verifiedAssignments);

  if (selectedConflict) {
    return NextResponse.json(
      {
        error: "Selected subjects have conflicting schedules.",
      },
      { status: 409 },
    );
  }

  const { data: existingAssignments, error: existingAssignmentsError } = await supabaseAdmin
    .from("academic_faculty_load_assignments")
    .select(
      `
        id,
        faculty_org_user_id,
        room_assignment_id,
        room_assignment:academic_room_assignments!academic_faculty_load_assignments_room_assignment_id_fkey(
          id,
          subject_id,
          room_id,
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
            year_level
          )
        )
      `,
    )
    .eq("org_id", context.org.id);

  if (existingAssignmentsError) {
    return NextResponse.json(
      { error: existingAssignmentsError.message || "Failed to check existing teacher assignments." },
      { status: 500 },
    );
  }

  const selectedRoomAssignmentIds = new Set(verifiedAssignments.map((assignment) => assignment.id));
  const selectedSubjectSectionKeys = new Set(
    verifiedAssignments.map((assignment) => {
      const subject = getAssignmentSubject(assignment);
      return normalizeSubjectSectionKey(subject?.subject_title, assignment.section);
    }),
  );
  const existingRows = (existingAssignments ?? []) as unknown as FacultyLoadAssignmentRow[];
  const assignedToOtherTeacher = existingRows.find((assignment) => {
    if (assignment.faculty_org_user_id === facultyId) {
      return false;
    }

    const roomAssignment = firstOrNull(assignment.room_assignment);
    const subject = roomAssignment ? getAssignmentSubject(roomAssignment) : null;

    return (
      Boolean(assignment.room_assignment_id && selectedRoomAssignmentIds.has(assignment.room_assignment_id)) ||
      Boolean(
        subject &&
          roomAssignment &&
          selectedSubjectSectionKeys.has(
            normalizeSubjectSectionKey(subject.subject_title, roomAssignment.section),
          ),
      )
    );
  });

  if (assignedToOtherTeacher) {
    return NextResponse.json(
      { error: "This subject and section is already assigned to another teacher." },
      { status: 409 },
    );
  }

  const existingFacultyScheduledAssignments = existingRows
    .filter((assignment) => assignment.faculty_org_user_id === facultyId)
    .map((assignment) => firstOrNull(assignment.room_assignment))
    .filter((assignment): assignment is JoinedRoomAssignmentRow => Boolean(assignment?.id));
  const existingConflict = findScheduleConflict(
    verifiedAssignments,
    existingFacultyScheduledAssignments,
  );

  if (existingConflict) {
    const candidateSubject = getAssignmentSubject(existingConflict.candidate);
    const conflictSubject = getAssignmentSubject(existingConflict.conflict);

    return NextResponse.json(
      {
        error: `${candidateSubject?.subject_title ?? "Selected subject"} conflicts with ${
          conflictSubject?.subject_title ?? "an assigned subject"
        } on ${existingConflict.candidate.day_of_week} from ${formatTimeLabel(
          existingConflict.candidate.start_time,
        )} to ${formatTimeLabel(existingConflict.candidate.end_time)}.`,
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
      { error: insertError.message || "Failed to assign subject to teacher." },
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

  if (
    context.institutionType !== "deped" ||
    (!context.isOrgAdmin && !context.enabledFeatureKeys.includes("deped-teacher-load-assignment"))
  ) {
    return NextResponse.json(
      { error: "DepEd teacher load assignment is not available for this account." },
      { status: 403 },
    );
  }

  let payload: DeleteFacultyRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const facultyId = normalizeText(payload.facultyId);
  const assignmentIds = Array.from(
    new Set(
      [
        ...(Array.isArray(payload.assignmentIds) ? payload.assignmentIds : []),
        ...(payload.assignmentId ? [payload.assignmentId] : []),
      ].flatMap((id) => splitGroupedIds(String(id))),
    ),
  );

  if (!facultyId || assignmentIds.length === 0) {
    return NextResponse.json(
      { error: "Teacher and subject assignment are required." },
      { status: 400 },
    );
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
