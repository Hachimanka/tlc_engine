"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type UserMetadata = {
  onboarding_complete?: boolean;
  role?: string;
};

function TenantPasswordSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [metadata, setMetadata] = useState<UserMetadata | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace("/login");
        return;
      }

      const userMetadata = data.user.user_metadata as UserMetadata;

      if (userMetadata?.onboarding_complete === false && userMetadata?.role === "org_admin") {
        router.replace("/tenant/onboarding");
        return;
      }

      setMetadata(userMetadata);
      setCheckingSession(false);
    };

    checkSession();
  }, [router]);

  const resolveRedirect = async () => {
    const redirect = searchParams?.get("redirect");

    if (metadata?.role === "org_admin") {
      return redirect || "/tenant/tenant-admin";
    }

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

    return redirect && redirect !== "/tenant/tenant-admin"
      ? redirect
      : payload.firstActiveHref || "/login";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        must_change_password: false,
        first_login: false,
      },
    });

    if (updateError) {
      setLoading(false);
      setError(updateError.message || "Failed to update password.");
      return;
    }

    const target = await resolveRedirect();
    setLoading(false);
    router.replace(target);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Checking session...</div>
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
          <h1 className="text-2xl font-bold text-teal-800 text-center">
            Set Your Password
          </h1>
          <p className="text-xs text-gray-400 text-center">
            Create a new password before entering your institution workspace.
          </p>
        </div>

        {error ? <div className="text-red-600 text-sm text-center">{error}</div> : null}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="bg-teal-700 text-white rounded px-6 py-2 font-medium shadow hover:bg-teal-800 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}

export default function TenantPasswordSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-sm text-gray-500">Loading password setup...</div>
        </div>
      }
    >
      <TenantPasswordSetupContent />
    </Suspense>
  );
}
