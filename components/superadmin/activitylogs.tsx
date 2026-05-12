import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type ActivityLog = {
	id: string;
	user_name: string;
	user_email: string | null;
	action: string;
	target: string | null;
	target_type: string | null;
	status: string;
	metadata: Record<string, unknown> | null;
	created_at: string;
};

const STATUS_OPTIONS = [
	{ label: "All Status", value: "" },
	{ label: "Success", value: "success" },
	{ label: "Failed", value: "failed" },
	{ label: "Warning", value: "warning" },
	{ label: "Info", value: "info" },
];

const ACTION_OPTIONS = [
	{ label: "All Actions", value: "" },
	{ label: "Created", value: "created" },
	{ label: "Updated", value: "updated" },
	{ label: "Deleted", value: "deleted" },
	{ label: "Suspended", value: "suspended" },
	{ label: "Converted", value: "converted" },
	{ label: "Viewed", value: "viewed" },
];

const statusStyle: Record<string, string> = {
	success: "bg-green-100 text-green-700 border border-green-300",
	failed: "bg-red-100 text-red-700 border border-red-300",
	warning: "bg-yellow-100 text-yellow-700 border border-yellow-300",
	info: "bg-blue-100 text-blue-700 border border-blue-300",
};

const statusDot: Record<string, string> = {
	success: "bg-green-500",
	failed: "bg-red-500",
	warning: "bg-yellow-400",
	info: "bg-blue-400",
};

const actionColor: Record<string, string> = {
	created: "bg-teal-100 text-teal-700",
	updated: "bg-blue-100 text-blue-700",
	deleted: "bg-red-100 text-red-700",
	suspended: "bg-orange-100 text-orange-700",
	converted: "bg-fuchsia-100 text-fuchsia-700",
	viewed: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }: { status: string }) {
	const key = status?.toLowerCase();
	const cls = statusStyle[key] || "bg-gray-100 text-gray-600 border border-gray-300";
	return (
		<span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
			<span className={`w-1.5 h-1.5 rounded-full ${statusDot[key] || "bg-gray-400"}`} />
			{status?.charAt(0).toUpperCase() + status?.slice(1)}
		</span>
	);
}

function ActionBadge({ action }: { action: string }) {
	const key = action?.toLowerCase().split(" ")[0];
	const cls = actionColor[key] || "bg-gray-100 text-gray-600";
	return (
		<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
			{action}
		</span>
	);
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
			<div className="mt-0.5 text-teal-500 shrink-0">{icon}</div>
			<div className="flex-1 min-w-0">
				<div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</div>
				<div className="text-sm text-gray-800 font-medium break-words">
					{value || <span className="text-gray-400 italic">—</span>}
				</div>
			</div>
		</div>
	);
}

const Icons = {
	search: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
	chevron: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	close: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
	user: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	email: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	action: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	target: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.8"/></svg>,
	type: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>,
	calendar: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	status: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	metadata: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
};

