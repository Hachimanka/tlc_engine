import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PlanLimitRow = {
  name: string;
  instructors: number | null;
  departments: number | null;
};

type LimitCheckResult = {
  allowed: boolean;
  error?: string;
};

const normalizePlanName = (value?: string | null) =>
  value?.trim().toLowerCase().replace(/[\s_-]+/g, "_") || "";

const isUnlimitedLimit = (value?: number | null) =>
  value == null || value <= 0 || value >= 999;

async function loadPlanLimits(planName?: string | null) {
  const normalizedPlan = normalizePlanName(planName);

  if (!normalizedPlan) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("subscription_plans")
    .select("name, instructors, departments")
    .ilike("name", normalizedPlan)
    .maybeSingle<PlanLimitRow>();

  if (error) {
    throw new Error(error.message || "Failed to load subscription limits.");
  }

  return data;
}

async function countOrgRows(tableName: "org_users" | "org_departments", orgId: string) {
  const { count, error } = await supabaseAdmin
    .from(tableName)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (error) {
    throw new Error(error.message || `Failed to count ${tableName}.`);
  }

  return count ?? 0;
}

export async function checkUserLimitBeforeCreate({
  orgId,
  planName,
}: {
  orgId: string;
  planName?: string | null;
}): Promise<LimitCheckResult> {
  const plan = await loadPlanLimits(planName);

  if (!plan || isUnlimitedLimit(plan.instructors)) {
    return { allowed: true };
  }

  const currentUsers = await countOrgRows("org_users", orgId);
  const limit = Number(plan.instructors);

  if (currentUsers >= limit) {
    return {
      allowed: false,
      error: `${plan.name} plan allows up to ${limit} user${limit === 1 ? "" : "s"}. Upgrade the subscription or remove an account before adding another user.`,
    };
  }

  return { allowed: true };
}

export async function checkDepartmentLimitBeforeCreate({
  orgId,
  planName,
}: {
  orgId: string;
  planName?: string | null;
}): Promise<LimitCheckResult> {
  const plan = await loadPlanLimits(planName);

  if (!plan || isUnlimitedLimit(plan.departments)) {
    return { allowed: true };
  }

  const currentDepartments = await countOrgRows("org_departments", orgId);
  const limit = Number(plan.departments);

  if (currentDepartments >= limit) {
    return {
      allowed: false,
      error: `${plan.name} plan allows up to ${limit} department${limit === 1 ? "" : "s"}. Upgrade the subscription or remove a department before adding another one.`,
    };
  }

  return { allowed: true };
}
