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

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const normalizeDepartmentKey = (value: unknown) =>
  normalizeRoleKey(normalizeText(value).replace(/\s+department$/i, ""));

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
    return NextResponse.json({ departmentName: "", faculty: [] });
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

  return NextResponse.json({
    departmentName,
    faculty,
  });
}
