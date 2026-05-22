"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import {
  tenantBrandingToCssVariables,
  type TenantBranding,
} from "@/lib/tenantBranding";
import { readStoredTenantBranding } from "@/lib/tenantBrandingSession";

type TenantBrandScopeProps = {
  branding?: Partial<TenantBranding> | null;
  className?: string;
  children: ReactNode;
};

export default function TenantBrandScope({
  branding,
  className,
  children,
}: TenantBrandScopeProps) {
  const [storedBranding] = useState<TenantBranding | null>(() =>
    readStoredTenantBranding(),
  );
  const activeBranding = branding ?? storedBranding;

  return (
    <div
      className={className}
      style={tenantBrandingToCssVariables(activeBranding) as CSSProperties}
    >
      {children}
    </div>
  );
}
