"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import type { TenantBranding } from "@/lib/tenantBranding";
import {
  clearStoredTenantBranding,
  saveStoredTenantBranding,
} from "@/lib/tenantBrandingSession";
import { isRecoverableSupabaseSessionError } from "@/lib/supabaseAuthErrors";
import { supabase } from "@/lib/supabaseClient";
import { ICON_SVGS } from "@/public/icons";

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
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const logoUrl = branding?.logoUrl || "";
  const logoAlt = branding?.logoAlt || "TLC Logo";
  const hasInstitutionBranding = Boolean(branding);

  const getAssignedFeatureRedirect = async () => {
    try {
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

      return payload.firstActiveHref || "/tenant/no-access";
    } catch {
      return "/login";
    }
  };

  const redirectAfterLogin = async (
    metadata: UserMetadata | null | undefined,
    options: { resolveAssignedFeature?: boolean } = {},
  ) => {
    const resolveAssignedFeature = options.resolveAssignedFeature ?? true;
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

    if (!resolveAssignedFeature) {
      return;
    }

    const assignedRedirect = await getAssignedFeatureRedirect();
    router.replace(
      assignedRedirect === "/tenant/no-access"
        ? assignedRedirect
        : redirect && redirect !== "/tenant/tenant-admin"
          ? redirect
          : assignedRedirect,
    );
  };

  useEffect(() => {
    const loadPublicBranding = async () => {
      const querySlug = searchParams?.get("org") || searchParams?.get("slug");
      const host = window.location.hostname;
      const subdomain = host.split(".")[0];
      const slug =
        querySlug ||
        (!["admin", "localhost", "www", "yourapp"].includes(subdomain) && host.includes(".")
          ? subdomain
          : "");

      if (!slug) {
        clearStoredTenantBranding();
        return;
      }

      try {
        const response = await fetch(`/api/tenant/branding/public?slug=${encodeURIComponent(slug)}`);
        const payload = await response.json().catch(() => ({}));

        if (response.ok && payload?.branding) {
          setBranding(payload.branding);
          saveStoredTenantBranding(payload.branding);
        }
      } catch {
        setBranding(null);
        clearStoredTenantBranding();
      }
    };

    const checkSession = async () => {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError && !isRecoverableSupabaseSessionError(userError)) {
          throw userError;
        }

        if (userError) {
          await supabase.auth.signOut({ scope: "local" });
        }

        if (data?.user) {
          await redirectAfterLogin(data.user.user_metadata as UserMetadata, {
            resolveAssignedFeature: false,
          });
          return;
        }
      } catch {
        await supabase.auth.signOut({ scope: "local" });
      }
    };

    loadPublicBranding();
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

    let signInResult;

    try {
      signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } catch {
      setLoading(false);
      setError("Unable to reach Supabase Auth. Please check your connection and try again.");
      return;
    }

    const { data, error: signInError } = signInResult;

    setLoading(false);

    if (signInError) {
      setError("Invalid credentials or user does not exist.");
      return;
    }

    await redirectAfterLogin(data.user?.user_metadata as UserMetadata);
  };

  if (loading) {
    return <TenantLoadingScreen branding={branding} label="Signing in" />;
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
          ) : hasInstitutionBranding ? (
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--color-default)] text-[var(--color-primary)]">
              <span
                className="themed-svg-icon flex h-6 w-6 items-center justify-center"
                dangerouslySetInnerHTML={{ __html: ICON_SVGS.settings }}
              />
            </span>
          ) : (
            <Image src="/navbar/tlclogo.png" alt="TLC Logo" width={48} height={48} />
          )}
          <h1 className="text-2xl font-bold text-[var(--color-primary)] text-center">
            {branding?.loginTitle || "Institution Login"}
          </h1>
          <p className="text-xs text-gray-400 text-center">
            {branding?.loginSubtitle || "Use your organization account credentials."}
          </p>
        </div>

        {error ? <div className="text-red-600 text-sm text-center">{error}</div> : null}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-light-primary)]"
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
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-light-primary)]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="bg-[var(--color-primary)] text-white rounded px-6 py-2 font-medium shadow hover:bg-[var(--color-light-primary)] transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </TenantBrandScope>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<TenantLoadingScreen label="Loading login" />}
    >
      <LoginContent />
    </Suspense>
  );
}
