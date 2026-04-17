"use client";

import { useState } from "react";
import Image from "next/image";
import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";
import LegalModal from "@/components/LandingPage/LegalModal";

const footerProductLinks = ["Features", "Pricing"];
const footerCompanyLinks = ["About", "Contact"];
const footerLegalLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"];
const footerSocialIcons: IconName[] = ["x", "linkedIn", "facebook", "email"];

const legalModalContent: Record<string, string[]> = {
  "Privacy Policy": [
    "This Privacy Policy explains how the Teaching Load Compliance (TLC) Platform collects, uses, and protects your information when you use our services.",
    "We collect information necessary to provide and improve our platform, including user details (such as name, email, and role), institutional data, and usage activity. This data is used to manage accounts, enforce academic workload policies, and enhance system performance.",
    "We do not sell or share your personal data with third parties for marketing purposes. Information may only be shared when required by law or to support essential system operations (such as secure cloud hosting).",
    "We implement appropriate technical and organizational measures to protect your data from unauthorized access, loss, or misuse. However, no system can guarantee absolute security.",
    "By using the platform, you agree to the collection and use of information as described in this policy.",
  ],
  "Terms of Service": [
    "These Terms of Service govern your access to and use of the Teaching Load Compliance (TLC) Platform.",
    "By using the platform, you agree to comply with all applicable policies and institutional rules. You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account.",
    "The platform is provided to support academic workload management and policy enforcement. You agree not to misuse the system, attempt unauthorized access, or disrupt its normal operation.",
    "We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice.",
    "Continued use of the platform after updates to these terms constitutes acceptance of the revised terms.",
  ],
  "Cookie Policy": [
    "The TLC Platform uses cookies and similar technologies to enhance user experience and improve system functionality.",
    "Cookies are small data files stored on your device that help us remember your preferences, maintain secure sessions, and analyze platform usage.",
    "We use essential cookies required for system operation, as well as optional analytics cookies to understand how users interact with the platform.",
    "You can control or disable cookies through your browser settings. However, disabling certain cookies may affect platform functionality.",
    "By continuing to use the platform, you consent to our use of cookies as described in this policy.",
  ],
  Security: [
    "We are committed to protecting the security and integrity of the TLC Platform and its users.",
    "We use industry-standard security measures such as data encryption, secure authentication, and access controls to safeguard sensitive information. System activities may be monitored to detect and prevent unauthorized access.",
    "User accounts are role-based, ensuring that individuals only access information relevant to their responsibilities. Regular system updates and audits are conducted to maintain security standards.",
    "While we strive to protect all data, users are also responsible for maintaining strong passwords and safeguarding their login credentials.",
    "If you suspect any security issue or unauthorized access, please report it immediately to your system administrator.",
  ],
};

export default function Footer() {
  const [activeLegalModal, setActiveLegalModal] = useState<string | null>(null);

  return (
    <>
      <footer className="bg-[var(--color-high-emphasis)] px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <Image src="/TLCLogo.svg" alt="TLC Platform" width={75} height={75} className="h-[75px] w-[75px]" />
            <p className="text-body-medium max-w-[320px] text-[#99a1af]">
              Modernizing academic workload management through automation and policy-driven systems.
            </p>

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

          <nav aria-label="Product" className="space-y-4">
            <h3 className="text-heading-h4 text-white">Product</h3>
            <ul className="space-y-3">
              {footerProductLinks.map((label) => {
                const productLinks: Record<string, string> = {
                  Features: "#features",
                  Pricing: "#pricing",
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

          <nav aria-label="Company" className="space-y-4">
            <h3 className="text-heading-h4 text-white">Company</h3>
            <ul className="space-y-3">
              {footerCompanyLinks.map((label) => {
                const companyLinks: Record<string, string> = {
                  "About": "#about",
                  Contact: "#contact",
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

          <nav aria-label="Legal" className="space-y-4">
            <h3 className="text-heading-h4 text-white">Legal</h3>
            <ul className="space-y-3">
              {footerLegalLinks.map((label) => {
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => setActiveLegalModal(label)}
                      className="text-body-medium cursor-pointer border-0 bg-transparent p-0 text-left text-[#99a1af] transition-colors hover:text-white"
                    >
                      {label}
                    </button>
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

      <LegalModal
        isOpen={Boolean(activeLegalModal)}
        title={activeLegalModal ?? ""}
        paragraphs={activeLegalModal ? (legalModalContent[activeLegalModal] ?? []) : []}
        onClose={() => setActiveLegalModal(null)}
      />
    </>
  );
}
