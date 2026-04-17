import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";

type FeatureCard = {
  id: number;
  iconName: IconName;
  title: string;
  description: string;
};

const featureRowOne: FeatureCard[] = [
  {
    id: 1,
    iconName: "file",
    title: "Teaching Load Automation",
    description:
      "Automatically calculate faculty teaching loads based on institutional policies and course assignments.",
  },
  {
    id: 2,
    iconName: "settings",
    title: "Policy Enforcement Engine",
    description:
      "Define and enforce complex institutional policies with our flexible rule-based system.",
  },
  {
    id: 3,
    iconName: "analytics",
    title: "Multi-Tenant Architecture",
    description:
      "Secure, scalable platform supporting multiple institutions with complete data isolation.",
  },
];

const featureRowTwo: FeatureCard[] = [
  {
    id: 4,
    iconName: "shield",
    title: "Role-Based Access Control",
    description:
      "Granular permissions ensure users only access information relevant to their role.",
  },
  {
    id: 5,
    iconName: "flow",
    title: "Approval Workflow System",
    description:
      "Streamlined approval processes for course assignments and load adjustments.",
  },
  {
    id: 6,
    iconName: "signal",
    title: "Real-Time Compliance Monitoring",
    description:
      "Track compliance status in real-time with alerts for policy violations and exceptions.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-[var(--color-background)] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-display-h1 text-[var(--color-primary)]">
            Powerful Features for Modern Institutions
          </h2>
          <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
            Everything you need to manage teaching loads, enforce policies, and maintain compliance
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 overflow-visible lg:grid-cols-3">
          {featureRowOne.map((feature) => (
            <article
              key={feature.id}
              className="group min-h-[250px] rounded-[10px] bg-[var(--color-card)] p-6 shadow-lg transition-all duration-300 ease-out transform-gpu hover:z-10 hover:scale-[1.04] hover:-translate-y-1 hover:bg-[var(--color-light-primary)] hover:shadow-[0_24px_60px_rgba(7,34,24,0.18)]"
            >
              <div className="flex h-[75px] w-[75px] items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 transition-colors duration-300 group-hover:bg-[var(--color-primary)]/70">
                <AppIcon
                  name={feature.iconName}
                  className="inline-block transition-colors duration-300 [&_svg]:h-8 [&_svg]:w-8 group-hover:[&_svg_path]:stroke-[var(--color-card)] group-hover:[&_svg_rect]:stroke-[var(--color-card)] group-hover:[&_svg_circle]:stroke-[var(--color-card)] group-hover:[&_svg_line]:stroke-[var(--color-card)] group-hover:[&_svg_polyline]:stroke-[var(--color-card)]"
                  title={feature.title}
                />
              </div>
              <h3 className="text-heading-h4 mt-4 text-[var(--color-high-emphasis)] transition-colors duration-300 group-hover:text-[var(--color-card)]">
                {feature.title}
              </h3>
              <p className="text-body-small mt-3 leading-7 text-[var(--color-low-emphasis)] transition-colors duration-300 group-hover:text-[var(--color-card)]/90">
                {feature.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 overflow-visible lg:grid-cols-3">
          {featureRowTwo.map((feature) => (
            <article
              key={feature.id}
              className="group min-h-[250px] rounded-[10px] bg-[var(--color-card)] p-6 shadow-lg transition-all duration-300 ease-out transform-gpu hover:z-10 hover:scale-[1.04] hover:-translate-y-1 hover:bg-[var(--color-light-primary)] hover:shadow-[0_24px_60px_rgba(7,34,24,0.18)]"
            >
              <div className="flex h-[75px] w-[75px] items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 transition-colors duration-300 group-hover:bg-[var(--color-primary)]/70">
                <AppIcon
                  name={feature.iconName}
                  className="inline-block transition-colors duration-300 [&_svg]:h-[34px] [&_svg]:w-[34px] group-hover:[&_svg_path]:stroke-[var(--color-card)] group-hover:[&_svg_rect]:stroke-[var(--color-card)] group-hover:[&_svg_circle]:stroke-[var(--color-card)] group-hover:[&_svg_line]:stroke-[var(--color-card)] group-hover:[&_svg_polyline]:stroke-[var(--color-card)]"
                  title={feature.title}
                />
              </div>
              <h3 className="text-heading-h4 mt-4 text-[var(--color-high-emphasis)] transition-colors duration-300 group-hover:text-[var(--color-card)]">
                {feature.title}
              </h3>
              <p className="text-body-small mt-3 leading-7 text-[var(--color-low-emphasis)] transition-colors duration-300 group-hover:text-[var(--color-card)]/90">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
