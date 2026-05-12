import { supabase } from "@/lib/supabaseClient";

type ActivityLogStatus = "success" | "failed" | "warning" | "info";

type SuperAdminActivityInput = {
  action: string;
  target?: string | null;
  targetType?: string | null;
  status?: ActivityLogStatus;
  metadata?: Record<string, unknown> | null;
};

export async function recordSuperAdminActivity(input: SuperAdminActivityInput) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      return false;
    }

    const response = await fetch("/api/superadmin/activity-logs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    return response.ok;
  } catch {
    return false;
  }
}
