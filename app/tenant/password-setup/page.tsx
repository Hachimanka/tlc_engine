"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import type { TenantBranding } from "@/lib/tenantBranding";
import {
  readStoredTenantBranding,
  saveStoredTenantBranding,
} from "@/lib/tenantBrandingSession";
import {
  buildTenantLoginUrl,
  buildTenantMeUrl,
  getExpectedTenantSlug,
  isOrgSlugMismatch,
} from "@/lib/tenantRoute";
import { isRecoverableSupabaseSessionError } from "@/lib/supabaseAuthErrors";
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
  const [branding, setBranding] = useState<TenantBranding | null>(() =>
    readStoredTenantBranding(),
  );
  const logoUrl = branding?.logoUrl || "";
  const logoAlt = branding?.logoAlt || "TLC Logo";

  useEffect(() => {
    const checkSession = async () => {
      const expectedSlug = getExpectedTenantSlug();
      const loginUrl = buildTenantLoginUrl(expectedSlug);

      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError && isRecoverableSupabaseSessionError(userError)) {
          await supabase.auth.signOut({ scope: "local" });
          router.replace(loginUrl);
          return;
        }

        if (userError) {
          throw userError;
        }

        if (!data?.user) {
          router.replace(loginUrl);
          return;
        }

        const userMetadata = data.user.user_metadata as UserMetadata;

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          router.replace(loginUrl);
          return;
        }

        try {
          const response = await fetch(buildTenantMeUrl(expectedSlug), {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const payload = await response.json().catch(() => ({}));

          if (!response.ok) {
            if (isOrgSlugMismatch(payload)) {
              await supabase.auth.signOut({ scope: "local" });
              router.replace(loginUrl);
              return;
            }

            throw new Error(payload?.error || "Unable to verify organization access.");
          }

          if (payload?.branding) {
            setBranding(payload.branding);
            saveStoredTenantBranding(payload.branding);
          }
        } catch {
          setError("Unable to verify organization access. Please try again.");
          setCheckingSession(false);
          return;
        }

        if (userMetadata?.onboarding_complete === false && userMetadata?.role === "org_admin") {
          router.replace("/tenant/onboarding");
          return;
        }

        setMetadata(userMetadata);
        setCheckingSession(false);
      } catch {
        setError("Unable to reach Supabase Auth. Please check your connection and try again.");
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [router]);

  const resolveRedirect = async () => {
    const redirect = searchParams?.get("redirect");
    const expectedSlug = getExpectedTenantSlug();

    if (metadata?.role === "org_admin") {
      return redirect || "/tenant/tenant-admin";
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        return buildTenantLoginUrl(expectedSlug);
      }

      const response = await fetch(buildTenantMeUrl(expectedSlug), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (isOrgSlugMismatch(payload)) {
          await supabase.auth.signOut({ scope: "local" });
        }

        return buildTenantLoginUrl(expectedSlug);
      }

      const assignedRedirect = payload.firstActiveHref || "/tenant/no-access";

      return assignedRedirect === "/tenant/no-access"
        ? assignedRedirect
        : redirect && redirect !== "/tenant/tenant-admin"
          ? redirect
          : assignedRedirect;
    } catch {
      return buildTenantLoginUrl(expectedSlug);
    }
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

    let updateResult;

    try {
      updateResult = await supabase.auth.updateUser({
        password,
        data: {
          must_change_password: false,
          first_login: false,
        },
      });
    } catch {
      setLoading(false);
      setError("Unable to reach Supabase Auth. Please check your connection and try again.");
      return;
    }

    const { error: updateError } = updateResult;

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
      <TenantLoadingScreen
        branding={branding}
        label="Checking session"
        useStoredBranding
      />
    );
  }

  return (
    <TenantBrandScope
      branding={branding}
      className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--color-card)] rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2">
          {logoUrl ? (
            <span
              className="h-12 w-12 rounded-md bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${logoUrl}")` }}
              role="img"
              aria-label={logoAlt}
            />
          ) : (
            <Image src="/navbar/tlclogo.png" alt="TLC Logo" width={48} height={48} />
          )}
          <h1 className="text-2xl font-bold text-[var(--color-primary)] text-center">
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
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-light-primary)]"
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
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-light-primary)]"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="bg-[var(--color-primary)] text-white rounded px-6 py-2 font-medium shadow hover:bg-[var(--color-light-primary)] transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </TenantBrandScope>
  );
}

export default function TenantPasswordSetupPage() {
  return (
    <Suspense
      fallback={<TenantLoadingScreen label="Loading password setup" useStoredBranding />}
    >
      <TenantPasswordSetupContent />
    </Suspense>
  );
}
