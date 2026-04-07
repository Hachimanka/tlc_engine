import { Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "Contact Us",
    tagline: "Perfect for small institutions getting started",
    features: [
      "Up to 50 faculty members",
      "Core load management",
      "Basic policy engine",
      "Email support",
      "Standard reports",
    ],
    featured: false,
    cta: "Get Started",
  },
  {
    name: "Professional",
    price: "Contact Us",
    tagline: "Ideal for mid-sized institutions requiring advanced tools",
    features: [
      "Unlimited faculty members",
      "Advanced policy engine",
      "Multi-department support",
      "Approval workflows",
      "Priority support",
      "Custom reports",
    ],
    featured: true,
    cta: "Get Started",
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "For large university systems with complex requirements",
    features: [
      "Multi-campus architecture",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
      "Advanced analytics",
      "Training & onboarding",
    ],
    featured: false,
    cta: "Contact Sales",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl mb-4" style={{ color: "var(--text-dark)" }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-base" style={{ color: "var(--text-mid)" }}>
            Choose a plan built for your institution's needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(({ name, price, tagline, features, featured, cta }) => (
            <div
              key={name}
              className={`rounded-2xl p-8 border ${featured ? "shadow-2xl" : "shadow-sm"}`}
              style={{
                background: featured ? "var(--teal-primary)" : "white",
                border: featured ? "2px solid var(--teal-primary)" : "1px solid #e4ece9",
                transform: featured ? "scale(1.03)" : "scale(1)",
              }}
            >
              {featured && (
                <div
                  className="inline-flex text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wider"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                >
                  Most Popular
                </div>
              )}

              <h3
                className="text-xl mb-1"
                style={{ color: featured ? "white" : "var(--text-dark)", fontFamily: "'DM Serif Display', serif" }}
              >
                {name}
              </h3>
              <div
                className="text-2xl font-bold mb-2"
                style={{ color: featured ? "white" : "var(--teal-primary)", fontFamily: "'DM Serif Display', serif" }}
              >
                {price}
              </div>
              <p className="text-sm mb-6" style={{ color: featured ? "rgba(255,255,255,0.75)" : "var(--text-light)" }}>
                {tagline}
              </p>

              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={15}
                      style={{ color: featured ? "rgba(255,255,255,0.9)" : "var(--teal-primary)", marginTop: 2, flexShrink: 0 }}
                    />
                    <span style={{ color: featured ? "rgba(255,255,255,0.85)" : "var(--text-mid)" }}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className="block text-center text-sm font-semibold py-3 px-6 rounded-lg transition-all hover:opacity-90"
                style={
                  featured
                    ? { background: "white", color: "var(--teal-primary)" }
                    : { background: "var(--teal-primary)", color: "white" }
                }
              >
                {cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
