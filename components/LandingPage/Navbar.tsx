"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = ["Features", "How It Works", "Pricing", "About", "Contact"];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--teal-primary)" }}>
            <span className="text-white font-bold text-sm font-mono">TLC</span>
          </div>
          <span className="font-semibold text-gray-800 text-sm hidden sm:block">TLC</span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/ /g, "-")}`}
              className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors"
              style={{ "--tw-text-opacity": "1" } as React.CSSProperties}
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#contact"
            className="text-sm font-medium px-4 py-2 rounded-md transition-colors"
            style={{ color: "var(--teal-primary)" }}
          >
            Sign In
          </a>
          <a
            href="#contact"
            className="text-sm font-semibold px-4 py-2 rounded-md text-white transition-all hover:opacity-90"
            style={{ background: "var(--teal-primary)" }}
          >
            Get Started
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden px-6 pb-4 bg-white border-t border-gray-100">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/ /g, "-")}`}
              className="block py-2.5 text-sm font-medium text-gray-700 border-b border-gray-50"
              onClick={() => setOpen(false)}
            >
              {link}
            </a>
          ))}
          <div className="flex gap-3 mt-4">
            <a href="#contact" className="flex-1 text-center text-sm font-semibold py-2.5 rounded-md text-white" style={{ background: "var(--teal-primary)" }}>
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
