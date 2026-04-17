import Image from "next/image";
import { AppIcon } from "@/public/icons";

const features = [
  { label: "Multi-tenant academic system" },
  { label: "Policy-driven workload computation" },
  { label: "Automated compliance validation" },
];

export default function WhatIs() {
  return (
    <section className="bg-[var(--color-card)] px-6 py-14 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-[496px] items-center justify-center gap-[50px]">
          <div className="flex flex-1 flex-col items-start justify-center gap-6 py-0">
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

          <div className="flex flex-[0_0_auto] flex-col items-center justify-start">
            <div className="flex h-[396px] w-[650px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-background)] shadow-lg">
              <Image
                src="/jm.png"
                alt="TLC Platform Features"
                width={450}
                height={396}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
