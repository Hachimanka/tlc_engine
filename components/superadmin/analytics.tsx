import React from "react";

const stats = [
	{ label: "Active Users", value: 3200 },
	{ label: "Logins Today", value: 450 },
	{ label: "New Tenants", value: 12 },
	{ label: "Errors", value: 2 },
];

const chartData = [
	{ label: "Mon", value: 40 },
	{ label: "Tue", value: 55 },
	{ label: "Wed", value: 38 },
	{ label: "Thu", value: 60 },
	{ label: "Fri", value: 48 },
	{ label: "Sat", value: 30 },
	{ label: "Sun", value: 20 },
];

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 min-w-[180px] max-w-[220px] flex-1">
			<span className="text-2xl font-semibold text-teal-800">{value.toLocaleString()}</span>
			<span className="text-gray-500 text-sm">{label}</span>
		</div>
	);
}

function BarChart({ data }: { data: typeof chartData }) {
	const max = Math.max(...data.map(d => d.value));
	return (
		<svg width={420} height={180} className="mx-auto">
			{/* X axis labels */}
			{data.map((d, i) => (
				<text key={d.label} x={40 + i * 50} y={170} fontSize={12} textAnchor="middle" fill="#666">{d.label}</text>
			))}
			{/* Bars */}
			{data.map((d, i) => (
				<rect
					key={d.label}
					x={30 + i * 50}
					y={160 - (d.value / max) * 120}
					width={28}
					height={(d.value / max) * 120}
					fill="#14b8a6"
					rx={4}
				/>
			))}
		</svg>
	);
}

export default function AnalyticsDashboard() {
	return (
		<div className="w-full px-8 py-6">
			<h1 className="text-2xl font-bold text-teal-800 mb-2">ANALYTICS</h1>
			<div className="border-b border-teal-200 mb-6" />
			<div className="flex flex-row gap-4 mb-8 flex-wrap">
				{stats.map((stat) => (
					<StatCard key={stat.label} label={stat.label} value={stat.value} />
				))}
			</div>
			<div className="flex flex-row gap-12 justify-center mt-8">
				<BarChart data={chartData} />
			</div>
		</div>
	);
}
