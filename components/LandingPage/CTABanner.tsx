"use client";

import { useState } from "react";
import RequestDemoModal from "@/components/LandingPage/DemoModal";

export default function CTABanner() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <>
      <section className="bg-[var(--color-light-primary)] px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-display-h1 text-white">Ready to Transform Your Institution?</h2>
            <p className="text-body-large mt-4 text-white/90">
              Join the growing number of institutions streamlining their teaching load management with TLC Platform
            </p>
          </div>

          <div className="mt-10 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="text-label-button flex h-[50px] w-[200px] items-center justify-center gap-2 rounded-lg border border-white bg-[var(--color-card)] px-4 py-3 text-[var(--color-light-primary)] shadow-level-1 transition-opacity hover:opacity-90"
            >
              Request Demo
            </button>
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
