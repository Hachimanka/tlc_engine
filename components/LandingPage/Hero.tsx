"use client";

import { useState } from "react";
import Image from "next/image";
import { AppIcon } from "@/public/icons";
import RequestDemoModal from "@/components/LandingPage/DemoModal";

export default function Hero() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <>
      <section className="bg-[var(--color-background)] px-6 py-14 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-[550px] items-center justify-center gap-[100px]">
            <div className="flex flex-1 flex-col items-start justify-center gap-6 py-0">
              <div className="flex w-full items-start gap-2.5">
                <h1 className="text-display-h1 text-[var(--color-primary)]">
                  Streamline Teaching Loads. Ensure Compliance. Empower Institutions.
                </h1>
              </div>

              <div className="w-full">
                <p className="text-body-large text-[var(--color-low-emphasis)]">
                  Automate faculty workload management, enforce institutional policies, and gain real-time insights with the TLC Platform.
                </p>
              </div>

              <div className="flex w-full items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="flex h-[50px] w-[180px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 shadow-lg transition-opacity hover:opacity-90"
                >
                  <span className="text-label-button text-white">Request a Demo</span>
                </button>
              </div>

              <div className="flex w-full items-center gap-3 pt-4">
                <div className="inline-flex flex-[0_0_auto] items-center justify-center rounded-full px-0 py-0">
                  <AppIcon
                    name="checkMarked"
                    className="inline-block [&_svg]:h-8 [&_svg]:w-8"
                    title="Checked"
                  />
                </div>
                <p className="text-body-small text-[var(--color-low-emphasis)]">
                  Trusted by academic institutions nationwide
                </p>
              </div>
            </div>

            <div className="flex flex-[0_0_auto] flex-col items-center justify-center">
              <div className="relative flex h-[550px] w-[550px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-card)] shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]">
                  <Image
                    src="/ad.png"
                    alt="Marketing"
                    width={550}
                    height={550}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
}
