import { NextResponse } from "next/server";
import { isMissingRoleLabelError, loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type HierarchyEntity = "college" | "department" | "user";

type HierarchyRequest = {
  entity?: HierarchyEntity;
  id?: string;
  userId?: string;
  name?: string;
  code?: string | null;
  collegeId?: string | null;
  deanUserId?: string | null;
  chairUserId?: string | null;
  departmentId?: string | null;
};

type DepartmentRow = {
  id: string;
  name: string;
  code?: string | null;
  chair_user_id?: string | null;
};

type OrgUserRow = {
  id: string;
  auth_user_id: string;
  full_name: string;
  department?: string | null;
  department_id?: string | null;
};

const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

const cleanText = (value?: string | null) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const cleanNullableText = (value?: string | null) => {
  const cleaned = cleanText(value);
  return cleaned || null;
};

const normalizeOptionalId = (value?: string | null) => {
  const cleaned = cleanText(value);
  return cleaned || null;
};

const isDuplicateError = (error: { code?: string; message?: string }) =>
  error.code === "23505" ||
  error.message?.toLowerCase().includes("duplicate") ||
  error.message?.toLowerCase().includes("unique");

const normalizeJoinedRole = (role: unknown) => {
  if (Array.isArray(role)) {
    return role[0] as { id?: string; key?: string; name?: string } | undefined;
  }

  return role as { id?: string; key?: string; name?: string } | undefined;
};

async function loadHierarchy(orgId: string) {
  const [collegeResult, departmentResult, initialUserResult] = await Promise.all([
    supabaseAdmin
      .from("org_colleges")
      .select("id, name, code, dean_user_id, sort_order, created_at, updated_at")
      .eq("org_id", orgId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("org_departments")
      .select("id, college_id, name, code, chair_user_id, sort_order, created_at, updated_at")
      .eq("org_id", orgId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("org_users")
      .select("id, full_name, email, employee_id, department, department_id, role_label, status, role_id, created_at, roles(id, key, name)")
      .eq("org_id", orgId)
      .order("full_name", { ascending: true }),
  ]);
  let userResult: {
    data: Array<{
      id: string;
      full_name: string;
      email: string;
      employee_id?: string | null;
      department?: string | null;
      department_id?: string | null;
      role_label?: string | null;
      status?: string | null;
      role_id: string;
      created_at?: string | null;
      roles?: unknown;
    }> | null;
    error: { code?: string; message?: string } | null;
  } = initialUserResult;

  if (isMissingRoleLabelError(userResult.error)) {
    userResult = await supabaseAdmin
      .from("org_users")
      .select("id, full_name, email, employee_id, department, department_id, status, role_id, created_at, roles(id, key, name)")
      .eq("org_id", orgId)
      .order("full_name", { ascending: true });
  }

  if (collegeResult.error) {
    throw new Error(collegeResult.error.message || "Failed to load colleges.");
  }

  if (departmentResult.error) {
    throw new Error(departmentResult.error.message || "Failed to load departments.");
  }

  if (userResult.error) {
    throw new Error(userResult.error.message || "Failed to load personnel.");
  }

  return {
    colleges: collegeResult.data ?? [],
    departments: departmentResult.data ?? [],
    users: (userResult.data ?? []).map((user) => {
      const role = normalizeJoinedRole(user.roles);

      return {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        employeeId: user.employee_id ?? null,
        department: user.department ?? null,
        departmentId: user.department_id ?? null,
        status: user.status ?? "active",
        roleId: user.role_id,
        roleKey: role?.key ?? "",
        roleName: user.role_label ?? role?.name ?? "Unassigned",
        createdAt: user.created_at ?? null,
      };
    }),
  };
}

async function validateUser(orgId: string, userId?: string | null) {
  const normalizedUserId = normalizeOptionalId(userId);
  if (!normalizedUserId) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("org_users")
    .select("id, auth_user_id, full_name, department, department_id")
    .eq("id", normalizedUserId)
    .eq("org_id", orgId)
    .maybeSingle<OrgUserRow>();

  if (error || !data?.id) {
    throw new Error("Selected user was not found in this organization.");
  }

  return data;
}

async function validateUserHierarchyAvailability(
  orgId: string,
  user: OrgUserRow | null,
  options: {
    excludeCollegeId?: string | null;
    excludeDepartmentId?: string | null;
    allowDepartmentId?: string | null;
  } = {},
) {
  if (!user?.id) {
    return;
  }

  let collegeQuery = supabaseAdmin
    .from("org_colleges")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("dean_user_id", user.id)
    .limit(1);

  const normalizedExcludeCollegeId = normalizeOptionalId(options.excludeCollegeId);
  if (normalizedExcludeCollegeId) {
    collegeQuery = collegeQuery.neq("id", normalizedExcludeCollegeId);
  }

  const { data: college, error: collegeError } =
    await collegeQuery.maybeSingle<{ id: string; name: string }>();

  if (collegeError) {
    throw new Error(collegeError.message || "Failed to validate leadership assignment.");
  }

  if (college?.id) {
    throw new Error(`This person is already assigned as Dean of ${college.name}.`);
  }

  let departmentQuery = supabaseAdmin
    .from("org_departments")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("chair_user_id", user.id)
    .limit(1);

  const normalizedExcludeDepartmentId = normalizeOptionalId(options.excludeDepartmentId);
  if (normalizedExcludeDepartmentId) {
    departmentQuery = departmentQuery.neq("id", normalizedExcludeDepartmentId);
  }

  const { data: chairedDepartment, error: departmentError } =
    await departmentQuery.maybeSingle<{ id: string; name: string }>();

  if (departmentError) {
    throw new Error(departmentError.message || "Failed to validate leadership assignment.");
  }

  if (chairedDepartment?.id) {
    throw new Error(`This person is already assigned as Chair of ${chairedDepartment.name}.`);
  }

  const normalizedAllowedDepartmentId = normalizeOptionalId(options.allowDepartmentId);
  if (user.department_id && user.department_id !== normalizedAllowedDepartmentId) {
    const { data: assignedDepartment, error: assignedDepartmentError } = await supabaseAdmin
      .from("org_departments")
      .select("name")
      .eq("id", user.department_id)
      .eq("org_id", orgId)
      .maybeSingle<{ name: string }>();

    if (assignedDepartmentError) {
      throw new Error(
        assignedDepartmentError.message || "Failed to validate personnel assignment.",
      );
    }

    throw new Error(
      assignedDepartment?.name
        ? `This person is already assigned to ${assignedDepartment.name}.`
        : "This person is already assigned to another department.",
    );
  }
}

async function validateCollege(orgId: string, collegeId?: string | null) {
  const normalizedCollegeId = normalizeOptionalId(collegeId);
  if (!normalizedCollegeId) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("org_colleges")
    .select("id")
    .eq("id", normalizedCollegeId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error("Selected college was not found in this organization.");
  }

  return data.id as string;
}

async function validateDepartment(orgId: string, departmentId?: string | null) {
  const normalizedDepartmentId = normalizeOptionalId(departmentId);
  if (!normalizedDepartmentId) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("org_departments")
    .select("id, name, code, chair_user_id")
    .eq("id", normalizedDepartmentId)
    .eq("org_id", orgId)
    .maybeSingle<DepartmentRow>();

  if (error || !data?.id) {
    throw new Error("Selected department was not found in this organization.");
  }

  return data;
}

async function assignUserToDepartment(
  orgId: string,
  user: OrgUserRow,
  department: DepartmentRow,
  now: string,
) {
  const { error } = await supabaseAdmin
    .from("org_users")
    .update({
      department_id: department.id,
      department: department.name,
      updated_at: now,
    })
    .eq("id", user.id)
    .eq("org_id", orgId);

  if (error) {
    throw new Error(error.message || "Failed to assign department.");
  }

  const { data: authTarget } = await supabaseAdmin.auth.admin.getUserById(user.auth_user_id);
  const metadata = authTarget?.user?.user_metadata ?? {};
  const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.auth_user_id,
    {
      user_metadata: {
        ...metadata,
        department: department.name,
        department_id: department.id,
      },
    },
  );

  if (authUpdateError) {
    throw new Error(
      authUpdateError.message || "Department saved, but auth profile update failed.",
    );
  }
}

async function parsePayload(req: Request) {
  try {
    return (await req.json()) as HierarchyRequest;
  } catch {
    throw new Error("Invalid request body.");
  }
}

function requireHigherEd(institutionType: string | null) {
  if (institutionType !== "higher_ed") {
    return jsonError("Departments hierarchy is available for Higher Ed tenants only.", 403);
  }

  return null;
}

export async function GET(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const typeError = requireHigherEd(context.institutionType);
  if (typeError) {
    return typeError;
  }

  try {
    return NextResponse.json(await loadHierarchy(context.org.id));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load departments hierarchy.",
      500,
    );
  }
}

export async function POST(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const typeError = requireHigherEd(context.institutionType);
  if (typeError) {
    return typeError;
  }

  let payload: HierarchyRequest;

  try {
    payload = await parsePayload(req);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request body.", 400);
  }

  const now = new Date().toISOString();
  const name = cleanText(payload.name);

  if (!payload.entity || !["college", "department"].includes(payload.entity)) {
    return jsonError("Entity must be college or department.", 400);
  }

  if (!name) {
    return jsonError("Name is required.", 400);
  }

  try {
    if (payload.entity === "college") {
      const dean = await validateUser(context.org.id, payload.deanUserId);
      await validateUserHierarchyAvailability(context.org.id, dean);
      const { error } = await supabaseAdmin.from("org_colleges").insert([
        {
          org_id: context.org.id,
          name,
          code: cleanNullableText(payload.code),
          dean_user_id: dean?.id ?? null,
          created_at: now,
          updated_at: now,
        },
      ]);

      if (error) {
        return jsonError(
          isDuplicateError(error)
            ? "A college with that code already exists."
            : error.message || "Failed to create college.",
          500,
        );
      }
    } else {
      const [collegeId, chair] = await Promise.all([
        validateCollege(context.org.id, payload.collegeId),
        validateUser(context.org.id, payload.chairUserId),
      ]);
      await validateUserHierarchyAvailability(context.org.id, chair);
      const { data: createdDepartment, error } = await supabaseAdmin
        .from("org_departments")
        .insert([
          {
            org_id: context.org.id,
            college_id: collegeId,
            name,
            code: cleanNullableText(payload.code),
            chair_user_id: chair?.id ?? null,
            created_at: now,
            updated_at: now,
          },
        ])
        .select("id, name, code, chair_user_id")
        .single<DepartmentRow>();

      if (error) {
        return jsonError(
          isDuplicateError(error)
            ? "A department with that code already exists."
            : error.message || "Failed to create department.",
          500,
        );
      }

      if (chair && createdDepartment) {
        await assignUserToDepartment(context.org.id, chair, createdDepartment, now);
      }
    }

    return NextResponse.json(await loadHierarchy(context.org.id));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to save hierarchy item.",
      400,
    );
  }
}

