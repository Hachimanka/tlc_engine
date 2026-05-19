"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Global/navbar";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import type { TenantBranding } from "@/lib/tenantBranding";
import { saveStoredTenantBranding } from "@/lib/tenantBrandingSession";
import {
  buildTenantLoginUrl,
  buildTenantMeUrl,
  getExpectedTenantSlug,
  isOrgSlugMismatch,
} from "@/lib/tenantRoute";
import { isRecoverableSupabaseSessionError } from "@/lib/supabaseAuthErrors";
import { supabase } from "@/lib/supabaseClient";
import { ICON_SVGS } from "@/public/icons";

type NoAccessState = {
  branding?: TenantBranding | null;
  org?: {
    name?: string;
    slug?: string;
  };
  user?: {
    fullName?: string;
    email?: string;
    avatarUrl?: string | null;
  };
  role?: {
    name?: string;
  };
};

export default function TenantNoAccessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [access, setAccess] = useState<NoAccessState | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAccess = async () => {
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

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          router.replace(loginUrl);
          return;
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
            router.replace(loginUrl);
            return;
          }

          setError(payload?.error || "Unable to load your account access.");
          setIsLoading(false);
          return;
        }

        if (payload.firstActiveHref) {
          router.replace(payload.firstActiveHref);
          return;
        }

        setAccess(payload);
        saveStoredTenantBranding(payload.branding ?? null);
        setIsLoading(false);
      } catch {
        setError("Unable to reach the authentication service. Please try again.");
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  if (isLoading) {
    return <TenantLoadingScreen label="Checking access" useStoredBranding />;
  }

  return (
    <TenantBrandScope
      branding={access?.branding}
      className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-high-emphasis)]"
    >
      <Navbar
        branding={access?.branding}
        organizationName={access?.org?.name}
        organizationSlug={access?.org?.slug}
        profile={{
          displayName: access?.user?.fullName,
          email: access?.user?.email,
          roleName: access?.role?.name,
          avatarUrl: access?.user?.avatarUrl ?? "",
        }}
      />
      <main className="flex flex-1 items-center justify-center p-6">
        <section className="max-w-md rounded-lg bg-white px-6 py-6 text-center shadow-level-1">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-default)] text-[var(--color-primary)]"
            dangerouslySetInnerHTML={{ __html: ICON_SVGS.lock }}
          />
          <h1 className="text-xl font-bold text-[var(--color-high-emphasis)]">
            No access assigned
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-low-emphasis)]">
            {error ||
              "Your role has no features assigned yet. Please contact your institution admin."}
          </p>
        </section>
      </main>
    </TenantBrandScope>
  );
}
