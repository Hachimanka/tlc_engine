"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  FeatureDefinition,
  FeatureKey,
} from "@/features/tenant-feature-catalog";

export type CreatedRole = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  featureKeys: string[];
};

type CreateRolePayload = {
  name: string;
  description?: string;
  featureKeys: string[];
};

type CreateRoleModalProps = {
  isOpen: boolean;
  features: FeatureDefinition[];
  onClose: () => void;
  onCreateRole: (payload: CreateRolePayload) => Promise<CreatedRole>;
};

const groupFeatures = (features: FeatureDefinition[]) => {
  return features.reduce<Record<string, FeatureDefinition[]>>((groups, feature) => {
    groups[feature.group] = [...(groups[feature.group] ?? []), feature];
    return groups;
  }, {});
};

export default function CreateRoleModal({
  isOpen,
  features,
  onClose,
  onCreateRole,
}: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [featureKeys, setFeatureKeys] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedFeatures = useMemo(() => groupFeatures(features), [features]);

  const resetForm = useCallback(() => {
    setRoleName("");
    setDescription("");
    setFeatureKeys([]);
    setError("");
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isOpen]);

  if (!isOpen) {
    return null;
  }

  const canCreate = Boolean(roleName.trim()) && !isSubmitting;

  const handleFeatureToggle = (featureKey: FeatureKey, enabled: boolean) => {
    setFeatureKeys((current) => {
      if (enabled) {
        return Array.from(new Set([...current, featureKey]));
      }

      return current.filter((key) => key !== featureKey);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roleName.trim()) {
      setError("Role name is required.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onCreateRole({
        name: roleName.trim(),
        description: description.trim() || undefined,
        featureKeys,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-role-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[var(--color-primary)] px-6 py-5">
          <h2 id="create-role-title" className="text-xl font-semibold text-white">
            Create Role
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-6 py-6">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="role-name" className="text-sm font-medium text-[#344054]">
                  Role Name
                </label>
                <input
                  id="role-name"
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value)}
                  placeholder="e.g., Subject Coordinator"
                  className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="role-description" className="text-sm font-medium text-[#344054]">
                  Description
                </label>
                <input
                  id="role-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What this role is responsible for"
                  className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-high-emphasis)]">
                  Initial Feature Access
                </h3>
                <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
                  You can adjust these after creating the role.
                </p>
              </div>

              {Object.entries(groupedFeatures).map(([group, groupItems]) => (
                <fieldset key={group} className="space-y-2">
                  <legend className="text-xs font-bold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                    {group}
                  </legend>
                  <div className="grid gap-2 md:grid-cols-2">
                    {groupItems.map((feature) => {
                      const isAdminOnly = Boolean(feature.adminOnly);

                      return (
                        <label
                          key={feature.key}
                          className={`grid grid-cols-[16px_1fr] gap-2 rounded-md border border-[var(--color-default)] px-3 py-2 text-sm ${
                            isAdminOnly
                              ? "bg-[#f8fafc] text-[var(--color-low-emphasis)]"
                              : "cursor-pointer hover:bg-[#ecf8f6]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={featureKeys.includes(feature.key)}
                            disabled={isAdminOnly}
                            onChange={(event) =>
                              handleFeatureToggle(feature.key, event.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-[#cfd5dd] text-[var(--color-primary)]"
                          />
                          <span>
                            <span className="font-semibold text-[var(--color-high-emphasis)]">
                              {feature.label}
                            </span>
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-[#c2410c]">
                              {feature.status === "planned" ? "Coming soon" : ""}
                            </span>
                            {isAdminOnly ? (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                                Org admin only
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

          <div className="flex justify-end gap-2 border-t border-[var(--color-default)] px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-[var(--color-default)] px-4 py-2 text-xs font-semibold text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canCreate}
              className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
