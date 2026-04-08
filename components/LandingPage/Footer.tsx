import { Share2, Link, PlayCircle, GitBranch } from "lucide-react";

const productLinks = ["Features", "How It Works", "Pricing", "Integrations"];
const companyLinks = ["About", "Blog", "Careers", "Contact"];
const legalLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"];

export default function Footer() {
  return (
    <footer className="bg-white border-t" style={{ borderColor: "#e8ece9" }}>
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--teal-primary)" }}
              >
                <span className="text-white font-bold text-sm font-mono">TLC</span>
              </div>
              <span className="font-semibold text-gray-800">TLC Platform</span>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-light)" }}>
              Modernizing academic workload management for institutions that care about compliance and faculty wellbeing.
            </p>
            <div className="flex gap-3">
              {[Share2, Link, PlayCircle, GitBranch].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                  style={{ border: "1px solid #e4ece9" }}
                >
                  <Icon size={14} style={{ color: "var(--text-mid)" }} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text-dark)" }}>
              Product
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm transition-colors hover:text-teal-700" style={{ color: "var(--text-light)" }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text-dark)" }}>
              Company
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm transition-colors hover:text-teal-700" style={{ color: "var(--text-light)" }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text-dark)" }}>
              Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm transition-colors hover:text-teal-700" style={{ color: "var(--text-light)" }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-2"
          style={{ borderTop: "1px solid #e8ece9" }}
        >
          <p className="text-xs" style={{ color: "var(--text-light)" }}>
            © {new Date().getFullYear()} TLC Platform. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "var(--text-light)" }}>
            Built for institutions that care about education quality.
          </p>
        </div>
      </div>
    </footer>
  );
}
