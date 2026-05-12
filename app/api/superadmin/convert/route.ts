import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getBootstrapSystemRoleDefinitions } from "@/features/tenant-role-catalog";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  authenticateSuperAdmin,
  tryCreateSuperAdminActivityLog,
} from "@/lib/superadminActivityLogs";

export const runtime = "nodejs";

type ConvertRequest = {
  demoRequestId?: string;
  plan?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const buildAcronym = (name: string) => {
  const words = name.split(" ").filter(Boolean);
  const letters = words.filter((word) => word.length > 2).map((word) => word[0]?.toLowerCase());
  const acronym = letters.join("");

  if (acronym) return acronym;
  if (words[0]) return words[0].slice(0, 3).toLowerCase();
  return "org";
};

const buildNamePart = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, ".") || "admin";

const generateTempPassword = () => {
  const base = randomBytes(8).toString("hex");
  const mix = randomBytes(4).toString("base64").replace(/[^a-zA-Z0-9]/g, "");
  return `Tlc!${base}${mix.slice(0, 3)}`;
};

export async function POST(req: Request) {
  const auth = await authenticateSuperAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  let payload: ConvertRequest = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { demoRequestId, plan, subscriptionStart, subscriptionEnd } = payload;

  if (!demoRequestId || !plan || !subscriptionStart || !subscriptionEnd) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { data: demoRequest, error: demoError } = await supabaseAdmin
    .from("demo_requests")
    .select("*")
    .eq("id", demoRequestId)
    .single();

  if (demoError || !demoRequest) {
    return NextResponse.json({ error: "Demo request not found." }, { status: 404 });
  }

  if (demoRequest.status === "converted") {
    return NextResponse.json({ error: "This request is already converted." }, { status: 409 });
  }

  const orgName = (demoRequest.institution_name || "Organization").trim();
  const requesterName = (demoRequest.full_name || "admin").trim();
  const slug = slugify(orgName);
  const acronym = buildAcronym(orgName);
  const namePart = buildNamePart(requesterName);
  const adminEmail = `${namePart}@${acronym}.edu`;

  const { data: existingOrgs, error: existingError } = await supabaseAdmin
    .from("organizations")
    .select("id, slug, admin_email")
    .or(`slug.eq.${slug},admin_email.eq.${adminEmail}`);

  if (existingError) {
    return NextResponse.json({ error: "Failed to check organization uniqueness." }, { status: 500 });
  }

  if (existingOrgs && existingOrgs.length > 0) {
    return NextResponse.json({ error: "Organization or admin email already exists." }, { status: 409 });
  }

  const tempPassword = generateTempPassword();

  const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: "org_admin",
      org_name: orgName,
      org_slug: slug,
      demo_request_id: demoRequestId,
      first_login: true,
      onboarding_complete: false,
    },
  });

  if (createUserError || !createdUser?.user) {
    const status = createUserError?.message?.toLowerCase().includes("already") ? 409 : 500;
    return NextResponse.json({ error: createUserError?.message || "Failed to create admin user." }, { status });
  }

  const now = new Date().toISOString();

  const orgRow = {
    name: orgName,
    slug,
    admin_email: adminEmail,
    contact_email: demoRequest.email,
    subscription_plan: plan,
    subscription_status: "active",
    subscription_start: subscriptionStart,
    subscription_end: subscriptionEnd,
    status: "active",
    created_at: now,
    updated_at: now,
  };

  const { data: createdOrg, error: orgError } = await supabaseAdmin
    .from("organizations")
    .insert([orgRow])
    .select("id")
    .single();

  if (orgError || !createdOrg?.id) {
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: orgError?.message || "Failed to create organization." }, { status: 500 });
  }

  const defaultRoles = getBootstrapSystemRoleDefinitions();

  const { data: createdRoles, error: rolesError } = await supabaseAdmin
    .from("roles")
    .insert(
      defaultRoles.map((role) => ({
        org_id: createdOrg.id,
        key: role.key,
        name: role.name,
        description: role.description,
        is_system: true,
        created_at: now,
        updated_at: now,
      })),
    )
    .select("id, key");

  if (rolesError || !createdRoles?.length) {
    await supabaseAdmin.from("organizations").delete().eq("id", createdOrg.id);
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: rolesError?.message || "Failed to seed roles." }, { status: 500 });
  }

  const adminRole = createdRoles.find((role) => role.key === "org_admin");

  if (!adminRole) {
    await supabaseAdmin.from("roles").delete().eq("org_id", createdOrg.id);
    await supabaseAdmin.from("organizations").delete().eq("id", createdOrg.id);
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: "Failed to resolve admin role." }, { status: 500 });
  }

  const { error: orgUserError } = await supabaseAdmin
    .from("org_users")
    .insert([
      {
        org_id: createdOrg.id,
        role_id: adminRole.id,
        auth_user_id: createdUser.user.id,
        full_name: requesterName,
        email: adminEmail,
        employee_id: null,
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ]);

  if (orgUserError) {
    await supabaseAdmin.from("roles").delete().eq("org_id", createdOrg.id);
    await supabaseAdmin.from("organizations").delete().eq("id", createdOrg.id);
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: orgUserError.message || "Failed to create org admin." }, { status: 500 });
  }

  const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
    createdUser.user.id,
    {
      user_metadata: {
        role: "org_admin",
        org_id: createdOrg.id,
        org_name: orgName,
        org_slug: slug,
        demo_request_id: demoRequestId,
        first_login: true,
        onboarding_complete: false,
      },
    },
  );

  if (metadataError) {
    await supabaseAdmin.from("roles").delete().eq("org_id", createdOrg.id);
    await supabaseAdmin.from("organizations").delete().eq("id", createdOrg.id);
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: metadataError.message || "Failed to update admin metadata." }, { status: 500 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("demo_requests")
    .update({ status: "converted" })
    .eq("id", demoRequestId);

  const warning = updateError
    ? "Organization created, but demo request status update failed."
    : undefined;

  await tryCreateSuperAdminActivityLog(auth.user, {
    action: "converted",
    target: orgName,
    targetType: "demo_request",
    status: warning ? "warning" : "success",
    metadata: {
      demo_request_id: demoRequestId,
      organization_id: createdOrg.id,
      admin_email: adminEmail,
      subscription_plan: plan,
      subscription_start: subscriptionStart,
      subscription_end: subscriptionEnd,
      warning: warning ?? null,
    },
  });

  return NextResponse.json({
    orgId: createdOrg.id,
    adminEmail,
    tempPassword,
    slug,
    warning,
  });
}
