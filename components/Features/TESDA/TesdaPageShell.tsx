"use client";

import type { ReactNode } from "react";

export function TesdaPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="rounded-2xl border border-[#d0d5dd] bg-white px-5 py-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-high-emphasis)]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-low-emphasis)]">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

export function TesdaMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d0d5dd] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[var(--color-high-emphasis)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">{detail}</p>
    </div>
  );
}

export function TesdaSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#d0d5dd] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">{description}</p>
      </div>
      {children}
    </section>
  );
}