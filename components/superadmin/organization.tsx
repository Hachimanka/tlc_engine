import React, { useState } from "react";

const organizations = [
	{
		name: "Metro State University",
		email: "admin@metrostate.edu",
		plan: { label: "Premium", color: "text-fuchsia-600" },
		status: { label: "Active", color: "text-green-600" },
		created: "Mar 13, 2026",
	},
	{
		name: "Sunrise Academy",
		email: "principal@sunrise.edu",
		plan: { label: "Basic", color: "text-gray-500" },
		status: { label: "Active", color: "text-green-600" },
		created: "Mar 13, 2026",
	},
	{
		name: "Pacific Technical College",
		email: "it@pacifictech.edu",
		plan: { label: "Basic", color: "text-gray-500" },
		status: { label: "Active", color: "text-green-600" },
		created: "Mar 13, 2026",
	},
	{
		name: "Valley Community College",
		email: "admin@valleycc.edu",
		plan: { label: "Enterprise", color: "text-emerald-600" },
		status: { label: "Active", color: "text-green-600" },
		created: "Mar 13, 2026",
	},
	{
		name: "Greenfield High School",
		email: "head@greenfield.edu",
		plan: { label: "Free Trial", color: "text-yellow-500" },
		status: { label: "Suspended", color: "text-red-600" },
		created: "Mar 13, 2026",
	},
];

export default function OrganizationTable() {
	const [search, setSearch] = useState("");
	const filtered = organizations.filter(org =>
		org.name.toLowerCase().includes(search.toLowerCase())
	);
	return (
		<div className="w-full px-8 py-6">
			<div className="flex items-center mb-4">
				<h1 className="text-2xl font-bold text-teal-800 flex-1">ORGANIZATION</h1>
				<div className="flex items-center gap-2">
					<div className="relative">
						<input
							type="text"
							className="border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 min-w-[220px]"
							placeholder="Search Organizations..."
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
						<span className="absolute left-3 top-2.5 text-gray-400">
							<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="#888" strokeWidth="2"/><path d="M20 20L17 17" stroke="#888" strokeWidth="2" strokeLinecap="round"/></svg>
						</span>
					</div>
					<button className="bg-teal-800 text-white rounded px-4 py-2 ml-2 shadow hover:bg-teal-700 transition flex items-center gap-1">
						+ Add
					</button>
				</div>
			</div>
			<div className="overflow-x-auto">
				   <table className="min-w-full bg-white rounded-xl shadow text-sm overflow-hidden">
					   <thead className="rounded-t-xl">
						   <tr className="bg-teal-800 text-white">
							<th className="px-4 py-3 text-left font-semibold">ORGANIZATION</th>
							<th className="px-4 py-3 text-left font-semibold">ADMIN EMAIL</th>
							<th className="px-4 py-3 text-left font-semibold">PLAN</th>
							<th className="px-4 py-3 text-left font-semibold">STATUS</th>
							<th className="px-4 py-3 text-left font-semibold">CREATED</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((org, idx) => (
							<tr key={org.name} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
								<td className="px-4 py-2 whitespace-nowrap">{org.name}</td>
								<td className="px-4 py-2 whitespace-nowrap">{org.email}</td>
								<td className={`px-4 py-2 whitespace-nowrap font-medium ${org.plan.color}`}>{org.plan.label}</td>
								<td className={`px-4 py-2 whitespace-nowrap font-medium ${org.status.color}`}>{org.status.label}</td>
								<td className="px-4 py-2 whitespace-nowrap">{org.created}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
