import React, { useState } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const weeklyLogins = [
	{ label: "Mon", value: 40 },
	{ label: "Tue", value: 55 },
	{ label: "Wed", value: 38 },
	{ label: "Thu", value: 60 },
	{ label: "Fri", value: 48 },
	{ label: "Sat", value: 30 },
	{ label: "Sun", value: 20 },
];

const monthlyGrowth = [
	{ label: "Oct", orgs: 4, demos: 8 },
	{ label: "Nov", orgs: 6, demos: 12 },
	{ label: "Dec", orgs: 5, demos: 9 },
	{ label: "Jan", orgs: 9, demos: 15 },
	{ label: "Feb", orgs: 11, demos: 18 },
	{ label: "Mar", orgs: 14, demos: 22 },
];

const planDistribution = [
	{ label: "Starter", value: 12, color: "#9ca3af" },
	{ label: "Basic", value: 28, color: "#14b8a6" },
	{ label: "Premium", value: 18, color: "#d946ef" },
	{ label: "Diamond", value: 7, color: "#0ea5e9" },
];

const recentActivity = [
	{ action: "New org converted", name: "Cebu Institute of Technology", time: "2 min ago", type: "convert" },
	{ action: "Demo request submitted", name: "Pacific Tech College", time: "18 min ago", type: "demo" },
	{ action: "Plan upgraded", name: "Metro State University", time: "1 hr ago", type: "upgrade" },
	{ action: "Account suspended", name: "Greenfield High School", time: "3 hrs ago", type: "suspend" },
	{ action: "New demo request", name: "Valley Community College", time: "5 hrs ago", type: "demo" },
];

const topOrgs = [
	{ name: "Metro State University", plan: "Diamond", users: 980, status: "active" },
	{ name: "Valley Community College", plan: "Premium", users: 640, status: "active" },
	{ name: "Pacific Technical College", plan: "Basic", users: 310, status: "active" },
	{ name: "Sunrise Academy", plan: "Basic", users: 210, status: "active" },
	{ name: "Greenfield High School", plan: "Starter", users: 45, status: "suspended" },
];

