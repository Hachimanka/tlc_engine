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
      className="w-full max-w-2xl animate-pulse"
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-12 w-12 rounded-xl bg-[var(--color-default)]" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-1/2 rounded bg-[var(--color-default)]" />
          <div className="h-3 w-2/3 rounded bg-[var(--color-default)]" />
        </div>
      </div>
      <div className="mt-8 space-y-4" aria-hidden="true">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-[var(--color-default)]" />
          <div className="h-11 w-full rounded-lg bg-[var(--color-default)]" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-[var(--color-default)]" />
          <div className="h-11 w-full rounded-lg bg-[var(--color-default)]" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-20 rounded-lg bg-[var(--color-default)]" />
          <div className="h-20 rounded-lg bg-[var(--color-default)]" />
          <div className="h-20 rounded-lg bg-[var(--color-default)]" />
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-default)] pt-5">
          <div className="h-10 w-24 rounded-lg bg-[var(--color-default)]" />
          <div className="h-10 w-32 rounded-lg bg-[var(--color-primary)]/35" />
        </div>
      </div>
    </div>
  );

  return (
    <TenantBrandScope
      branding={activeBranding}
      className={className}
    >
      {card ? (
        <div className="flex min-h-[360px] w-full max-w-2xl items-center justify-center rounded-2xl border border-[var(--color-default)] bg-[var(--color-card)] p-8 shadow-level-1">
          {skeleton}
        </div>
      ) : (
        skeleton
      )}
    </TenantBrandScope>
  );
}
