import "server-only";

import { NextResponse } from "next/server";
import { getBearerToken } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type ActivityLogStatus = "success" | "failed" | "warning" | "info";

export type SuperAdminActivityInput = {
  action: string;
  target?: string | null;
  targetType?: string | null;
  status?: ActivityLogStatus;
  metadata?: Record<string, unknown> | null;
};

type SuperAdminUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

const ALLOWED_STATUSES = new Set<ActivityLogStatus>([
  "success",
  "failed",
  "warning",
  "info",
]);

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const getMetadataString = (
  metadata: Record<string, unknown> | undefined,
  key: string,
) => {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
};

export const getSuperAdminDisplayName = (user: SuperAdminUser) =>
  getMetadataString(user.user_metadata, "full_name") ||
  getMetadataString(user.user_metadata, "name") ||
  user.email ||
  "Super Admin";

export async function authenticateSuperAdmin(req: Request): Promise<
  | { user: SuperAdminUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const token = getBearerToken(req);

  if (!token) {
    return { error: jsonError("Missing authorization token.", 401) };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;

  if (error || !user) {
    return { error: jsonError("Unauthorized.", 401) };
  }

  const role = (user.user_metadata as { role?: string } | undefined)?.role;

  if (role !== "superadmin") {
    return { error: jsonError("Insufficient permissions.", 403) };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
  };
}

export const normalizeActivityStatus = (
  status: unknown,
): ActivityLogStatus => {
  if (typeof status === "string") {
    const normalized = status.toLowerCase() as ActivityLogStatus;

    if (ALLOWED_STATUSES.has(normalized)) {
      return normalized;
    }
  }

  return "success";
};

export async function createSuperAdminActivityLog(
  user: SuperAdminUser,
  input: SuperAdminActivityInput,
) {
  const action = input.action.trim();

  if (!action) {
    throw new Error("Activity action is required.");
  }

  const { data, error } = await supabaseAdmin
    .from("activity_logs")
    .insert([
      {
        user_name: getSuperAdminDisplayName(user),
        user_email: user.email ?? null,
        action,
        target: input.target?.trim() || null,
        target_type: input.targetType?.trim() || null,
        status: normalizeActivityStatus(input.status),
        metadata: input.metadata ?? null,
        created_at: new Date().toISOString(),
      },
    ])
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to save activity log.");
  }

  return data;
}

export async function tryCreateSuperAdminActivityLog(
  user: SuperAdminUser,
  input: SuperAdminActivityInput,
) {
  try {
    await createSuperAdminActivityLog(user, input);
  } catch {
    // Activity logging should never break the primary workflow.
  }
}
