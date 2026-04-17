import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";

type StepItem = {
  number: string;
  title: string;
  description: string;
  iconName: IconName;
  showConnector: boolean;
};

const steps: StepItem[] = [
  {
    number: "01",
    title: "Set up your institution",
    description:
      "Configure your institution's basic information, departments, and organizational structure.",
    iconName: "settings",
    showConnector: true,
  },
  {
    number: "02",
    title: "Define policies and roles",
    description:
      "Create custom policies for teaching loads and define user roles with appropriate permissions.",
    iconName: "file",
    showConnector: true,
  },
  {
    number: "03",
    title: "Assign teaching loads",
    description:
      "Assign courses to faculty members and let the system automatically calculate their teaching loads.",
    iconName: "people",
    showConnector: true,
  },
  {
    number: "04",
    title: "Monitor compliance and approvals",
    description:
      "Track compliance in real-time, manage approval workflows, and generate comprehensive reports.",
    iconName: "analytics",
    showConnector: false,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[var(--color-card)] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-display-h1 text-[var(--color-primary)]">How It Works</h2>
          <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
            Get started with TLC Platform in four simple steps
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.number} className="relative w-full rounded-[10px] p-6 text-center">
              <p className="text-[56px] font-bold leading-[60px] text-[#6ed3c7] opacity-30">{step.number}</p>

              <div className="mt-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-light-primary)]">
                <AppIcon
                  name={step.iconName}
                  className="inline-block [&_svg]:h-8 [&_svg]:w-8 [&_svg_path]:stroke-white [&_svg_circle]:stroke-white"
                  title={step.title}
                />
              </div>

              <h3 className="text-heading-h4 mt-6 text-[var(--color-high-emphasis)]">{step.title}</h3>
              <p className="text-body-small mt-3 leading-7 text-[var(--color-low-emphasis)]">{step.description}</p>

              {step.showConnector && (
                <div className="absolute right-[-32px] top-[128px] hidden h-0.5 w-8 -translate-y-1/2 bg-[#6ed3c7] lg:block" />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
