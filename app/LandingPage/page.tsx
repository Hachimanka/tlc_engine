"use client";

import { useState } from "react";
import "../globals.css";
import Image from "next/image";
import { AppIcon } from "@/public/ico";
import type { IconName } from "@/public/ico";
import RequestDemoModal from "@/components/LandingPage/DemoModal";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About Us", href: "#about-us" },
  { label: "Contact", href: "#contact" },
];

const features = [
  { label: "Multi-tenant academic system" },
  { label: "Policy-driven workload computation" },
  { label: "Automated compliance validation" },
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

type ContactItem = {
  id: string;
  iconName: IconName;
  title: string;
  lines: string[];
};

const contactInfo: ContactItem[] = [
  {
    id: "email",
    iconName: "email",
    title: "Email",
    lines: ["support@tlcplatform.edu", "sales@tlcplatform.edu"],
  },
  {
    id: "phone",
    iconName: "call",
    title: "Phone",
    lines: ["09987654321", "Mon-Fri, 9am-5pm"],
  },
  {
    id: "office",
    iconName: "location",
    title: "Office",
    lines: ["Tres de Abril", "Labangon", "Cebu"],
  },
];

const footerProductLinks = ["Features", "Pricing"];
const footerCompanyLinks = ["About Us", "Contact"];
const footerLegalLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"];
const footerSocialIcons: IconName[] = ["x", "linkedIn", "facebook", "email"];

export default function MarketingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

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
                <h1 className="text-display-h1 text-[var(--color-primary)]">
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
                  onClick={() => setIsDemoModalOpen(true)}
                  className="flex w-[180px] h-[50px] items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] rounded-lg shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span className="text-label-button text-white">
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
                <h3 className="text-heading-h4 mt-4 text-[var(--color-high-emphasis)]">
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
                <h3 className="text-heading-h4 mt-4 text-[var(--color-high-emphasis)]">
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

      {/* STAKEHOLDERS SECTION */}
      <section className="bg-[var(--color-background)] px-6 py-8 md:px-10">
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
                className="rounded-[14px] bg-white p-8 shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a]"
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

      {/* PRICING SECTION */}
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

                  <button
                    type="button"
                    className={`text-label-button mt-4 rounded-lg px-4 py-3 transition-opacity hover:opacity-90 ${
                      isBrand
                        ? "bg-white text-[var(--color-primary)]"
                        : "bg-[var(--color-light-primary)] text-white"
                    }`}
                  >
                    Get Started
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about-us" className="bg-[var(--color-background)] px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[700px] items-center gap-12">
            <div className="flex flex-1 items-center">
              <div className="w-full max-w-[700px]">
                <h2 className="text-heading-h2 text-[var(--color-primary)]">About Us</h2>

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

            <div className="flex flex-1 items-center justify-center">
              <div className="relative h-[650px] w-full max-w-[885px] overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src="/lf.png"
                  alt="About TLC Platform"
                  width={885}
                  height={650}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="bg-[var(--color-card)] px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-display-h1 text-[var(--color-primary)]">Get in Touch</h2>
            <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
              Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-20 lg:grid-cols-2">

            {/* MESSAGING FORM */}
            <form className="flex flex-col gap-6">

              {/* FULL NAME FIELD */}
              <div className="flex flex-col gap-2">
                <label htmlFor="fullName" className="text-label-input text-[#364153]">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="text-body-small h-10 rounded-lg border border-transparent bg-[var(--color-background)] px-3 text-[var(--color-low-emphasis)] focus:border-[var(--color-light-primary)]"
                />
              </div>

              {/* EMAIL FIELD */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-label-input text-[#364153]">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@university.edu"
                  className="text-body-small h-10 rounded-lg border border-transparent bg-[var(--color-background)] px-3 text-[var(--color-low-emphasis)] focus:border-[var(--color-light-primary)]"
                />
              </div>

              {/* INSTITUTION FIELD */}
              <div className="flex flex-col gap-2">
                <label htmlFor="institutionName" className="text-label-input text-[#364153]">Institution Name</label>
                <input
                  id="institutionName"
                  name="institutionName"
                  type="text"
                  placeholder="University Name"
                  className="text-body-small h-10 rounded-lg border border-transparent bg-[var(--color-background)] px-3 text-[var(--color-low-emphasis)] focus:border-[var(--color-light-primary)]"
                />
              </div>

              {/* MESSAGE FIELD */}
              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-label-input text-[#364153]">Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us about your needs..."
                  className="text-body-small min-h-[150px] rounded-lg border border-transparent bg-[var(--color-background)] px-3 py-2 text-[var(--color-low-emphasis)] focus:border-[var(--color-light-primary)]"
                />
              </div>

              {/* FORM ACTIONS */}
              <div className="grid grid-cols-1 gap-4">
                <button
                  type="submit"
                  className="text-label-button rounded-lg bg-[var(--color-primary)] px-4 py-3 text-white transition-opacity hover:opacity-90"
                >
                  Send Message
                </button>
              </div>
            </form>

            {/* CONTACT INFORMATION */}
            <div className="flex flex-col gap-6">
              <h3 className="text-heading-h3 text-[var(--color-high-emphasis)]">Contact Information</h3>

              {/* CONTACT INFO ITEMS */}
              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-default)]">
                      <AppIcon
                        name={item.iconName}
                        className="inline-block [&_svg]:h-6 [&_svg]:w-6"
                        title={item.title}
                      />
                    </div>
                    <div>
                      <p className="text-heading-h4 text-[var(--color-high-emphasis)]">{item.title}</p>
                      {item.lines.map((line) => (
                        <p key={line} className="text-body-medium text-[var(--color-low-emphasis)]">{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="bg-[var(--color-light-primary)] px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-display-h1 text-white">Ready to Transform Your Institution?</h2>
            <p className="text-body-large mt-4 text-white/90">
              Join the growing number of institutions streamlining their teaching load management with TLC Platform
            </p>
          </div>

          <div className="mt-10 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="text-label-button flex h-[50px] w-[200px] items-center justify-center gap-2 rounded-lg border border-white bg-[var(--color-card)] px-4 py-3 text-[var(--color-light-primary)] shadow-level-1 transition-opacity hover:opacity-90"
            >
              Request Demo
            </button>
          </div>
        </div>
      </section>

      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />

      {/* FOOTER SECTION */}
      <footer className="bg-[var(--color-high-emphasis)] px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">

            {/* BRAND COLUMN */}
            <div className="space-y-6">
              <Image src="/TLCLogo.svg" alt="TLC Platform" width={75} height={75} className="h-[75px] w-[75px]" />
              <p className="text-body-medium max-w-[320px] text-[#99a1af]">
                Modernizing academic workload management through automation and policy-driven systems.
              </p>

              {/* SOCIAL ICONS */}
              <div className="flex items-center gap-3">
                {footerSocialIcons.map((iconName) => {
                  const socialLinks: Record<string, string> = {
                    x: "https://x.com",
                    linkedIn: "https://linkedin.com",
                    facebook: "https://facebook.com",
                    email: "mailto:info@tlcplatform.com",
                  };
                  return (
                    <a
                      key={iconName}
                      href={socialLinks[iconName] || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-default)]/15 transition-opacity hover:opacity-80"
                      aria-label={`Visit our ${iconName}`}
                    >
                      <AppIcon name={iconName} className="inline-block [&_svg]:h-5 [&_svg]:w-5" title={iconName} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* PRODUCT COLUMN */}
            <nav aria-label="Product" className="space-y-4">
              <h3 className="text-heading-h4 text-white">Product</h3>
              <ul className="space-y-3">
                {footerProductLinks.map((label) => {
                  const productLinks: Record<string, string> = {
                    "Features": "#features",
                    "Pricing": "#pricing",
                  };
                  return (
                    <li key={label}>
                      <a href={productLinks[label] || "#"} className="text-body-medium text-[#99a1af] no-underline hover:text-white">
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* COMPANY COLUMN */}
            <nav aria-label="Company" className="space-y-4">
              <h3 className="text-heading-h4 text-white">Company</h3>
              <ul className="space-y-3">
                {footerCompanyLinks.map((label) => {
                  const companyLinks: Record<string, string> = {
                    "About Us": "#about-us",
                    "Contact": "#contact",
                  };
                  return (
                    <li key={label}>
                      <a href={companyLinks[label] || "#"} className="text-body-medium text-[#99a1af] no-underline hover:text-white">
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* LEGAL COLUMN */}
            <nav aria-label="Legal" className="space-y-4">
              <h3 className="text-heading-h4 text-white">Legal</h3>
              <ul className="space-y-3">
                {footerLegalLinks.map((label) => {
                  const legalLinks: Record<string, string> = {
                    "Privacy Policy": "#privacy",
                    "Terms of Service": "#terms",
                    "Cookie Policy": "#cookies",
                    "Security": "#security",
                  };
                  return (
                    <li key={label}>
                      <a href={legalLinks[label] || "#"} className="text-body-medium text-[#99a1af] no-underline hover:text-white">
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="mt-10 border-t border-[#1e2939] pt-6">
            <p className="text-body-medium text-center text-[#99a1af]">
              © 2026 TLC Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
