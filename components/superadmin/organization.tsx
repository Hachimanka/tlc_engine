import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Organization = {
	id: string;
	name: string;
	slug: string;
	admin_email: string;
	contact_email: string;
	subscription_plan: string;
	subscription_status: string;
	subscription_start: string | null;
	subscription_end: string | null;
	status: string;
	address: string | null;
	created_at: string;
	updated_at: string;
};

const statusStyle: Record<string, string> = {
	active: "bg-green-100 text-green-700 border border-green-300",
	suspended: "bg-red-100 text-red-700 border border-red-300",
	inactive: "bg-gray-100 text-gray-600 border border-gray-300",
};

const statusDot: Record<string, string> = {
	active: "bg-green-500",
	suspended: "bg-red-500",
	inactive: "bg-gray-400",
};

const planStyle: Record<string, string> = {
	starter: "text-gray-500",
	basic: "text-gray-500",
	premium: "text-fuchsia-600",
	diamond: "text-sky-500",
	enterprise: "text-emerald-600",
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

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
			<div className="mt-0.5 text-teal-500 shrink-0">{icon}</div>
			<div className="flex-1 min-w-0">
				<div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</div>
				<div className="text-sm text-gray-800 font-medium break-words">{value || <span className="text-gray-400 italic">—</span>}</div>
			</div>
		</div>
	);
}

