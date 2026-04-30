import type { ComponentType, ReactNode } from "react";
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
	Server,
	ShieldCheck,
	TriangleAlert,
	UsersRound,
	Zap,
} from "lucide-react";

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

const metrics: Array<{
	label: string;
	value: string;
	helper: string;
	trend: string;
	icon: IconComponent;
	iconClass: string;
	trendClass: string;
}> = [
	{
		label: "Organizations",
		value: "1,245",
		helper: "58 onboarded this quarter",
		trend: "+4.5%",
		icon: Building2,
		iconClass: "bg-teal-50 text-teal-700",
		trendClass: "bg-emerald-50 text-emerald-700",
	},
	{
		label: "Active Tenants",
		value: "1,102",
		helper: "92% tenant activation",
		trend: "+3.1%",
		icon: ShieldCheck,
		iconClass: "bg-sky-50 text-sky-700",
		trendClass: "bg-emerald-50 text-emerald-700",
	},
	{
		label: "Total Users",
		value: "24,860",
		helper: "Across all institutions",
		trend: "+8.2%",
		icon: UsersRound,
		iconClass: "bg-violet-50 text-violet-700",
		trendClass: "bg-emerald-50 text-emerald-700",
	},
	{
		label: "System Health",
		value: "98.7%",
		helper: "All core services online",
		trend: "Stable",
		icon: Activity,
		iconClass: "bg-amber-50 text-amber-700",
		trendClass: "bg-amber-50 text-amber-700",
	},
	{
		label: "Platform Uptime",
		value: "99.98%",
		helper: "Last 30 days",
		trend: "+0.2%",
		icon: Gauge,
		iconClass: "bg-rose-50 text-rose-700",
		trendClass: "bg-emerald-50 text-emerald-700",
	},
];

const teachingLoadData = [
	{ subject: "CS", overload: 10, standard: 45 },
	{ subject: "Math", overload: 12, standard: 50 },
	{ subject: "Physics", overload: 8, standard: 32 },
	{ subject: "Biology", overload: 9, standard: 40 },
	{ subject: "English", overload: 7, standard: 48 },
	{ subject: "History", overload: 5, standard: 30 },
];

const pipeline = [
	{ label: "Demo Requests", value: 84, color: "bg-teal-600" },
	{ label: "Contacted", value: 61, color: "bg-sky-500" },
	{ label: "Scheduled", value: 38, color: "bg-violet-500" },
	{ label: "Converted", value: 22, color: "bg-emerald-500" },
];

const recentOrganizations = [
	{ name: "Cebu Institute of Technology", plan: "Premium", users: 1280, status: "Active" },
	{ name: "Metro State University", plan: "Diamond", users: 980, status: "Active" },
	{ name: "Pacific Technical College", plan: "Basic", users: 310, status: "Trial" },
	{ name: "Greenfield High School", plan: "Starter", users: 45, status: "Review" },
];

const systemChecks = [
	{ label: "API Gateway", value: "Operational", icon: Server },
	{ label: "Auth Services", value: "Operational", icon: ShieldCheck },
	{ label: "Demo Queue", value: "6 pending", icon: Inbox },
];

const priorityItems = [
	{ title: "Review pending demo requests", meta: "12 waiting for first contact", tone: "text-amber-700 bg-amber-50" },
	{ title: "Subscription renewals", meta: "8 plans renew this week", tone: "text-sky-700 bg-sky-50" },
	{ title: "Inactive tenants", meta: "3 accounts need follow-up", tone: "text-rose-700 bg-rose-50" },
];

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

function MetricCard({ metric }: { metric: (typeof metrics)[number] }) {
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
					{subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
				</div>
				{action}
			</div>
			<div className="p-5">{children}</div>
		</section>
	);
}

