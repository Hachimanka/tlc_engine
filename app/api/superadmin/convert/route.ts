import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getBootstrapSystemRoleDefinitions } from "@/features/tenant-role-catalog";
import {
  getCustomerConversionEmailConfigError,
  sendCustomerConversionEmail,
} from "@/lib/customerConversionEmail";
import { buildOrganizationAcronym } from "@/lib/organizationNickname";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

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

const getRequestOrigin = (req: Request) => {
  const explicitOrigin = req.headers.get("origin")?.trim();

  if (explicitOrigin) {
    return explicitOrigin.replace(/\/+$/, "");
  }

  const forwardedHost = req.headers.get("x-forwarded-host")?.trim();
  const host = forwardedHost || req.headers.get("host")?.trim();

  if (host) {
    const forwardedProto = req.headers.get("x-forwarded-proto")?.trim();
    const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
    return `${protocol}://${host}`.replace(/\/+$/, "");
  }

  return new URL(req.url).origin.replace(/\/+$/, "");
};

const buildLoginUrl = (req: Request, slug: string) =>
  `${getRequestOrigin(req)}/login?slug=${encodeURIComponent(slug)}`;

const rollbackCustomerConversion = async ({
  authUserId,
  orgId,
}: {
  authUserId?: string;
  orgId?: string;
}) => {
  if (orgId) {
    await supabaseAdmin.from("org_users").delete().eq("org_id", orgId);
    await supabaseAdmin.from("roles").delete().eq("org_id", orgId);
    await supabaseAdmin.from("organizations").delete().eq("id", orgId);
  }

  if (authUserId) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
  }
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
  const requesterEmail = (demoRequest.email || "").trim().toLowerCase();

  if (!EMAIL_PATTERN.test(requesterEmail)) {
    return NextResponse.json(
      { error: "Demo request email is missing or invalid." },
      { status: 400 },
    );
  }

  const emailConfigError = getCustomerConversionEmailConfigError();

  if (emailConfigError) {
    return NextResponse.json({ error: emailConfigError }, { status: 500 });
  }

  const slug = slugify(orgName);
  const acronym = buildOrganizationAcronym(orgName);
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
    await rollbackCustomerConversion({
      authUserId: createdUser.user.id,
      orgId: createdOrg.id,
    });
    return NextResponse.json({ error: rolesError?.message || "Failed to seed roles." }, { status: 500 });
  }

  const adminRole = createdRoles.find((role) => role.key === "org_admin");

  if (!adminRole) {
    await rollbackCustomerConversion({
      authUserId: createdUser.user.id,
      orgId: createdOrg.id,
    });
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
    await rollbackCustomerConversion({
      authUserId: createdUser.user.id,
      orgId: createdOrg.id,
    });
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
    await rollbackCustomerConversion({
      authUserId: createdUser.user.id,
      orgId: createdOrg.id,
    });
    return NextResponse.json({ error: metadataError.message || "Failed to update admin metadata." }, { status: 500 });
  }

  const loginUrl = buildLoginUrl(req, slug);
  let emailResult: { id: string | null; sentTo: string };

  try {
    emailResult = await sendCustomerConversionEmail({
      to: requesterEmail,
      requesterName,
      orgName,
      adminEmail,
      tempPassword,
      loginUrl,
      plan,
      subscriptionStart,
      subscriptionEnd,
    });
  } catch (error) {
    await rollbackCustomerConversion({
      authUserId: createdUser.user.id,
      orgId: createdOrg.id,
    });

    const message =
      error instanceof Error
        ? error.message
        : "Email delivery failed.";

    await tryCreateSuperAdminActivityLog(auth.user, {
      action: "conversion email failed",
      target: orgName,
      targetType: "demo_request",
      status: "failed",
      metadata: {
        demo_request_id: demoRequestId,
        admin_email: adminEmail,
        email_recipient: requesterEmail,
        subscription_plan: plan,
        subscription_start: subscriptionStart,
        subscription_end: subscriptionEnd,
        rollback: true,
        error: message,
      },
    });

    return NextResponse.json(
      {
        error: `Customer was not created because the account email could not be sent. ${message}`,
      },
      { status: 502 },
    );
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
      email_recipient: emailResult.sentTo,
      email_delivery_id: emailResult.id,
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
    loginUrl,
    emailSentTo: emailResult.sentTo,
    emailDeliveryId: emailResult.id,
    warning,
  });
}
