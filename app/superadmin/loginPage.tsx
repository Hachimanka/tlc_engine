"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { recordSuperAdminActivity } from "@/lib/superadminActivityClient";



export default function SuperAdminLoginPage({ onLogin }: { onLogin: () => void }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !password) {
			setError("Please enter both email and password.");
			return;
		}
		setError("");
		setLoading(true);
		// Supabase sign in
		const { data, error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		setLoading(false);
		if (signInError) {
			setError("Invalid credentials or user does not exist.");
			return;
		}

		const role = (data?.user?.user_metadata as { role?: string } | undefined)?.role;
		if (role !== "superadmin") {
			await supabase.auth.signOut();
			setError("You do not have access to the superadmin portal.");
			return;
		}
		await recordSuperAdminActivity({
			action: "logged in",
			target: "Superadmin portal",
			targetType: "session",
			status: "success",
		});
		onLogin();
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-6">
				<h1 className="text-2xl font-bold text-teal-800 text-center"> Login</h1>
				{/* <div className="text-xs text-gray-400 text-center mb-2">Demo: superadmin@demo.com / password123</div> */}
				{error && <div className="text-red-600 text-sm text-center">{error}</div>}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
					<input
						type="email"
						className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
						value={email}
						onChange={e => setEmail(e.target.value)}
						placeholder="Enter your email"
						autoComplete="username"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
					<input
						type="password"
						className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
						value={password}
						onChange={e => setPassword(e.target.value)}
						placeholder="Enter your password"
						autoComplete="current-password"
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					className="flex items-center justify-center gap-2 rounded bg-teal-700 px-6 py-2 font-medium text-white shadow transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-80"
				>
					{loading ? (
						<>
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" aria-hidden="true" />
							Signing in...
						</>
					) : (
						"Login"
					)}
				</button>
			</form>
		</div>
	);
}
