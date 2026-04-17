"use client";

import { useEffect, type ReactElement } from "react";
import { AppIcon } from "@/public/icons";

type LegalModalProps = {
  isOpen: boolean;
  title: string;
  paragraphs: string[];
  onClose: () => void;
};

export default function LegalModal({
  isOpen,
  title,
  paragraphs,
  onClose,
}: LegalModalProps): ReactElement | null {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-3xl rounded-2xl bg-[var(--color-card)] shadow-[0_24px_64px_rgba(0,0,0,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-default)] px-6 py-5">
          <h2 className="text-heading-h4 text-[var(--color-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-default)]"
          >
            <AppIcon
              name="close"
              className="inline-block [&_svg]:h-4 [&_svg]:w-4"
              title="Close"
            />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {paragraphs.map((paragraph, index) => (
            <p
              key={`${title}-${index}`}
              className="text-body-medium leading-7 text-[var(--color-low-emphasis)]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex justify-end border-t border-[var(--color-default)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-label-button rounded-lg bg-[var(--color-primary)] px-5 py-2 text-white transition-opacity hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
