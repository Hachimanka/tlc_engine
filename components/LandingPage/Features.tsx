"use client";
import { BookOpen, ShieldCheck, Building2, Lock, GitBranch, Activity } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Teaching Load Automation",
    desc: "Automatically calculate and distribute teaching loads across faculty based on institutional policies and contractual requirements.",
  },
  {
    icon: ShieldCheck,
    title: "Policy Enforcement Engine",
    desc: "Real-time enforcement of institutional rules and regulations, ensuring every assignment is compliant before approval.",
  },
  {
    icon: Building2,
    title: "Multi-Tenant Architecture",
    desc: "Seamlessly manage multiple campuses, colleges, or departments within a single unified platform built for scale.",
  },
  {
    icon: Lock,
    title: "Role-Based Access Control",
    desc: "Granular permission settings ensure the right people see the right information at the right time — nothing more.",
  },
  {
    icon: GitBranch,
    title: "Approval Workflow System",
    desc: "Customizable approval chains that streamline decision-making and keep all stakeholders informed throughout the process.",
  },
  {
    icon: Activity,
    title: "Real-Time Compliance Monitoring",
    desc: "Live dashboards and automated alerts keep your institution ahead of compliance requirements and policy thresholds.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20" style={{ background: "var(--bg-off)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl mb-4" style={{ color: "var(--text-dark)" }}>
            Powerful Features for Modern Institutions
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--text-mid)" }}>
            Everything you need to manage teaching loads, enforce policies, and maintain compliance.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-6 border transition-all duration-300 hover:-translate-y-1"
              style={{ border: "1px solid #e4ece9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(13,123,107,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
              }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "var(--teal-light)" }}
              >
                <Icon size={20} style={{ color: "var(--teal-primary)" }} />
              </div>
              <h3 className="text-lg mb-2" style={{ color: "var(--text-dark)", fontFamily: "'DM Serif Display', serif" }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-mid)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
