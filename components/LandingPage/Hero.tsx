"use client";

import { useState } from "react";
import Image from "next/image";
import { AppIcon } from "@/public/icons";
import RequestDemoModal from "@/components/LandingPage/DemoModal";

export default function Hero() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const heroImages = [
    {
      src: "/landingpage/teachingload.png",
      alt: "Teaching load optimization dashboard",
    },
    {
      src: "/landingpage/ensurecompliance.png",
      alt: "Policy compliance overview",
    },
    {
      src: "/landingpage/empowerinstitutions.png",
      alt: "Institutional analytics panel",
    },
  ];

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
              <div className="hero-orbit-shell relative flex h-[550px] w-[550px] flex-col items-center justify-center overflow-visible rounded-2xl">
                <div className="hero-orbit-ring" />
                <div className="hero-orbit-ring hero-orbit-ring-inner" />

                {heroImages.map((image, index) => (
                  <div
                    key={image.src}
                    className="hero-orbit-item"
                    style={{ animationDelay: `-${index * 4}s` }}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={330}
                      height={230}
                      className="h-full w-full rounded-2xl object-cover"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hero-orbit-shell {
          background: transparent;
          border: none;
          transform: translateX(24px);
        }

        .hero-orbit-ring {
          position: absolute;
          top: 50%;
          left: 52%;
          width: 340px;
          height: 340px;
          border-radius: 9999px;
          border: 1px dashed rgba(5, 150, 105, 0.3);
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .hero-orbit-ring-inner {
          width: 250px;
          height: 250px;
          border-style: solid;
          border-color: rgba(5, 150, 105, 0.12);
        }

        .hero-orbit-item {
          position: absolute;
          width: clamp(180px, 42vw, 320px);
          aspect-ratio: 1.5;
          border-radius: 16px;
          overflow: hidden;
          box-shadow:
            0 14px 30px rgba(7, 34, 24, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.45) inset;
          animation: heroOrbitCounterClockwise 12s cubic-bezier(0.65, 0.05, 0.36, 1)
            infinite;
          will-change: top, left, opacity, transform;
        }

        @keyframes heroOrbitCounterClockwise {
          0%,
          25% {
            top: 16%;
            left: 58%;
            opacity: 0.58;
            z-index: 1;
            transform: translate(-50%, -50%) scale(0.84);
          }

          33%,
          58% {
            top: 50%;
            left: 24%;
            opacity: 1;
            z-index: 4;
            transform: translate(-50%, -50%) scale(1.06);
          }

          66%,
          91% {
            top: 84%;
            left: 58%;
            opacity: 0.58;
            z-index: 1;
            transform: translate(-50%, -50%) scale(0.84);
          }

          100% {
            top: 16%;
            left: 58%;
            opacity: 0.58;
            z-index: 1;
            transform: translate(-50%, -50%) scale(0.84);
          }
        }

        @media (max-width: 1024px) {
          .hero-orbit-shell {
            width: 460px;
            height: 460px;
            transform: translateX(12px);
          }

          .hero-orbit-ring {
            width: 290px;
            height: 290px;
          }

          .hero-orbit-ring-inner {
            width: 210px;
            height: 210px;
          }

          .hero-orbit-item {
            width: clamp(150px, 38vw, 250px);
          }
        }
      `}</style>

      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
}
