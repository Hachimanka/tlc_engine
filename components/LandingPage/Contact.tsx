import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";

type ContactItem = {
  id: string;
  iconName: IconName;
  title: string;
  lines: string[];
};

const contactInfo: ContactItem[] = [
  {
    id: "email",
    iconName: "email",
    title: "Email",
    lines: ["support@tlcplatform.edu", "sales@tlcplatform.edu"],
  },
  {
    id: "phone",
    iconName: "call",
    title: "Phone",
    lines: ["09987654321", "Mon-Fri, 9am-5pm"],
  },
  {
    id: "office",
    iconName: "location",
    title: "Office",
    lines: ["Tres de Abril", "Labangon", "Cebu"],
  },
];

export default function Contact() {
  return (
    <section id="contact" className="bg-[var(--color-card)] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-display-h1 text-[var(--color-primary)]">Get in Touch</h2>
          <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
            Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-20 lg:grid-cols-2">
          <form className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="fullName" className="text-label-input text-[#364153]">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                className="text-body-small h-10 rounded-lg border border-transparent bg-[var(--color-background)] px-3 text-[var(--color-low-emphasis)] focus:border-[var(--color-light-primary)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-label-input text-[#364153]">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john@university.edu"
                className="text-body-small h-10 rounded-lg border border-transparent bg-[var(--color-background)] px-3 text-[var(--color-low-emphasis)] focus:border-[var(--color-light-primary)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="institutionName" className="text-label-input text-[#364153]">Institution Name</label>
              <input
                id="institutionName"
                name="institutionName"
                type="text"
                placeholder="University Name"
                className="text-body-small h-10 rounded-lg border border-transparent bg-[var(--color-background)] px-3 text-[var(--color-low-emphasis)] focus:border-[var(--color-light-primary)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-label-input text-[#364153]">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Tell us about your needs..."
                className="text-body-small min-h-[150px] rounded-lg border border-transparent bg-[var(--color-background)] px-3 py-2 text-[var(--color-low-emphasis)] focus:border-[var(--color-light-primary)]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                type="submit"
                className="text-label-button rounded-lg bg-[var(--color-primary)] px-4 py-3 text-white transition-opacity hover:opacity-90"
              >
                Send Message
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-6">
            <h3 className="text-heading-h3 text-[var(--color-high-emphasis)]">Contact Information</h3>

            <div className="space-y-6">
              {contactInfo.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-default)]">
                    <AppIcon
                      name={item.iconName}
                      className="inline-block [&_svg]:h-6 [&_svg]:w-6"
                      title={item.title}
                    />
                  </div>
                  <div>
                    <p className="text-heading-h4 text-[var(--color-high-emphasis)]">{item.title}</p>
                    {item.lines.map((line) => (
                      <p key={line} className="text-body-medium text-[var(--color-low-emphasis)]">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
