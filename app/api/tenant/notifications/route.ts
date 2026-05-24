import { NextResponse } from "next/server";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ApprovalNotificationRow = {
  id: string;
  title: string;
  target_label: string | null;
  payload: unknown;
  submitted_at: string;
  submitted_by_org_user_id: string | null;
};

type SubmitterRow = {
  id: string;
  full_name: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toText = (value: unknown) => (typeof value === "string" ? value : "");

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  const { data, error } = await supabaseAdmin
    .from("academic_approval_requests")
    .select("id, title, target_label, payload, submitted_at, submitted_by_org_user_id")
    .eq("org_id", context.org.id)
    .eq("request_type", "adjustment_request")
    .in("status", ["pending_chairman", "pending_dean"])
    .order("submitted_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load notifications." },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as ApprovalNotificationRow[];
  const targetedRows = rows.filter((row) => {
    const payload = asRecord(row.payload);
    return toText(payload.recipientOrgUserId) === context.orgUser.id;
  });
  const submitterIds = Array.from(
    new Set(targetedRows.map((row) => row.submitted_by_org_user_id).filter(Boolean) as string[]),
  );
  let submittersById = new Map<string, SubmitterRow>();

  if (submitterIds.length > 0) {
    const { data: submitters } = await supabaseAdmin
      .from("org_users")
      .select("id, full_name")
      .eq("org_id", context.org.id)
      .in("id", submitterIds);

    submittersById = new Map(((submitters ?? []) as SubmitterRow[]).map((user) => [user.id, user]));
  }

  const notifications = targetedRows.map((row) => {
    const payload = asRecord(row.payload);
    const submitter = row.submitted_by_org_user_id
      ? submittersById.get(row.submitted_by_org_user_id)
      : null;

    return {
      id: row.id,
      title: row.title,
      subject: row.target_label ?? "",
      description: toText(payload.description),
      requestType: toText(payload.requestTypeLabel) || row.title,
      teacherName: toText(payload.teacherName) || submitter?.full_name || "Teacher",
      submittedAt: row.submitted_at,
    };
  });

  return NextResponse.json({
    notifications,
    unreadCount: notifications.length,
  });
}