export async function PATCH(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const typeError = requireHigherEd(context.institutionType);
  if (typeError) {
    return typeError;
  }

  let payload: HierarchyRequest;

  try {
    payload = await parsePayload(req);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request body.", 400);
  }

  const id = normalizeOptionalId(payload.id ?? payload.userId);
  if (!payload.entity || !id) {
    return jsonError("Entity and id are required.", 400);
  }

  try {
    const now = new Date().toISOString();

    if (payload.entity === "college") {
      const name = cleanText(payload.name);
      if (!name) {
        return jsonError("College name is required.", 400);
      }

      const dean = await validateUser(context.org.id, payload.deanUserId);
      await validateUserHierarchyAvailability(context.org.id, dean, {
        excludeCollegeId: id,
      });
      const { error } = await supabaseAdmin
        .from("org_colleges")
        .update({
          name,
          code: cleanNullableText(payload.code),
          dean_user_id: dean?.id ?? null,
          updated_at: now,
        })
        .eq("id", id)
        .eq("org_id", context.org.id);

      if (error) {
        return jsonError(
          isDuplicateError(error)
            ? "A college with that code already exists."
            : error.message || "Failed to update college.",
          500,
        );
      }
    } else if (payload.entity === "department") {
      const name = cleanText(payload.name);
      if (!name) {
        return jsonError("Department name is required.", 400);
      }

      const [existingDepartment, collegeId, chair] = await Promise.all([
        validateDepartment(context.org.id, id),
        validateCollege(context.org.id, payload.collegeId),
        validateUser(context.org.id, payload.chairUserId),
      ]);
      if (!existingDepartment) {
        return jsonError("Selected department was not found in this organization.", 404);
      }

      await validateUserHierarchyAvailability(context.org.id, chair, {
        excludeDepartmentId: id,
        allowDepartmentId: existingDepartment.chair_user_id === chair?.id ? id : null,
      });
      const { error } = await supabaseAdmin
        .from("org_departments")
        .update({
          name,
          code: cleanNullableText(payload.code),
          college_id: collegeId,
          chair_user_id: chair?.id ?? null,
          updated_at: now,
        })
        .eq("id", id)
        .eq("org_id", context.org.id);

      if (error) {
        return jsonError(
          isDuplicateError(error)
            ? "A department with that code already exists."
            : error.message || "Failed to update department.",
          500,
        );
      }

      if (chair) {
        await assignUserToDepartment(
          context.org.id,
          chair,
          {
            id,
            name,
            code: cleanNullableText(payload.code),
            chair_user_id: chair.id,
          },
          now,
        );
      }
    } else if (payload.entity === "user") {
      const department = await validateDepartment(context.org.id, payload.departmentId);
      const user = await validateUser(context.org.id, id);

      if (!user) {
        return jsonError("User was not found in this organization.", 404);
      }

      if (department) {
        await validateUserHierarchyAvailability(context.org.id, user, {
          allowDepartmentId: department.id,
        });
        await assignUserToDepartment(context.org.id, user, department, now);
        return NextResponse.json(await loadHierarchy(context.org.id));
      }

      const { error } = await supabaseAdmin
        .from("org_users")
        .update({
          department_id: null,
          department: null,
          updated_at: now,
        })
        .eq("id", user.id)
        .eq("org_id", context.org.id);

      if (error) {
        return jsonError(error.message || "Failed to assign department.", 500);
      }

      const { data: authTarget } = await supabaseAdmin.auth.admin.getUserById(user.auth_user_id);
      const metadata = authTarget?.user?.user_metadata ?? {};
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.auth_user_id,
        {
          user_metadata: {
            ...metadata,
            department: null,
            department_id: null,
          },
        },
      );

      if (authUpdateError) {
        return jsonError(
          authUpdateError.message || "Department saved, but auth profile update failed.",
          500,
        );
      }
    } else {
      return jsonError("Unsupported entity.", 400);
    }

    return NextResponse.json(await loadHierarchy(context.org.id));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to update hierarchy.",
      400,
    );
  }
}

export async function DELETE(req: Request) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  const { context } = result;
  const typeError = requireHigherEd(context.institutionType);
  if (typeError) {
    return typeError;
  }

  let payload: HierarchyRequest;

  try {
    payload = await parsePayload(req);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request body.", 400);
  }

  const id = normalizeOptionalId(payload.id);
  if (!payload.entity || !id || !["college", "department"].includes(payload.entity)) {
    return jsonError("Entity and id are required.", 400);
  }

  const tableName = payload.entity === "college" ? "org_colleges" : "org_departments";
  const { error } = await supabaseAdmin
    .from(tableName)
    .delete()
    .eq("id", id)
    .eq("org_id", context.org.id);

  if (error) {
    return jsonError(error.message || "Failed to delete hierarchy item.", 500);
  }

  try {
    return NextResponse.json(await loadHierarchy(context.org.id));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Deleted item, but failed to reload hierarchy.",
      500,
    );
  }
}
