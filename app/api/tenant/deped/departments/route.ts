import { NextResponse } from "next/server";
import { normalizeRoleKey } from "@/features/tenant-role-catalog";
import { loadTenantContext, type TenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type DepedDepartmentRow = {
  id: string;
  name: string;
  chair_user_id: string | null;
  created_at: string;
};

type OrgUserRow = {
  id: string;
  full_name: string;
  email: string;
  role_id: string;
  department?: string | null;
  department_id?: string | null;
  roles?: { key?: string | null; name?: string | null } | { key?: string | null; name?: string | null }[] | null;
};

type CreateDepedDepartmentRequest = {
  departmentName?: string;
  departmentHeadUserId?: string | null;
};

const departmentManagerRoles = new Set([
  "org_admin",
  "school_head",
  "principal",
  "load_admin",
]);

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const canManageDepedDepartments = (context: TenantContext) =>
  context.institutionType === "deped" &&
  (departmentManagerRoles.has(normalizeRoleKey(context.role.key)) ||
    context.enabledFeatureKeys.includes("deped-department-load"));

const isDuplicateDepartmentError = (error: { code?: string; message?: string }) =>
  error.code === "23505" ||
  error.message?.toLowerCase().includes("duplicate") ||
  error.message?.toLowerCase().includes("unique");

const normalizeJoinedRole = (role: OrgUserRow["roles"]) => {
  if (Array.isArray(role)) {
    return role[0] ?? null;
  }

  return role ?? null;
};

const mapDepartment = (row: DepedDepartmentRow, usersById: Map<string, OrgUserRow>) => ({
  id: row.id,
  departmentName: row.name,
  departmentHead: row.chair_user_id
    ? usersById.get(row.chair_user_id)?.full_name ?? "Unassigned"
    : "",
  departmentHeadUserId: row.chair_user_id ?? "",
  createdAt: row.created_at,
});

const mapHeadOption = (user: OrgUserRow) => {
  const role = normalizeJoinedRole(user.roles);

  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    roleName: role?.name ?? "Staff",
    department: user.department ?? "",
    departmentId: user.department_id ?? "",
  };
};

async function loadDepartmentRows(orgId: string) {
  const [departmentResult, userResult] = await Promise.all([
    supabaseAdmin
      .from("org_departments")
      .select("id, name, chair_user_id, created_at")
      .eq("org_id", orgId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("org_users")
      .select("id, full_name, email, role_id, department, department_id, roles(key, name)")
      .eq("org_id", orgId)
      .eq("status", "active")
      .order("full_name", { ascending: true }),
  ]);

  if (departmentResult.error) {
    throw new Error(departmentResult.error.message || "Failed to load DepEd departments.");
  }

  if (userResult.error) {
    throw new Error(userResult.error.message || "Failed to load department head options.");
  }

  const users = (userResult.data ?? []) as OrgUserRow[];
  const usersById = new Map(users.map((user) => [user.id, user]));

  return {
    departments: ((departmentResult.data ?? []) as DepedDepartmentRow[]).map((row) =>
      mapDepartment(row, usersById),
    ),
    departmentHeadOptions: users.map(mapHeadOption),
  };
}

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canManageDepedDepartments(context)) {
    return NextResponse.json(
      { error: "DepEd Department Load is not available for this account." },
      { status: 403 },
    );
  }

  try {
    return NextResponse.json(await loadDepartmentRows(context.org.id));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load DepEd departments.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canManageDepedDepartments(context)) {
    return NextResponse.json(
      { error: "Only DepEd department load managers can add departments." },
      { status: 403 },
    );
  }

  let payload: CreateDepedDepartmentRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const departmentName = normalizeText(payload.departmentName);
  const departmentHeadUserId = normalizeText(payload.departmentHeadUserId);

  if (!departmentName) {
    return NextResponse.json(
      { error: "Department name is required." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  if (departmentHeadUserId) {
    const { data: headUser, error: headError } = await supabaseAdmin
      .from("org_users")
      .select("id")
      .eq("id", departmentHeadUserId)
      .eq("org_id", context.org.id)
      .maybeSingle<{ id: string }>();

    if (headError || !headUser?.id) {
      return NextResponse.json(
        { error: "Selected department head was not found in this organization." },
        { status: 400 },
      );
    }
  }

  const { error } = await supabaseAdmin.from("org_departments").insert([
    {
      org_id: context.org.id,
      college_id: null,
      name: departmentName,
      code: null,
      chair_user_id: departmentHeadUserId || null,
      created_at: now,
      updated_at: now,
    },
  ]);

  if (error) {
    const message = error && isDuplicateDepartmentError(error)
      ? "That department already exists."
      : error.message || "Failed to add department.";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    return NextResponse.json(await loadDepartmentRows(context.org.id), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Department was added, but the updated list could not be loaded.",
      },
      { status: 500 },
    );
  }
}
