"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type FeatureSidebarItem = {
  tenantType: "Deped" | "College";
  role: string;
  featureKey: string;
  href: string;
  label: string;
  icon: string;
  onClick?: () => void;
};

type FeatureSidebarProps = {
  title: string;
  items: FeatureSidebarItem[];
};

export default function Sidebar({ title, items }: FeatureSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-[var(--color-default)] bg-[var(--color-card)] px-2 py-4">
      <div className="px-2.5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-low-emphasis)]">
          {title}
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = item.href !== "#" && pathname === item.href;
          const isButton = typeof item.onClick === "function";
          const sharedClassName = `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
            isActive
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-primary)] hover:bg-[rgba(0,107,95,0.08)]"
          }`;

          return isButton ? (
            <button
              key={`${item.role}-${item.featureKey}-${item.label}`}
              type="button"
              onClick={item.onClick}
              className={sharedClassName}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(2,147,131,0.10)]"
                dangerouslySetInnerHTML={{ __html: item.icon }}
              />
              <span>{item.label}</span>
            </button>
          ) : (
            <Link
              key={`${item.role}-${item.featureKey}-${item.label}`}
              href={item.href}
              aria-disabled={item.href === "#"}
              className={sharedClassName}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(2,147,131,0.10)]"
                dangerouslySetInnerHTML={{ __html: item.icon }}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
