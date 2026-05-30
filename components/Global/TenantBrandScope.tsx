"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TENANT_BRANDING,
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

type LogoPalette = Pick<
  TenantBranding,
  | "primaryColor"
  | "lightPrimaryColor"
  | "secondaryColor"
  | "accentColor"
  | "defaultColor"
  | "backgroundColor"
  | "cardColor"
>;

const componentToHex = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");

const rgbToHex = (r: number, g: number, b: number) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

const hexToRgb = (hex: string) => {
  const clean = hex.replace(/^#/, "");

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return null;
  }

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const blendHex = (base: string, overlay: string, amount: number) => {
  const baseRgb = hexToRgb(base);
  const overlayRgb = hexToRgb(overlay);

  if (!baseRgb || !overlayRgb) {
    return base;
  }

  return rgbToHex(
    baseRgb.r + (overlayRgb.r - baseRgb.r) * amount,
    baseRgb.g + (overlayRgb.g - baseRgb.g) * amount,
    baseRgb.b + (overlayRgb.b - baseRgb.b) * amount,
  );
};

const lightenHex = (hex: string, amount: number) => blendHex(hex, "#ffffff", amount);

const colorDistance = (hexA: string, hexB: string) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);

  if (!a || !b) {
    return 0;
  }

  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
};

const isNearWhite = (hex: string) => {
  const rgb = hexToRgb(hex);
  return Boolean(rgb && rgb.r > 235 && rgb.g > 235 && rgb.b > 235);
};

const deriveLogoPalette = async (logoUrl: string): Promise<LogoPalette | null> => {
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const maxDimension = 64;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.floor(bitmap.width * scale));
    const height = Math.max(1, Math.floor(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const counts = new Map<string, number>();

    for (let i = 0; i < imageData.length; i += 4) {
      if (imageData[i + 3] < 100) {
        continue;
      }

      const hex = rgbToHex((imageData[i] >> 4) << 4, (imageData[i + 1] >> 4) << 4, (imageData[i + 2] >> 4) << 4);
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }

    const colors = Array.from(counts.entries())
      .map(([color, count]) => ({ color, count }))
      .filter(({ color }) => !isNearWhite(color))
      .sort((a, b) => b.count - a.count)
      .map(({ color }) => color);

    const primary = colors[0];

    if (!primary) {
      return null;
    }

    const secondary =
      colors.find((color) => colorDistance(primary, color) > 40) ?? lightenHex(primary, 0.18);
    const accent =
      colors.find((color) => color !== secondary && colorDistance(primary, color) > 40) ?? secondary;

    return {
      primaryColor: primary,
      lightPrimaryColor: lightenHex(primary, 0.18),
      secondaryColor: secondary,
      accentColor: accent,
      defaultColor: lightenHex(primary, 0.68),
      backgroundColor: lightenHex(primary, 0.86),
      cardColor: lightenHex(primary, 0.92),
    };
  } catch {
    return null;
  }
};

const shouldDerivePaletteFromLogo = (branding?: Partial<TenantBranding> | null) =>
  Boolean(
    branding?.logoUrl &&
      branding.logoUrl !== DEFAULT_TENANT_BRANDING.logoUrl &&
      (!branding.primaryColor ||
        branding.primaryColor.toLowerCase() === DEFAULT_TENANT_BRANDING.primaryColor),
  );

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
