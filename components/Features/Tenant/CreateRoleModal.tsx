"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

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
};

type CreateRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateRole: (payload: CreateRolePayload) => Promise<CreatedRole>;
};

export default function CreateRoleModal({
  isOpen,
  onClose,
  onCreateRole,
}: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setRoleName("");
    setDescription("");
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
        className="w-full max-w-[520px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
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

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="role-name" className="text-sm font-medium text-[#344054]">
              Role Name
            </label>
            <input
              id="role-name"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              placeholder="e.g., Laboratory Coordinator"
              className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role-description" className="text-sm font-medium text-[#344054]">
              Description
            </label>
            <textarea
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="What this role is responsible for"
              className="w-full resize-none rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
            />
            <p className="text-xs text-[var(--color-low-emphasis)]">
              Features are assigned per account after selecting this role.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--color-default)] pt-4">
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
