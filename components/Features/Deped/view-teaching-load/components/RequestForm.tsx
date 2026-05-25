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

const subjectOptions = [
	{ value: "", label: "Select a subject" },
	{ value: "filipino", label: "Filipino" },
	{ value: "english", label: "English" },
	{ value: "mathematics", label: "Mathematics" },
	{ value: "science", label: "Science" },
	{ value: "araling-panlipunan", label: "Araling Panlipunan" },
	{ value: "esp", label: "Edukasyon sa Pagpapakatao" },
	{ value: "tle", label: "TLE" },
	{ value: "other", label: "Other" },
];

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
	const [submitError, setSubmitError] = useState("");
	const [submitSuccess, setSubmitSuccess] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

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
		setSubmitSuccess("");
		setIsSubmitting(false);
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitError("");
		setSubmitSuccess("");

		if (!formData.subjectConcerned || !formData.requestType || !formData.description.trim()) {
			setSubmitError("Subject, request type, and description are required.");
			return;
		}

		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session?.access_token) {
			setSubmitError("Please sign in again to send this request.");
			return;
		}

		setIsSubmitting(true);
		const response = await fetch("/api/tenant/deped/load-requests", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${session.access_token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(formData),
		});
		const payload: { error?: string } = await response.json().catch(() => ({}));

		if (!response.ok) {
			setSubmitError(payload.error || "Unable to send request.");
			setIsSubmitting(false);
			return;
		}

		setFormData(initialFormData);
		setSubmitSuccess("Request sent to your department head.");
		setIsSubmitting(false);
		window.dispatchEvent(new Event("tlc-notifications-updated"));
		window.setTimeout(() => {
			setSubmitSuccess("");
			onClose();
		}, 900);
	};

	return (
		<TenantBrandScope>
			<div
				className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
				onClick={handleCancel}
			>
				<div
					className="w-full max-w-2xl overflow-hidden rounded-[18px] bg-[var(--color-card)] shadow-level-2"
					onClick={(event) => event.stopPropagation()}
				>
				<form
					onSubmit={handleSubmit}
					className="request-modal-scrollbar max-h-[90vh] overflow-y-auto"
				>
					<div className="sticky top-0 z-20 flex items-start justify-between gap-4 bg-[var(--color-primary)] px-6 py-5 text-white">
						<div className="space-y-1">
							<p className="text-xs font-semibold uppercase tracking-wide text-white/75">
								DepEd load request
							</p>
							<h2 className="text-[22px] font-semibold leading-tight">
								Submit Load Request or Concern
							</h2>
							<p className="text-sm text-white/85">
								Send a load concern or a question about your current teaching assignment.
							</p>
						</div>

						<button
							type="button"
							onClick={handleCancel}
							aria-label="Close modal"
							className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-white transition-colors hover:bg-[var(--color-light-primary)]"
						>
							<AppIcon
								name="close"
								className="inline-block [&_svg]:h-4 [&_svg]:w-4 [&_svg_*]:stroke-current"
								title="Close"
							/>
						</button>
					</div>

					<div className="space-y-5 p-6">
						{submitError ? (
							<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
								{submitError}
							</div>
						) : null}
						{submitSuccess ? (
							<div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
								{submitSuccess}
							</div>
						) : null}

						<div className="space-y-2">
							<label htmlFor="subjectConcerned" className="text-label-input text-[#364153]">
								Subject Concerned
							</label>
							<StyledSelect
								value={formData.subjectConcerned}
								onChange={(value) => handleSelectChange("subjectConcerned", value)}
								options={subjectOptions}
								className="[&_button]:h-10"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="requestType" className="text-label-input text-[#364153]">
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
							<label htmlFor="description" className="text-label-input text-[#364153]">
								Description
							</label>
							<textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleChange}
								placeholder="Type here..."
								className="text-body-small h-44 w-full resize-none rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-high-emphasis)] shadow-level-1 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
							/>
						</div>

						<div className="flex justify-end gap-3 border-t border-[var(--color-default)] pt-4">
							<button
								type="button"
								onClick={handleCancel}
								disabled={isSubmitting}
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
