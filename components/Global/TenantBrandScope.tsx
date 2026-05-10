"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  tenantBrandingToCssVariables,
  type TenantBranding,
} from "@/lib/tenantBranding";

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
  return (
    <div
      className={className}
      style={tenantBrandingToCssVariables(branding) as CSSProperties}
    >
      {children}
    </div>
  );
}
