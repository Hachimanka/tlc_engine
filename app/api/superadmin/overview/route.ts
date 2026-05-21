import { NextResponse } from "next/server";
import { authenticateSuperAdmin } from "@/lib/superadminActivityLogs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type {
  SuperadminOverviewActivityItem,
  SuperadminOverviewGrowthBucket,
  SuperadminOverviewPayload,
  SuperadminOverviewPeriod,
} from "@/lib/superadminOverviewTypes";

export const runtime = "nodejs";

type OrganizationRow = {
  id: string;
  name: string;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type OrgUserRow = {
  id: string;
  org_id: string;
  status?: string | null;
  created_at?: string | null;
};

type DemoRequestRow = {
  id: string;
  status?: string | null;
  institution_name?: string | null;
  created_at?: string | null;
};

type SubscriptionPlanRow = {
  name: string;
  price?: number | string | null;
  color?: string | null;
};

type ActivityLogRow = {
  id: string;
  user_name?: string | null;
  action: string;
  target?: string | null;
  target_type?: string | null;
  status?: string | null;
  created_at: string;
};

const VALID_PERIODS = new Set<SuperadminOverviewPeriod>(["week", "month", "year"]);

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  contacted: "#0ea5e9",
  scheduled: "#8b5cf6",
  converted: "#10b981",
  rejected: "#ef4444",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "#9ca3af",
  basic: "#14b8a6",
  premium: "#d946ef",
  diamond: "#0ea5e9",
  enterprise: "#10b981",
};

const formatTitle = (value?: string | null) =>
  (value || "Unknown")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ") || "Unknown";

const normalizeKey = (value?: string | null) => (value || "unknown").trim().toLowerCase();

const parseDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const buildBuckets = (period: SuperadminOverviewPeriod) => {
  const today = startOfDay(new Date());
  const buckets: Array<{ label: string; start: Date; end: Date }> = [];

  if (period === "year") {
    const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);

    for (let index = 0; index < 12; index += 1) {
      const bucketStart = addMonths(start, index);
      buckets.push({
        label: new Intl.DateTimeFormat("en", { month: "short" }).format(bucketStart),
        start: bucketStart,
        end: addMonths(bucketStart, 1),
      });
    }

    return buckets;
  }

  if (period === "month") {
    const start = addDays(today, -35);

    for (let index = 0; index < 6; index += 1) {
      const bucketStart = addDays(start, index * 7);
      buckets.push({
        label: new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
        }).format(bucketStart),
        start: bucketStart,
        end: addDays(bucketStart, 7),
      });
    }

    return buckets;
  }

  const start = addDays(today, -6);

  for (let index = 0; index < 7; index += 1) {
    const bucketStart = addDays(start, index);
    buckets.push({
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(bucketStart),
      start: bucketStart,
      end: addDays(bucketStart, 1),
    });
  }

  return buckets;
};

const countRowsFrom = <T,>(
  rows: T[],
  getDate: (row: T) => string | null | undefined,
  start: Date,
) =>
  rows.filter((row) => {
    const date = parseDate(getDate(row));
    return date ? date >= start : false;
  }).length;

const countRowsInBucket = <T,>(
  rows: T[],
  getDate: (row: T) => string | null | undefined,
  start: Date,
  end: Date,
) =>
  rows.filter((row) => {
    const date = parseDate(getDate(row));
    return date ? date >= start && date < end : false;
  }).length;

const getActivityType = (row: ActivityLogRow) => {
  const action = row.action.toLowerCase();
  const targetType = (row.target_type || "").toLowerCase();

  if (action.includes("converted") || targetType.includes("demo")) return "convert";
  if (action.includes("created")) return "created";
  if (action.includes("updated")) return "updated";
  if (action.includes("deleted")) return "deleted";
  if (action.includes("logged")) return "session";
  return "activity";
};

