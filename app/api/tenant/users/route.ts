import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type CreateUserRequest = {
  fullName?: string;
  email?: string;
  employeeId?: string;
  roleId?: string;
};

const getBearerToken = (req: Request) => {
  const authHeader = req.headers.get("authorization") || "";
  const [type, token] = authHeader.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
};

const generateTempPassword = () => {
  const base = randomBytes(8).toString("hex");
  const mix = randomBytes(4).toString("base64").replace(/[^a-zA-Z0-9]/g, "");
  return `Tlc!${base}${mix.slice(0, 3)}`;
};

const loadOrgContext = async (req: Request) => {
  const token = getBearerToken(req);
  if (!token) {
    return { error: NextResponse.json({ error: "Missing authorization token." }, { status: 401 }) };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  const authUser = authData?.user;
  if (authError || !authUser) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const { data: orgUser, error: orgUserError } = await supabaseAdmin
    .from("org_users")
    .select("org_id, roles(key)")
    .eq("auth_user_id", authUser.id)
    .single();

  if (orgUserError || !orgUser?.org_id) {
    return { error: NextResponse.json({ error: "Organization membership not found." }, { status: 403 }) };
  }

  if (orgUser.roles?.key !== "org_admin") {
    return { error: NextResponse.json({ error: "Insufficient permissions." }, { status: 403 }) };
  }

  return { orgId: orgUser.org_id, authUser };
};

export async function GET(req: Request) {
  const context = await loadOrgContext(req);
  if (context.error) {
    return context.error;
  }

  const { orgId } = context;

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name, description, is_system")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (rolesError) {
    return NextResponse.json({ error: rolesError.message || "Failed to load roles." }, { status: 500 });
  }

  const { data: users, error: usersError } = await supabaseAdmin
    .from("org_users")
    .select("id, full_name, email, employee_id, status, role_id, created_at, roles(id, key, name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (usersError) {
    return NextResponse.json({ error: usersError.message || "Failed to load users." }, { status: 500 });
  }

  return NextResponse.json({ roles: roles ?? [], users: users ?? [] });
}

export async function POST(req: Request) {
  const context = await loadOrgContext(req);
  if (context.error) {
    return context.error;
  }

  let payload: CreateUserRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { fullName, email, employeeId, roleId } = payload;

  if (!fullName || !email || !roleId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { orgId } = context;

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id, key, name")
    .eq("id", roleId)
    .eq("org_id", orgId)
    .single();

  if (roleError || !roleRow) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  const { data: orgInfo } = await supabaseAdmin
    .from("organizations")
    .select("name, slug")
    .eq("id", orgId)
    .single();

  const tempPassword = generateTempPassword();

  const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: roleRow.key,
      org_id: orgId,
      org_name: orgInfo?.name ?? null,
      org_slug: orgInfo?.slug ?? null,
      first_login: true,
      onboarding_complete: false,
    },
  });

  if (createUserError || !createdUser?.user) {
    const status = createUserError?.message?.toLowerCase().includes("already") ? 409 : 500;
    return NextResponse.json({ error: createUserError?.message || "Failed to create user." }, { status });
  }

  const now = new Date().toISOString();

  const { error: orgUserError } = await supabaseAdmin
    .from("org_users")
    .insert([
      {
        org_id: orgId,
        role_id: roleRow.id,
        auth_user_id: createdUser.user.id,
        full_name: fullName,
        email,
        employee_id: employeeId || null,
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ]);

  if (orgUserError) {
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: orgUserError.message || "Failed to save user." }, { status: 500 });
  }

  return NextResponse.json({
    tempPassword,
    user: {
      id: createdUser.user.id,
      full_name: fullName,
      email,
      employee_id: employeeId || null,
      status: "active",
      role: {
        id: roleRow.id,
        key: roleRow.key,
        name: roleRow.name,
      },
    },
  });
}
