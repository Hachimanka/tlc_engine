"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import type { TenantBranding } from "@/lib/tenantBranding";
import { saveStoredTenantBranding } from "@/lib/tenantBrandingSession";
import { supabase } from "@/lib/supabaseClient";
import { ICON_SVGS } from "@/public/icons";

type TenantAccess = {
  branding?: TenantBranding | null;
  role?: {
    name?: string;
  };
  user?: {
    fullName?: string;
    email?: string;
  };
};

export default function TenantNoAccessPage() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [access, setAccess] = useState<TenantAccess | null>(null);

  useEffect(() => {
    const loadAccess = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/tenant/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        router.replace("/login");
        return;
      }

      if (payload.firstActiveHref) {
        router.replace(payload.firstActiveHref);
        return;
      }

      setAccess(payload);
      saveStoredTenantBranding(payload.branding ?? null);
      setCheckingAccess(false);
    };

    loadAccess();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (checkingAccess) {
    return <TenantLoadingScreen label="Checking access" useStoredBranding />;
  }

  return (
    <TenantBrandScope
      branding={access?.branding ?? null}
      className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 text-[var(--color-high-emphasis)]"
    >
      <section className="w-full max-w-md rounded-lg bg-white px-6 py-6 text-center shadow-level-1">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-default)]"
          dangerouslySetInnerHTML={{ __html: ICON_SVGS.lock }}
        />
        <h1 className="text-xl font-bold">No Feature Access Yet</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-low-emphasis)]">
          {access?.role?.name || "Your role"} does not have any active workspace features assigned.
          Ask your institution admin to update this role in Roles & Feature Access.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-5 rounded-md border border-[var(--color-default)] px-4 py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
        >
          Sign out
        </button>
      </section>
    </TenantBrandScope>
  );
}
