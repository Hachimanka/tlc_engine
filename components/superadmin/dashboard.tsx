import { ICON_SVGS } from "@/public/icons";
import React from "react";

const stats = [
	{ label: "Organizations", value: 1245 },
	{ label: "Active Tenants", value: 1245 },
	{ label: "Total Users", value: 1245 },
	{ label: "System Health", value: 1245 },
	{ label: "Platform Uptime", value: 1245 },
];

const chartData = [
	{ subject: "CS", overload: 10, standard: 45 },
	{ subject: "Math", overload: 12, standard: 50 },
	{ subject: "Physics", overload: 8, standard: 32 },
	{ subject: "Biology", overload: 9, standard: 40 },
	{ subject: "English", overload: 7, standard: 48 },
	{ subject: "History", overload: 5, standard: 30 },
];

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 min-w-[200px] max-w-[240px] flex-1">
			<div className="flex items-center gap-2">
				<span className="text-2xl font-semibold">{value.toLocaleString()}</span>
				<span className="ml-auto" dangerouslySetInnerHTML={{ __html: ICON_SVGS.people }} />
			</div>
			<span className="text-gray-500 text-sm">{label}</span>
			<div className="flex items-center gap-1 mt-2">
				<span className="text-green-600 text-xs font-semibold">▲ +4.5%</span>
				<span className="text-xs text-gray-400">vs last semester</span>
			</div>
		</div>
	);
}

function BarChart({ data }: { data: typeof chartData }) {
	// Simple SVG bar chart for two series
	const max = Math.max(...data.map(d => Math.max(d.overload, d.standard)));
	return (
		<svg width={320} height={180} className="mx-auto">
			{/* X axis labels */}
			{data.map((d, i) => (
				<text key={d.subject} x={40 + i * 45} y={170} fontSize={12} textAnchor="middle" fill="#666">{d.subject}</text>
			))}
			{/* Bars */}
			{data.map((d, i) => (
				<g key={d.subject}>
					{/* Overload bar */}
					<rect x={30 + i * 45} y={160 - (d.overload / max) * 120} width={14} height={(d.overload / max) * 120} fill="#14b8a6" rx={3} />
					{/* Standard bar */}
					<rect x={46 + i * 45} y={160 - (d.standard / max) * 120} width={14} height={(d.standard / max) * 120} fill="#0f766e" rx={3} />
				</g>
			))}
			{/* Legend */}
			<rect x={80} y={10} width={14} height={14} fill="#14b8a6" rx={2} />
			<text x={100} y={22} fontSize={12} fill="#333">overload</text>
			<rect x={160} y={10} width={14} height={14} fill="#0f766e" rx={2} />
			<text x={180} y={22} fontSize={12} fill="#333">standard</text>
		</svg>
	);
}

export default function SuperAdminDashboard() {
	return (
		<div className="w-full px-8 py-6">
			<h1 className="text-2xl font-bold text-teal-800 mb-2">DASHBOARD</h1>
			<div className="border-b border-teal-200 mb-6" />
			<div className="flex flex-row gap-4 mb-8">
				{stats.map((stat) => (
					<StatCard key={stat.label} label={stat.label} value={stat.value} />
				))}
			</div>
			<div className="flex flex-row gap-12 justify-center mt-8">
				<BarChart data={chartData} />
				<BarChart data={chartData} />
			</div>
		</div>
	);
}
