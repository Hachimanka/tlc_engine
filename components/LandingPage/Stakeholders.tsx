import { AppIcon } from "@/public/icons";
import type { IconName } from "@/public/icons";

type StakeholderCard = {
  id: string;
  iconName: IconName;
  title: string;
  description: string;
  features: string[];
};

const stakeholders: StakeholderCard[] = [
  {
    id: "administrators",
    iconName: "settings",
    title: "For Administrators",
    description:
      "Streamline workload management across departments, enforce institutional policies, and gain comprehensive oversight with powerful reporting tools.",
    features: [
      "Centralized workload management",
      "Policy compliance tracking",
      "Comprehensive analytics and reporting",
      "Automated approval workflows",
    ],
  },
  {
    id: "departments",
    iconName: "people",
    title: "For Departments",
    description:
      "Manage faculty assignments efficiently, balance teaching loads, and ensure fair distribution of courses across your department.",
    features: [
      "Department-level oversight",
      "Fair load distribution",
      "Course assignment optimization",
      "Real-time compliance alerts",
    ],
  },
  {
    id: "faculty",
    iconName: "file",
    title: "For Faculty",
    description:
      "View your teaching assignments, track your workload progress, and submit requests through a simple, intuitive interface.",
    features: [
      "Clear workload visibility",
      "Easy request submission",
      "Teaching history tracking",
      "Mobile-friendly access",
    ],
  },
];

export default function Stakeholders() {
  return (
    <section className="bg-[var(--color-background)] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-display-h1 text-[var(--color-primary)]">Built for Every Stakeholder</h2>
          <p className="text-body-large mt-4 text-[var(--color-low-emphasis)]">
            TLC Platform serves the unique needs of administrators, departments, and faculty
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {stakeholders.map((stakeholder) => (
            <article
              key={stakeholder.id}
              className="rounded-[14px] bg-white p-8 shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-light-primary)]">
                <AppIcon
                  name={stakeholder.iconName}
                  className="inline-block [&_svg]:h-8 [&_svg]:w-8 [&_svg_path]:stroke-white [&_svg_circle]:stroke-white"
                  title={stakeholder.title}
                />
              </div>

              <h3 className="text-heading-h3 mt-6 text-[var(--color-high-emphasis)]">
                {stakeholder.title}
              </h3>

              <p className="text-body-small mt-4 leading-[26px] text-[var(--color-low-emphasis)]">
                {stakeholder.description}
              </p>

              <ul className="mt-6 space-y-3">
                {stakeholder.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                    <span className="text-body-medium text-[#364153]">{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
