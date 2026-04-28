"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";



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
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		setLoading(false);
		if (signInError) {
			setError("Invalid credentials or user does not exist.");
			return;
		}
		onLogin();
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="flex flex-col items-center gap-4">
					<div className="w-20 h-20 flex items-center justify-center rounded-xl bg-teal-100 shadow animate-bounce" style={{ animationDuration: '0.7s' }}>
						<img
							src="/navbar/tlclogo.png"
							alt="TLC Logo"
							className="w-14 h-14"
							style={{ objectFit: 'contain' }}
						/>
					</div>
					<div className="text-teal-700 font-semibold text-lg">Logging in...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-6">
				<h1 className="text-2xl font-bold text-teal-800 text-center">Super Admin Login</h1>
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
					className="bg-teal-700 text-white rounded px-6 py-2 font-medium shadow hover:bg-teal-800 transition"
				>
					Login
				</button>
			</form>
		</div>
	);
}