const mapActivity = (row: ActivityLogRow): SuperadminOverviewActivityItem => ({
  id: row.id,
  action: row.action,
  name: row.target || row.action,
  type: getActivityType(row),
  status: row.status || "info",
  target: row.target ?? null,
  targetType: row.target_type ?? null,
  userName: row.user_name ?? null,
  createdAt: row.created_at,
});

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export async function GET(req: Request) {
  const auth = await authenticateSuperAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  const url = new URL(req.url);
  const requestedPeriod = url.searchParams.get("period") as SuperadminOverviewPeriod | null;
  const period =
    requestedPeriod && VALID_PERIODS.has(requestedPeriod) ? requestedPeriod : "week";
  const buckets = buildBuckets(period);
  const periodStart = buckets[0]?.start ?? startOfDay(new Date());

  try {
    const [organizationsResult, usersResult, demosResult, plansResult, activityResult] =
      await Promise.all([
        supabaseAdmin
          .from("organizations")
          .select("id, name, subscription_plan, subscription_status, status, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("org_users")
          .select("id, org_id, status, created_at"),
        supabaseAdmin
          .from("demo_requests")
          .select("id, status, institution_name, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("subscription_plans").select("name, price, color"),
        supabaseAdmin
          .from("activity_logs")
          .select("id, user_name, action, target, target_type, status, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

    const firstError =
      organizationsResult.error ||
      usersResult.error ||
      demosResult.error ||
      plansResult.error ||
      activityResult.error;

    if (firstError) {
      return NextResponse.json(
        { error: firstError.message || "Failed to load superadmin overview." },
        { status: 500 },
      );
    }

    const organizations = (organizationsResult.data ?? []) as OrganizationRow[];
    const users = (usersResult.data ?? []) as OrgUserRow[];
    const demos = (demosResult.data ?? []) as DemoRequestRow[];
    const plans = (plansResult.data ?? []) as SubscriptionPlanRow[];
    const activities = (activityResult.data ?? []) as ActivityLogRow[];

    const usersByOrg = new Map<string, number>();
    for (const user of users) {
      usersByOrg.set(user.org_id, (usersByOrg.get(user.org_id) ?? 0) + 1);
    }

    const planPrices = new Map<string, number>();
    const planColors = new Map<string, string>();
    for (const plan of plans) {
      const key = normalizeKey(plan.name);
      planPrices.set(key, Number(plan.price ?? 0) || 0);
      if (plan.color) {
        planColors.set(key, PLAN_COLORS[normalizeKey(plan.color)] ?? plan.color);
      }
    }

    const activeOrganizations = organizations.filter(
      (org) => normalizeKey(org.status) === "active",
    );
    const convertedDemos = demos.filter((demo) => normalizeKey(demo.status) === "converted");
    const pendingDemos = demos.filter((demo) => normalizeKey(demo.status) === "pending");
    const rejectedDemos = demos.filter((demo) => normalizeKey(demo.status) === "rejected");
    const activeUsers = users.filter((user) => normalizeKey(user.status) === "active");

    const estimatedMonthlyRevenue = activeOrganizations.reduce((total, org) => {
      const planKey = normalizeKey(org.subscription_plan);
      return total + (planPrices.get(planKey) ?? 0);
    }, 0);

    const demoStatusCounts = demos.reduce<Record<string, number>>((counts, demo) => {
      const status = normalizeKey(demo.status);
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    }, {});

    const pipelineStatuses = ["pending", "contacted", "scheduled", "converted", "rejected"];
    const pipeline = pipelineStatuses.map((status) => ({
      label: formatTitle(status),
      status,
      value: demoStatusCounts[status] ?? 0,
      color: STATUS_COLORS[status] ?? "#64748b",
    }));

    const planCounts = organizations.reduce<Record<string, number>>((counts, org) => {
      const plan = normalizeKey(org.subscription_plan);
      counts[plan] = (counts[plan] ?? 0) + 1;
      return counts;
    }, {});

    const planDistribution = Object.entries(planCounts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([plan, value]) => ({
        label: formatTitle(plan),
        value,
        color: planColors.get(plan) ?? PLAN_COLORS[plan] ?? "#64748b",
      }));

    const recentOrganizations = organizations.slice(0, 5).map((org) => ({
      id: org.id,
      name: org.name,
      plan: formatTitle(org.subscription_plan),
      status: formatTitle(org.status),
      users: usersByOrg.get(org.id) ?? 0,
      createdAt: org.created_at ?? null,
    }));

    const topOrganizations = organizations
      .map((org) => ({
        id: org.id,
        name: org.name,
        plan: formatTitle(org.subscription_plan),
        status: normalizeKey(org.status),
        users: usersByOrg.get(org.id) ?? 0,
        createdAt: org.created_at ?? null,
      }))
      .sort((left, right) => right.users - left.users)
      .slice(0, 5);

    const activityBuckets = buckets.map((bucket) => ({
      label: bucket.label,
      value: countRowsInBucket(activities, (row) => row.created_at, bucket.start, bucket.end),
    }));

    const growthBuckets: SuperadminOverviewGrowthBucket[] = buckets.map((bucket) => ({
      label: bucket.label,
      orgs: countRowsInBucket(
        organizations,
        (row) => row.created_at,
        bucket.start,
        bucket.end,
      ),
      demos: countRowsInBucket(demos, (row) => row.created_at, bucket.start, bucket.end),
    }));

    const emailConfigured = Boolean(
      process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim(),
    );
    const operationalChecks = 2 + (emailConfigured ? 1 : 0);
    const totalChecks = 3;
    const healthPercent = Math.round((operationalChecks / totalChecks) * 100);

    const payload: SuperadminOverviewPayload = {
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalOrganizations: organizations.length,
        activeOrganizations: activeOrganizations.length,
        suspendedOrganizations: organizations.filter(
          (org) => normalizeKey(org.status) === "suspended",
        ).length,
        inactiveOrganizations: organizations.filter(
          (org) => normalizeKey(org.status) === "inactive",
        ).length,
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        totalDemoRequests: demos.length,
        pendingDemoRequests: pendingDemos.length,
        convertedDemoRequests: convertedDemos.length,
        rejectedDemoRequests: rejectedDemos.length,
        conversionRate:
          demos.length > 0 ? Math.round((convertedDemos.length / demos.length) * 1000) / 10 : 0,
        estimatedMonthlyRevenue,
        healthScore: `${operationalChecks}/${totalChecks}`,
        healthPercent,
        emailConfigured,
        newOrganizationsInPeriod: countRowsFrom(
          organizations,
          (row) => row.created_at,
          periodStart,
        ),
        newUsersInPeriod: countRowsFrom(users, (row) => row.created_at, periodStart),
        newDemoRequestsInPeriod: countRowsFrom(demos, (row) => row.created_at, periodStart),
        activityCountInPeriod: countRowsFrom(
          activities,
          (row) => row.created_at,
          periodStart,
        ),
      },
      pipeline,
      planDistribution,
      recentOrganizations,
      topOrganizations,
      recentActivity: activities.slice(0, 6).map(mapActivity),
      activityBuckets,
      growthBuckets,
      healthChecks: [
        { label: "Database", value: "Operational", status: "operational" },
        { label: "Superadmin Auth", value: "Verified", status: "operational" },
        {
          label: "Gmail Sender",
          value: emailConfigured ? "Configured" : "Needs setup",
          status: emailConfigured ? "operational" : "warning",
        },
        {
          label: "Demo Queue",
          value: `${pendingDemos.length} pending`,
          status: pendingDemos.length > 0 ? "info" : "operational",
        },
      ],
    };

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load superadmin overview.") },
      { status: 500 },
    );
  }
}
