"use client";

import { useState } from "react";
import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";

type PricingPlan = {
  id: string;
  name: string;
  price: string;
  description: string;
  accent: "light" | "brand";
  iconName: IconName;
  features: Array<{
    text: string;
    iconName: IconName;
  }>;
};

const pricingPlans: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: "0.0",
    description: "Perfect for small institutions getting started",
    accent: "light",
    iconName: "file",
    features: [
      { text: "Up to 100 faculty members", iconName: "people" },
      { text: "Core teaching load features", iconName: "file" },
      { text: "Basic policy enforcement", iconName: "settings" },
      { text: "Email support", iconName: "email" },
      { text: "Monthly reports", iconName: "analytics" },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "0.0",
    description: "Ideal for growing institutions",
    accent: "brand",
    iconName: "subscription",
    features: [
      { text: "Up to 500 faculty members", iconName: "people" },
      { text: "Full feature access", iconName: "menu" },
      { text: "Advanced workflow automation", iconName: "flow" },
      { text: "Custom policy rules", iconName: "settings" },
      { text: "Priority support", iconName: "bell" },
      { text: "Real-time analytics", iconName: "analytics" },
      { text: "API access", iconName: "lock" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise (Custom)",
    price: "0.0",
    description: "For large institutions and multi-campus systems",
    accent: "light",
    iconName: "shield",
    features: [
      { text: "Unlimited faculty members", iconName: "people" },
      { text: "Multi-campus support", iconName: "location" },
      { text: "Custom policy engine", iconName: "settings" },
      { text: "Dedicated support team", iconName: "bell" },
      { text: "Advanced security features", iconName: "shield" },
      { text: "Custom integrations", iconName: "flow" },
      { text: "Training & onboarding", iconName: "hat" },
      { text: "SLA guarantee", iconName: "subscription" },
    ],
  },
];

export default function Pricing() {
  const [selectedPlanId, setSelectedPlanId] = useState(
    pricingPlans[1]?.id ?? pricingPlans[0]?.id ?? ""
  );

  return (
    <section id="pricing" className="bg-[var(--color-card)] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-display-h1 text-[var(--color-primary)]">
            Simple, Transparent Pricing
          </h2>
          <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
            Choose the plan that best fits your institution's needs
          </p>
        </div>

        {/* ✅ FIXED GRID */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;

            const cardClasses = isSelected
              ? "scale-[1.03] border-[var(--color-light-primary)] bg-[var(--color-light-primary)] text-white shadow-2xl"
              : "border-transparent bg-[#f3f3f1] text-[var(--color-high-emphasis)] shadow-lg";

            const paragraphClasses = isSelected
              ? "text-white/90"
              : "text-[var(--color-low-emphasis)]";

            const featureTextClasses = isSelected
              ? "text-white"
              : "text-[#364153]";

            const iconStrokeClasses = isSelected
              ? "[&_svg_path]:stroke-white"
              : "";

            return (
              <article
                key={plan.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => setSelectedPlanId(plan.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedPlanId(plan.id);
                  }
                }}
                className={`w-full max-w-sm flex min-h-[560px] cursor-pointer flex-col rounded-2xl border p-8 transition-all duration-300 ease-out transform-gpu ${
                  isSelected
                    ? "z-10 scale-[1.05] -translate-y-2 shadow-[0_24px_60px_rgba(7,34,24,0.25)]"
                    : "hover:shadow-xl"
                } ${cardClasses}`}        
                      >
                <h3 className="text-heading-h3">{plan.name}</h3>
                <h4 className="text-heading-h2 mt-2">{plan.price}</h4>
                <p className={`mt-2 ${paragraphClasses}`}>
                  {plan.description}
                </p>

                <div className="mt-4 flex flex-1 flex-col gap-4">
                  {plan.features.map((feature) => (
                    <div key={feature.text} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full">
                        <AppIcon
                          name={feature.iconName}
                          className={`inline-block [&_svg]:h-4 [&_svg]:w-4 ${iconStrokeClasses}`}
                          title={feature.text}
                        />
                      </span>
                      <p className={featureTextClasses}>
                        {feature.text}
                      </p>
                    </div>
                  ))}
                </div>

                <a
                  href="#contact"
                  className={`text-label-button mt-4 rounded-lg px-4 py-3 text-center transition-opacity hover:opacity-90 ${
                    isSelected
                      ? "bg-white text-[var(--color-primary)]"
                      : "bg-[var(--color-light-primary)] text-white"
                  }`}
                >
                  Get Started
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}