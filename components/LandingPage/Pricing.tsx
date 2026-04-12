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
  return (
    <section id="pricing" className="bg-[var(--color-card)] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-display-h1 text-[var(--color-primary)]">
            Simple, Transparent Pricing
          </h2>
          <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
            Choose the plan that best fits your institution's needs
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const isBrand = plan.accent === "brand";

            return (
              <article
                key={plan.id}
                className={`flex min-h-[560px] flex-col rounded-2xl p-8 shadow-lg ${
                  isBrand
                    ? "bg-[var(--color-light-primary)] text-white"
                    : "bg-[#f3f3f1] text-[var(--color-high-emphasis)]"
                }`}
              >
                <h3 className="text-heading-h3">{plan.name}</h3>
                <h4 className="text-heading-h2 mt-2">{plan.price}</h4>
                <p className={`mt-2 ${isBrand ? "text-white/90" : "text-[var(--color-low-emphasis)]"}`}>
                  {plan.description}
                </p>

                <div className="mt-4 flex flex-1 flex-col gap-4">
                  {plan.features.map((feature) => (
                    <div key={feature.text} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full">
                        <AppIcon
                          name={feature.iconName}
                          className={`inline-block [&_svg]:h-4 [&_svg]:w-4 ${isBrand ? "[&_svg_path]:stroke-white" : ""}`}
                          title={feature.text}
                        />
                      </span>
                      <p className={isBrand ? "text-white" : "text-[#364153]"}>{feature.text}</p>
                    </div>
                  ))}
                </div>

                <a
                  href="#contact"
                  className={`text-label-button mt-4 rounded-lg px-4 py-3 text-center transition-opacity hover:opacity-90 ${
                    isBrand
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
