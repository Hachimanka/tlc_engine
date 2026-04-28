export default function Policies() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden rounded-[18px] border border-[var(--color-default)] bg-[var(--color-card)] p-6 shadow-level-1">
      <div>
        <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
          Manage Policies
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-low-emphasis)]">
          Tenant policy management will live here. Use this space for policy
          setup, approval rules, and institution-level controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Policy Setup",
            description: "Create and organize tenant policies.",
          },
          {
            title: "Approval Rules",
            description: "Define how requests are reviewed and approved.",
          },
          {
            title: "Access Controls",
            description: "Connect policy visibility to tenant user functions.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[8px] border border-[var(--color-default)] bg-white p-4"
          >
            <h2 className="text-sm font-semibold text-[var(--color-high-emphasis)]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-low-emphasis)]">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
