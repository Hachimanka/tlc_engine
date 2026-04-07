"use client";
import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", institution: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", institution: "", message: "" });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl mb-4" style={{ color: "var(--text-dark)" }}>
            Get In Touch
          </h2>
          <p className="text-base" style={{ color: "var(--text-mid)" }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-mid)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none border transition-all focus:border-teal-500"
                  style={{ border: "1px solid #dde4e2", color: "var(--text-dark)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-mid)" }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="john@university.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none border transition-all focus:border-teal-500"
                  style={{ border: "1px solid #dde4e2", color: "var(--text-dark)" }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-mid)" }}>
                Institution Name
              </label>
              <input
                type="text"
                placeholder="University of ..."
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border transition-all focus:border-teal-500"
                style={{ border: "1px solid #dde4e2", color: "var(--text-dark)" }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-mid)" }}>
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Tell us about your institution and requirements..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border transition-all focus:border-teal-500 resize-none"
                style={{ border: "1px solid #dde4e2", color: "var(--text-dark)" }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-lg text-white transition-all hover:opacity-90"
                style={{ background: "var(--teal-primary)" }}
              >
                {sent ? "Message Sent!" : "Send Message"} <Send size={15} />
              </button>
              <button
                className="text-sm font-semibold px-6 py-3 rounded-lg border transition-all hover:bg-gray-50"
                style={{ border: "1px solid #dde4e2", color: "var(--text-mid)" }}
                onClick={() => setForm({ name: "", email: "", institution: "", message: "" })}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl" style={{ color: "var(--text-dark)", fontFamily: "'DM Serif Display', serif" }}>
              Contact Information
            </h3>

            {[
              {
                icon: Mail,
                label: "Email",
                value: "hello@tlcplatform.com",
                sub: "We'll respond within 24 hours",
              },
              {
                icon: Phone,
                label: "Phone",
                value: "+1 (555) 123-4567",
                sub: "Mon–Fri, 8am–6pm EST",
              },
              {
                icon: MapPin,
                label: "Office",
                value: "123 Education Ave",
                sub: "Boston, MA 02101",
              },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--teal-light)" }}
                >
                  <Icon size={18} style={{ color: "var(--teal-primary)" }} />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-light)" }}>
                    {label}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
                    {value}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-light)" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
