import React, { useState } from "react";

export default function SuperAdminSettings() {
	const [email, setEmail] = useState("admin@metrostate.edu");
	const [name, setName] = useState("Leonard Forrosuelo");
	const [password, setPassword] = useState("");
	const [notifications, setNotifications] = useState(true);

	return (
		<div className="w-full max-w-2xl mx-auto px-8 py-8">
			<h1 className="text-2xl font-bold text-teal-800 mb-2">SETTINGS</h1>
			<div className="border-b border-teal-200 mb-6" />

			{/* Profile Section */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-teal-700 mb-2">Profile</h2>
				<div className="flex flex-col gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
						<input
							className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
							value={name}
							onChange={e => setName(e.target.value)}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
						<input
							className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
							value={email}
							onChange={e => setEmail(e.target.value)}
							type="email"
						/>
					</div>
				</div>
			</div>

			{/* Password Section */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-teal-700 mb-2">Change Password</h2>
				<div className="flex flex-col gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
						<input
							className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
							value={password}
							onChange={e => setPassword(e.target.value)}
							type="password"
							placeholder="Enter new password"
						/>
					</div>
					<button className="bg-teal-700 text-white rounded px-4 py-2 w-fit font-medium shadow hover:bg-teal-800 transition self-end">Update Password</button>
				</div>
			</div>

			{/* Notification Section */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-teal-700 mb-2">Notifications</h2>
				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={notifications}
						onChange={e => setNotifications(e.target.checked)}
						className="accent-teal-700 w-5 h-5"
					/>
					<span className="text-gray-700">Enable email notifications</span>
				</label>
			</div>

			<button className="bg-teal-700 text-white rounded px-6 py-2 font-medium shadow hover:bg-teal-800 transition">Save Changes</button>
		</div>
	);
}