function FilterDropdown({
	open,
	setOpen,
	label,
	options,
	value,
	onChange,
}: {
	open: boolean;
	setOpen: (v: boolean) => void;
	label: string;
	options: { label: string; value: string }[];
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div className="relative shrink-0">
			<button
				className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white shadow-sm hover:border-teal-400 transition-colors w-40 justify-between text-gray-700"
				onClick={() => setOpen(!open)}
			>
				<span>{label}</span>
				<span className="text-gray-400">{Icons.chevron}</span>
			</button>
			{open && (
				<>
					<div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
					<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 w-40 py-1 overflow-hidden">
						{options.map(opt => (
							<button
								key={opt.value}
								className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-teal-50 transition-colors
									${value === opt.value ? "text-teal-700 font-semibold" : "text-gray-700"}`}
								onClick={() => { onChange(opt.value); setOpen(false); }}
							>
								{opt.label}
								{value === opt.value && (
									<svg width="14" height="14" fill="none" viewBox="0 0 24 24">
										<path d="M5 13l4 4L19 7" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								)}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}

export default function ActivityLogsTable() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [actionFilter, setActionFilter] = useState("");
	const [statusOpen, setStatusOpen] = useState(false);
	const [actionOpen, setActionOpen] = useState(false);
	const [logs, setLogs] = useState<ActivityLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);

	async function fetchLogs() {
		setLoading(true);
		setError("");

		try {
			const { data: sessionData } = await supabase.auth.getSession();
			const token = sessionData.session?.access_token;

			if (!token) {
				setError("Your session expired. Please log in again.");
				setLogs([]);
				return;
			}

			const response = await fetch("/api/superadmin/activity-logs?limit=250", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const payload: { logs?: ActivityLog[]; error?: string } = await response
				.json()
				.catch(() => ({}));

			if (!response.ok) {
				setError(payload.error || "Failed to load activity logs.");
				setLogs([]);
				return;
			}

			setLogs(payload.logs || []);
		} catch {
			setError("Failed to load activity logs.");
			setLogs([]);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchLogs();
	}, []);

	const filtered = logs.filter(log => {
		const matchesSearch =
			log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
			log.action?.toLowerCase().includes(search.toLowerCase()) ||
			log.target?.toLowerCase().includes(search.toLowerCase()) ||
			log.user_email?.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter ? log.status?.toLowerCase() === statusFilter : true;
		const matchesAction = actionFilter
			? log.action?.toLowerCase().includes(actionFilter.toLowerCase())
			: true;
		return matchesSearch && matchesStatus && matchesAction;
	});

	const openPanel = (log: ActivityLog) => {
		setSelectedLog(log);
		setPanelOpen(true);
	};

	const closePanel = () => {
		setPanelOpen(false);
		setTimeout(() => setSelectedLog(null), 300);
	};

	const statusLabel = STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || "All Status";
	const actionLabel = ACTION_OPTIONS.find(o => o.value === actionFilter)?.label || "All Actions";

	return (
		<div className="w-full px-8 py-6 relative">
			{/* Header */}
			<div className="border-b border-teal-200 mb-6">
				<h1 className="text-2xl font-bold text-teal-800 pb-2">ACTIVITY LOGS</h1>
			</div>

			{/* Search + Filters */}
			<div className="flex items-center gap-3 mb-5 w-full">
				<div className="relative flex-1">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
						{Icons.search}
					</span>
					<input
						type="text"
						className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm text-gray-700 placeholder-gray-400"
						placeholder="Search by user, action, or target..."
						value={search}
						onChange={e => setSearch(e.target.value)}
					/>
				</div>
				<FilterDropdown
					open={statusOpen} setOpen={setStatusOpen}
					label={statusLabel} options={STATUS_OPTIONS}
					value={statusFilter} onChange={setStatusFilter}
				/>
				<FilterDropdown
					open={actionOpen} setOpen={setActionOpen}
					label={actionLabel} options={ACTION_OPTIONS}
					value={actionFilter} onChange={setActionFilter}
				/>
				<button
					className="shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
					onClick={fetchLogs}
					disabled={loading}
				>
					Refresh
				</button>
			</div>

			{/* Table */}
			{loading ? (
				<div className="text-center py-10 text-gray-500">Loading...</div>
			) : error ? (
				<div className="text-center py-10 text-red-500">{error}</div>
			) : (
				<div className="overflow-x-auto rounded-xl shadow border border-gray-100">
					<table className="min-w-full bg-white text-sm">
						<thead>
							<tr className="bg-teal-800 text-white">
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">USER</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">ACTION</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">TARGET</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">STATUS</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">DATE</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 ? (
								<tr><td colSpan={5} className="text-center py-10 text-gray-400">No logs found.</td></tr>
							) : filtered.map((log, idx) => (
								<tr
									key={log.id}
									className={`cursor-pointer transition-colors duration-150 hover:bg-teal-50
										${selectedLog?.id === log.id && panelOpen ? "bg-teal-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}
									onClick={() => openPanel(log)}
								>
									<td className="px-5 py-3 whitespace-nowrap">
										<div className="flex items-center gap-2">
											<div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
												{log.user_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
											</div>
											<span className="font-medium text-gray-800">{log.user_name}</span>
										</div>
									</td>
									<td className="px-5 py-3 whitespace-nowrap">
										<ActionBadge action={log.action} />
									</td>
									<td className="px-5 py-3 whitespace-nowrap text-gray-600">
										{log.target || <span className="text-gray-400">—</span>}
									</td>
									<td className="px-5 py-3 whitespace-nowrap">
										<StatusBadge status={log.status} />
									</td>
									<td className="px-5 py-3 whitespace-nowrap text-gray-500 text-xs">
										{log.created_at
											? new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
											: "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Overlay */}
			{panelOpen && (
				<div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={closePanel} />
			)}

			{/* Side Panel */}
			<div className={`fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
				${panelOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				{selectedLog && (
					<>
						{/* Header */}
						<div className="px-6 pt-6 pb-4 border-b border-gray-100">
							<div className="flex items-start justify-between mb-1">
								<StatusBadge status={selectedLog.status} />
								<button
									className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
									onClick={closePanel}
								>
									{Icons.close}
								</button>
							</div>
							<div className="flex items-center gap-3 mt-3">
								<div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
									{selectedLog.user_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
								</div>
								<div>
									<h2 className="text-lg font-bold text-gray-900">{selectedLog.user_name}</h2>
									<p className="text-xs text-gray-400">{selectedLog.user_email || "No email recorded"}</p>
								</div>
							</div>
						</div>

						{/* Fields */}
						<div className="flex-1 overflow-y-auto px-6 py-2">
							<FieldRow icon={Icons.user} label="User" value={selectedLog.user_name} />
							{selectedLog.user_email && (
								<FieldRow icon={Icons.email} label="Email" value={
									<a href={`mailto:${selectedLog.user_email}`} className="text-teal-600 hover:underline">{selectedLog.user_email}</a>
								} />
							)}
							<FieldRow icon={Icons.action} label="Action" value={
								<ActionBadge action={selectedLog.action} />
							} />
							<FieldRow icon={Icons.target} label="Target" value={selectedLog.target} />
							{selectedLog.target_type && (
								<FieldRow icon={Icons.type} label="Target Type" value={
									<span className="capitalize">{selectedLog.target_type}</span>
								} />
							)}
							<FieldRow icon={Icons.status} label="Status" value={
								<StatusBadge status={selectedLog.status} />
							} />
							<FieldRow icon={Icons.calendar} label="Timestamp" value={
								new Date(selectedLog.created_at).toLocaleString("en-US", {
									month: "long", day: "numeric", year: "numeric",
									hour: "numeric", minute: "2-digit", hour12: true,
								})
							} />

							{/* Metadata */}
							{selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
								<div className="flex items-start gap-3 py-3">
									<div className="mt-0.5 text-teal-500 shrink-0">{Icons.metadata}</div>
									<div className="flex-1 min-w-0">
										<div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Additional Details</div>
										<div className="bg-gray-50 rounded-xl p-3 font-mono text-xs text-gray-600 overflow-x-auto">
											{Object.entries(selectedLog.metadata).map(([key, val]) => (
												<div key={key} className="flex gap-2">
													<span className="text-teal-600 font-semibold">{key}:</span>
													<span>{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
							<p className="text-[11px] text-gray-400">
								Log ID: <span className="font-mono">{selectedLog.id}</span>
							</p>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
