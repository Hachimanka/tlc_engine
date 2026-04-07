import Image from "next/image";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-high-emphasis)]">

      {/* TOP BAR */}
      <nav className="h-[72px] bg-[var(--color-primary)] px-6 md:px-10">
        <div className="mx-auto flex h-full max-w-7xl items-center">

          {/* LOGO */}
          <a
            href="/"
            aria-label="Home"
            className="flex items-center gap-3 -ml-15"
          >
          <Image
            src="/TLCLogo.svg"
            alt="TLC Engine Logo"
            width={48}
            height={48}
            className="object-contain"
          />
          </a>

          {/* NAVIGATION */}
          <div className="flex flex-1 items-center justify-center gap-2" role="menubar" aria-label="Marketing navigation">
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

      {/* HERO SECTION */}
      <section className="bg-[var(--color-background)] px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-[550px] items-center justify-center gap-[50px]">

            {/* LEFT CONTENT */}
            <div className="flex flex-col flex-1 items-start justify-center gap-6 py-0">

              {/* TITLE */}
              <div className="flex items-start gap-2.5 w-full">
                <h1 className="text-display-h1 text-[var(--color-primary)]">
                  Streamline Teaching Loads. Ensure Compliance. Empower Institutions.
                </h1>
              </div>

              {/* DESCRIPTION */}
              <div className="w-full">
                <p className="text-body-large text-[var(--color-high-emphasis)]">
                  Automate faculty workload management, enforce institutional policies, and gain real-time insights with the TLC Platform.
                </p>
              </div>

              {/* CTA BUTTON */}
              <div className="flex items-start gap-2.5 w-full">
                <button
                  type="button"
                  className="flex w-[180px] h-[50px] items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] rounded-lg shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span className="text-body-small text-white font-semibold">
                    Request a Demo
                  </span>
                </button>
              </div>

              {/* TRUST SECTION */}
              <div className="flex w-full items-center gap-3 pt-4">
                <div className="inline-flex items-center justify-center px-3 py-0 flex-[0_0_auto] rounded-full bg-[var(--color-card)] bg-opacity-10">
                  <div className="relative w-6 h-6">
                    <svg className="w-6 h-6 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <p className="text-body-small text-[var(--color-high-emphasis)]">
                  Trusted by academic institutions nationwide
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - IMAGE PLACEHOLDER */}
            <div className="inline-flex flex-col items-center justify-center p-[25px] flex-[0_0_auto] self-stretch">
              <div className="flex flex-col w-[550px] items-center relative flex-1 grow bg-[var(--color-card)] rounded-2xl overflow-hidden shadow-lg">
                <div className="relative self-stretch w-full h-[550px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
                  
                  {/* PLACEHOLDER FOR FUTURE IMAGE */}
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-body-small text-white opacity-70">
                      Future feature image coming soon
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}