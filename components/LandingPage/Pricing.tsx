"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";
import { supabase } from "@/lib/supabaseClient";

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

type SubscriptionPlan = {
  id: string;
  name: string;
  price: number | null;
  description: string | null;
  features: string[] | null;
  badge: string | null;
  color: string | null;
  is_active: boolean | null;
};

const featureIconCycle: IconName[] = [
  "people",
  "file",
  "settings",
  "analytics",
  "bell",
  "lock",
  "flow",
  "subscription",
  "shield",
  "checkMarked",
];

const planIconCycle: IconName[] = [
  "file",
  "subscription",
  "shield",
  "analytics",
  "settings",
];

const formatPrice = (price: number) => {
  if (!Number.isFinite(price) || price <= 0) return "Free";
  return `$${price}/mo`;
};

const pickPlanIcon = (planName: string, index: number): IconName => {
  const normalized = planName.toLowerCase();
  if (normalized.includes("starter") || normalized.includes("basic")) return "file";
  if (normalized.includes("pro")) return "subscription";
  if (normalized.includes("premium")) return "analytics";
  if (normalized.includes("enterprise")) return "shield";
  return planIconCycle[index % planIconCycle.length];
};

const pickFeatureIcon = (index: number): IconName =>
  featureIconCycle[index % featureIconCycle.length];

export default function Pricing() {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPlans = async () => {
      setLoading(true);
      setError("");
      const { data, error: fetchError } = await supabase
        .from("subscription_plans")
        .select("id, name, price, description, features, badge, color, is_active")
        .order("price", { ascending: true });

      if (!isMounted) return;

      if (fetchError) {
        setError("Unable to load pricing at the moment.");
        setPricingPlans([]);
        setLoading(false);
        return;
      }

      const activePlans = (data || []).filter((plan: SubscriptionPlan) => {
        if (plan.is_active === false) return false;
        const name = (plan.name || "").toLowerCase();
        return !name.includes("starter");
      });

      const normalized = activePlans.map((plan: SubscriptionPlan, index: number) => {
        const features = Array.isArray(plan.features) && plan.features.length > 0
          ? plan.features
          : ["Core platform access"];
        return {
          id: plan.id,
          name: plan.name,
          price: formatPrice(plan.price ?? 0),
          description: plan.description || "Flexible plan built for institutional needs",
          accent: plan.badge ? "brand" : "light",
          iconName: pickPlanIcon(plan.name, index),
          features: features.map((text, featureIndex) => ({
            text,
            iconName: pickFeatureIcon(featureIndex),
          })),
        } as PricingPlan;
      });

      setPricingPlans(normalized);
      setLoading(false);
    };

    fetchPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (pricingPlans.length === 0) return;
    if (pricingPlans.some((plan) => plan.id === selectedPlanId)) return;

    const preferred = pricingPlans.find((plan) => plan.accent === "brand") || pricingPlans[0];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (preferred) setSelectedPlanId(preferred.id);
  }, [pricingPlans, selectedPlanId]);

  return (
    <section id="pricing" className="bg-[var(--color-card)] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-display-h1 text-[var(--color-primary)]">
            Simple, Transparent Pricing
          </h2>
          <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
            Choose the plan that best fits your institution&apos;s needs
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-5 lg:grid-cols-3 lg:gap-8">
          {loading ? (
            <div className="col-span-full text-body-medium text-[var(--color-low-emphasis)]">
              Loading pricing...
            </div>
          ) : error ? (
            <div className="col-span-full text-body-medium text-red-500">
              {error}
            </div>
          ) : pricingPlans.length === 0 ? (
            <div className="col-span-full text-body-medium text-[var(--color-low-emphasis)]">
              No active plans available.
            </div>
          ) : (
            pricingPlans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const isExpanded = isSelected;

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
                className={`w-full max-w-sm flex cursor-pointer flex-col rounded-2xl border p-6 transition-all duration-300 ease-out transform-gpu lg:min-h-[560px] lg:p-8 ${
                  isSelected
                    ? "z-10 scale-[1.02] -translate-y-1 shadow-[0_24px_60px_rgba(7,34,24,0.25)]"
                    : "hover:shadow-xl lg:scale-100 lg:translate-y-0"
                } ${cardClasses} ${
                  isExpanded ? "min-h-[420px] sm:min-h-[460px]" : "min-h-[170px] sm:min-h-[190px]"
                } overflow-hidden`}
              >
                <h3 className="text-heading-h3">{plan.name}</h3>
                <h4 className="text-heading-h2 mt-2">{plan.price}</h4>
                <p className={`mt-2 ${paragraphClasses}`}>
                  {plan.description}
                </p>

                <div className={`mt-4 flex flex-1 flex-col gap-4 ${isExpanded ? "" : "hidden lg:flex"}`}>
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
                    isExpanded ? "" : "hidden lg:block"
                  } ${
                    isSelected
                      ? "bg-white text-[var(--color-primary)]"
                      : "bg-[var(--color-light-primary)] text-white"
                  }`}
                >
                  Get Started
                </a>
              </article>
            );
          })
          )}
        </div>
      </div>
    </section>
  );
}
