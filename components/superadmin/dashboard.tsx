"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Gauge,
  Inbox,
  RefreshCw,
  Server,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
  Zap,
} from "lucide-react";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import { fetchSuperadminOverview } from "@/lib/superadminOverviewClient";
import type {
  SuperadminOverviewHealthCheck,
  SuperadminOverviewPayload,
} from "@/lib/superadminOverviewTypes";

type DashboardNavKey =
  | "organizations"
  | "subscription"
  | "demorequests"
  | "analytics"
  | "activitylogs"
  | "settings";

type SuperAdminDashboardProps = {
  onNavigate?: (key: DashboardNavKey) => void;
};

type IconComponent = ComponentType<{
  className?: string;
  size?: number;
  strokeWidth?: number;
}>;

type Metric = {
  label: string;
  value: string;
  helper: string;
  trend: string;
  icon: IconComponent;
  iconClass: string;
  trendClass: string;
};

const quickActions: Array<{
  label: string;
  description: string;
  key: DashboardNavKey;
  icon: IconComponent;
}> = [
  { label: "Demo Requests", description: "Review and convert pipeline leads", key: "demorequests", icon: Inbox },
  { label: "Organizations", description: "Manage institution accounts", key: "organizations", icon: Building2 },
  { label: "Analytics", description: "Inspect usage and growth", key: "analytics", icon: BarChart3 },
  { label: "Subscriptions", description: "Check plans and billing status", key: "subscription", icon: CreditCard },
];

const formatNumber = (value: number) => value.toLocaleString("en-US");

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatGeneratedMonth = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
};

