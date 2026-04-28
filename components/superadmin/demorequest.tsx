import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type DemoRequest = {
	id: string;
	full_name: string;
	email: string;
	institution_name: string;
	role_position: string;
	institution_size: string;
	preferred_demo_date: string | null;
	preferred_demo_time: string | null;
	message: string | null;
	status: string;
	created_at: string;
};

const STATUS_OPTIONS = [
	{ label: "All Status", value: "" },
	{ label: "Pending", value: "pending" },
	{ label: "Contacted", value: "contacted" },
	{ label: "Scheduled", value: "scheduled" },
	{ label: "Rejected", value: "rejected" },
	{ label: "Converted", value: "converted" },
];

const statusStyle: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
	contacted: "bg-blue-100 text-blue-700 border border-blue-300",
	scheduled: "bg-indigo-100 text-indigo-700 border border-indigo-300",
	completed: "bg-green-100 text-green-700 border border-green-300",
	rejected: "bg-red-100 text-red-700 border border-red-300",
	converted: "bg-teal-100 text-teal-700 border border-teal-300",
};

const statusDot: Record<string, string> = {
	pending: "bg-yellow-400",
	contacted: "bg-blue-400",
	scheduled: "bg-indigo-400",
	completed: "bg-green-400",
	rejected: "bg-red-400",
	converted: "bg-teal-500",
};

function StatusBadge({ status }: { status: string }) {
	const cls = statusStyle[status] || "bg-gray-100 text-gray-600 border border-gray-300";
	return (
		<span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
			<span className={`w-1.5 h-1.5 rounded-full ${statusDot[status] || "bg-gray-400"}`} />
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</span>
	);
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
			<div className="mt-0.5 text-teal-500 shrink-0">{icon}</div>
			<div>
				<div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</div>
				<div className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-400 italic">—</span>}</div>
			</div>
		</div>
	);
}

const Icons = {
	email: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	institution: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M3 21h18M6 21V10m12 11V10M2 10l10-7 10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	role: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	size: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	date: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	time: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	message: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
	search: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
	chevron: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	close: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
	phone: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.72 19.72 0 013.09 4.18 2 2 0 015.09 2h3a2 2 0 012 1.72c.13 1 .37 1.98.72 2.91a2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006.99 7l1.17-1.17a2 2 0 012.11-.45c.93.35 1.9.59 2.91.72A2 2 0 0122 17z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
	calendar: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	star: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
};

const PLAN_OPTIONS = [
	{ label: "Starter", value: "starter" },
	{ label: "Basic", value: "basic" },
	{ label: "Premium", value: "premium" },
	{ label: "Diamond", value: "diamond" },
];

