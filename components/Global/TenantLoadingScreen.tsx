"use client";

import { useEffect, useState } from "react";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import type { TenantBranding } from "@/lib/tenantBranding";
import { readStoredTenantBranding } from "@/lib/tenantBrandingSession";

type TenantLoadingScreenProps = {
  branding?: Partial<TenantBranding> | null;
  card?: boolean;
  className?: string;
  label?: string;
  useStoredBranding?: boolean;
};

export default function TenantLoadingScreen({
  branding,
  card = false,
  className = "flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4",
  label = "Loading workspace",
  useStoredBranding = false,
}: TenantLoadingScreenProps) {
  const [storedBranding, setStoredBranding] = useState<TenantBranding | null>(null);

  useEffect(() => {
    if (!useStoredBranding || branding?.logoUrl) {
      return;
    }

    let isMounted = true;
    const frame = window.requestAnimationFrame(() => {
      if (isMounted) {
        setStoredBranding(readStoredTenantBranding());
      }
    });

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(frame);
    };
  }, [branding?.logoUrl, useStoredBranding]);

  const activeBranding = branding ?? storedBranding;

  const skeleton = (
    <div
      className="w-full max-w-md animate-pulse"
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-12 w-12 rounded-xl bg-[var(--color-default)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-44 rounded bg-[var(--color-default)]" />
          <div className="h-3 w-28 rounded bg-[var(--color-default)]" />
        </div>
      </div>
      <div className="mt-6 space-y-3" aria-hidden="true">
        <div className="h-11 w-full rounded-lg bg-[var(--color-default)]" />
        <div className="h-11 w-full rounded-lg bg-[var(--color-default)]" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 rounded-lg bg-[var(--color-default)]" />
          <div className="h-16 rounded-lg bg-[var(--color-default)]" />
          <div className="h-16 rounded-lg bg-[var(--color-default)]" />
        </div>
        <div className="h-10 w-2/3 rounded-lg bg-[var(--color-primary)]/35" />
      </div>
    </div>
  );

  return (
    <TenantBrandScope
      branding={activeBranding}
      className={className}
    >
      {card ? (
        <div className="flex min-h-[220px] w-full max-w-md items-center justify-center rounded-xl border border-[var(--color-default)] bg-[var(--color-card)] px-8 py-10 shadow-level-1">
          {skeleton}
        </div>
      ) : (
        skeleton
      )}
    </TenantBrandScope>
  );
}
