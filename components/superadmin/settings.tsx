import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = "profile" | "security" | "notifications" | "system" | "danger";

const INPUT_CLASS = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 bg-white";

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
	profile: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	security: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 2L4 6v6c0 5 3.6 9.3 8 10.5C16.4 21.3 20 17 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
	notifications: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	system: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>,
	danger: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
	eye: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>,
	eyeOff: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
	check: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
	save: <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, description }: {
	value: boolean;
	onChange: (v: boolean) => void;
	label: string;
	description?: string;
}) {
	return (
		<div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
			<div>
				<p className="text-sm font-medium text-gray-800">{label}</p>
				{description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
			</div>
			<button
				type="button"
				className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${value ? "bg-teal-600" : "bg-gray-200"}`}
				onClick={() => onChange(!value)}
			>
				<span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
			</button>
		</div>
	);
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
			<div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
				<span className="text-teal-600">{icon}</span>
				<h2 className="text-sm font-bold uppercase tracking-widest text-teal-800">{title}</h2>
			</div>
			<div className="px-6 py-5">{children}</div>
		</div>
	);
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
	return (
		<div className="flex flex-col gap-1">
			<label className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</label>
			{children}
			{hint && <p className="text-xs text-gray-400">{hint}</p>}
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, show, onToggle, placeholder }: {
	value: string;
	onChange: (v: string) => void;
	show: boolean;
	onToggle: () => void;
	placeholder?: string;
}) {
	return (
		<div className="relative">
			<input
				type={show ? "text" : "password"}
				className={INPUT_CLASS + " pr-10"}
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
			/>
			<button
				type="button"
				className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
				onClick={onToggle}
			>
				{show ? Icons.eyeOff : Icons.eye}
			</button>
		</div>
	);
}

function SaveButton({ onClick, saving, success, label = "Save Changes" }: {
	onClick: () => void;
	saving: boolean;
	success: boolean;
	label?: string;
}) {
	return (
		<button
			className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm
				${success ? "bg-green-600 text-white" : "bg-teal-700 hover:bg-teal-800 text-white"} disabled:opacity-50`}
			onClick={onClick}
			disabled={saving}
		>
			{saving ? (
				<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Saving...</>
			) : success ? (
				<>{Icons.check} Saved!</>
			) : (
				<>{Icons.save} {label}</>
			)}
		</button>
	);
}

