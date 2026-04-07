import { Users, Building, GraduationCap } from "lucide-react";

const stakeholders = [
  {
    icon: Users,
    title: "For Administrators",
    desc: "Gain complete visibility into institutional workloads. Make data-driven decisions with confidence and ensure every policy is enforced automatically.",
    bullets: [
      "Unified load management dashboard",
      "Automated policy enforcement",
      "Comprehensive audit reporting",
      "Multi-department oversight",
    ],
  },
  {
    icon: Building,
    title: "For Departments",
    desc: "Manage your department's faculty workloads efficiently, plan ahead for upcoming terms, and stay informed on compliance status at all times.",
    bullets: [
      "Department-level insights",
      "Semester workload planning",
      "Load rebalancing tools",
      "Streamlined approvals",
    ],
  },
  {
    icon: GraduationCap,
    title: "For Faculty",
    desc: "Access your teaching schedule, track your load distribution, and submit requests through a transparent, intuitive interface built for educators.",
    bullets: [
      "View load summary",
      "Load change requests",
      "Teaching history",
      "Mobile-friendly access",
    ],
  },
];

export default function Stakeholders() {
  return (
    <section className="py-20" style={{ background: "var(--bg-off)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl mb-4" style={{ color: "var(--text-dark)" }}>
            Built for Every Stakeholder
          </h2>
          <p className="text-base" style={{ color: "var(--text-mid)" }}>
            TLC serves the unique needs of administrators, departments, and faculty.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {stakeholders.map(({ icon: Icon, title, desc, bullets }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-8 border"
              style={{ border: "1px solid #e4ece9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "var(--teal-light)" }}
              >
                <Icon size={22} style={{ color: "var(--teal-primary)" }} />
              </div>
              <h3 className="text-xl mb-3" style={{ color: "var(--text-dark)", fontFamily: "'DM Serif Display', serif" }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-mid)" }}>
                {desc}
              </p>
              <ul className="space-y-2">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-dark)" }}>
                    <span style={{ color: "var(--teal-primary)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
