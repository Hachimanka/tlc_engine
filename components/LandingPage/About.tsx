import Image from "next/image";

export default function About() {
  return (
    <section id="about-us" className="bg-[var(--color-background)] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex min-h-[700px] items-center gap-12">
          <div className="flex flex-1 items-center">
            <div className="w-full max-w-[700px]">
              <h2 className="text-heading-h2 text-[var(--color-primary)]">About Us</h2>

              <div className="mt-6 space-y-6">
                <p className="text-body-large leading-[1.46] text-[var(--color-low-emphasis)]">
                  <span className="font-bold text-[var(--color-high-emphasis)]">Our Mission:</span>{" "}
                  To modernize academic workload management through automation and policy-driven systems.
                </p>

                <p className="text-body-large leading-[1.46] text-[var(--color-low-emphasis)]">
                  The TLC Platform was born from years of experience working with academic institutions
                  struggling with manual workload tracking, inconsistent policy enforcement, and limited
                  visibility into faculty assignments.
                </p>

                <p className="text-body-large leading-[1.46] text-[var(--color-low-emphasis)]">
                  We believe that education administrators deserve modern tools that match the complexity
                  of their work. Our platform combines advanced technology with deep understanding of
                  academic operations to deliver a solution that truly works.
                </p>

                <p className="text-body-large leading-[1.46] text-[var(--color-low-emphasis)]">
                  Today, we are proud to serve institutions across the country, helping them streamline
                  operations, ensure compliance, and focus on what matters most: delivering quality
                  education.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="relative h-[650px] w-full max-w-[885px] overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/lf.png"
                alt="About TLC Platform"
                width={885}
                height={650}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