const formatTimeAgo = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const minutes = Math.max(0, Math.floor(diffMs / 60000));
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

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${metric.iconClass}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${metric.trendClass}`}>
          {metric.trend}
        </span>
      </div>
      <div className="mt-5">
        <p className="text-2xl font-bold text-gray-950">{metric.value}</p>
        <p className="mt-1 text-sm font-semibold text-gray-700">{metric.label}</p>
        <p className="mt-1 text-xs text-gray-500">{metric.helper}</p>
      </div>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ActivityChart({ data }: { data: SuperadminOverviewPayload["activityBuckets"] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  if (data.every((item) => item.value === 0)) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        No activity recorded for this period.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal-500" />
          Activity logs
        </span>
      </div>
      <div className="flex h-56 items-end gap-4">
        {data.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end justify-center rounded-md bg-gray-50 px-2 pt-3">
              <div
                className="w-full max-w-8 rounded-t bg-teal-500"
                style={{ height: `${(item.value / max) * 100}%`, minHeight: 8 }}
                title={`${item.value} activities`}
              />
            </div>
            <span className="text-xs font-semibold text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineProgress({ data }: { data: SuperadminOverviewPayload["pipeline"] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.status}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <span className="text-sm font-bold text-gray-950">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const statusClass =
    normalized === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "suspended" || normalized === "rejected"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}>
      {status}
    </span>
  );
}

function HealthCheckRow({ check }: { check: SuperadminOverviewHealthCheck }) {
  const Icon = check.status === "warning" ? TriangleAlert : check.status === "info" ? Inbox : Server;
  const tone =
    check.status === "warning"
      ? "text-amber-700"
      : check.status === "info"
        ? "text-sky-700"
        : "text-teal-700";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ${tone}`}>
          <Icon size={17} />
        </span>
        <span className="truncate text-sm font-semibold text-gray-800">{check.label}</span>
      </div>
      <span className="shrink-0 text-xs font-medium text-gray-500">{check.value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  const skeletonMetrics = [
    {
      label: "Organizations",
      helper: "added this week",
      trend: "+",
      icon: Building2,
      iconClass: "bg-teal-50 text-teal-700",
    },
    {
      label: "Active Tenants",
      helper: "tenant activation",
      trend: "suspended",
      icon: ShieldCheck,
      iconClass: "bg-sky-50 text-sky-700",
    },
    {
      label: "Total Users",
      helper: "active tenant users",
      trend: "+",
      icon: UsersRound,
      iconClass: "bg-violet-50 text-violet-700",
    },
    {
      label: "Demo Requests",
      helper: "pending review",
      trend: "converted",
      icon: Inbox,
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      label: "Health Checks",
      helper: "Database, auth, and email config",
      trend: "Ready",
      icon: Gauge,
      iconClass: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-teal-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Zap size={14} />
              Live overview
            </div>
            <h1 className="text-2xl font-bold text-gray-950">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Real platform activity, tenant health, and operating priorities.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
              <CalendarDays size={15} />
              {formatGeneratedMonth()}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
              <RefreshCw size={15} />
              Refresh
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white shadow-sm">
              <BarChart3 size={15} />
              View Analytics
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {skeletonMetrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${metric.iconClass}`}>
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    {metric.trend}
                  </span>
                </div>
                <div className="mt-5 animate-pulse">
                  <BrandedSkeletonBlock className="h-7 w-14" strong />
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-700">{metric.label}</p>
                <p className="mt-1 text-xs text-gray-500">{metric.helper}</p>
              </article>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <Panel
            title="Platform Activity"
            subtitle="Activity log volume for the last 7 days"
            className="xl:col-span-8"
            action={
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                <ArrowUpRight size={13} />
                events
              </span>
            }
          >
            <div className="mb-5 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                <span className="h-2.5 w-2.5 rounded-sm bg-teal-500" />
                Activity logs
              </span>
            </div>
            <div className="flex h-56 items-end gap-4">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                <div key={day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end justify-center rounded-md bg-gray-50 px-2 pt-3">
                    <BrandedSkeletonBlock
                      className={`w-full max-w-8 rounded-t ${index === 3 ? "h-36" : index === 4 ? "h-20" : "h-12"}`}
                      strong={index === 3}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{day}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="System Health" subtitle="Derived checks, not uptime" className="xl:col-span-4">
            <div className="rounded-lg bg-slate-950 p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-teal-200">Health checks</p>
                  <div className="mt-3 animate-pulse">
                    <BrandedSkeletonBlock className="h-10 w-20 bg-white/30" strong />
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                  <Gauge size={24} />
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-4/5 rounded-full bg-teal-400" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {["Database", "Superadmin Auth", "Email Config"].map((label) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
                      <Server size={17} />
                    </span>
                    <span className="truncate text-sm font-semibold text-gray-800">{label}</span>
                  </div>
                  <BrandedSkeletonBlock className="h-3 w-16" />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Conversion Pipeline" subtitle="Demo request status counts" className="xl:col-span-5">
            <div className="space-y-4">
              {["Pending", "Converted", "Rejected"].map((label, index) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <BrandedSkeletonBlock className="h-4 w-8" />
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <BrandedSkeletonBlock className={index === 0 ? "h-full w-3/4 rounded-full" : "h-full w-1/2 rounded-full"} strong />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Organizations" subtitle="Latest tenant records" className="xl:col-span-7">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="text-xs font-semibold uppercase text-gray-400">
                    <th className="pb-3">Organization</th>
                    <th className="pb-3">Plan</th>
                    <th className="pb-3 text-right">Users</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[0, 1, 2].map((row) => (
                    <tr key={row}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <BrandedSkeletonBlock className="h-9 w-9 rounded-lg" strong />
                          <BrandedSkeletonBlock className="h-4 w-44" />
                        </div>
                      </td>
                      <td className="py-3">
                        <BrandedSkeletonBlock className="h-4 w-20" />
                      </td>
                      <td className="py-3">
                        <BrandedSkeletonBlock className="ml-auto h-4 w-10" />
                      </td>
                      <td className="py-3">
                        <BrandedSkeletonBlock className="ml-auto h-5 w-16 rounded-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Priority Queue" subtitle="Items that need attention" className="xl:col-span-4">
            <div className="space-y-3">
              {["Review pending demo requests", "Configure Gmail sender"].map((label) => (
                <div key={label} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <TriangleAlert size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                      <BrandedSkeletonBlock className="mt-2 h-3 w-36" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Quick Actions" subtitle="Common super admin workflows" className="xl:col-span-8">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.key}
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                        <Icon size={19} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{action.label}</p>
                        <p className="mt-1 truncate text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                    <ArrowRight size={17} className="shrink-0 text-gray-400" />
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function DashboardFullSkeleton() {
  const metricIcons = [
    { icon: Building2, iconClass: "bg-teal-50 text-teal-700" },
    { icon: ShieldCheck, iconClass: "bg-sky-50 text-sky-700" },
    { icon: UsersRound, iconClass: "bg-violet-50 text-violet-700" },
    { icon: Inbox, iconClass: "bg-amber-50 text-amber-700" },
    { icon: Gauge, iconClass: "bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="w-full px-4 py-5 sm:px-6 lg:px-8" role="status" aria-label="Loading dashboard">
      <span className="sr-only">Loading dashboard</span>
      <div className="mx-auto max-w-[1400px] space-y-6 animate-pulse">
        <header className="flex flex-col gap-4 border-b border-teal-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <BrandedSkeletonBlock className="mb-2 h-7 w-36 rounded-full" />
            <BrandedSkeletonBlock className="h-8 w-40" strong />
            <BrandedSkeletonBlock className="mt-2 h-4 w-[420px] max-w-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BrandedSkeletonBlock className="h-10 w-28 rounded-lg" />
            <BrandedSkeletonBlock className="h-10 w-24 rounded-lg" />
            <BrandedSkeletonBlock className="h-10 w-36 rounded-lg" strong />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metricIcons.map(({ icon: Icon, iconClass }) => (
            <article key={iconClass} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <BrandedSkeletonBlock className="h-6 w-20 rounded-full" />
              </div>
              <BrandedSkeletonBlock className="mt-5 h-7 w-14" strong />
              <BrandedSkeletonBlock className="mt-2 h-4 w-28" />
              <BrandedSkeletonBlock className="mt-2 h-3 w-36" />
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <section className="rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-8">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div>
                <BrandedSkeletonBlock className="h-4 w-36" strong />
                <BrandedSkeletonBlock className="mt-2 h-3 w-56" />
              </div>
              <BrandedSkeletonBlock className="h-6 w-24 rounded-full" />
            </div>
            <div className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <BrandedSkeletonBlock className="h-3 w-3 rounded-sm" strong />
                <BrandedSkeletonBlock className="h-3 w-24" />
              </div>
              <div className="flex h-56 items-end gap-4">
                {["h-12", "h-20", "h-8", "h-40", "h-28", "h-8", "h-10"].map((height, index) => (
                  <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-44 w-full items-end justify-center rounded-md bg-gray-50 px-2 pt-3">
                      <BrandedSkeletonBlock className={`w-full max-w-8 rounded-t ${height}`} strong={index === 3} />
                    </div>
                    <BrandedSkeletonBlock className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-4">
            <div className="border-b border-gray-100 px-5 py-4">
              <BrandedSkeletonBlock className="h-4 w-28" strong />
              <BrandedSkeletonBlock className="mt-2 h-3 w-40" />
            </div>
            <div className="p-5">
              <div className="rounded-lg bg-slate-950 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <BrandedSkeletonBlock className="h-3 w-28 bg-white/30" />
                    <BrandedSkeletonBlock className="mt-3 h-10 w-20 bg-white/30" strong />
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                    <Gauge size={24} />
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-4/5 rounded-full bg-teal-400" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <BrandedSkeletonBlock className="h-8 w-8 rounded-lg" />
                      <BrandedSkeletonBlock className="h-4 w-36" />
                    </div>
                    <BrandedSkeletonBlock className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-5">
            <div className="border-b border-gray-100 px-5 py-4">
              <BrandedSkeletonBlock className="h-4 w-36" strong />
              <BrandedSkeletonBlock className="mt-2 h-3 w-44" />
            </div>
            <div className="space-y-4 p-5">
              {[0, 1, 2].map((item) => (
                <div key={item}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <BrandedSkeletonBlock className="h-4 w-24" />
                    <BrandedSkeletonBlock className="h-4 w-8" />
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <BrandedSkeletonBlock className={item === 0 ? "h-full w-3/4 rounded-full" : "h-full w-1/2 rounded-full"} strong />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-7">
            <div className="border-b border-gray-100 px-5 py-4">
              <BrandedSkeletonBlock className="h-4 w-40" strong />
              <BrandedSkeletonBlock className="mt-2 h-3 w-32" />
            </div>
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr>
                    {[0, 1, 2, 3].map((head) => (
                      <th key={head} className="pb-3">
                        <BrandedSkeletonBlock className="h-3 w-24" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[0, 1, 2].map((row) => (
                    <tr key={row}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <BrandedSkeletonBlock className="h-9 w-9 rounded-lg" strong />
                          <BrandedSkeletonBlock className="h-4 w-44" />
                        </div>
                      </td>
                      <td className="py-3"><BrandedSkeletonBlock className="h-4 w-20" /></td>
                      <td className="py-3"><BrandedSkeletonBlock className="ml-auto h-4 w-10" /></td>
                      <td className="py-3"><BrandedSkeletonBlock className="ml-auto h-5 w-16 rounded-full" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-4">
            <div className="border-b border-gray-100 px-5 py-4">
              <BrandedSkeletonBlock className="h-4 w-28" strong />
              <BrandedSkeletonBlock className="mt-2 h-3 w-40" />
            </div>
            <div className="space-y-3 p-5">
              {[0, 1].map((item) => (
                <div key={item} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <BrandedSkeletonBlock className="h-8 w-8 rounded-lg" />
                    <div>
                      <BrandedSkeletonBlock className="h-4 w-44" strong />
                      <BrandedSkeletonBlock className="mt-2 h-3 w-36" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-8">
            <div className="border-b border-gray-100 px-5 py-4">
              <BrandedSkeletonBlock className="h-4 w-28" strong />
              <BrandedSkeletonBlock className="mt-2 h-3 w-48" />
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <BrandedSkeletonBlock className="h-10 w-10 rounded-lg" />
                    <div>
                      <BrandedSkeletonBlock className="h-4 w-32" strong />
                      <BrandedSkeletonBlock className="mt-2 h-3 w-44" />
                    </div>
                  </div>
                  <BrandedSkeletonBlock className="h-4 w-4" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard({ onNavigate }: SuperAdminDashboardProps) {
  const [overview, setOverview] = useState<SuperadminOverviewPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const payload = await fetchSuperadminOverview("week");
      setOverview(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const metrics = useMemo<Metric[]>(() => {
    if (!overview) return [];

    const { summary } = overview;

    return [
      {
        label: "Organizations",
        value: formatNumber(summary.totalOrganizations),
        helper: `${formatNumber(summary.newOrganizationsInPeriod)} added this week`,
        trend: `+${formatNumber(summary.newOrganizationsInPeriod)}`,
        icon: Building2,
        iconClass: "bg-teal-50 text-teal-700",
        trendClass: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Active Tenants",
        value: formatNumber(summary.activeOrganizations),
        helper: `${summary.totalOrganizations ? Math.round((summary.activeOrganizations / summary.totalOrganizations) * 100) : 0}% tenant activation`,
        trend: `${summary.suspendedOrganizations} suspended`,
        icon: ShieldCheck,
        iconClass: "bg-sky-50 text-sky-700",
        trendClass:
          summary.suspendedOrganizations > 0
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Total Users",
        value: formatNumber(summary.totalUsers),
        helper: `${formatNumber(summary.activeUsers)} active tenant users`,
        trend: `+${formatNumber(summary.newUsersInPeriod)}`,
        icon: UsersRound,
        iconClass: "bg-violet-50 text-violet-700",
        trendClass: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Demo Requests",
        value: formatNumber(summary.totalDemoRequests),
        helper: `${formatNumber(summary.pendingDemoRequests)} pending review`,
        trend: `${summary.conversionRate}% converted`,
        icon: Inbox,
        iconClass: "bg-amber-50 text-amber-700",
        trendClass: "bg-teal-50 text-teal-700",
      },
      {
        label: "Health Checks",
        value: summary.healthScore,
        helper: "Database, auth, and email config",
        trend: summary.emailConfigured ? "Ready" : "Email setup",
        icon: Gauge,
        iconClass: "bg-rose-50 text-rose-700",
        trendClass: summary.emailConfigured
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700",
      },
    ];
  }, [overview]);

  const priorityItems = useMemo(() => {
    if (!overview) return [];

    const { summary } = overview;
    const items = [];

    if (summary.pendingDemoRequests > 0) {
      items.push({
        title: "Review pending demo requests",
        meta: `${summary.pendingDemoRequests} waiting for action`,
        tone: "text-amber-700 bg-amber-50",
      });
    }

    if (!summary.emailConfigured) {
      items.push({
        title: "Configure Gmail sender",
        meta: "Account emails need Gmail env vars",
        tone: "text-rose-700 bg-rose-50",
      });
    }

    if (summary.suspendedOrganizations > 0) {
      items.push({
        title: "Suspended organizations",
        meta: `${summary.suspendedOrganizations} tenant accounts suspended`,
        tone: "text-sky-700 bg-sky-50",
      });
    }

    return items.length > 0
      ? items
      : [
          {
            title: "No urgent priorities",
            meta: "Dashboard checks are clear",
            tone: "text-emerald-700 bg-emerald-50",
          },
        ];
  }, [overview]);

  if (isLoading) {
    return <DashboardFullSkeleton />;
  }

  if (error || !overview) {
    return (
      <div className="flex min-h-[420px] items-center justify-center px-6 py-8">
        <div className="max-w-md rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-600">{error || "Dashboard data is unavailable."}</p>
          <button
            type="button"
            onClick={() => void loadOverview()}
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
    <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-teal-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Zap size={14} />
              Live overview
            </div>
            <h1 className="text-2xl font-bold text-gray-950">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Real platform activity, tenant health, and operating priorities.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
              <CalendarDays size={15} />
              {formatGeneratedMonth(overview.generatedAt)}
            </span>
            <button
              type="button"
              onClick={() => void loadOverview()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("analytics")}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              <BarChart3 size={15} />
              View Analytics
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <Panel
            title="Platform Activity"
            subtitle="Activity log volume for the last 7 days"
            className="xl:col-span-8"
            action={
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                <ArrowUpRight size={13} />
                {formatNumber(overview.summary.activityCountInPeriod)} events
              </span>
            }
          >
            <ActivityChart data={overview.activityBuckets} />
          </Panel>

          <Panel title="System Health" subtitle="Derived checks, not uptime" className="xl:col-span-4">
            <div className="rounded-lg bg-slate-950 p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-teal-200">Health checks</p>
                  <p className="mt-2 text-4xl font-bold">{overview.summary.healthScore}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                  <Gauge size={24} />
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-teal-400"
                  style={{ width: `${overview.summary.healthPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {overview.healthChecks.map((check) => (
                <HealthCheckRow key={check.label} check={check} />
              ))}
            </div>
          </Panel>

          <Panel title="Conversion Pipeline" subtitle="Demo request status counts" className="xl:col-span-5">
            <PipelineProgress data={overview.pipeline} />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xl font-bold text-gray-950">{overview.summary.conversionRate}%</p>
                <p className="mt-1 text-xs text-gray-500">Conversion rate</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xl font-bold text-gray-950">{formatNumber(overview.summary.rejectedDemoRequests)}</p>
                <p className="mt-1 text-xs text-gray-500">Rejected requests</p>
              </div>
            </div>
          </Panel>

          <Panel title="Recent Organizations" subtitle="Latest tenant records" className="xl:col-span-7">
            {overview.recentOrganizations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
                No organizations yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="text-xs font-semibold uppercase text-gray-400">
                      <th className="pb-3">Organization</th>
                      <th className="pb-3">Plan</th>
                      <th className="pb-3 text-right">Users</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {overview.recentOrganizations.map((org) => (
                      <tr key={org.id}>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">
                              {initials(org.name)}
                            </div>
                            <span className="font-semibold text-gray-800">{org.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-gray-600">{org.plan}</td>
                        <td className="py-3 text-right text-sm font-bold text-gray-900">{formatNumber(org.users)}</td>
                        <td className="py-3 text-right">
                          <StatusBadge status={org.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Priority Queue" subtitle="Items that need attention" className="xl:col-span-4">
            <div className="space-y-3">
              {priorityItems.map((item) => (
                <div key={item.title} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.tone}`}>
                      <TriangleAlert size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.meta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Quick Actions" subtitle="Common super admin workflows" className="xl:col-span-8">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => onNavigate?.(action.key)}
                    className="group flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-teal-200 hover:bg-teal-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 group-hover:bg-white group-hover:text-teal-700">
                        <Icon size={19} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{action.label}</p>
                        <p className="mt-1 truncate text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                    <ArrowRight size={17} className="shrink-0 text-gray-400 group-hover:text-teal-700" />
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={15} />
                {overview.summary.healthScore} checks operational
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                <Clock size={15} />
                Updated {formatTimeAgo(overview.generatedAt)}
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