const conversionFunnel = [
	{ label: "Demo Requests", value: 84, color: "#14b8a6" },
	{ label: "Contacted", value: 61, color: "#0ea5e9" },
	{ label: "Scheduled", value: 38, color: "#d946ef" },
	{ label: "Converted", value: 22, color: "#10b981" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
	users: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	logins: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	orgs: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M3 21h18M6 21V10m12 11V10M2 10l10-7 10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	revenue: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	demos: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	trend_up: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 6h6v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	trend_down: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M23 18l-9.5-9.5-5 5L1 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 18h6v-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const activityIcon: Record<string, { icon: string; bg: string; text: string }> = {
	convert: { icon: "⭐", bg: "bg-teal-100", text: "text-teal-700" },
	demo: { icon: "📋", bg: "bg-blue-100", text: "text-blue-700" },
	upgrade: { icon: "🚀", bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
	suspend: { icon: "⛔", bg: "bg-red-100", text: "text-red-700" },
};

const planColor: Record<string, string> = {
	Starter: "text-gray-500",
	Basic: "text-teal-600",
	Premium: "text-fuchsia-600",
	Diamond: "text-sky-500",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, trend, trendLabel, color }: {
	label: string;
	value: string;
	icon: React.ReactNode;
	trend: "up" | "down" | "neutral";
	trendLabel: string;
	color: string;
}) {
	return (
		<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 flex-1 min-w-[180px]">
			<div className="flex items-center justify-between">
				<span className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
					{icon}
				</span>
				<span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
					${trend === "up" ? "bg-green-50 text-green-600" : trend === "down" ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"}`}>
					{trend === "up" ? Icons.trend_up : trend === "down" ? Icons.trend_down : null}
					{trendLabel}
				</span>
			</div>
			<div>
				<p className="text-2xl font-bold text-gray-900">{value}</p>
				<p className="text-xs text-gray-400 mt-0.5">{label}</p>
			</div>
		</div>
	);
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function LoginBarChart() {
	const max = Math.max(...weeklyLogins.map(d => d.value));
	return (
		<div className="flex items-end gap-2 h-36 w-full">
			{weeklyLogins.map(d => (
				<div key={d.label} className="flex flex-col items-center gap-1 flex-1">
					<span className="text-[10px] text-gray-400 font-medium">{d.value}</span>
					<div
						className="w-full rounded-t-lg bg-teal-500 transition-all"
						style={{ height: `${(d.value / max) * 100}%`, minHeight: 4 }}
					/>
					<span className="text-[10px] text-gray-400">{d.label}</span>
				</div>
			))}
		</div>
	);
}

// ─── Multi-Bar Chart ──────────────────────────────────────────────────────────
function GrowthChart() {
	const maxOrgs = Math.max(...monthlyGrowth.map(d => d.orgs));
	const maxDemos = Math.max(...monthlyGrowth.map(d => d.demos));
	const max = Math.max(maxOrgs, maxDemos);
	return (
		<div className="flex items-end gap-3 h-36 w-full">
			{monthlyGrowth.map(d => (
				<div key={d.label} className="flex flex-col items-center gap-1 flex-1">
					<div className="flex items-end gap-0.5 w-full" style={{ height: 112 }}>
						<div
							className="flex-1 rounded-t-md bg-teal-500 transition-all"
							style={{ height: `${(d.orgs / max) * 100}%`, minHeight: 4 }}
						/>
						<div
							className="flex-1 rounded-t-md bg-fuchsia-400 transition-all"
							style={{ height: `${(d.demos / max) * 100}%`, minHeight: 4 }}
						/>
					</div>
					<span className="text-[10px] text-gray-400">{d.label}</span>
				</div>
			))}
		</div>
	);
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart() {
	const total = planDistribution.reduce((s, d) => s + d.value, 0);
	let offset = 0;
	const r = 54;
	const cx = 70;
	const cy = 70;
	const circumference = 2 * Math.PI * r;

	return (
		<div className="flex items-center gap-6">
			<svg width={140} height={140} viewBox="0 0 140 140">
				<circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={18} />
				{planDistribution.map((d) => {
					const pct = d.value / total;
					const dash = pct * circumference;
					const gap = circumference - dash;
					const rotate = (offset / total) * 360 - 90;
					offset += d.value;
					return (
						<circle
							key={d.label}
							cx={cx} cy={cy} r={r}
							fill="none"
							stroke={d.color}
							strokeWidth={18}
							strokeDasharray={`${dash} ${gap}`}
							strokeDashoffset={0}
							transform={`rotate(${rotate} ${cx} ${cy})`}
							strokeLinecap="butt"
						/>
					);
				})}
				<text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#111">{total}</text>
				<text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#9ca3af">Total Orgs</text>
			</svg>
			<div className="flex flex-col gap-2">
				{planDistribution.map(d => (
					<div key={d.label} className="flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
						<span className="text-xs text-gray-600">{d.label}</span>
						<span className="text-xs font-bold text-gray-800 ml-auto pl-3">{d.value}</span>
						<span className="text-[10px] text-gray-400">({Math.round(d.value / total * 100)}%)</span>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Funnel Chart ─────────────────────────────────────────────────────────────
function FunnelChart() {
	const max = conversionFunnel[0].value;
	return (
		<div className="flex flex-col gap-2 w-full">
			{conversionFunnel.map((d, i) => (
				<div key={d.label} className="flex items-center gap-3">
					<span className="text-xs text-gray-500 w-28 shrink-0">{d.label}</span>
					<div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
						<div
							className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
							style={{ width: `${(d.value / max) * 100}%`, background: d.color }}
						>
							<span className="text-[11px] font-bold text-white">{d.value}</span>
						</div>
					</div>
					{i < conversionFunnel.length - 1 && (
						<span className="text-[10px] text-gray-400 w-10 text-right shrink-0">
							↓ {Math.round((conversionFunnel[i + 1].value / d.value) * 100)}%
						</span>
					)}
				</div>
			))}
		</div>
	);
}

// ─── Card Wrapper ─────────────────────────────────────────────────────────────
function Card({ title, subtitle, children, className = "" }: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col ${className}`}>
			<div className="px-5 py-4 border-b border-gray-100">
				<p className="text-sm font-bold text-gray-800">{title}</p>
				{subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
			</div>
			<div className="px-5 py-4 flex-1">{children}</div>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
	const [period, setPeriod] = useState<"week" | "month" | "year">("week");

	return (
		<div className="w-full px-8 py-6">
			{/* Header */}
			<div className="border-b border-teal-200 mb-6 flex items-center justify-between pb-2">
				<h1 className="text-2xl font-bold text-teal-800">ANALYTICS</h1>
				<div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
					{(["week", "month", "year"] as const).map(p => (
						<button
							key={p}
							className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize
								${period === p ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
							onClick={() => setPeriod(p)}
						>
							{p}
						</button>
					))}
				</div>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<StatCard
					label="Total Active Users"
					value="3,200"
					icon={Icons.users}
					trend="up"
					trendLabel="+12%"
					color="bg-teal-50 text-teal-600"
				/>
				<StatCard
					label="Logins Today"
					value="450"
					icon={Icons.logins}
					trend="up"
					trendLabel="+8%"
					color="bg-blue-50 text-blue-600"
				/>
				<StatCard
					label="Active Organizations"
					value="65"
					icon={Icons.orgs}
					trend="up"
					trendLabel="+14"
					color="bg-fuchsia-50 text-fuchsia-600"
				/>
				<StatCard
					label="Monthly Revenue"
					value="$18,420"
					icon={Icons.revenue}
					trend="up"
					trendLabel="+22%"
					color="bg-emerald-50 text-emerald-600"
				/>
			</div>

			{/* Row 2 — Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
				<Card title="Daily Logins" subtitle="This week" className="lg:col-span-1">
					<LoginBarChart />
				</Card>

				<Card title="Org & Demo Growth" subtitle="Last 6 months" className="lg:col-span-2">
					<div className="flex items-center gap-4 mb-3">
						<span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block" /> New Orgs</span>
						<span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-fuchsia-400 inline-block" /> Demo Requests</span>
					</div>
					<GrowthChart />
				</Card>
			</div>

			{/* Row 3 */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
				<Card title="Plan Distribution" subtitle="Organizations by plan">
					<DonutChart />
				</Card>

				<Card title="Conversion Funnel" subtitle="Demo → Customer pipeline" className="lg:col-span-2">
					<FunnelChart />
					<div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-6">
						<div className="text-center">
							<p className="text-lg font-bold text-gray-900">26.2%</p>
							<p className="text-xs text-gray-400">Overall Conversion Rate</p>
						</div>
						<div className="text-center">
							<p className="text-lg font-bold text-gray-900">84</p>
							<p className="text-xs text-gray-400">Total Demo Requests</p>
						</div>
						<div className="text-center">
							<p className="text-lg font-bold text-teal-600">22</p>
							<p className="text-xs text-gray-400">Successfully Converted</p>
						</div>
						<div className="text-center">
							<p className="text-lg font-bold text-red-500">18</p>
							<p className="text-xs text-gray-400">Rejected</p>
						</div>
					</div>
				</Card>
			</div>

			{/* Row 4 */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Recent Activity */}
				<Card title="Recent Activity" subtitle="Latest platform events">
					<div className="flex flex-col gap-2">
						{recentActivity.map((a, i) => {
							const style = activityIcon[a.type] || activityIcon.demo;
							return (
								<div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
									<span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${style.bg}`}>
										{style.icon}
									</span>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
										<p className="text-xs text-gray-400">{a.action}</p>
									</div>
									<span className="text-[11px] text-gray-400 shrink-0">{a.time}</span>
								</div>
							);
						})}
					</div>
				</Card>

				{/* Top Organizations */}
				<Card title="Top Organizations" subtitle="By active users">
					<div className="flex flex-col gap-2">
						{topOrgs.map((org, i) => (
							<div key={org.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
								<span className="text-xs font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
								<div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
									{org.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-800 truncate">{org.name}</p>
									<p className={`text-xs font-semibold ${planColor[org.plan]}`}>{org.plan}</p>
								</div>
								<div className="text-right shrink-0">
									<p className="text-sm font-bold text-gray-800">{org.users.toLocaleString()}</p>
									<p className="text-[10px] text-gray-400">users</p>
								</div>
								{org.status === "suspended" && (
									<span className="text-[10px] bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">Suspended</span>
								)}
							</div>
						))}
					</div>
				</Card>
			</div>
		</div>
	);
}