"use client";

import { useEffect, useState } from "react";
import TenantBrandScope from "@/components/Global/TenantBrandScope";
import StyledSelect from "@/components/Global/StyledSelect";
import { AppIcon } from "@/public/icons";
import { supabase } from "@/lib/supabaseClient";

type RequestFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

type TeachingLoadRow = {
  id: string | number;
  subjectTitle: string;
  subjectCode: string;
  schedule: string;
  room: string;
  section: string;
  students: number;
};

type FormData = {
  subjectConcerned: string;
  requestType: string;
  description: string;
};

const initialFormData: FormData = {
  subjectConcerned: "",
  requestType: "",
  description: "",
};

const baseSubjectOptions = [{ value: "", label: "Select a subject" }];

const requestTypeOptions = [
  { value: "", label: "Select request type" },
  { value: "load-concern", label: "Load Concern" },
  { value: "schedule-conflict", label: "Schedule Conflict" },
  { value: "subject-assignment", label: "Subject Assignment" },
  { value: "clarification", label: "Clarification / Question" },
  { value: "other", label: "Other" },
];

export default function RequestForm({ isOpen, onClose }: RequestFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [subjectOptions, setSubjectOptions] = useState(baseSubjectOptions);
  const [teachingLoadRows, setTeachingLoadRows] = useState<TeachingLoadRow[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadSubjectOptions = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setSubjectOptions(baseSubjectOptions);
        return;
      }

      try {
        const response = await fetch("/api/tenant/my-teaching-load", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setSubjectOptions(baseSubjectOptions);
          return;
        }

        const payload = await response.json();

        const rows: TeachingLoadRow[] = Array.isArray(payload.rows)
          ? payload.rows
          : [];

        setTeachingLoadRows(rows);

        if (rows.length === 0) {
          setSubjectOptions([
            ...baseSubjectOptions,
            { value: "other", label: "Other" },
          ]);
          return;
        }

        const options = rows.map((row) => ({
          value: String(row.id),
          label: `${row.subjectCode} - ${row.subjectTitle}`,
          description: row.section ? `Section ${row.section}` : undefined,
        }));

        setSubjectOptions([
          ...baseSubjectOptions,
          ...options,
          { value: "other", label: "Other" },
        ]);
      } catch {
        setSubjectOptions(baseSubjectOptions);
      }
    };

    loadSubjectOptions();

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

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setSubmitError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    if (!formData.requestType) {
      setSubmitError("Please select the type of request.");
      return;
    }

    if (!formData.subjectConcerned) {
      setSubmitError("Please select the subject concerned or choose Other.");
      return;
    }

    setIsSubmitting(true);

    const selectedRow = teachingLoadRows.find(
      (row) => String(row.id) === formData.subjectConcerned,
    );

    const requestBody = {
      subjectId: selectedRow?.id ?? formData.subjectConcerned,
      subjectTitle: selectedRow?.subjectTitle ?? formData.subjectConcerned,
      subjectCode: selectedRow?.subjectCode ?? formData.subjectConcerned,
      section: selectedRow?.section ?? null,
      room: selectedRow?.room ?? null,
      schedule: selectedRow?.schedule ?? null,
      requestType: formData.requestType,
      description: formData.description,
    };

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Your session expired. Please log in again.");
      }

      const response = await fetch("/api/tenant/academic-approvals", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Failed to send the request.");
      }

      window.alert("Your request has been submitted successfully.");

      setFormData(initialFormData);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to send the request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TenantBrandScope>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={handleCancel}
      >
        <div
          className="w-full max-w-2xl overflow-hidden rounded-2xl bg-[var(--color-card)] shadow-level-2"
          onClick={(event) => event.stopPropagation()}
        >
          <form
            onSubmit={handleSubmit}
            className="request-modal-scrollbar max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[var(--color-default)] bg-[var(--color-card)] px-6 py-5">
              <div className="space-y-1">
                <h2 className="text-[20px] font-semibold text-[var(--color-high-emphasis)]">
                  Submit Load Request or Concern
                </h2>
                <p className="text-sm text-[var(--color-low-emphasis)]">
                  Send a load concern or a question about your current teaching
                  assignment.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                aria-label="Close modal"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-default)] text-[var(--color-primary)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-default)]"
              >
                <AppIcon
                  name="close"
                  className="inline-block [&_svg]:h-4 [&_svg]:w-4 [&_svg_*]:stroke-current"
                  title="Close"
                />
              </button>
            </div>

          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label
                htmlFor="subjectConcerned"
                className="text-label-input text-[#364153]"
              >
                Subject Concerned
              </label>
              <StyledSelect
                value={formData.subjectConcerned}
                onChange={(value) =>
                  handleSelectChange("subjectConcerned", value)
                }
                options={subjectOptions}
                className="[&_button]:h-10"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="requestType"
                className="text-label-input text-[#364153]"
              >
                Type of Request
              </label>
              <StyledSelect
                value={formData.requestType}
                onChange={(value) => handleSelectChange("requestType", value)}
                options={requestTypeOptions}
                className="[&_button]:h-10"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-label-input text-[#364153]"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Type here..."
                className="text-body-small h-40 w-full resize-none rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-high-emphasis)] shadow-level-1"
              />
            </div>

            {submitError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 border-t border-[var(--color-default)] pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-[var(--color-default)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
          </form>
        </div>
      </div>
      <style jsx>{`
        .request-modal-scrollbar {
          scrollbar-color: var(--color-primary) var(--color-default);
          scrollbar-width: thin;
        }

        .request-modal-scrollbar::-webkit-scrollbar {
          width: 12px;
        }

        .request-modal-scrollbar::-webkit-scrollbar-track {
          background: var(--color-default);
        }

        .request-modal-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-primary);
          border: 3px solid var(--color-default);
          border-radius: 999px;
        }

        .request-modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-light-primary);
        }
      `}</style>
    </TenantBrandScope>
  );
}
