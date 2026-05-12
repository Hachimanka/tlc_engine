"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import type { TenantBranding } from "@/lib/tenantBranding";
import { readStoredTenantBranding } from "@/lib/tenantBrandingSession";
import { ICON_SVGS } from "@/public/icons";

type TenantLoadingScreenProps = {
  branding?: Partial<TenantBranding> | null;
  label?: string;
  useStoredBranding?: boolean;
};

export default function TenantLoadingScreen({
  branding,
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
  const logoUrl = activeBranding?.logoUrl || "";
  const logoAlt = activeBranding?.logoAlt || "Institution logo";

  return (
    <TenantBrandScope
      branding={activeBranding}
      className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4"
    >
      <div
        className="flex flex-col items-center gap-4"
        role="status"
        aria-label={label}
      >
        <div className="relative h-20 w-36" aria-hidden="true">
          <span className="absolute bottom-3 left-5 h-2 w-2 rounded-full bg-[var(--color-primary)]/25" />
          <span className="absolute bottom-3 left-[4.25rem] h-2 w-2 rounded-full bg-[var(--color-primary)]/35" />
          <span className="absolute bottom-3 right-5 h-2 w-2 rounded-full bg-[var(--color-primary)]/50" />
          <span className="tenant-logo-step-loader absolute left-0 top-0 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-default)] bg-white shadow-level-1">
            {logoUrl ? (
              <span
                className="h-10 w-10 rounded-lg bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${logoUrl}")` }}
                role="img"
                aria-label={logoAlt}
              />
            ) : activeBranding ? (
              <span className="themed-svg-icon flex h-7 w-7 items-center justify-center text-[var(--color-primary)]">
                <span dangerouslySetInnerHTML={{ __html: ICON_SVGS.settings }} />
              </span>
            ) : (
              <Image
                src="/navbar/tlclogo.png"
                alt="TLC Logo"
                width={36}
                height={36}
                priority
              />
            )}
          </span>
        </div>
      </div>
    </TenantBrandScope>
  );
}
