"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import {
  DEFAULT_TENANT_LOGO_URL,
  type TenantBranding,
} from "@/lib/tenantBranding";
import { ICON_SVGS } from "@/public/icons";

const TENANT_NAVBAR_TRANSITION_MS = 800;
const TENANT_NAVBAR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

type TenantLogoLoaderProps = {
  branding?: Partial<TenantBranding> | null;
  logoUrl?: string | null;
  logoAlt?: string;
  navbarHeight?: number;
  isDataReady: boolean;
  onAnimationComplete?: () => void;
};

export default function TenantLogoLoader({
  branding,
  logoUrl,
  logoAlt = "Tenant logo",
  navbarHeight = 72,
  isDataReady,
  onAnimationComplete,
}: TenantLogoLoaderProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [showImageLogo, setShowImageLogo] = useState(Boolean(logoUrl || branding?.logoUrl));
  const stageRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  const activeLogoUrl = logoUrl || branding?.logoUrl || DEFAULT_TENANT_LOGO_URL;

  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    setShowImageLogo(Boolean(activeLogoUrl));
  }, [activeLogoUrl]);

  useEffect(() => {
    document.body.classList.add("tenant-logo-loader-active");

    return () => {
      document.body.classList.remove(
        "tenant-logo-loader-active",
        "tenant-logo-loader-revealing",
      );
    };
  }, []);

  useEffect(() => {
    if (!isDataReady || completedRef.current) {
      return;
    }

    let finishTimer: number | undefined;

    const startExit = () => {
      const targetLogo = document.querySelector<HTMLElement>("[data-tlc-navbar-logo]");
      const loaderLogo = stageRef.current;

      if (targetLogo && loaderLogo) {
        const navbar = targetLogo.closest("nav");
        const measuredNavbarHeight = navbar?.getBoundingClientRect().height;
        const targetRect = targetLogo.getBoundingClientRect();
        const loaderRect = loaderLogo.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const loaderCenterX = loaderRect.left + loaderRect.width / 2;
        const loaderCenterY = loaderRect.top + loaderRect.height / 2;
        const targetScale = Math.min(
          targetRect.width / loaderRect.width,
          targetRect.height / loaderRect.height,
        );

        if (measuredNavbarHeight && Number.isFinite(measuredNavbarHeight)) {
          loaderLogo.parentElement?.style.setProperty(
            "--tenant-loader-navbar-height",
            `${measuredNavbarHeight}px`,
          );
        }

        loaderLogo.style.setProperty("--tenant-loader-dock-x", `${targetCenterX - loaderCenterX}px`);
        loaderLogo.style.setProperty("--tenant-loader-dock-y", `${targetCenterY - loaderCenterY}px`);
        loaderLogo.style.setProperty("--tenant-loader-dock-scale", `${targetScale}`);
      }

      completedRef.current = true;
      document.body.classList.add("tenant-logo-loader-revealing");
      setIsExiting(true);
      finishTimer = window.setTimeout(() => {
        document.body.classList.remove(
          "tenant-logo-loader-active",
          "tenant-logo-loader-revealing",
        );
        onAnimationCompleteRef.current?.();
      }, TENANT_NAVBAR_TRANSITION_MS);
    };

    const frame = window.requestAnimationFrame(startExit);

    return () => {
      window.cancelAnimationFrame(frame);

      if (finishTimer) {
        window.clearTimeout(finishTimer);
      }
    };
  }, [isDataReady]);

  return (
    <TenantBrandScope branding={branding}>
      <div
        className={`tenant-logo-loader${isExiting ? " tenant-logo-loader-exiting" : ""}`}
        role="status"
        aria-live="polite"
        aria-label="Loading tenant workspace"
        style={{
          "--tenant-loader-navbar-height": `${navbarHeight}px`,
          "--tenant-loader-transition-ms": `${TENANT_NAVBAR_TRANSITION_MS}ms`,
          "--tenant-loader-easing": TENANT_NAVBAR_EASING,
        } as CSSProperties}
      >
        <div className="tenant-logo-loader-bg" />
        <div ref={stageRef} className="tenant-logo-loader-stage" aria-hidden="true">
          <div className="tenant-logo-loader-mark">
            {showImageLogo && activeLogoUrl ? (
              <Image
                src={activeLogoUrl}
                alt=""
                width={96}
                height={96}
                unoptimized
                className="tenant-logo-loader-image"
                onError={() => setShowImageLogo(false)}
              />
            ) : (
              <span
                className="tenant-logo-loader-fallback themed-svg-icon"
                dangerouslySetInnerHTML={{ __html: ICON_SVGS.settings }}
              />
            )}
          </div>
        </div>
        <span className="sr-only">Loading workspace for {logoAlt}</span>
      </div>
    </TenantBrandScope>
  );
}
