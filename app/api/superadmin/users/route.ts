import { NextResponse } from "next/server";
import { generateTempPassword } from "@/lib/tempPassword";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  authenticateSuperAdmin,
  getSuperAdminDisplayName,
  tryCreateSuperAdminActivityLog,
} from "@/lib/superadminActivityLogs";

export const runtime = "nodejs";

type CreateSuperAdminRequest = {
  fullName?: string;
  email?: string;
};

type AuthUserSummary = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LIST_PAGES = 10;
const USERS_PER_PAGE = 1000;

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const getMetadataString = (
  metadata: Record<string, unknown> | undefined,
  key: string,
) => {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
};

const toSuperAdminAccount = (user: AuthUserSummary) => ({
  id: user.id,
  email: user.email ?? "",
  fullName:
    getMetadataString(user.user_metadata, "full_name") ||
    getMetadataString(user.user_metadata, "name") ||
    user.email ||
    "Super Admin",
  accountStatus:
    getMetadataString(user.user_metadata, "account_status") || "active",
  createdAt: user.created_at ?? null,
  lastSignInAt: user.last_sign_in_at ?? null,
});

const listSuperAdminAccounts = async () => {
  const accounts: ReturnType<typeof toSuperAdminAccount>[] = [];

  for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      throw new Error(error.message || "Failed to load super admin accounts.");
    }

    const users = (data?.users ?? []) as AuthUserSummary[];

    accounts.push(
      ...users
        .filter((user) => user.user_metadata?.role === "superadmin")
        .map(toSuperAdminAccount),
    );

    if (users.length < USERS_PER_PAGE) {
      break;
    }
  }

  return accounts.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
};

export async function GET(req: Request) {
  const auth = await authenticateSuperAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  try {
    const users = await listSuperAdminAccounts();
    return NextResponse.json({ users });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Failed to load super admin accounts.",
      500,
    );
  }
}

export async function POST(req: Request) {
  const auth = await authenticateSuperAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  let payload: CreateSuperAdminRequest = {};

  try {
    payload = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const fullName = payload.fullName?.trim();
  const email = payload.email?.trim().toLowerCase();

  if (!fullName || !email) {
    return jsonError("Full name and email are required.", 400);
  }

  if (fullName.length > 120) {
    return jsonError("Full name must be 120 characters or fewer.", 400);
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return jsonError("Please enter a valid email address.", 400);
  }

  const tempPassword = generateTempPassword();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: "superadmin",
      full_name: fullName,
      name: fullName,
      account_status: "active",
      created_by: auth.user.id,
      created_by_email: auth.user.email ?? null,
    },
  });

  if (error || !data?.user) {
    const message = error?.message || "Failed to create super admin account.";
    const lowerMessage = message.toLowerCase();
    const status =
      lowerMessage.includes("already") ||
      lowerMessage.includes("registered") ||
      lowerMessage.includes("exists")
        ? 409
        : 500;

    return jsonError(
      status === 409 ? "An account with this email already exists." : message,
      status,
    );
  }

  const createdUser = data.user as AuthUserSummary;
  const account = toSuperAdminAccount(createdUser);

  await tryCreateSuperAdminActivityLog(auth.user, {
    action: "created",
    target: email,
    targetType: "superadmin_account",
    status: "success",
    metadata: {
      created_user_id: createdUser.id,
      created_user_name: fullName,
      created_by: auth.user.id,
      created_by_name: getSuperAdminDisplayName(auth.user),
    },
  });

  return NextResponse.json(
    {
      tempPassword,
      user: account,
    },
    { status: 201 },
  );
}
