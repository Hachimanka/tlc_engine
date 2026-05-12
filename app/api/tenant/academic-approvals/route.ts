import { NextResponse } from "next/server";
import {
  canUseHigherEdApprovals,
  canViewApprovals,
  jsonError,
  mapApprovalRequest,
  type AcademicApprovalRow,
} from "@/lib/academicApprovals";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type OrgUserLookup = {
  id: string;
  full_name: string;
  email: string;
};

export async function GET(req: Request) {
  const result = await loadTenantContext(req);

  if (result.error) {
    return result.error;
  }

  const { context } = result;

  if (!canUseHigherEdApprovals(context)) {
    return jsonError("Academic approvals are available for Higher Ed institutions only.", 400);
  }

  if (!canViewApprovals(context)) {
    return jsonError("Only Deans, VPAA, or org admins can view academic approvals.", 403);
  }

  const url = new URL(req.url);
  const requestType = url.searchParams.get("type");

  let query = supabaseAdmin
    .from("academic_approval_requests")
    .select("*")
    .eq("org_id", context.org.id)
    .order("updated_at", { ascending: false });

  if (requestType) {
    query = query.eq("request_type", requestType);
  }

  const { data: requests, error: requestsError } = await query;

  if (requestsError) {
    return jsonError(requestsError.message || "Failed to load academic approvals.", 500);
  }

  const submittedByIds = Array.from(
    new Set(
      (requests ?? [])
        .map((request) => (request as AcademicApprovalRow).submitted_by_org_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const submittersById = new Map<string, OrgUserLookup>();

  if (submittedByIds.length > 0) {
    const { data: submitters, error: submittersError } = await supabaseAdmin
      .from("org_users")
      .select("id, full_name, email")
      .eq("org_id", context.org.id)
      .in("id", submittedByIds);

    if (submittersError) {
      return jsonError(submittersError.message || "Failed to load submitter details.", 500);
    }

    for (const submitter of (submitters ?? []) as OrgUserLookup[]) {
      submittersById.set(submitter.id, submitter);
    }
  }

  return NextResponse.json({
    requests: (requests ?? []).map((row) => {
      const request = row as AcademicApprovalRow;
      const submitter = request.submitted_by_org_user_id
        ? submittersById.get(request.submitted_by_org_user_id)
        : undefined;

      return {
        ...mapApprovalRequest(request, context),
        submittedBy: submitter
          ? {
              id: submitter.id,
              name: submitter.full_name,
              email: submitter.email,
            }
          : null,
      };
    }),
  });
}
