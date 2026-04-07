import { CheckCircle } from "lucide-react";

const points = [
  "Systematic load management system",
  "Policy-first, always compliant",
  "Built for faculty administrators",
];

export default function WhatIs() {
  return (
    <section className="py-20" style={{ background: "#ffffff" }}>
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <h2 className="text-3xl lg:text-4xl mb-5" style={{ color: "var(--text-dark)" }}>
            What is the TLC Platform?
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-mid)" }}>
            The Teaching Load & Compliance Platform is a solution designed to modernize academic workload management. Our system helps institutions enforce policies, automate complex calculations, and maintain compliance across all departments.
          </p>
          <ul className="space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-medium" style={{ color: "var(--text-dark)" }}>
                <CheckCircle size={16} style={{ color: "var(--teal-primary)", flexShrink: 0 }} />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right image */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #d4ede8 0%, var(--teal-light) 100%)", transform: "rotate(-2deg) scale(0.98)" }}
          />
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=700&q=80"
              alt="Academic professionals working"
              className="w-full object-cover"
              style={{ height: "360px" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
