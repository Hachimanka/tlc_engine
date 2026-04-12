import Image from "next/image";
import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";

const footerProductLinks = ["Features", "Pricing"];
const footerCompanyLinks = ["About Us", "Contact"];
const footerLegalLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"];
const footerSocialIcons: IconName[] = ["x", "linkedIn", "facebook", "email"];

export default function Footer() {
  return (
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
                  "About Us": "#about-us",
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
                const legalLinks: Record<string, string> = {
                  "Privacy Policy": "#privacy",
                  "Terms of Service": "#terms",
                  "Cookie Policy": "#cookies",
                  Security: "#security",
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
  );
}
