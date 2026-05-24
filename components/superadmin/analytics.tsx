"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Building2,
  DollarSign,
  Inbox,
  RefreshCw,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import { fetchSuperadminOverview } from "@/lib/superadminOverviewClient";
import type {
  SuperadminOverviewActivityItem,
  SuperadminOverviewPayload,
  SuperadminOverviewPeriod,
} from "@/lib/superadminOverviewTypes";

const PERIODS: SuperadminOverviewPeriod[] = ["week", "month", "year"];

const formatNumber = (value: number) => value.toLocaleString("en-US");

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatTimeAgo = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
};

const initials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "OR";

function StatCard({
  label,
  value,
  icon,
  trendLabel,
  color,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  trendLabel: string;
  color: string;
}) {
  return (
    <div className="flex min-w-[180px] flex-1 flex-col gap-3 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">
          <TrendingUp size={13} />
          {trendLabel}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-0.5 text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col rounded-lg border border-gray-100 bg-white shadow-sm ${className}`}>
      <div className="border-b border-gray-100 px-5 py-4">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p> : null}
      </div>
      <div className="flex-1 px-5 py-4">{children}</div>
    </div>
  );
}

function ActivityBarChart({ data }: { data: SuperadminOverviewPayload["activityBuckets"] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  if (data.every((item) => item.value === 0)) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        No activity for this period.
      </div>
    );
  }

  return (
    <div className="flex h-36 w-full items-end gap-2">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-gray-400">{item.value}</span>
          <div
            className="w-full rounded-t-lg bg-teal-500 transition-all"
            style={{ height: `${(item.value / max) * 100}%`, minHeight: 4 }}
            title={`${item.value} activity logs`}
          />
          <span className="text-[10px] text-gray-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function GrowthChart({ data }: { data: SuperadminOverviewPayload["growthBuckets"] }) {
  const max = Math.max(...data.map((item) => Math.max(item.orgs, item.demos)), 1);

  if (data.every((item) => item.orgs === 0 && item.demos === 0)) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        No organization or demo growth for this period.
      </div>
    );
  }

  return (
    <div className="flex h-36 w-full items-end gap-3">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full items-end gap-0.5" style={{ height: 112 }}>
            <div
              className="flex-1 rounded-t-md bg-teal-500 transition-all"
              style={{ height: `${(item.orgs / max) * 100}%`, minHeight: item.orgs > 0 ? 4 : 0 }}
              title={`${item.orgs} new organizations`}
            />
            <div
              className="flex-1 rounded-t-md bg-fuchsia-400 transition-all"
              style={{ height: `${(item.demos / max) * 100}%`, minHeight: item.demos > 0 ? 4 : 0 }}
              title={`${item.demos} demo requests`}
            />
          </div>
          <span className="text-[10px] text-gray-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: SuperadminOverviewPayload["planDistribution"] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const center = 70;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        No plan data yet.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <svg width={140} height={140} viewBox="0 0 140 140" aria-label="Plan distribution">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={18} />
        {data.map((item, index) => {
          const offset = data.slice(0, index).reduce((sum, current) => sum + current.value, 0);
          const percentage = item.value / total;
          const dash = percentage * circumference;
          const gap = circumference - dash;
          const rotate = (offset / total) * 360 - 90;

          return (
            <circle
              key={item.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={18}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={0}
              transform={`rotate(${rotate} ${center} ${center})`}
            />
          );
        })}
        <text x={center} y={center - 6} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#111">
          {total}
        </text>
        <text x={center} y={center + 12} textAnchor="middle" fontSize={10} fill="#9ca3af">
          Total Orgs
        </text>
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="min-w-0 flex-1 truncate text-xs text-gray-600">{item.label}</span>
            <span className="text-xs font-bold text-gray-800">{item.value}</span>
            <span className="text-[10px] text-gray-400">({Math.round((item.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelChart({ data }: { data: SuperadminOverviewPayload["pipeline"] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex w-full flex-col gap-2">
      {data.map((item, index) => (
        <div key={item.status} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-gray-500">{item.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="flex h-full items-center justify-end rounded-full pr-2 transition-all"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
            >
              <span className="text-[11px] font-bold text-white">{item.value}</span>
            </div>
          </div>
          {index < data.length - 1 ? (
            <span className="w-10 shrink-0 text-right text-[10px] text-gray-400">
              {item.value > 0 ? `${Math.round((data[index + 1].value / item.value) * 100)}%` : "0%"}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RecentActivityRow({ activity }: { activity: SuperadminOverviewActivityItem }) {
  const tone =
    activity.status === "failed"
      ? "bg-red-100 text-red-700"
      : activity.status === "warning"
        ? "bg-amber-100 text-amber-700"
        : activity.type === "convert"
          ? "bg-teal-100 text-teal-700"
          : "bg-blue-100 text-blue-700";

  return (
    <div className="flex items-center gap-3 border-b border-gray-50 py-2 last:border-0">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Activity size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{activity.name}</p>
        <p className="text-xs text-gray-400">{activity.action}</p>
      </div>
      <span className="shrink-0 text-[11px] text-gray-400">{formatTimeAgo(activity.createdAt)}</span>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="w-full px-8 py-6 animate-pulse" role="status" aria-label="Loading analytics">
      <span className="sr-only">Loading analytics</span>

      <div className="mb-6 flex items-center justify-between border-b border-teal-200 pb-2">
        <div>
          <BrandedSkeletonBlock className="h-8 w-40" strong />
          <BrandedSkeletonBlock className="mt-2 h-3 w-[520px] max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            {[0, 1, 2].map((item) => (
              <BrandedSkeletonBlock key={item} className="h-8 w-16 rounded-md" />
            ))}
          </div>
          <BrandedSkeletonBlock className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          "bg-teal-50 text-teal-600",
          "bg-blue-50 text-blue-600",
          "bg-fuchsia-50 text-fuchsia-600",
          "bg-emerald-50 text-emerald-600",
        ].map((color, index) => (
          <div key={color} className="flex min-w-[180px] flex-1 flex-col gap-3 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                {index === 0 ? <UsersRound size={20} /> : index === 1 ? <Activity size={20} /> : index === 2 ? <Building2 size={20} /> : <DollarSign size={20} />}
              </span>
              <BrandedSkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
            <div>
              <BrandedSkeletonBlock className="h-7 w-24" strong />
              <BrandedSkeletonBlock className="mt-2 h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <BrandedSkeletonBlock className="h-4 w-36" strong />
            <BrandedSkeletonBlock className="mt-2 h-3 w-48" />
          </div>
          <div className="flex-1 px-5 py-4">
            <div className="flex h-36 w-full items-end gap-2">
              {["h-10", "h-20", "h-14", "h-28", "h-16", "h-8", "h-12"].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-1">
                  <BrandedSkeletonBlock className="h-3 w-6" />
                  <BrandedSkeletonBlock className={`w-full rounded-t-lg ${height}`} strong={index === 3} />
                  <BrandedSkeletonBlock className="h-3 w-7" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-gray-100 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-gray-100 px-5 py-4">
            <BrandedSkeletonBlock className="h-4 w-36" strong />
            <BrandedSkeletonBlock className="mt-2 h-3 w-56" />
          </div>
          <div className="flex-1 px-5 py-4">
            <div className="mb-3 flex items-center gap-4">
              <BrandedSkeletonBlock className="h-3 w-20" />
              <BrandedSkeletonBlock className="h-3 w-28" />
            </div>
            <div className="flex h-36 w-full items-end gap-3">
              {["h-20", "h-12", "h-28", "h-16", "h-24", "h-10"].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-28 w-full items-end gap-0.5">
                    <BrandedSkeletonBlock className={`flex-1 rounded-t-md ${height}`} strong />
                    <BrandedSkeletonBlock className={`flex-1 rounded-t-md ${index % 2 === 0 ? "h-16" : "h-8"}`} />
                  </div>
                  <BrandedSkeletonBlock className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <BrandedSkeletonBlock className="h-4 w-32" strong />
            <BrandedSkeletonBlock className="mt-2 h-3 w-36" />
          </div>
          <div className="flex items-center gap-6 px-5 py-4">
            <BrandedSkeletonBlock className="h-[140px] w-[140px] rounded-full" strong />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <BrandedSkeletonBlock className="h-2.5 w-2.5 rounded-full" />
                  <BrandedSkeletonBlock className="h-3 flex-1" />
                  <BrandedSkeletonBlock className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-gray-100 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-gray-100 px-5 py-4">
            <BrandedSkeletonBlock className="h-4 w-36" strong />
            <BrandedSkeletonBlock className="mt-2 h-3 w-44" />
          </div>
          <div className="px-5 py-4">
            <div className="flex w-full flex-col gap-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <BrandedSkeletonBlock className="h-3 w-24" />
                  <div className="h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <BrandedSkeletonBlock className={item === 0 ? "h-full w-4/5 rounded-full" : "h-full w-1/2 rounded-full"} strong />
                  </div>
                  <BrandedSkeletonBlock className="h-3 w-10" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="text-center">
                  <BrandedSkeletonBlock className="mx-auto h-6 w-12" strong />
                  <BrandedSkeletonBlock className="mt-2 h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((card) => (
          <div key={card} className="flex flex-col rounded-lg border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <BrandedSkeletonBlock className="h-4 w-32" strong />
              <BrandedSkeletonBlock className="mt-2 h-3 w-40" />
            </div>
            <div className="flex flex-col gap-2 px-5 py-4">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="flex items-center gap-3 border-b border-gray-50 py-2 last:border-0">
                  <BrandedSkeletonBlock className="h-8 w-8 rounded-lg" strong />
                  <div className="min-w-0 flex-1">
                    <BrandedSkeletonBlock className="h-4 w-44" />
                    <BrandedSkeletonBlock className="mt-2 h-3 w-28" />
                  </div>
                  <BrandedSkeletonBlock className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<SuperadminOverviewPeriod>("week");
  const [overview, setOverview] = useState<SuperadminOverviewPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async (nextPeriod: SuperadminOverviewPeriod) => {
    setIsLoading(true);
    setError("");

    try {
      const payload = await fetchSuperadminOverview(nextPeriod);
      setOverview(payload);
    } catch (err) {
      setOverview(null);
      setError(err instanceof Error ? err.message : "Failed to load analytics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview(period);
  }, [loadOverview, period]);

  const cards = useMemo(() => {
    if (!overview) return [];

    const { summary } = overview;

    return [
      {
        label: "Total Active Users",
        value: formatNumber(summary.activeUsers),
        icon: <UsersRound size={20} />,
        trendLabel: `+${formatNumber(summary.newUsersInPeriod)}`,
        color: "bg-teal-50 text-teal-600",
      },
      {
        label: "Platform Activity",
        value: formatNumber(summary.activityCountInPeriod),
        icon: <Activity size={20} />,
        trendLabel: period,
        color: "bg-blue-50 text-blue-600",
      },
      {
        label: "Active Organizations",
        value: formatNumber(summary.activeOrganizations),
        icon: <Building2 size={20} />,
        trendLabel: `+${formatNumber(summary.newOrganizationsInPeriod)}`,
        color: "bg-fuchsia-50 text-fuchsia-600",
      },
      {
        label: "Estimated Monthly Revenue",
        value: formatCurrency(summary.estimatedMonthlyRevenue),
        icon: <DollarSign size={20} />,
        trendLabel: "derived",
        color: "bg-emerald-50 text-emerald-600",
      },
    ];
  }, [overview, period]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !overview) {
    return (
      <div className="flex min-h-[420px] items-center justify-center px-8 py-10">
        <div className="max-w-md rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-600">{error || "Analytics data is unavailable."}</p>
          <button
            type="button"
            onClick={() => void loadOverview(period)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 flex items-center justify-between border-b border-teal-200 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-teal-800">ANALYTICS</h1>
          <p className="mt-1 text-xs text-gray-500">Real platform data from organizations, users, demo requests, plans, and activity logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            {PERIODS.map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  period === item
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void loadOverview(period)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Platform Activity" subtitle="Activity logs in the selected period">
          <ActivityBarChart data={overview.activityBuckets} />
        </Card>

        <Card title="Org & Demo Growth" subtitle="New organizations and demo requests" className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-500" />
              New Orgs
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-fuchsia-400" />
              Demo Requests
            </span>
          </div>
          <GrowthChart data={overview.growthBuckets} />
        </Card>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Plan Distribution" subtitle="Organizations by plan">
          <DonutChart data={overview.planDistribution} />
        </Card>

        <Card title="Conversion Funnel" subtitle="Demo to customer pipeline" className="lg:col-span-2">
          <FunnelChart data={overview.pipeline} />
          <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{overview.summary.conversionRate}%</p>
              <p className="text-xs text-gray-400">Overall Conversion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{formatNumber(overview.summary.totalDemoRequests)}</p>
              <p className="text-xs text-gray-400">Total Demo Requests</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-teal-600">{formatNumber(overview.summary.convertedDemoRequests)}</p>
              <p className="text-xs text-gray-400">Successfully Converted</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-500">{formatNumber(overview.summary.rejectedDemoRequests)}</p>
              <p className="text-xs text-gray-400">Rejected</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Recent Activity" subtitle="Latest platform events">
          {overview.recentActivity.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
              No activity logs yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {overview.recentActivity.map((activity) => (
                <RecentActivityRow key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </Card>

        <Card title="Top Organizations" subtitle="By account count">
          {overview.topOrganizations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
              No organization users yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {overview.topOrganizations.map((org, index) => (
                <div key={org.id} className="flex items-center gap-3 border-b border-gray-50 py-2 last:border-0">
                  <span className="w-4 shrink-0 text-xs font-bold text-gray-300">{index + 1}</span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">
                    {initials(org.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{org.name}</p>
                    <p className="text-xs font-semibold text-teal-600">{org.plan}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-800">{formatNumber(org.users)}</p>
                    <p className="text-[10px] text-gray-400">users</p>
                  </div>
                  {org.status === "suspended" ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      Suspended
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
