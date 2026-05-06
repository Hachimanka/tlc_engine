"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type UserMetadata = {
  first_login?: boolean;
  onboarding_complete?: boolean;
  must_change_password?: boolean;
  role?: string;
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const getAssignedFeatureRedirect = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      return "/login";
    }

    const response = await fetch("/api/tenant/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return "/login";
    }

    return payload.firstActiveHref || "/login";
  };

  const redirectAfterLogin = async (metadata: UserMetadata | null | undefined) => {
    const redirect = searchParams?.get("redirect");

    if (metadata?.must_change_password === true) {
      const target = redirect || "/tenant/tenant-admin";
      router.replace(`/tenant/password-setup?redirect=${encodeURIComponent(target)}`);
      return;
    }

    const isFirstLogin = metadata?.first_login === true || metadata?.onboarding_complete === false;
    if (isFirstLogin) {
      router.replace("/tenant/onboarding");
      return;
    }

    if (metadata?.role === "org_admin") {
      router.replace(redirect || "/tenant/tenant-admin");
      return;
    }

    const assignedRedirect = await getAssignedFeatureRedirect();
    router.replace(redirect && redirect !== "/tenant/tenant-admin" ? redirect : assignedRedirect);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        await redirectAfterLogin(data.user.user_metadata as UserMetadata);
        return;
      }

      setCheckingSession(false);
    };

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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

    await redirectAfterLogin(data.user?.user_metadata as UserMetadata);
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
          <h1 className="text-2xl font-bold text-teal-800 text-center">Institution Login</h1>
          <p className="text-xs text-gray-400 text-center">
            Use your organization account credentials.
          </p>
        </div>

        {error ? <div className="text-red-600 text-sm text-center">{error}</div> : null}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@institution.edu"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-sm text-gray-500">Loading login...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
