"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/public/icons";

type RequestFormProps = {
	isOpen: boolean;
	onClose: () => void;
};

type FormData = {
	subjectConcerned: string;
	requestType: string;
	description: string;
	otherDetails: string;
};

const initialFormData: FormData = {
	subjectConcerned: "",
	requestType: "",
	description: "",
	otherDetails: "",
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
		e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleCancel = () => {
		setFormData(initialFormData);
		onClose();
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setFormData(initialFormData);
		onClose();
	};

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
			onClick={handleCancel}
		>
			<div
				className="w-full max-w-2xl overflow-hidden rounded-2xl bg-[var(--color-card)] shadow-level-2"
				onClick={(event) => event.stopPropagation()}
			>
				<form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto">
					<div className="flex items-start justify-between gap-4 border-b border-[var(--color-default)] px-6 py-5">
						<div className="space-y-1">
							<h2 className="text-[20px] font-semibold text-[var(--color-high-emphasis)]">
								Submit Load Request or Concern
							</h2>
							<p className="text-sm text-[var(--color-low-emphasis)]">
								Send a load concern or a question about your current teaching assignment.
							</p>
						</div>

						<button
							type="button"
							onClick={handleCancel}
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

					<div className="space-y-5 p-6">
						<div className="space-y-2">
							<label htmlFor="subjectConcerned" className="text-label-input text-[#364153]">
								Subject Concerned
							</label>
							<select
								id="subjectConcerned"
								name="subjectConcerned"
								value={formData.subjectConcerned}
								onChange={handleChange}
								className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
							>
								{subjectOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<label htmlFor="requestType" className="text-label-input text-[#364153]">
								Type of Request
							</label>
							<select
								id="requestType"
								name="requestType"
								value={formData.requestType}
								onChange={handleChange}
								className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
							>
								{requestTypeOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
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
								className="text-body-small h-40 w-full resize-none rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-high-emphasis)] shadow-level-1"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="otherDetails" className="text-label-input text-[#364153]">
								Other Details (Optional)
							</label>
							<textarea
								id="otherDetails"
								name="otherDetails"
								value={formData.otherDetails}
								onChange={handleChange}
								placeholder="Add any extra context here..."
								className="text-body-small h-28 w-full resize-none rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-high-emphasis)] shadow-level-1"
							/>
						</div>

						<div className="flex justify-end gap-3 border-t border-[var(--color-default)] pt-4">
							<button
								type="button"
								onClick={handleCancel}
								className="rounded-lg border border-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
							>
								Cancel
							</button>
							<button
								type="submit"
								className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)]"
							>
								Send
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
