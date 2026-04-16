"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/public/icons";

const features = [
  { label: "Multi-tenant academic system" },
  { label: "Policy-driven workload computation" },
  { label: "Automated compliance validation" },
];

const whatIsImages = [
  {
    src: "/landingpage/WhatIs/IAAcademicSetup.png",
    alt: "Academic setup interface",
  },
  {
    src: "/landingpage/WhatIs/IADashboard.png",
    alt: "Dashboard overview interface",
  },
  {
    src: "/landingpage/WhatIs/IAPolicies.png",
    alt: "Policies management interface",
  },
  {
    src: "/landingpage/WhatIs/IAUserManagement.png",
    alt: "User management interface",
  },
];

export default function WhatIs() {
  const sectionRef = useRef<HTMLElement>(null);
  const [sectionOpacity, setSectionOpacity] = useState(0);

  useEffect(() => {
    const updateOpacity = () => {
      const sectionElement = sectionRef.current;

      if (!sectionElement) {
        return;
      }

      const rect = sectionElement.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const sectionCenter = rect.top + rect.height / 2;
      const maxDistance = window.innerHeight * 0.75;
      const distance = Math.abs(sectionCenter - viewportCenter);
      const nextOpacity = Math.max(0, Math.min(1, 1 - distance / maxDistance));

      setSectionOpacity(nextOpacity);
    };

    updateOpacity();
    window.addEventListener("scroll", updateOpacity, { passive: true });
    window.addEventListener("resize", updateOpacity);

    return () => {
      window.removeEventListener("scroll", updateOpacity);
      window.removeEventListener("resize", updateOpacity);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--color-card)] px-6 py-14 md:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex h-[496px] items-center justify-center gap-[50px]">
          <div
            className="flex flex-1 flex-col items-start justify-center gap-6 py-0"
            style={{
              opacity: sectionOpacity,
              transform: `translateX(${-Math.round((1 - sectionOpacity) * 56)}px)`,
              transition: "opacity 120ms linear, transform 120ms linear",
              willChange: "opacity, transform",
            }}
          >
            <div className="w-full">
              <h2 className="text-display-h1 text-[var(--color-primary)]">
                What is the TLC Platform?
              </h2>
            </div>

            <div className="w-full">
              <p className="text-body-large text-[var(--color-low-emphasis)]">
                The Teaching Load Compliance Platform is a comprehensive solution designed to modernize academic workload management. Our system helps institutions enforce policies, automate complex calculations, and maintain compliance across all departments.
              </p>
            </div>

            <div className="flex w-full flex-col gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <AppIcon
                      name="checkMarked"
                      className="inline-block [&_svg]:h-8 [&_svg]:w-8"
                      title="Checked"
                    />
                  </div>
                  <span className="text-body-small text-[var(--color-low-emphasis)]">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex flex-[0_0_auto] flex-col items-center justify-start"
            style={{
              opacity: sectionOpacity,
              transform: `translateX(${Math.round((1 - sectionOpacity) * 56)}px)`,
              transition: "opacity 120ms linear, transform 120ms linear",
              willChange: "opacity, transform",
            }}
          >
            <div className="relative grid h-[396px] w-[650px] grid-cols-2 grid-rows-2 gap-4 overflow-visible rounded-2xl bg-transparent p-4">
              {whatIsImages.map((image) => (
                <div
                  key={image.src}
                  className="overflow-hidden rounded-xl shadow-[0_18px_40px_rgba(7,34,24,0.16)]"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={300}
                    height={180}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}

              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-primary)] p-3 shadow-[0_12px_30px_rgba(7,34,24,0.35)]">
                <Image
                  src="/TLCLogo.svg"
                  alt="TLC Platform logo"
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
