import Image from "next/image";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  return (
    <nav className="h-[72px] bg-[var(--color-primary)] px-6 md:px-10">
      <div className="mx-auto flex h-full max-w-7xl items-center">
        <a
          href="/"
          aria-label="Home"
          className="-ml-15 flex items-center gap-3"
        >
          <Image
            src="/TLCLogo.svg"
            alt="TLC Engine Logo"
            width={48}
            height={48}
            className="object-contain"
          />
        </a>

        <div
          className="flex flex-1 items-center justify-center gap-2"
          role="menubar"
          aria-label="Marketing navigation"
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              role="menuitem"
              className="text-body-small rounded-lg px-4 py-2 text-[var(--color-card)] no-underline transition-colors hover:bg-white/10"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
