"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type RoleSidebarItem = {
	href: string;
	label: string;
	icon: string;
	onClick?: () => void;
};

type RoleSidebarProps = {
	title: string;
	items: RoleSidebarItem[];
};

export default function Sidebar({ title, items }: RoleSidebarProps) {
	const pathname = usePathname();

	return (
		<aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[var(--color-default)] bg-[var(--color-card)] px-2 py-4">
			<div className="px-3 pb-3">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-low-emphasis)]">
					{title}
				</p>
			</div>

			<nav className="flex flex-col gap-1">
				{items.map((item) => {
					const isActive = item.href !== "#" && pathname === item.href;
					const isButton = typeof item.onClick === "function";
					const sharedClassName = `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
						isActive
							? "bg-[var(--color-primary)] text-white"
							: "text-[var(--color-primary)] hover:bg-[rgba(0,107,95,0.08)]"
					}`;

					return (
						isButton ? (
							<button
								key={item.label}
								type="button"
								onClick={item.onClick}
								className={sharedClassName}
							>
								<span
									className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(2,147,131,0.10)]"
									dangerouslySetInnerHTML={{ __html: item.icon }}
								/>
								<span>{item.label}</span>
							</button>
						) : (
							<Link
								key={item.label}
								href={item.href}
								aria-disabled={item.href === "#"}
								className={sharedClassName}
							>
								<span
									className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(2,147,131,0.10)]"
									dangerouslySetInnerHTML={{ __html: item.icon }}
								/>
								<span>{item.label}</span>
							</Link>
						)
					);
				})}
			</nav>
		</aside>
	);
}
