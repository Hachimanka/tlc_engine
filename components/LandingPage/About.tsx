"use client";

import Image from "next/image";

const aboutImages = [
  {
    src: "/landingpage/About/SuperAdminDashboard.png",
    alt: "Super admin dashboard view",
  },
  {
    src: "/landingpage/About/PeopleWorkingTogether.png",
    alt: "People collaborating together",
  },
  {
    src: "/landingpage/About/FutureImprovements.png",
    alt: "Future-ready education management",
  },
];

export default function About() {
  return (
    <section id="about" className="bg-[var(--color-background)] px-6 py-8 md:px-10 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-10 lg:min-h-[700px] lg:flex-row lg:items-center lg:gap-12">
          <div className="flex w-full flex-1 items-center justify-center lg:justify-start">
            <div className="w-full max-w-[700px] text-center lg:text-left">
              <h2 className="text-heading-h2 text-[var(--color-primary)]">About</h2>

              <div className="mt-6 space-y-6">
                <p className="text-body-large leading-[1.46] text-[var(--color-low-emphasis)]">
                  <span className="font-bold text-[var(--color-high-emphasis)]">Our Mission:</span>{" "}
                  To modernize academic workload management through automation and policy-driven systems.
                </p>

                <p className="text-body-large leading-[1.46] text-[var(--color-low-emphasis)]">
                  The TLC Platform was born from years of experience working with academic institutions
                  struggling with manual workload tracking, inconsistent policy enforcement, and limited
                  visibility into faculty assignments.
                </p>

                <p className="text-body-large leading-[1.46] text-[var(--color-low-emphasis)]">
                  We believe that education administrators deserve modern tools that match the complexity
                  of their work. Our platform combines advanced technology with deep understanding of
                  academic operations to deliver a solution that truly works.
                </p>

                <p className="text-body-large leading-[1.46] text-[var(--color-low-emphasis)]">
                  Today, we are proud to serve institutions across the country, helping them streamline
                  operations, ensure compliance, and focus on what matters most: delivering quality
                  education.
                </p>
              </div>
            </div>
          </div>

          <div className="about-visual-wrap hidden flex-1 items-center justify-center lg:flex">
            <div className="about-visual-shell relative h-[650px] w-full max-w-[885px] overflow-visible">

              {aboutImages.map((image, index) => (
                <div
                  key={image.src}
                  className="about-visual-item"
                  style={{ animationDelay: `-${index * 6}s` }}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={760}
                    height={420}
                    className="h-full w-full rounded-2xl object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .about-visual-wrap {
          display: none;
        }

        .about-visual-shell {
          border: none;
          background: transparent;
        }

        .about-visual-item {
          position: absolute;
          left: 50%;
          width: min(760px, calc(100% - 120px));
          aspect-ratio: 1.8;
          overflow: hidden;
          border-radius: 16px;
          box-shadow:
            0 20px 50px rgba(7, 34, 24, 0.16),
            0 0 0 1px rgba(255, 255, 255, 0.45) inset;
          animation: aboutVerticalRotate 18s cubic-bezier(0.65, 0.05, 0.36, 1) infinite;
          will-change: top, opacity, transform;
        }

        @keyframes aboutVerticalRotate {
          0%,
          28% {
            top: 20%;
            opacity: 0.62;
            z-index: 1;
            transform: translate(-50%, -50%) scale(0.9);
          }

          36%,
          61% {
            top: 50%;
            opacity: 1;
            z-index: 3;
            transform: translate(-50%, -50%) scale(1);
          }

          69%,
          94% {
            top: 80%;
            opacity: 0.62;
            z-index: 1;
            transform: translate(-50%, -50%) scale(0.9);
          }

          100% {
            top: 20%;
            opacity: 0.62;
            z-index: 1;
            transform: translate(-50%, -50%) scale(0.9);
          }
        }

        @media (max-width: 1024px) {
          .about-visual-wrap {
            display: none !important;
          }

          .about-visual-shell {
            height: 520px;
          }

          .about-visual-item {
            width: min(620px, calc(100% - 72px));
          }
        }

        @media (min-width: 1025px) {
          .about-visual-wrap {
            display: flex;
          }
        }
      `}</style>
    </section>
  );
}
