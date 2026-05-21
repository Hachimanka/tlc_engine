"use client";

import { supabase } from "@/lib/supabaseClient";
import type {
  SuperadminOverviewPayload,
  SuperadminOverviewPeriod,
} from "@/lib/superadminOverviewTypes";

export async function fetchSuperadminOverview(
  period: SuperadminOverviewPeriod = "week",
): Promise<SuperadminOverviewPayload> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("Your session expired. Please log in again.");
  }

  const response = await fetch(`/api/superadmin/overview?period=${period}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load superadmin overview.");
  }

  return payload as SuperadminOverviewPayload;
}
