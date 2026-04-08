import { CheckCircle, ArrowRight } from "lucide-react";

const bullets = [
  "Trusted by 500+ institutions worldwide",
  "Policy-first, always compliant",
  "Built for faculty administrators",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f0faf8 0%, #ffffff 60%, #f7f9f8 100%)" }}>
      {/* Subtle background decoration */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--teal-primary), transparent)", transform: "translate(30%, -30%)" }}
      />

      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left copy */}
        <div>
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider"
            style={{ background: "var(--teal-light)", color: "var(--teal-primary)" }}
          >
            Teaching Load & Compliance
          </div>

          <h1 className="text-4xl lg:text-5xl xl:text-6xl leading-tight mb-6" style={{ color: "var(--text-dark)" }}>
            Streamline Teaching Loads.
            <br />
            <span style={{ color: "var(--teal-primary)" }}>Ensure Compliance.</span>
            <br />
            Empower Institutions.
          </h1>

          <p className="text-lg mb-8 leading-relaxed" style={{ color: "var(--text-mid)" }}>
            The Teaching Load & Compliance Platform is a solution designed to modernize academic workload management. Our system helps institutions enforce policies, automate complex calculations, and maintain compliance across all departments.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <a
              href="#contact"
              className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-lg text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "var(--teal-primary)" }}
            >
              Get Started <ArrowRight size={16} />
            </a>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-lg border transition-all hover:bg-gray-50"
              style={{ borderColor: "#d0dbd8", color: "var(--text-dark)" }}
            >
              See How It Works
            </a>
          </div>

          <ul className="space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-mid)" }}>
                <CheckCircle size={16} style={{ color: "var(--teal-primary)", flexShrink: 0 }} />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Right image */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--teal-light) 0%, #d4ede8 100%)", transform: "rotate(3deg) scale(0.97)" }}
          />
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1562774053-701939374585?w=700&q=80"
              alt="University building"
              className="w-full object-cover"
              style={{ height: "420px" }}
            />
            {/* Stats overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-3">
              <div className="flex-1 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
                <div className="text-xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--teal-primary)" }}>500+</div>
                <div className="text-xs text-gray-500 font-medium">Institutions</div>
              </div>
              <div className="flex-1 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
                <div className="text-xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--teal-primary)" }}>98%</div>
                <div className="text-xs text-gray-500 font-medium">Compliance Rate</div>
              </div>
              <div className="flex-1 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
                <div className="text-xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--teal-primary)" }}>40%</div>
                <div className="text-xs text-gray-500 font-medium">Time Saved</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
