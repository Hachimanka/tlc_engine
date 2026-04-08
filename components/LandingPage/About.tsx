export default function About() {
  return (
    <section id="about" className="py-20" style={{ background: "var(--bg-off)" }}>
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left copy */}
        <div>
          <span
            className="text-xs font-semibold uppercase tracking-widest mb-3 block"
            style={{ color: "var(--teal-primary)" }}
          >
            About Us
          </span>
          <h2 className="text-3xl lg:text-4xl mb-5" style={{ color: "var(--text-dark)" }}>
            Our Mission: A modern solution for academic workload management to help institutions thrive.
          </h2>
          <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-mid)" }}>
            The TLC Platform was born from a simple observation: institutions need trustworthy, policy-driven tools that put compliance first, not as an afterthought. We partnered with academic leaders to build something that truly works.
          </p>
          <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-mid)" }}>
            We believe the product should solve the institutional problem that institutions face from the complexity of faculty schedules, policy updates, and more — establishing a shared vocabulary for collaboration between faculty and administration.
          </p>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-mid)" }}>
            Today, we support numerous institutions around the world, from small colleges to large multi-campus universities, helping them build quality education.
          </p>
        </div>

        {/* Right image */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--teal-light), #c8e8e1)", transform: "rotate(2deg) scale(0.97)" }}
          />
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700&q=80"
              alt="Team collaboration"
              className="w-full object-cover"
              style={{ height: "400px" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
