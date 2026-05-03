"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type UserMetadata = {
  first_login?: boolean;
  onboarding_complete?: boolean;
};

export default function TenantLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const redirectAfterLogin = (metadata: UserMetadata | null | undefined) => {
    const isFirstLogin = metadata?.first_login === true || metadata?.onboarding_complete === false;
    if (isFirstLogin) {
      router.replace("/tenant/onboarding");
      return;
    }
    const redirect = searchParams?.get("redirect") || "/tenant/tenant-admin";
    router.replace(redirect);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        redirectAfterLogin(data.user.user_metadata as UserMetadata);
        return;
      }
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError("Invalid credentials or user does not exist.");
      return;
    }

    redirectAfterLogin(data.user?.user_metadata as UserMetadata);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-teal-100 shadow">
            <Image src="/navbar/tlclogo.png" alt="TLC Logo" width={36} height={36} />
          </div>
          <div className="text-teal-700 font-semibold text-sm">Checking session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2">
          <Image src="/navbar/tlclogo.png" alt="TLC Logo" width={48} height={48} />
          <h1 className="text-2xl font-bold text-teal-800 text-center">Institution Admin Login</h1>
          <p className="text-xs text-gray-400 text-center">Use the credentials sent by the super admin.</p>
        </div>

        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@institution.edu"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temporary password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="bg-teal-700 text-white rounded px-6 py-2 font-medium shadow hover:bg-teal-800 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
