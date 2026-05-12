import { NextResponse } from "next/server";
import {
  authenticateSuperAdmin,
  createSuperAdminActivityLog,
  normalizeActivityStatus,
  type SuperAdminActivityInput,
} from "@/lib/superadminActivityLogs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const parseLimit = (value: string | null) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 100;
  }

  return Math.min(Math.floor(parsed), 250);
};

const isPlainMetadata = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function GET(req: Request) {
  const auth = await authenticateSuperAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  const url = new URL(req.url);
  const limit = parseLimit(url.searchParams.get("limit"));

  const { data, error } = await supabaseAdmin
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load activity logs." },
      { status: 500 },
    );
  }

  return NextResponse.json({ logs: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await authenticateSuperAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  let payload: SuperAdminActivityInput = { action: "" };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = payload.action?.trim();

  if (!action) {
    return NextResponse.json({ error: "Activity action is required." }, { status: 400 });
  }

  if (action.length > 120) {
    return NextResponse.json(
      { error: "Activity action must be 120 characters or fewer." },
      { status: 400 },
    );
  }

  if (payload.metadata !== null && payload.metadata !== undefined && !isPlainMetadata(payload.metadata)) {
    return NextResponse.json({ error: "Metadata must be an object." }, { status: 400 });
  }

  try {
    const log = await createSuperAdminActivityLog(auth.user, {
      action,
      target: payload.target ?? null,
      targetType: payload.targetType ?? null,
      status: normalizeActivityStatus(payload.status),
      metadata: payload.metadata ?? null,
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save activity log.",
      },
      { status: 500 },
    );
  }
}
