const steps = [
  {
    num: "01",
    label: "Setup",
    title: "Set up your Institution",
    desc: "Configure your institution's structure, departments, and academic calendars. Define your policies and compliance requirements once.",
  },
  {
    num: "02",
    label: "Configure",
    title: "Define policies and rules",
    desc: "Translate your institutional policies into automated rules. Set thresholds, limits, and approval requirements that govern teaching assignments.",
  },
  {
    num: "03",
    label: "Assign",
    title: "Assign teaching loads",
    desc: "Assign courses to faculty with confidence, knowing the system validates every decision against your policies in real time.",
  },
  {
    num: "04",
    label: "Monitor",
    title: "Monitor compliance and approvals",
    desc: "Track compliance status, manage approval workflows, and generate reports to keep administrators and faculty aligned.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl mb-4" style={{ color: "var(--text-dark)" }}>
            How It Works
          </h2>
          <p className="text-base" style={{ color: "var(--text-mid)" }}>
            Get started with TLC Platform in four easy steps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line on desktop */}
          <div
            className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px"
            style={{ background: "linear-gradient(90deg, var(--teal-light), var(--teal-primary), var(--teal-light))" }}
          />

          {steps.map(({ num, label, title, desc }, i) => (
            <div key={num} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Step number bubble */}
              <div className="relative z-10 mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg mb-1"
                  style={{
                    background: i === 0 || i === 3 ? "var(--teal-primary)" : "white",
                    border: "2px solid var(--teal-primary)",
                    color: i === 0 || i === 3 ? "white" : "var(--teal-primary)",
                    fontFamily: "'DM Serif Display', serif",
                  }}
                >
                  {num}
                </div>
              </div>

              <span
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: "var(--teal-primary)" }}
              >
                {label}
              </span>
              <h3 className="text-lg mb-3" style={{ color: "var(--text-dark)", fontFamily: "'DM Serif Display', serif" }}>
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
