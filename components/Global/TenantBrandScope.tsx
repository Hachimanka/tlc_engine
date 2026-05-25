"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  tenantBrandingToCssVariables,
  type TenantBranding,
} from "@/lib/tenantBranding";
import { readStoredTenantBranding } from "@/lib/tenantBrandingSession";

type TenantBrandScopeProps = {
  branding?: Partial<TenantBranding> | null;
  className?: string;
  applyToDocument?: boolean;
  lockDocumentScroll?: boolean;
  children: ReactNode;
};

export default function TenantBrandScope({
  branding,
  className,
  applyToDocument = false,
  lockDocumentScroll = false,
  children,
}: TenantBrandScopeProps) {
  const [storedBranding] = useState<TenantBranding | null>(() =>
    branding ? null : readStoredTenantBranding(),
  );

  const activeBranding = branding ?? storedBranding;
  const cssVariables = useMemo(
    () => tenantBrandingToCssVariables(activeBranding),
    [activeBranding],
  );

  useEffect(() => {
    if (!applyToDocument || typeof document === "undefined") {
      return;
    }

    const roots = [document.documentElement, document.body];
    const previousValues = roots.map((root) => ({
      root,
      hadClass: root.classList.contains("tenant-branded-scrollbars"),
      variables: Object.fromEntries(
        Object.keys(cssVariables).map((name) => [
          name,
          root.style.getPropertyValue(name),
        ]),
      ),
      overflow: root.style.overflow,
    }));

    roots.forEach((root) => {
      root.classList.add("tenant-branded-scrollbars");
      Object.entries(cssVariables).forEach(([name, value]) => {
        root.style.setProperty(name, value);
      });

      if (lockDocumentScroll) {
        root.style.overflow = "hidden";
      }
    });

    return () => {
      previousValues.forEach(({ root, hadClass, variables, overflow }) => {
        Object.entries(variables).forEach(([name, value]) => {
          if (value) {
            root.style.setProperty(name, value);
          } else {
            root.style.removeProperty(name);
          }
        });

        if (!hadClass) {
          root.classList.remove("tenant-branded-scrollbars");
        }

        root.style.overflow = overflow;
      });
    };
  }, [applyToDocument, cssVariables, lockDocumentScroll]);

  const scopeClassName = ["tenant-branded-scrollbars", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={scopeClassName}
      style={cssVariables as CSSProperties}
    >
      {children}
    </div>
  );
}
