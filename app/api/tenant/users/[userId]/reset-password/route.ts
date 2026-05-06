import { NextResponse } from "next/server";
import { loadTenantContext } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateTempPassword } from "@/lib/tempPassword";

export const runtime = "nodejs";

type OrgUserRow = {
  id: string;
  org_id: string;
  auth_user_id: string;
  role_id: string;
  email: string;
  status?: string | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const result = await loadTenantContext(req, { requireOrgAdmin: true });
  if (result.error) {
    return result.error;
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  const { context } = result;

  const { data: targetUser, error: targetError } = await supabaseAdmin
    .from("org_users")
    .select("id, org_id, auth_user_id, role_id, email, status")
    .eq("id", userId)
    .eq("org_id", context.org.id)
    .maybeSingle<OrgUserRow>();

  if (targetError || !targetUser?.id) {
    return NextResponse.json(
      { error: targetError?.message || "Account not found in this organization." },
      { status: 404 },
    );
  }

  if ((targetUser.status ?? "active") !== "active") {
    return NextResponse.json(
      { error: "Reactivate this account before resetting the password." },
      { status: 400 },
    );
  }

  const tempPassword = generateTempPassword();
  const { data: authTarget } = await supabaseAdmin.auth.admin.getUserById(targetUser.auth_user_id);
  const metadata = authTarget?.user?.user_metadata ?? {};

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    targetUser.auth_user_id,
    {
      password: tempPassword,
      user_metadata: {
        ...metadata,
        first_login: false,
        onboarding_complete: true,
        must_change_password: true,
      },
    },
  );

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Failed to reset password." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    tempPassword,
    message: "Temporary password generated. It is shown only in this response.",
  });
}
