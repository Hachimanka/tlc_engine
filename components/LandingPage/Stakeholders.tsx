"use client";

import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";
import { useEffect, useRef, useState } from "react";

type StakeholderCard = {
  id: string;
  iconName: IconName;
  title: string;
  description: string;
  features: string[];
};

const stakeholders: StakeholderCard[] = [
  {
    id: "administrators",
    iconName: "settings",
    title: "For Administrators",
    description:
      "Streamline workload management across departments, enforce institutional policies, and gain comprehensive oversight with powerful reporting tools.",
    features: [
      "Centralized workload management",
      "Policy compliance tracking",
      "Comprehensive analytics and reporting",
      "Automated approval workflows",
    ],
  },
  {
    id: "departments",
    iconName: "people",
    title: "For Departments",
    description:
      "Manage faculty assignments efficiently, balance teaching loads, and ensure fair distribution of courses across your department.",
    features: [
      "Department-level oversight",
      "Fair load distribution",
      "Course assignment optimization",
      "Real-time compliance alerts",
    ],
  },
  {
    id: "faculty",
    iconName: "file",
    title: "For Faculty",
    description:
      "View your teaching assignments, track your workload progress, and submit requests through a simple, intuitive interface.",
    features: [
      "Clear workload visibility",
      "Easy request submission",
      "Teaching history tracking",
      "Mobile-friendly access",
    ],
  },
];

export default function Stakeholders() {
  const sectionRef = useRef<HTMLElement>(null);
  const [motionStyles, setMotionStyles] = useState({ opacity: 0, translateY: 28 });

  useEffect(() => {
    const updateMotion = () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const fadeInProgress = Math.max(
        0,
        Math.min(1, (viewportHeight - rect.top) / (viewportHeight * 0.38)),
      );
      const fadeOutProgress = Math.max(0, Math.min(1, rect.bottom / (viewportHeight * 0.38)));
      const opacity = Math.min(fadeInProgress, fadeOutProgress);

      // Enter from below, then drift upward as the section leaves the viewport.
      const translateY = (1 - fadeInProgress) * 28 - (1 - fadeOutProgress) * 28;

      setMotionStyles({ opacity, translateY });
    };

    updateMotion();
    window.addEventListener("scroll", updateMotion, { passive: true });
    window.addEventListener("resize", updateMotion);

    return () => {
      window.removeEventListener("scroll", updateMotion);
      window.removeEventListener("resize", updateMotion);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--color-background)] px-6 py-8 md:px-10"
      style={{
        opacity: motionStyles.opacity,
        transform: `translateY(${motionStyles.translateY}px)`,
        transition: "opacity 120ms linear, transform 120ms linear",
        willChange: "opacity, transform",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-display-h1 text-[var(--color-primary)]">Built for Every Stakeholder</h2>
          <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
            TLC Platform serves the unique needs of administrators, departments, and faculty
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {stakeholders.map((stakeholder) => (
            <article
              key={stakeholder.id}
              className="rounded-[14px] bg-white p-8 shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] transition-all duration-300 ease-out transform-gpu hover:z-10 hover:scale-[1.04] hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(7,34,24,0.2)]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-light-primary)]">
                <AppIcon
                  name={stakeholder.iconName}
                  className="inline-block [&_svg]:h-8 [&_svg]:w-8 [&_svg_path]:stroke-white [&_svg_circle]:stroke-white"
                  title={stakeholder.title}
                />
              </div>

              <h3 className="text-heading-h3 mt-6 text-[var(--color-high-emphasis)]">
                {stakeholder.title}
              </h3>

              <p className="text-body-small mt-4 leading-[26px] text-[var(--color-low-emphasis)]">
                {stakeholder.description}
              </p>

              <ul className="mt-6 space-y-3">
                {stakeholder.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                    <span className="text-body-medium text-[#364153]">{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
