import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Plan = {
	id: string;
	name: string;
	price: number;
	tenants: number;
	instructors: number;
	departments: number;
	description: string;
	features: string[];
	badge: string | null;
	color: string;
	is_active: boolean;
};

type Tenant = {
	id: string;
	name: string;
	admin_email: string;
	status: string;
	subscription_start: string | null;
	subscription_end: string | null;
	created_at: string;
};

const colorMap: Record<string, {
	card: string;
	badge: string;
	price: string;
	btn: string;
	border: string;
	tag: string;
	check: string;
	header: string;
}> = {
	gray: {
		card: "bg-white border border-gray-200",
		badge: "bg-gray-100 text-gray-600",
		price: "text-gray-700",
		btn: "bg-gray-700 hover:bg-gray-800 text-white",
		border: "border-gray-200",
		tag: "bg-gray-100 text-gray-500 border-gray-200",
		check: "text-gray-400",
		header: "text-gray-800",
	},
	teal: {
		card: "bg-white border border-teal-200",
		badge: "bg-teal-100 text-teal-700",
		price: "text-teal-700",
		btn: "bg-teal-700 hover:bg-teal-800 text-white",
		border: "border-teal-200",
		tag: "bg-teal-50 text-teal-600 border-teal-200",
		check: "text-teal-500",
		header: "text-teal-800",
	},
	fuchsia: {
		card: "bg-white border-2 border-fuchsia-400",
		badge: "bg-fuchsia-100 text-fuchsia-700",
		price: "text-fuchsia-700",
		btn: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white",
		border: "border-fuchsia-200",
		tag: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
		check: "text-fuchsia-500",
		header: "text-fuchsia-800",
	},
	sky: {
		card: "bg-gradient-to-b from-sky-50 to-white border border-sky-300",
		badge: "bg-sky-100 text-sky-700",
		price: "text-sky-700",
		btn: "bg-sky-600 hover:bg-sky-700 text-white",
		border: "border-sky-200",
		tag: "bg-sky-50 text-sky-600 border-sky-200",
		check: "text-sky-500",
		header: "text-sky-800",
	},
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

function CheckIcon({ className }: { className: string }) {
	return (
		<svg width="15" height="15" fill="none" viewBox="0 0 24 24" className={className}>
			<circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15"/>
			<path d="M7 13l3.5 3.5L17 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
		</svg>
	);
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ plan, onClose, onSaved }: {
	plan: Plan;
	onClose: () => void;
	onSaved: (updated: Plan) => void;
}) {
	const [form, setForm] = useState({
		name: plan.name,
		price: plan.price.toString(),
		tenants: plan.tenants.toString(),
		instructors: plan.instructors.toString(),
		departments: plan.departments.toString(),
		description: plan.description,
		badge: plan.badge || "",
		color: plan.color,
		features: plan.features.join("\n"),
		is_active: plan.is_active,
	});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const handleSave = async () => {
		setSaving(true);
		setError("");
		const featuresArr = form.features.split("\n").map(f => f.trim()).filter(Boolean);
		const payload = {
			name: form.name,
			price: parseFloat(form.price) || 0,
			tenants: parseInt(form.tenants) || 0,
			instructors: parseInt(form.instructors) || 0,
			departments: parseInt(form.departments) || 0,
			description: form.description,
			badge: form.badge || null,
			color: form.color,
			features: featuresArr,
			is_active: form.is_active,
		};
		const { error } = await supabase.from("subscription_plans").update(payload).eq("id", plan.id);
		setSaving(false);
		if (error) { setError(error.message); return; }
		onSaved({ ...plan, ...payload });
	};

	const field = (label: string, key: keyof typeof form, type = "text") => (
		<div>
			<label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">{label}</label>
			<input
				type={type}
				className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800"
				value={form[key] as string}
				onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
			/>
		</div>
	);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />
			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 z-10 flex flex-col max-h-[90vh]">
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
					<h2 className="text-lg font-bold text-teal-800">Edit — {plan.name}</h2>
					<button className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose}>
						<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
					</button>
				</div>
				<div className="overflow-y-auto px-6 py-4 flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-4">
						{field("Plan Name", "name")}
						{field("Price (USD)", "price", "number")}
					</div>
					<div className="grid grid-cols-3 gap-4">
						{field("Max Tenants", "tenants", "number")}
						{field("Instructors", "instructors", "number")}
						{field("Departments", "departments", "number")}
					</div>
					{field("Description", "description")}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">Badge</label>
							<input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800" placeholder="e.g. Most Popular" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} />
						</div>
						<div>
							<label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">Color Theme</label>
							<select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
								{Object.keys(colorMap).map(c => (
									<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
								))}
							</select>
						</div>
					</div>
					<div>
						<label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
							Features <span className="normal-case font-normal text-gray-400">(one per line)</span>
						</label>
						<textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 resize-none" rows={6} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} />
					</div>
					<div className="flex items-center gap-3">
						<label className="text-xs font-bold uppercase tracking-widest text-gray-400">Active</label>
						<button type="button" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? "bg-teal-600" : "bg-gray-200"}`} onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
							<span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-6" : "translate-x-1"}`} />
						</button>
					</div>
					{error && <p className="text-red-500 text-xs">{error}</p>}
				</div>
				<div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100">
					<button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors" onClick={onClose} disabled={saving}>Cancel</button>
					<button className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors disabled:opacity-50" onClick={handleSave} disabled={saving}>
						{saving ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Tenants Side Panel ───────────────────────────────────────────────────────
function TenantsPanel({ plan, onClose }: {
	plan: Plan | null;
	onClose: () => void;
}) {
	const [tenants, setTenants] = useState<Tenant[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const isOpen = !!plan;

	async function fetchTenants(planName: string) {
		setLoading(true);
		const { data, error } = await supabase
			.from("organizations")
			.select("id, name, admin_email, status, subscription_start, subscription_end, created_at")
			.ilike("subscription_plan", planName)
			.order("created_at", { ascending: false });
		setLoading(false);
		if (!error) setTenants(data || []);
	}

	useEffect(() => {
		if (!plan) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchTenants(plan.name);
	}, [plan]);

	const filtered = tenants.filter(t =>
		t.name?.toLowerCase().includes(search.toLowerCase()) ||
		t.admin_email?.toLowerCase().includes(search.toLowerCase())
	);

	const c = plan ? (colorMap[plan.color] || colorMap.teal) : colorMap.teal;

	return (
		<>
			{/* Overlay */}
			{isOpen && (
				<div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
			)}

			{/* Panel */}
			<div className={`fixed top-0 right-0 h-full w-[460px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
				${isOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				{plan && (
					<>
						{/* Header */}
						<div className={`px-6 pt-6 pb-4 border-b border-gray-100`}>
							<div className="flex items-start justify-between mb-1">
								<span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${c.tag}`}>
									{plan.name} Plan
								</span>
								<button
									className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
									onClick={onClose}
								>
									<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
								</button>
							</div>
							<h2 className="text-xl font-bold text-gray-900 mt-3">Tenants</h2>
							<p className="text-sm text-gray-400 mt-0.5">
								{loading ? "Loading..." : `${tenants.length} organization${tenants.length !== 1 ? "s" : ""} on this plan`}
							</p>

							{/* Search */}
							<div className="relative mt-4">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
									<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
								</span>
								<input
									type="text"
									className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
									placeholder="Search organizations..."
									value={search}
									onChange={e => setSearch(e.target.value)}
								/>
							</div>
						</div>

						{/* Tenant List */}
						<div className="flex-1 overflow-y-auto px-6 py-3">
							{loading ? (
								<div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading tenants...</div>
							) : filtered.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 text-gray-400">
									<svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mb-3 text-gray-200">
										<path d="M3 21h18M6 21V10m12 11V10M2 10l10-7 10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
									<p className="text-sm font-medium">No organizations found</p>
									<p className="text-xs mt-1 text-gray-300">
										{search ? "Try a different search" : "No tenants on this plan yet"}
									</p>
								</div>
							) : (
								<div className="flex flex-col gap-2">
									{filtered.map(tenant => (
										<div
											key={tenant.id}
											className="border border-gray-100 rounded-xl px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
										>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													<p className="text-sm font-semibold text-gray-800 truncate">{tenant.name}</p>
													<p className="text-xs text-gray-400 truncate mt-0.5">{tenant.admin_email}</p>
												</div>
												<StatusBadge status={tenant.status} />
											</div>
											{(tenant.subscription_start || tenant.subscription_end) && (
												<div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
													<svg width="11" height="11" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
													{tenant.subscription_start
														? new Date(tenant.subscription_start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
														: "—"}
													<span>→</span>
													{tenant.subscription_end
														? new Date(tenant.subscription_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
														: "—"}
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
							<div className="flex items-center justify-between text-[11px] text-gray-400">
								<span>{filtered.length} of {tenants.length} shown</span>
								<span className={`font-semibold ${c.price}`}>
									{plan.price === 0 ? "Free" : `$${plan.price}/mo`} per tenant
								</span>
							</div>
						</div>
					</>
				)}
			</div>
		</>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SubscriptionCards() {
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
	const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);

	async function fetchPlans() {
		setLoading(true);
		setError("");
		const { data, error } = await supabase
			.from("subscription_plans")
			.select("*")
			.order("price", { ascending: true });
		if (error) {
			setError("Failed to load subscription plans.");
			setPlans([]);
		} else {
			setPlans(data || []);
		}
		setLoading(false);
	}

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchPlans();
	}, []);

	const handleSaved = (updated: Plan) => {
		setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
		setEditingPlan(null);
	};

	if (loading) return <div className="text-center py-20 text-gray-500">Loading plans...</div>;
	if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

	return (
		<div className="w-full px-8 py-6">
			<div className="border-b border-teal-200 mb-8">
				<h1 className="text-2xl font-bold text-teal-800 pb-2">SUBSCRIPTIONS</h1>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
				{plans.map(plan => {
					const c = colorMap[plan.color] || colorMap.teal;
					const isUnlimited = (val: number) => val <= 0 || val >= 999;

					return (
						<div key={plan.id} className={`relative rounded-2xl shadow-md flex flex-col ${c.card}`}>
							{/* Badge */}
							{plan.badge && (
								<div className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 rounded-full text-xs font-bold shadow ${c.badge}`}>
									{plan.badge}
								</div>
							)}

							{/* Header */}
							<div className={`px-5 pt-6 pb-4 border-b ${c.border}`}>
								<div className="flex items-center justify-between mb-3">
									<span className={`text-base font-bold ${c.header}`}>{plan.name}</span>
									<span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${c.tag}`}>
										{isUnlimited(plan.tenants) ? "Unlimited" : `${plan.tenants} tenants`}
									</span>
								</div>
								<div className="flex items-end gap-1 mb-2">
									<span className={`text-4xl font-extrabold tracking-tight ${c.price}`}>
										{plan.price === 0 ? "Free" : `$${plan.price}`}
									</span>
									{plan.price > 0 && <span className="text-gray-400 text-sm mb-1">/mo</span>}
								</div>
								<p className="text-gray-500 text-xs leading-relaxed">{plan.description}</p>
							</div>

							{/* Stats */}
							<div className={`flex divide-x ${c.border} border-b`}>
								<div className="flex-1 px-4 py-2.5 text-center">
									<div className={`text-sm font-bold ${c.price}`}>
										{isUnlimited(plan.instructors) ? "∞" : plan.instructors}
									</div>
									<div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Instructors</div>
								</div>
								<div className="flex-1 px-4 py-2.5 text-center">
									<div className={`text-sm font-bold ${c.price}`}>
										{isUnlimited(plan.departments) ? "∞" : plan.departments}
									</div>
									<div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Departments</div>
								</div>
							</div>

							{/* Features */}
							<div className="px-5 py-4 flex-1">
								<p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Includes</p>
								<ul className="flex flex-col gap-1.5">
									{(plan.features || []).map((f, i) => (
										<li key={i} className="flex items-start gap-2 text-sm text-gray-700">
											<CheckIcon className={`${c.check} shrink-0 mt-0.5`} />
											{f}
										</li>
									))}
								</ul>
							</div>

							{/* Actions */}
							<div className="px-5 pb-5 flex gap-2 mt-auto">
								<button
									className="flex-1 border border-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
									onClick={() => setEditingPlan(plan)}
								>
									Edit
								</button>
								<button
									className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${c.btn}`}
									onClick={() => setViewingPlan(plan)}
								>
									View Tenants
								</button>
							</div>

							{/* Inactive overlay */}
							{!plan.is_active && (
								<div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
									<span className="bg-gray-200 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">Inactive</span>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Edit Modal */}
			{editingPlan && (
				<EditModal
					plan={editingPlan}
					onClose={() => setEditingPlan(null)}
					onSaved={handleSaved}
				/>
			)}

			{/* Tenants Side Panel */}
			<TenantsPanel
				plan={viewingPlan}
				onClose={() => setViewingPlan(null)}
			/>
		</div>
	);
}