const Icons = {
	search: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
	chevron: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	close: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
	institution: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M3 21h18M6 21V10m12 11V10M2 10l10-7 10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	email: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	contact: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	plan: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
	calendar: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	slug: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	status: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	address: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
	edit: <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	check: <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	x: <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

export default function OrganizationTable() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [filterOpen, setFilterOpen] = useState(false);
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);

	// Address edit state
	const [editingAddress, setEditingAddress] = useState(false);
	const [addressValue, setAddressValue] = useState("");
	const [addressLoading, setAddressLoading] = useState(false);
	const [addressError, setAddressError] = useState("");

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		setError("");
		const { data, error } = await supabase
			.from("organizations")
			.select("*")
			.order("created_at", { ascending: false });
		if (error) {
			setError("Failed to load organizations.");
			setOrganizations([]);
		} else {
			setOrganizations(data || []);
		}
		setLoading(false);
	};

	const filtered = organizations.filter(org => {
		const matchesSearch =
			org.name?.toLowerCase().includes(search.toLowerCase()) ||
			org.admin_email?.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter ? org.status?.toLowerCase() === statusFilter.toLowerCase() : true;
		return matchesSearch && matchesStatus;
	});

	const openPanel = (org: Organization) => {
		setSelectedOrg(org);
		setPanelOpen(true);
		setEditingAddress(false);
		setAddressValue(org.address || "");
		setAddressError("");
	};

	const closePanel = () => {
		setPanelOpen(false);
		setEditingAddress(false);
		setAddressError("");
		setTimeout(() => setSelectedOrg(null), 300);
	};

	const handleAddressSave = async () => {
		if (!selectedOrg) return;
		setAddressLoading(true);
		setAddressError("");
		const { error } = await supabase
			.from("organizations")
			.update({ address: addressValue, updated_at: new Date().toISOString() })
			.eq("id", selectedOrg.id);
		setAddressLoading(false);
		if (error) {
			setAddressError("Failed to save address.");
			return;
		}
		// Update local state
		const updated = { ...selectedOrg, address: addressValue };
		setSelectedOrg(updated);
		setOrganizations(prev => prev.map(o => o.id === selectedOrg.id ? updated : o));
		setEditingAddress(false);
	};

	const handleAddressCancel = () => {
		setAddressValue(selectedOrg?.address || "");
		setEditingAddress(false);
		setAddressError("");
	};

	const selectedLabel = statusFilter
		? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
		: "All Status";

	return (
		<div className="w-full px-8 py-6 relative">
			<div className="w-full border-b border-teal-200 mb-6">
				<h1 className="text-2xl font-bold text-teal-800 pb-2">ORGANIZATION</h1>
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
						placeholder="Search Organizations..."
						value={search}
						onChange={e => setSearch(e.target.value)}
					/>
				</div>

				<div className="relative flex-shrink-0">
					<button
						className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white shadow-sm hover:border-teal-400 transition-colors w-[160px] justify-between text-gray-700"
						onClick={() => setFilterOpen(v => !v)}
					>
						<span>{selectedLabel}</span>
						{Icons.chevron}
					</button>
					{filterOpen && (
						<>
							<div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
							<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 w-[160px] py-1 overflow-hidden">
								{[
									{ label: "All Status", value: "" },
									{ label: "Active", value: "active" },
									{ label: "Suspended", value: "suspended" },
								].map(opt => (
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

				<button className="flex-shrink-0 bg-teal-800 text-white rounded-lg px-4 py-2.5 text-sm shadow hover:bg-teal-700 transition-colors flex items-center gap-1 font-medium">
					+ Add
				</button>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-xl shadow border border-gray-100">
				{loading ? (
					<div className="text-center py-10 text-gray-500">Loading...</div>
				) : error ? (
					<div className="text-center py-10 text-red-500">{error}</div>
				) : (
					<table className="min-w-full bg-white text-sm">
						<thead>
							<tr className="bg-teal-800 text-white">
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">ORGANIZATION</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">ADMIN EMAIL</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">PLAN</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">STATUS</th>
								<th className="px-5 py-3 text-left font-semibold text-xs tracking-wider">CREATED</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 ? (
								<tr>
									<td colSpan={5} className="text-center py-10 text-gray-400">No organizations found.</td>
								</tr>
							) : filtered.map((org, idx) => (
								<tr
									key={org.id}
									className={`cursor-pointer transition-colors duration-150 hover:bg-teal-50
										${selectedOrg?.id === org.id && panelOpen ? "bg-teal-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}
									onClick={() => openPanel(org)}
								>
									<td className="px-5 py-3 whitespace-nowrap font-medium text-gray-800">{org.name}</td>
									<td className="px-5 py-3 whitespace-nowrap text-gray-600">{org.admin_email}</td>
									<td className={`px-5 py-3 whitespace-nowrap font-semibold capitalize ${planStyle[org.subscription_plan?.toLowerCase()] || "text-gray-500"}`}>
										{org.subscription_plan}
									</td>
									<td className="px-5 py-3 whitespace-nowrap">
										<StatusBadge status={org.status} />
									</td>
									<td className="px-5 py-3 whitespace-nowrap text-gray-600">
										{org.created_at ? new Date(org.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

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
				{selectedOrg && (
					<>
						{/* Panel Header */}
						<div className="px-6 pt-6 pb-4 border-b border-gray-100">
							<div className="flex items-start justify-between mb-1">
								<StatusBadge status={selectedOrg.status} />
								<button
									className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
									onClick={closePanel}
									aria-label="Close"
								>
									{Icons.close}
								</button>
							</div>
							<h2 className="text-xl font-bold text-gray-900 mt-3">{selectedOrg.name}</h2>
							<p className="text-sm text-gray-500 mt-0.5 capitalize">{selectedOrg.subscription_plan} Plan</p>
						</div>

						{/* Fields */}
						<div className="flex-1 overflow-y-auto px-6 py-2">
							<FieldRow icon={Icons.slug} label="Slug" value={
								<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{selectedOrg.slug}</span>
							} />
							<FieldRow icon={Icons.email} label="Admin Email" value={
								<a href={`mailto:${selectedOrg.admin_email}`} className="text-teal-600 hover:underline">{selectedOrg.admin_email}</a>
							} />
							<FieldRow icon={Icons.contact} label="Contact Email" value={
								<a href={`mailto:${selectedOrg.contact_email}`} className="text-teal-600 hover:underline">{selectedOrg.contact_email}</a>
							} />
							<FieldRow icon={Icons.plan} label="Subscription Plan" value={
								<span className={`capitalize font-semibold ${planStyle[selectedOrg.subscription_plan?.toLowerCase()] || "text-gray-700"}`}>
									{selectedOrg.subscription_plan}
								</span>
							} />
							<FieldRow icon={Icons.status} label="Subscription Status" value={
								<StatusBadge status={selectedOrg.subscription_status} />
							} />
							<FieldRow icon={Icons.calendar} label="Subscription Start" value={
								selectedOrg.subscription_start
									? new Date(selectedOrg.subscription_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
									: null
							} />
							<FieldRow icon={Icons.calendar} label="Subscription End" value={
								selectedOrg.subscription_end
									? new Date(selectedOrg.subscription_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
									: null
							} />

							{/* Address — editable */}
							<div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
								<div className="mt-0.5 text-teal-500 shrink-0">{Icons.address}</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-0.5">
										<div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Address</div>
										{!editingAddress && (
											<button
												className="flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-800 font-medium transition-colors"
												onClick={() => { setEditingAddress(true); setAddressValue(selectedOrg.address || ""); }}
											>
												{Icons.edit}
												Edit
											</button>
										)}
									</div>

									{editingAddress ? (
										<div className="flex flex-col gap-2 mt-1">
											<textarea
												className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none text-gray-800"
												rows={3}
												placeholder="Enter address..."
												value={addressValue}
												onChange={e => setAddressValue(e.target.value)}
												autoFocus
											/>
											{addressError && <p className="text-red-500 text-xs">{addressError}</p>}
											<div className="flex gap-2">
												<button
													className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors disabled:opacity-50"
													onClick={handleAddressSave}
													disabled={addressLoading}
												>
													{Icons.check}
													{addressLoading ? "Saving..." : "Save"}
												</button>
												<button
													className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
													onClick={handleAddressCancel}
													disabled={addressLoading}
												>
													{Icons.x}
													Cancel
												</button>
											</div>
										</div>
									) : (
										<div className="text-sm text-gray-800 font-medium break-words">
											{selectedOrg.address || <span className="text-gray-400 italic">— click Edit to add address</span>}
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Footer timestamp */}
						<div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
							<p className="text-[11px] text-gray-400">
								Created {new Date(selectedOrg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {new Date(selectedOrg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
							</p>
						</div>
					</>
				)}
			</div>
		</div>
	);
}