function TeachingLoadChart() {
	const max = Math.max(...teachingLoadData.map((item) => Math.max(item.overload, item.standard)));

	return (
		<div>
			<div className="mb-5 flex flex-wrap items-center gap-4">
				<span className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
					<span className="h-2.5 w-2.5 rounded-sm bg-teal-500" />
					Overload
				</span>
				<span className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
					<span className="h-2.5 w-2.5 rounded-sm bg-slate-700" />
					Standard
				</span>
			</div>
			<div className="flex h-56 items-end gap-4">
				{teachingLoadData.map((item) => (
					<div key={item.subject} className="flex min-w-0 flex-1 flex-col items-center gap-2">
						<div className="flex h-44 w-full items-end justify-center gap-1 rounded-md bg-gray-50 px-2 pt-3">
							<div
								className="w-full max-w-5 rounded-t bg-teal-500"
								style={{ height: `${(item.overload / max) * 100}%`, minHeight: 8 }}
								title={`${item.overload} overload loads`}
							/>
							<div
								className="w-full max-w-5 rounded-t bg-slate-700"
								style={{ height: `${(item.standard / max) * 100}%`, minHeight: 8 }}
								title={`${item.standard} standard loads`}
							/>
						</div>
						<span className="text-xs font-semibold text-gray-500">{item.subject}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function PipelineProgress() {
	const max = pipeline[0].value;

	return (
		<div className="space-y-4">
			{pipeline.map((item) => (
				<div key={item.label}>
					<div className="mb-2 flex items-center justify-between gap-3">
						<span className="text-sm font-medium text-gray-700">{item.label}</span>
						<span className="text-sm font-bold text-gray-950">{item.value}</span>
					</div>
					<div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
						<div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / max) * 100}%` }} />
					</div>
				</div>
			))}
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const statusClass =
		status === "Active"
			? "border-emerald-200 bg-emerald-50 text-emerald-700"
			: status === "Trial"
				? "border-sky-200 bg-sky-50 text-sky-700"
				: "border-amber-200 bg-amber-50 text-amber-700";

	return (
		<span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}>
			{status}
		</span>
	);
}

export default function SuperAdminDashboard({ onNavigate }: SuperAdminDashboardProps) {
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
						<p className="mt-1 text-sm text-gray-500">Platform activity, tenant health, and operating priorities.</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
							<CalendarDays size={15} />
							April 2026
						</span>
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
						title="Teaching Load Trends"
						subtitle="Standard and overload distribution by subject"
						className="xl:col-span-8"
						action={
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
								<ArrowUpRight size={13} />
								+6.4%
							</span>
						}
					>
						<TeachingLoadChart />
					</Panel>

					<Panel title="System Health" subtitle="Operational status" className="xl:col-span-4">
						<div className="rounded-lg bg-slate-950 p-5 text-white">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase text-teal-200">Health score</p>
									<p className="mt-2 text-4xl font-bold">98.7%</p>
								</div>
								<div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
									<Gauge size={24} />
								</div>
							</div>
							<div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
								<div className="h-full w-[98%] rounded-full bg-teal-400" />
							</div>
						</div>

						<div className="mt-4 space-y-3">
							{systemChecks.map((check) => {
								const Icon = check.icon;
								return (
									<div key={check.label} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
										<div className="flex min-w-0 items-center gap-3">
											<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
												<Icon size={17} />
											</span>
											<span className="truncate text-sm font-semibold text-gray-800">{check.label}</span>
										</div>
										<span className="shrink-0 text-xs font-medium text-gray-500">{check.value}</span>
									</div>
								);
							})}
						</div>
					</Panel>

					<Panel title="Conversion Pipeline" subtitle="Demo request movement" className="xl:col-span-5">
						<PipelineProgress />
						<div className="mt-5 grid grid-cols-2 gap-3">
							<div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
								<p className="text-xl font-bold text-gray-950">26.2%</p>
								<p className="mt-1 text-xs text-gray-500">Conversion rate</p>
							</div>
							<div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
								<p className="text-xl font-bold text-gray-950">2.4 days</p>
								<p className="mt-1 text-xs text-gray-500">Avg. response time</p>
							</div>
						</div>
					</Panel>

					<Panel title="Recent Organizations" subtitle="Latest tenant activity" className="xl:col-span-7">
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
									{recentOrganizations.map((org) => (
										<tr key={org.name}>
											<td className="py-3">
												<div className="flex items-center gap-3">
													<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">
														{org.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}
													</div>
													<span className="font-semibold text-gray-800">{org.name}</span>
												</div>
											</td>
											<td className="py-3 text-sm text-gray-600">{org.plan}</td>
											<td className="py-3 text-right text-sm font-bold text-gray-900">{org.users.toLocaleString()}</td>
											<td className="py-3 text-right">
												<StatusBadge status={org.status} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
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
								No critical incidents
							</span>
							<span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
								<Clock size={15} />
								Last sync 4 min ago
							</span>
						</div>
					</Panel>
				</div>
			</div>
		</div>
	);
}