export default function DemoRequestTable() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [filterOpen, setFilterOpen] = useState(false);
	const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [actionError, setActionError] = useState("");
	const [showPlanPanel, setShowPlanPanel] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState("");
	const [subscriptionStart, setSubscriptionStart] = useState("");
	const [subscriptionEnd, setSubscriptionEnd] = useState("");

	async function fetchData() {
		setLoading(true);
		setError("");
		const { data, error } = await supabase
			.from("demo_requests")
			.select("*")
			.order("created_at", { ascending: false });
		if (error) {
			setError("Failed to load demo requests.");
			setDemoRequests([]);
		} else {
			setDemoRequests(data || []);
		}
		setLoading(false);
	}

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchData();
	}, []);

	const filtered = demoRequests.filter(req => {
		const matchesSearch =
			req.full_name?.toLowerCase().includes(search.toLowerCase()) ||
			req.institution_name?.toLowerCase().includes(search.toLowerCase()) ||
			req.email?.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter ? req.status === statusFilter : true;
		return matchesSearch && matchesStatus;
	});

	const openPanel = (req: DemoRequest) => {
		setSelectedRequest(req);
		setPanelOpen(true);
		setActionError("");
	};

	const closePanel = () => {
		setPanelOpen(false);
		setTimeout(() => setSelectedRequest(null), 300);
		setActionError("");
	};

	const handleStatusUpdate = async (status: string) => {
		if (!selectedRequest) return;
		if (status === "converted") {
			setShowPlanPanel(true);
			return;
		}
		setActionLoading(true);
		setActionError("");
		const { error } = await supabase
			.from("demo_requests")
			.update({ status })
			.eq("id", selectedRequest.id);
		setActionLoading(false);
		if (error) {
			setActionError("Failed to update status. Please try again.");
			return;
		}
		await fetchData();
		setSelectedRequest(prev => prev ? { ...prev, status } : null);
	};

	const handleConvertConfirm = async () => {
		if (!selectedRequest || !selectedPlan || !subscriptionStart || !subscriptionEnd) return;
		setActionLoading(true);
		setActionError("");

		// 1. Update demo_requests — only status
		const { error: updateError } = await supabase
			.from("demo_requests")
			.update({ status: "converted" })
			.eq("id", selectedRequest.id);

		if (updateError) {
			setActionLoading(false);
			setActionError(`Update failed: ${updateError.message}`);
			return;
		}

        // 2. Build org row
        const now = new Date().toISOString();
        const orgName = selectedRequest.institution_name;
        const requesterName = selectedRequest.full_name;

        // Slug: "Cebu Institute of Technology" → "cebu-institute-of-technology"
        const slug = orgName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");

        // Acronym: "Cebu Institute of Technology" → "cit"
        const acronym = orgName
            .split(" ")
            .filter(w => w.length > 2) // skip short words like "of", "the", "and"
            .map(w => w[0].toLowerCase())
            .join("");

        // Admin email: "Leonard Forrosuelo" + "cit" → "leonard.forrosuelo@cit.edu"
        const namePart = requesterName
            .toLowerCase()
            .trim()
            .replace(/[^a-z\s]/g, "")
            .replace(/\s+/g, ".");

        const adminEmail = `${namePart}@${acronym}.edu`;

        const orgRow = {
            name: orgName,
            slug,                              // "cebu-institute-of-technology"
            admin_email: adminEmail,           // "leonard.forrosuelo@cit.edu"
            contact_email: selectedRequest.email,
            subscription_plan: selectedPlan,
            subscription_status: "active",
            subscription_start: subscriptionStart,
            subscription_end: subscriptionEnd,
            status: "active",
            created_at: now,
            updated_at: now,
        };

		console.log("Inserting org row:", orgRow);

		const { data: insertData, error: insertError } = await supabase
			.from("organizations")
			.insert([orgRow])
			.select();

		setActionLoading(false);

		if (insertError) {
			setActionError(`Insert failed: ${insertError.message} | Code: ${insertError.code} | Hint: ${insertError.hint}`);
			console.error("Insert error:", insertError);
			return;
		}

		console.log("Inserted successfully:", insertData);

		setShowPlanPanel(false);
		setSelectedPlan("");
		setSubscriptionStart("");
		setSubscriptionEnd("");
		await fetchData();
		setSelectedRequest(prev => prev ? { ...prev, status: "converted" } : null);
	};

	const selectedLabel = STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || "All Status";

	return (
		<div className="w-full px-8 py-6 relative">
			{/* Header */}
			<div className="border-b border-teal-200 mb-6">
				<h1 className="text-2xl font-bold text-teal-800 pb-2">DEMO REQUESTS</h1>
			</div>

			{/* Search + Filter row */}
			<div className="flex items-center gap-3 mb-5 w-full">
				<div className="relative flex-1">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
						{Icons.search}
					</span>
					<input
						type="text"
						className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm text-gray-700 placeholder-gray-400"
						placeholder="Search by name, institution, or email..."
						value={search}
						onChange={e => setSearch(e.target.value)}
					/>
				</div>

				<div className="relative shrink-0">
					<button
						className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white shadow-sm hover:border-teal-400 transition-colors w-40 justify-between text-gray-700"
						onClick={() => setFilterOpen(v => !v)}
					>
						<span>{selectedLabel}</span>
						<span className="text-gray-400">{Icons.chevron}</span>
					</button>
					{filterOpen && (
						<>
							<div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
							<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 w-40 py-1 overflow-hidden">
								{STATUS_OPTIONS.map(opt => (
									<button
										key={opt.value}
										className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-teal-50 transition-colors
											${statusFilter === opt.value ? "text-teal-700 font-semibold" : "text-gray-700"}`}
										onClick={() => { setStatusFilter(opt.value); setFilterOpen(false); }}
									>
										{opt.label}
										{statusFilter === opt.value && (
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
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">FULL NAME</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">INSTITUTION</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">PREFERRED DATE</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">PREFERRED TIME</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">STATUS</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 ? (
								<tr><td colSpan={5} className="text-center py-10 text-gray-400">No requests found.</td></tr>
							) : filtered.map((req, idx) => (
								<tr
									key={req.id}
									className={`cursor-pointer transition-colors duration-150 hover:bg-teal-50
										${selectedRequest?.id === req.id && panelOpen ? "bg-teal-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}
									onClick={() => openPanel(req)}
								>
									<td className="px-5 py-3 whitespace-nowrap font-medium text-gray-800">
										<div className="flex items-center gap-2">
											{(req.status === "pending" || req.status === "contacted") && (
												<span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[req.status]}`} />
											)}
											{req.full_name}
										</div>
									</td>
									<td className="px-5 py-3 whitespace-nowrap text-gray-600">{req.institution_name}</td>
									<td className="px-5 py-3 whitespace-nowrap text-gray-600">
										{req.preferred_demo_date
											? new Date(req.preferred_demo_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
											: <span className="text-gray-400">—</span>}
									</td>
									<td className="px-5 py-3 whitespace-nowrap text-gray-600">{req.preferred_demo_time || <span className="text-gray-400">—</span>}</td>
									<td className="px-5 py-3 whitespace-nowrap">
										<StatusBadge status={req.status} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Overlay */}
			{panelOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
					onClick={closePanel}
				/>
			)}

			{/* Side Panel */}
			<div
				className={`fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
					${panelOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				{selectedRequest && (
					<>
						{/* Panel Header */}
						<div className="px-6 pt-6 pb-4 border-b border-gray-100">
							<div className="flex items-start justify-between mb-1">
								<StatusBadge status={selectedRequest.status} />
								<button
									className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
									onClick={closePanel}
									aria-label="Close"
								>
									{Icons.close}
								</button>
							</div>
							<h2 className="text-xl font-bold text-gray-900 mt-3">{selectedRequest.full_name}</h2>
							<p className="text-sm text-gray-500 mt-0.5">{selectedRequest.institution_name}</p>
						</div>

						{/* Fields */}
						<div className="flex-1 overflow-y-auto px-6 py-2">
							<FieldRow icon={Icons.email} label="Email Address" value={
								<a href={`mailto:${selectedRequest.email}`} className="text-teal-600 hover:underline">{selectedRequest.email}</a>
							} />
							<FieldRow icon={Icons.institution} label="Institution" value={selectedRequest.institution_name} />
							<FieldRow icon={Icons.role} label="Role / Position" value={selectedRequest.role_position} />
							<FieldRow icon={Icons.size} label="Institution Size" value={selectedRequest.institution_size} />
							<FieldRow icon={Icons.date} label="Preferred Date" value={
								selectedRequest.preferred_demo_date
									? new Date(selectedRequest.preferred_demo_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
									: null
							} />
							<FieldRow icon={Icons.time} label="Preferred Time" value={selectedRequest.preferred_demo_time} />
							<FieldRow icon={Icons.message} label="Message" value={selectedRequest.message} />
						</div>

						{/* Actions */}
						<div className="px-6 py-4 border-t border-gray-100">
							<p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Actions</p>
							{actionError && <p className="text-red-500 text-xs mb-2">{actionError}</p>}
							<div className="grid grid-cols-2 gap-2">
								<button
									className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-700 text-sm font-semibold hover:bg-yellow-100 transition-colors disabled:opacity-40"
									disabled={actionLoading || selectedRequest.status === "contacted" || selectedRequest.status === "converted"}
									onClick={() => handleStatusUpdate("contacted")}
								>
									{Icons.phone}
									Mark Contacted
								</button>
								<button
									className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-40"
									disabled={actionLoading || selectedRequest.status === "scheduled" || selectedRequest.status === "converted"}
									onClick={() => handleStatusUpdate("scheduled")}
								>
									{Icons.calendar}
									Schedule Demo
								</button>
								<button
									className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-300 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-40"
									disabled={actionLoading || selectedRequest.status === "rejected" || selectedRequest.status === "converted"}
									onClick={() => handleStatusUpdate("rejected")}
								>
									<svg width="15" height="15" fill="none" viewBox="0 0 24 24">
										<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
										<path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
									</svg>
									Reject
								</button>
								<button
									className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-teal-300 bg-teal-50 text-teal-700 text-sm font-semibold hover:bg-teal-100 transition-colors disabled:opacity-40"
									disabled={actionLoading || selectedRequest.status === "converted"}
									onClick={() => handleStatusUpdate("converted")}
								>
									{Icons.star}
									Convert to Customer
								</button>
							</div>
							{actionLoading && <p className="text-teal-600 text-xs text-center mt-2">Updating...</p>}
						</div>

						{/* Footer timestamp */}
						<div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
							<p className="text-[11px] text-gray-400">
								Submitted {new Date(selectedRequest.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {new Date(selectedRequest.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
							</p>
						</div>
					</>
				)}
			</div>

			{/* Plan Conversion Panel */}
			{showPlanPanel && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={() => setShowPlanPanel(false)} />
					<div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
						<h3 className="text-lg font-bold text-teal-800 mb-1">Convert to Customer</h3>
						<p className="text-sm text-gray-500 mb-4">Select a plan and subscription period for <span className="font-semibold text-gray-700">{selectedRequest?.institution_name}</span>.</p>

						{/* Plan selection */}
						<p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Plan</p>
						<div className="grid grid-cols-2 gap-2 mb-4">
							{PLAN_OPTIONS.map(opt => (
								<button
									key={opt.value}
									className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150
										${selectedPlan === opt.value
											? "bg-teal-600 text-white border-teal-600"
											: "bg-white text-teal-700 border-teal-300 hover:bg-teal-50"}`}
									onClick={() => setSelectedPlan(opt.value)}
								>
									{opt.label}
								</button>
							))}
						</div>

						{/* Date inputs */}
						<p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Subscription Period</p>
						<div className="flex flex-col gap-2 mb-5">
							<div>
								<label className="text-xs text-gray-500 mb-1 block">Start Date</label>
								<input
									type="date"
									className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
									value={subscriptionStart}
									onChange={e => setSubscriptionStart(e.target.value)}
								/>
							</div>
							<div>
								<label className="text-xs text-gray-500 mb-1 block">End Date</label>
								<input
									type="date"
									className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
									value={subscriptionEnd}
									onChange={e => setSubscriptionEnd(e.target.value)}
								/>
							</div>
						</div>

						{actionError && <p className="text-red-500 text-xs mb-3">{actionError}</p>}

						<div className="flex gap-2 justify-end">
							<button
								className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 text-sm"
								onClick={() => setShowPlanPanel(false)}
								disabled={actionLoading}
							>
								Cancel
							</button>
							<button
								className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors disabled:opacity-50"
								onClick={handleConvertConfirm}
								disabled={!selectedPlan || !subscriptionStart || !subscriptionEnd || actionLoading}
							>
								{actionLoading ? "Converting..." : "Confirm Conversion"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Close filter dropdown on outside click */}
			{filterOpen && (
				<div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
			)}
		</div>
	);
}
