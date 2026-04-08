import { ArrowRight } from "lucide-react";

export default function CTABanner() {
  return (
    <section
      className="py-20 relative overflow-hidden"
      style={{ background: "var(--teal-primary)" }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
        style={{ background: "white" }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10"
        style={{ background: "white" }}
      />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl lg:text-4xl mb-4 text-white">
          Ready to Transform Your Institution?
        </h2>
        <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.8)" }}>
          Join hundreds of institutions already streamlining their teaching loads and maintaining compliance with the TLC Platform.
        </p>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 text-sm font-semibold px-8 py-3.5 rounded-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{ background: "white", color: "var(--teal-primary)" }}
        >
          Get Started Today <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}
