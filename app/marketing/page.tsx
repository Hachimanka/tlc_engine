import Image from "next/image";
import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const features = [
  { label: "Multi-tenant academic system",},
  { label: "Policy-driven workload computation",},
  { label: "Automated compliance validation",},
];

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

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-high-emphasis)]">

      {/* TOP BAR */}
      <nav className="h-[72px] bg-[var(--color-primary)] px-6 md:px-10">
        <div className="mx-auto flex h-full max-w-7xl items-center">

          {/* LOGO */}
          <a
            href="/"
            aria-label="Home"
            className="flex items-center gap-3 -ml-15"
          >
          <Image
            src="/TLCLogo.svg"
            alt="TLC Engine Logo"
            width={48}
            height={48}
            className="object-contain"
          />
          </a>

          {/* NAVIGATION */}
          <div className="flex flex-1 items-center justify-center gap-2" role="menubar" aria-label="Marketing navigation">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                role="menuitem"
                className="text-body-small rounded-lg px-4 py-2 text-[var(--color-card)] no-underline transition-colors hover:bg-white/10"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-[var(--color-background)] px-6 py-14 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-[550px] items-center justify-center gap-[100px]">

            {/* LEFT CONTENT */}
            <div className="flex flex-col flex-1 items-start justify-center gap-6 py-0">

              {/* TITLE */}
              <div className="flex items-start gap-2.5 w-full">
                <h1 className="text-display-h1 text-[var(--color-primary)] !text-5xl">
                  Streamline Teaching Loads. Ensure Compliance. Empower Institutions.
                </h1>
              </div>

              {/* DESCRIPTION */}
              <div className="w-full">
                <p className="text-body-large text-[var(--color-low-emphasis)]">
                  Automate faculty workload management, enforce institutional policies, and gain real-time insights with the TLC Platform.
                </p>
              </div>

              {/* CTA BUTTON */}
              <div className="flex items-start gap-2.5 w-full">
                <button
                  type="button"
                  className="flex w-[180px] h-[50px] items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] rounded-lg shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span className="text-body-small text-white font-semibold">
                    Request a Demo
                  </span>
                </button>
              </div>

              {/* TRUST SECTION */}
              <div className="flex w-full items-center gap-3 pt-4">
                <div className="inline-flex items-center justify-center px-0 py-0 flex-[0_0_auto] rounded-full ">
                  <AppIcon name="checkMarked" className="inline-block [&_svg]:h-8 [&_svg]:w-8" title="Checked" />
                </div>
                <p className="text-body-small text-[var(--color-low-emphasis)]">
                  Trusted by academic institutions nationwide
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - IMAGE PLACEHOLDER */}
            <div className="flex flex-col items-center justify-center flex-[0_0_auto]">
              <div className="flex flex-col w-[550px] h-[550px] items-center justify-center relative bg-[var(--color-card)] rounded-2xl overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
                  <Image
                    src="/ad.png"
                    alt="Marketing"
                    width={550}
                    height={550}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="bg-[var(--color-card)] px-6 py-14 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-[496px] items-center justify-center gap-[50px]">
            
            {/* LEFT CONTENT */}
            <div className="flex flex-col flex-1 items-start justify-center gap-6 py-0">

              {/* TITLE */}
              <div className="w-full">
                <h2 className="text-display-h1 text-[var(--color-primary)]">
                  What is the TLC Platform?
                </h2>
              </div>

              {/* DESCRIPTION */}
              <div className="w-full">
                <p className="text-body-large text-[var(--color-low-emphasis)]">
                  The Teaching Load Compliance Platform is a comprehensive solution designed to modernize academic workload management. Our system helps institutions enforce policies, automate complex calculations, and maintain compliance across all departments.
                </p>
              </div>

              {/* FEATURES LIST */}
              <div className="flex flex-col gap-4 w-full">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <AppIcon name="checkMarked" className="inline-block [&_svg]:h-8 [&_svg]:w-8" title="Checked" />
                    </div>
                    <span className="text-body-small text-[var(--color-low-emphasis)]">
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE - IMAGE */}
            <div className="flex flex-col items-center justify-start flex-[0_0_auto]">
              <div className="flex flex-col w-[650px] h-[396px] items-center justify-center relative bg-[var(--color-background)] rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/jm.png"
                  alt="TLC Platform Features"
                  width={450}
                  height={396}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POWERFUL FEATURES SECTION */}
      <section className="bg-[var(--color-background)] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-display-h1 text-[var(--color-primary)]">
              Powerful Features for Modern Institutions
            </h2>
            <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
              Everything you need to manage teaching loads, enforce policies, and maintain compliance
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {featureRowOne.map((feature) => (
              <article
                key={feature.id}
                className="min-h-[250px] rounded-[10px] bg-[var(--color-card)] p-6 shadow-lg"
              >
                <div className="flex h-[75px] w-[75px] items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
                  <AppIcon
                    name={feature.iconName}
                    className="inline-block [&_svg]:h-8 [&_svg]:w-8"
                    title={feature.title}
                  />
                </div>
                <h3 className="mt-4 text-[22px] font-semibold leading-7 text-[var(--color-high-emphasis)]">
                  {feature.title}
                </h3>
                <p className="text-body-small mt-3 leading-7 text-[var(--color-low-emphasis)]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {featureRowTwo.map((feature) => (
              <article
                key={feature.id}
                className="min-h-[250px] rounded-[10px] bg-[var(--color-card)] p-6 shadow-lg"
              >
                <div className="flex h-[75px] w-[75px] items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
                  <AppIcon
                    name={feature.iconName}
                    className="inline-block [&_svg]:h-[34px] [&_svg]:w-[34px]"
                    title={feature.title}
                  />
                </div>
                <h3 className="mt-4 text-[22px] font-semibold leading-7 text-[var(--color-high-emphasis)]">
                  {feature.title}
                </h3>
                <p className="text-body-small mt-3 leading-7 text-[var(--color-low-emphasis)]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-[var(--color-card)] px-6 py-16 md:px-10">
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

                <div className="mt-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]">
                  <AppIcon
                    name={step.iconName}
                    className="inline-block [&_svg]:h-8 [&_svg]:w-8 [&_svg_path]:stroke-white [&_svg_circle]:stroke-white"
                    title={step.title}
                  />
                </div>

                <h3 className="mt-6 text-xl font-semibold leading-7 text-[var(--color-high-emphasis)]">{step.title}</h3>
                <p className="text-body-small mt-3 leading-7 text-[var(--color-low-emphasis)]">{step.description}</p>

                {step.showConnector && (
                  <div className="absolute right-[-32px] top-[128px] hidden h-0.5 w-8 -translate-y-1/2 bg-[#6ed3c7] lg:block" />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}