export default function SuperAdminSettings() {
	const [activeSection, setActiveSection] = useState<Section>("profile");

	// Profile
	const [name, setName] = useState("Leonard Forrosuelo");
	const [email, setEmail] = useState("admin@platform.edu");
	const [phone, setPhone] = useState("");
	const [profileSaving, setProfileSaving] = useState(false);
	const [profileSuccess, setProfileSuccess] = useState(false);

	// Security
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [passwordSuccess, setPasswordSuccess] = useState(false);
	const [passwordSaving, setPasswordSaving] = useState(false);
	const [twoFactor, setTwoFactor] = useState(false);
	const [sessionTimeout, setSessionTimeout] = useState("60");

	// Notifications
	const [notifDemoRequest, setNotifDemoRequest] = useState(true);
	const [notifNewOrg, setNotifNewOrg] = useState(true);
	const [notifSubscription, setNotifSubscription] = useState(true);
	const [notifSystemAlerts, setNotifSystemAlerts] = useState(true);
	const [notifWeeklyReport, setNotifWeeklyReport] = useState(false);
	const [notifLoginAlert, setNotifLoginAlert] = useState(true);

	// System
	const [maintenanceMode, setMaintenanceMode] = useState(false);
	const [allowRegistrations, setAllowRegistrations] = useState(true);
	const [defaultPlan, setDefaultPlan] = useState("basic");
	const [maxOrgsPerPlan, setMaxOrgsPerPlan] = useState("50");
	const [supportEmail, setSupportEmail] = useState("support@platform.edu");
	const [platformName, setPlatformName] = useState("EduAdmin Platform");
	const [systemSaving, setSystemSaving] = useState(false);
	const [systemSuccess, setSystemSuccess] = useState(false);

	// Danger
	const [confirmDelete, setConfirmDelete] = useState("");

	const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
		{ key: "profile", label: "Profile", icon: Icons.profile },
		{ key: "security", label: "Security", icon: Icons.security },
		{ key: "notifications", label: "Notifications", icon: Icons.notifications },
		{ key: "system", label: "System", icon: Icons.system },
		{ key: "danger", label: "Danger Zone", icon: Icons.danger },
	];

	// ── Handlers ───────────────────────────────────────────────────────────────
	const handleProfileSave = async () => {
		setProfileSaving(true);
		setProfileSuccess(false);
		// Simulate or connect to supabase auth update
		await new Promise(r => setTimeout(r, 800));
		setProfileSaving(false);
		setProfileSuccess(true);
		setTimeout(() => setProfileSuccess(false), 3000);
	};

	const handlePasswordUpdate = async () => {
		setPasswordError("");
		setPasswordSuccess(false);
		if (!currentPassword) { setPasswordError("Current password is required."); return; }
		if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
		if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
		setPasswordSaving(true);
		const { error } = await supabase.auth.updateUser({ password: newPassword });
		setPasswordSaving(false);
		if (error) { setPasswordError(error.message); return; }
		setPasswordSuccess(true);
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setTimeout(() => setPasswordSuccess(false), 3000);
	};

	const handleSystemSave = async () => {
		setSystemSaving(true);
		setSystemSuccess(false);
		await new Promise(r => setTimeout(r, 800));
		setSystemSaving(false);
		setSystemSuccess(true);
		setTimeout(() => setSystemSuccess(false), 3000);
	};

	return (
		<div className="w-full px-8 py-6">
			{/* Header */}
			<div className="border-b border-teal-200 mb-6">
				<h1 className="text-2xl font-bold text-teal-800 pb-2">SETTINGS</h1>
			</div>

			<div className="flex gap-6">
				{/* Sidebar Nav */}
				<div className="w-52 shrink-0">
					<nav className="flex flex-col gap-1 sticky top-6">
						{navItems.map(item => (
							<button
								key={item.key}
								className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left
									${activeSection === item.key
										? "bg-teal-700 text-white shadow-sm"
										: item.key === "danger"
										? "text-red-500 hover:bg-red-50"
										: "text-gray-600 hover:bg-gray-100"}`}
								onClick={() => setActiveSection(item.key)}
							>
								<span className={activeSection === item.key ? "text-white" : item.key === "danger" ? "text-red-400" : "text-teal-500"}>
									{item.icon}
								</span>
								{item.label}
							</button>
						))}
					</nav>
				</div>

				{/* Content */}
				<div className="flex-1 flex flex-col gap-5 min-w-0">

					{/* ── Profile ── */}
					{activeSection === "profile" && (
						<SectionCard title="Profile Information" icon={Icons.profile}>
							<div className="flex flex-col gap-4">
								{/* Avatar */}
								<div className="flex items-center gap-4 pb-4 border-b border-gray-100">
									<div className="w-16 h-16 rounded-full bg-teal-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
										{name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
									</div>
									<div>
										<p className="text-sm font-semibold text-gray-800">{name}</p>
										<p className="text-xs text-gray-400">{email}</p>
										<span className="inline-block mt-1 text-[11px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">Super Admin</span>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<Field label="Full Name">
										<input className={INPUT_CLASS} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
									</Field>
									<Field label="Phone Number" hint="Optional — for account recovery">
										<input className={INPUT_CLASS} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+63 912 345 6789" />
									</Field>
								</div>
								<Field label="Email Address" hint="Used for login and system notifications">
									<input className={INPUT_CLASS} type="email" value={email} onChange={e => setEmail(e.target.value)} />
								</Field>

								<div className="flex justify-end pt-2">
									<SaveButton onClick={handleProfileSave} saving={profileSaving} success={profileSuccess} />
								</div>
							</div>
						</SectionCard>
					)}

					{/* ── Security ── */}
					{activeSection === "security" && (
						<>
							<SectionCard title="Change Password" icon={Icons.security}>
								<div className="flex flex-col gap-4">
									<Field label="Current Password">
										<PasswordInput value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} placeholder="Enter current password" />
									</Field>
									<Field label="New Password" hint="Minimum 8 characters">
										<PasswordInput value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(v => !v)} placeholder="Enter new password" />
									</Field>
									<Field label="Confirm New Password">
										<PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} placeholder="Re-enter new password" />
									</Field>

									{/* Password strength */}
									{newPassword.length > 0 && (
										<div>
											<div className="flex gap-1 mb-1">
												{[1,2,3,4].map(i => (
													<div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
														newPassword.length >= i * 3
															? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-yellow-400" : i <= 3 ? "bg-blue-400" : "bg-green-500"
															: "bg-gray-200"
													}`} />
												))}
											</div>
											<p className="text-xs text-gray-400">
												{newPassword.length < 4 ? "Too short" : newPassword.length < 7 ? "Weak" : newPassword.length < 10 ? "Fair" : "Strong"}
											</p>
										</div>
									)}

									{passwordError && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{passwordError}</p>}
									{passwordSuccess && <p className="text-green-600 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">Password updated successfully.</p>}

									<div className="flex justify-end pt-1">
										<SaveButton onClick={handlePasswordUpdate} saving={passwordSaving} success={passwordSuccess} label="Update Password" />
									</div>
								</div>
							</SectionCard>

							<SectionCard title="Access & Session" icon={Icons.security}>
								<div className="flex flex-col gap-1">
									<Toggle
										value={twoFactor}
										onChange={setTwoFactor}
										label="Two-Factor Authentication"
										description="Require a verification code on login"
									/>
									<div className="flex items-center justify-between py-3">
										<div>
											<p className="text-sm font-medium text-gray-800">Session Timeout</p>
											<p className="text-xs text-gray-400 mt-0.5">Auto-logout after inactivity</p>
										</div>
										<select
											className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700"
											value={sessionTimeout}
											onChange={e => setSessionTimeout(e.target.value)}
										>
											<option value="15">15 minutes</option>
											<option value="30">30 minutes</option>
											<option value="60">1 hour</option>
											<option value="120">2 hours</option>
											<option value="480">8 hours</option>
										</select>
									</div>
									<div className="pt-3 border-t border-gray-100">
										<p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Active Sessions</p>
										<div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
											<div>
												<p className="text-sm font-medium text-gray-800">Current Session</p>
												<p className="text-xs text-gray-400">Chrome · Cebu, Philippines · Just now</p>
											</div>
											<span className="text-[11px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Active</span>
										</div>
									</div>
								</div>
							</SectionCard>
						</>
					)}

					{/* ── Notifications ── */}
					{activeSection === "notifications" && (
						<SectionCard title="Notification Preferences" icon={Icons.notifications}>
							<div className="flex flex-col">
								<p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Platform Events</p>
								<Toggle value={notifDemoRequest} onChange={setNotifDemoRequest} label="New Demo Requests" description="Get notified when someone submits a demo request" />
								<Toggle value={notifNewOrg} onChange={setNotifNewOrg} label="New Organization Added" description="Alert when an org is converted or manually added" />
								<Toggle value={notifSubscription} onChange={setNotifSubscription} label="Subscription Changes" description="Plan upgrades, downgrades, and expirations" />

								<p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-4 mb-1">System</p>
								<Toggle value={notifSystemAlerts} onChange={setNotifSystemAlerts} label="System Alerts" description="Downtime, errors, and critical warnings" />
								<Toggle value={notifLoginAlert} onChange={setNotifLoginAlert} label="Login Alerts" description="Notify on new device or unusual login" />

								<p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-4 mb-1">Reports</p>
								<Toggle value={notifWeeklyReport} onChange={setNotifWeeklyReport} label="Weekly Summary Report" description="Receive a weekly digest of platform activity" />

								<div className="flex justify-end pt-4 border-t border-gray-100 mt-2">
									<SaveButton onClick={async () => {}} saving={false} success={false} label="Save Preferences" />
								</div>
							</div>
						</SectionCard>
					)}

					{/* ── System ── */}
					{activeSection === "system" && (
						<>
							<SectionCard title="Platform Settings" icon={Icons.system}>
								<div className="flex flex-col gap-4">
									<div className="grid grid-cols-2 gap-4">
										<Field label="Platform Name">
											<input className={INPUT_CLASS} value={platformName} onChange={e => setPlatformName(e.target.value)} />
										</Field>
										<Field label="Support Email">
											<input className={INPUT_CLASS} type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
										</Field>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<Field label="Max Orgs per Plan (override)" hint="0 = use plan default">
											<input className={INPUT_CLASS} type="number" value={maxOrgsPerPlan} onChange={e => setMaxOrgsPerPlan(e.target.value)} />
										</Field>
										<Field label="Default Plan">
											<select className={INPUT_CLASS} value={defaultPlan} onChange={e => setDefaultPlan(e.target.value)}>
												<option value="starter">Starter</option>
												<option value="basic">Basic</option>
												<option value="premium">Premium</option>
												<option value="diamond">Diamond</option>
											</select>
										</Field>
									</div>

									<div className="flex flex-col gap-1 pt-2 border-t border-gray-100">
										<Toggle
											value={allowRegistrations}
											onChange={setAllowRegistrations}
											label="Allow New Registrations"
											description="Let new tenant organizations enter the setup flow"
										/>
										<Toggle
											value={maintenanceMode}
											onChange={setMaintenanceMode}
											label="Maintenance Mode"
											description="Block all user access and show a maintenance message"
										/>
									</div>

									{maintenanceMode && (
										<div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
											⚠️ Maintenance mode is <strong>ON</strong>. All tenant users are currently blocked from accessing the platform.
										</div>
									)}

									<div className="flex justify-end pt-2">
										<SaveButton onClick={handleSystemSave} saving={systemSaving} success={systemSuccess} />
									</div>
								</div>
							</SectionCard>

							<SectionCard title="Audit & Logs" icon={Icons.system}>
								<div className="flex flex-col gap-3">
									<p className="text-sm text-gray-500">Recent super admin activity on this platform.</p>
									{[
										{ action: "Updated subscription plan for Cebu Tech", time: "2 hours ago", type: "edit" },
										{ action: "Converted demo request — fsdf", time: "5 hours ago", type: "convert" },
										{ action: "Added organization manually", time: "Yesterday", type: "add" },
										{ action: "Changed platform support email", time: "3 days ago", type: "edit" },
										{ action: "Enabled maintenance mode", time: "1 week ago", type: "warning" },
									].map((log, i) => (
										<div key={i} className="flex items-start gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
											<span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
												log.type === "edit" ? "bg-blue-400" :
												log.type === "convert" ? "bg-teal-400" :
												log.type === "add" ? "bg-green-400" :
												"bg-yellow-400"
											}`} />
											<div className="flex-1">
												<p className="text-gray-700">{log.action}</p>
												<p className="text-xs text-gray-400">{log.time}</p>
											</div>
										</div>
									))}
								</div>
							</SectionCard>
						</>
					)}

					{/* ── Danger Zone ── */}
					{activeSection === "danger" && (
						<div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
							<div className="flex items-center gap-3 px-6 py-4 border-b border-red-100 bg-red-50">
								<span className="text-red-500">{Icons.danger}</span>
								<h2 className="text-sm font-bold uppercase tracking-widest text-red-700">Danger Zone</h2>
							</div>
							<div className="px-6 py-5 flex flex-col gap-5">
								<p className="text-sm text-gray-500">These actions are irreversible. Please proceed with extreme caution.</p>

								{/* Clear demo requests */}
								<div className="flex items-center justify-between py-4 border border-red-100 rounded-xl px-4 bg-red-50/40">
									<div>
										<p className="text-sm font-semibold text-gray-800">Clear All Demo Requests</p>
										<p className="text-xs text-gray-400 mt-0.5">Permanently delete all demo request records</p>
									</div>
									<button className="px-4 py-2 rounded-lg bg-white border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
										Clear
									</button>
								</div>

								{/* Suspend all orgs */}
								<div className="flex items-center justify-between py-4 border border-red-100 rounded-xl px-4 bg-red-50/40">
									<div>
										<p className="text-sm font-semibold text-gray-800">Suspend All Organizations</p>
										<p className="text-xs text-gray-400 mt-0.5">Immediately suspend access for all active tenants</p>
									</div>
									<button className="px-4 py-2 rounded-lg bg-white border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
										Suspend All
									</button>
								</div>

								{/* Reset platform */}
								<div className="flex items-start justify-between py-4 border-2 border-red-300 rounded-xl px-4 bg-red-50">
									<div className="flex-1 mr-4">
										<p className="text-sm font-bold text-red-700">Reset Entire Platform</p>
										<p className="text-xs text-gray-500 mt-0.5 mb-3">This will delete all organizations, subscriptions, and demo requests. This cannot be undone.</p>
										<p className="text-xs font-medium text-gray-600 mb-1.5">Type <span className="font-mono font-bold text-red-600">RESET PLATFORM</span> to confirm</p>
										<input
											className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-800 bg-white"
											placeholder="RESET PLATFORM"
											value={confirmDelete}
											onChange={e => setConfirmDelete(e.target.value)}
										/>
									</div>
									<button
										className="mt-6 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-40 shrink-0"
										disabled={confirmDelete !== "RESET PLATFORM"}
									>
										Reset
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
