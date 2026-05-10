"use client";

import type {
  FeatureDefinition,
  FeatureKey,
} from "@/features/tenant-feature-catalog";

export type RoleAccess = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  featureKeys: string[];
};

type PermissionProps = {
  selectedRole: RoleAccess | null;
  features: FeatureDefinition[];
  selectedFeatureKeys: string[];
  hasChanges: boolean;
  isSaving: boolean;
  onFeatureToggle: (featureKey: FeatureKey, enabled: boolean) => void;
  onSave: () => void;
};

const groupFeatures = (features: FeatureDefinition[]) => {
  const groups = features.reduce<Record<string, FeatureDefinition[]>>((currentGroups, feature) => {
    currentGroups[feature.group] = [
      ...(currentGroups[feature.group] ?? []),
      feature,
    ];
    return currentGroups;
  }, {});

  for (const group of Object.keys(groups)) {
    groups[group] = groups[group].sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === "active" ? -1 : 1;
      }

      if (Boolean(left.adminOnly) !== Boolean(right.adminOnly)) {
        return left.adminOnly ? 1 : -1;
      }

      return left.label.localeCompare(right.label);
    });
  }

  return groups;
};

export default function Permission({
  selectedRole,
  features,
  selectedFeatureKeys,
  hasChanges,
  isSaving,
  onFeatureToggle,
  onSave,
}: PermissionProps) {
  if (!selectedRole) {
    return (
      <section className="flex h-full min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold text-[var(--color-high-emphasis)]">
            Select a role
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-low-emphasis)]">
            Choose a role to manage the features available to users assigned to it.
          </p>
        </div>
      </section>
    );
  }

  const selected = new Set(selectedFeatureKeys);
  const groupedFeatures = groupFeatures(features);
  const isOrgAdminRole = selectedRole.key === "org_admin";
  const availableCount = features.filter(
    (feature) => feature.status === "active" && !feature.adminOnly,
  ).length;
  const adminOnlyCount = features.filter(
    (feature) => feature.status === "active" && feature.adminOnly,
  ).length;
  const plannedCount = features.filter((feature) => feature.status === "planned").length;

  return (
    <section className="flex h-full min-h-[520px] flex-1 flex-col rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
      <div className="border-b border-[var(--color-default)] px-6 pb-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-high-emphasis)]">
              Feature Access for {selectedRole.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-low-emphasis)]">
              {isOrgAdminRole
                ? "Org Admin always keeps full access to every feature in this institution."
                : selectedRole.description || "Assign the features users with this role can access."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#ecf8f6] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary)]">
                {availableCount} available
              </span>
              <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
                {adminOnlyCount} admin workspace
              </span>
              <span className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] font-semibold text-[#c2410c]">
                {plannedCount} planned
              </span>
            </div>
          </div>

          {selectedRole.isSystem ? (
            <span className="rounded-full bg-[#ecf8f6] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              System role
            </span>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-7">
          {Object.entries(groupedFeatures).map(([group, groupItems]) => (
            <fieldset key={group} className="space-y-3">
              <legend className="text-sm font-bold text-[var(--color-high-emphasis)]">
                {group}
              </legend>

              <div className="grid gap-3 xl:grid-cols-2">
                {groupItems.map((feature) => {
                  const isPlanned = feature.status === "planned";
                  const isChecked =
                    isOrgAdminRole || (!isPlanned && selected.has(feature.key));
                  const isAdminOnlyLocked = feature.adminOnly && !isOrgAdminRole;
                  const isPlannedLocked = isPlanned && !isOrgAdminRole;
                  const isDisabled =
                    isOrgAdminRole || isAdminOnlyLocked || isPlannedLocked;

                  return (
                    <label
                      key={feature.key}
                      className={`grid min-h-[116px] grid-cols-[18px_1fr] gap-3 rounded-lg border p-4 ${
                        isDisabled
                          ? "border-[var(--color-default)] bg-[#f8fafc]"
                          : "cursor-pointer border-[var(--color-default)] bg-white hover:bg-[#ecf8f6]"
                      }`}
                    >
                      <span className="relative mt-1 flex h-4 w-4 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={(event) =>
                            onFeatureToggle(feature.key, event.target.checked)
                          }
                          className="peer h-4 w-4 cursor-pointer rounded-[4px] border border-[#cfd5dd] bg-[#cfd5dd] checked:border-[var(--color-primary)] checked:bg-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                        />
                        <svg
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                          className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
                          fill="none"
                        >
                          <path
                            d="M3.5 8.2 6.5 11 12.5 5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </span>
                      <span>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--color-high-emphasis)]">
                            {feature.label}
                          </span>
                          {isPlanned ? (
                            <span className="rounded-full bg-[#fff7ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#c2410c]">
                              Planned
                            </span>
                          ) : null}
                          {isAdminOnlyLocked ? (
                            <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                              Org admin only
                            </span>
                          ) : null}
                          {!isPlanned && !feature.adminOnly ? (
                            <span className="rounded-full bg-[#ecf8f6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                              Available
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-[var(--color-low-emphasis)]">
                          {feature.description}
                        </span>
                        {isPlanned ? (
                          <span className="mt-2 block text-[11px] font-medium text-[#c2410c]">
                            Page is not built yet, so this stays hidden from user menus.
                          </span>
                        ) : null}
                        {feature.href && !feature.adminOnly ? (
                          <span className="mt-2 block text-[11px] font-medium text-[var(--color-primary)]">
                            Route: {feature.href}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-default)] px-5 py-4">
        <p className="text-xs text-[var(--color-low-emphasis)]">
          Only available features are assignable to custom roles. Planned features are shown for roadmap visibility and stay hidden until their pages are built.
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={isOrgAdminRole || !hasChanges || isSaving}
          className="rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        >
          {isSaving ? "Saving..." : "Save Feature Access"}
        </button>
      </div>
    </section>
  );
}
