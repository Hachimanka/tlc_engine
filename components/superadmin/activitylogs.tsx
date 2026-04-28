import React, { useState } from "react";

const logs = [
	{
		user: "Leonard Forrosuelo",
		action: "Added new organization",
		target: "Metro State University",
		date: "Mar 20, 2026",
		status: { label: "Success", color: "text-green-600" },
	},
	{
		user: "Jane Dela Cruz",
		action: "Edited subscription plan",
		target: "Sunrise Academy",
		date: "Mar 19, 2026",
		status: { label: "Success", color: "text-green-600" },
	},
	{
		user: "Admin",
		action: "Suspended account",
		target: "Greenfield High School",
		date: "Mar 18, 2026",
		status: { label: "Suspended", color: "text-red-600" },
	},
	{
		user: "Leonard Forrosuelo",
		action: "Viewed analytics",
		target: "Valley Community College",
		date: "Mar 17, 2026",
		status: { label: "Viewed", color: "text-blue-600" },
	},
];

export default function ActivityLogsTable() {
	const [search, setSearch] = useState("");
	const filtered = logs.filter(log =>
		log.user.toLowerCase().includes(search.toLowerCase()) ||
		log.action.toLowerCase().includes(search.toLowerCase()) ||
		log.target.toLowerCase().includes(search.toLowerCase())
	);
	return (
		<div className="w-full px-8 py-6">
			<div className="flex items-center mb-4">
				<h1 className="text-2xl font-bold text-teal-800 flex-1">ACTIVITY LOGS</h1>
				<div className="flex items-center gap-2">
					<div className="relative">
						<input
							type="text"
							className="border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 min-w-[220px]"
							placeholder="Search logs..."
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
						<span className="absolute left-3 top-2.5 text-gray-400">
							<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="#888" strokeWidth="2"/><path d="M20 20L17 17" stroke="#888" strokeWidth="2" strokeLinecap="round"/></svg>
						</span>
					</div>
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full bg-white rounded-xl shadow text-sm overflow-hidden">
					<thead className="rounded-t-xl">
						<tr className="bg-teal-800 text-white">
							<th className="px-4 py-3 text-left font-semibold">USER</th>
							<th className="px-4 py-3 text-left font-semibold">ACTION</th>
							<th className="px-4 py-3 text-left font-semibold">TARGET</th>
							<th className="px-4 py-3 text-left font-semibold">STATUS</th>
							<th className="px-4 py-3 text-left font-semibold">DATE</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((log, idx) => (
							<tr key={log.user + log.action + log.date} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
								<td className="px-4 py-2 whitespace-nowrap">{log.user}</td>
								<td className="px-4 py-2 whitespace-nowrap">{log.action}</td>
								<td className="px-4 py-2 whitespace-nowrap">{log.target}</td>
								<td className={`px-4 py-2 whitespace-nowrap font-medium ${log.status.color}`}>{log.status.label}</td>
								<td className="px-4 py-2 whitespace-nowrap">{log.date}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
