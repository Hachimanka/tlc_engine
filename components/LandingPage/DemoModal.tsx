"use client";

import { useEffect, useState, type ReactElement } from "react";
import { AppIcon } from "@/public/icons";

type RequestDemoModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

const initialFormData = {
	fullName: "",
	emailAddress: "",
	institutionName: "",
	rolePosition: "",
	institutionSize: "",
	preferredDemoDate: "",
	preferredDemoTime: "",
	message: "",
};

const roleOptions = [
	{ value: "", label: "Select Options..." },
	{ value: "administrator", label: "Administrator" },
	{ value: "faculty", label: "Faculty" },
	{ value: "staff", label: "Staff" },
	{ value: "it", label: "IT" },
	{ value: "other", label: "Other" },
];

const institutionSizeOptions = [
	{ value: "", label: "Select Options..." },
	{ value: "small", label: "Small (< 1,000)" },
	{ value: "medium", label: "Medium (1,000 - 10,000)" },
	{ value: "large", label: "Large (10,000 - 50,000)" },
	{ value: "xlarge", label: "Extra Large (> 50,000)" },
];

export default function RequestDemoModal({
	isOpen,
	onClose,
}: RequestDemoModalProps): ReactElement | null {
	const [formData, setFormData] = useState(initialFormData);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	if (!isOpen) {
		return null;
	}

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleCancel = () => {
		setFormData(initialFormData);
		onClose();
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onClose();
		setFormData(initialFormData);
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-[var(--color-card)] shadow-level-2">
				<form
					onSubmit={handleSubmit}
					className="max-h-[90vh] overflow-y-auto"
				>
					<div className="flex items-center gap-4 border-b border-[var(--color-default)] px-6 py-5">
						<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-default)]">
							<AppIcon
								name="demo"
								className="inline-block [&_svg]:h-7 [&_svg]:w-7"
								title="Request Demo"
							/>
						</div>

						<div className="flex-1">
							<h2 className="text-heading-h4 text-[var(--color-primary)]">
								Request a Demo
							</h2>
							<p className="text-body-medium text-[var(--color-medium-dark)]">
								Schedule a live demonstration of the TLC Platform for your
								institution
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

					<div className="space-y-8 p-6">
						<section className="space-y-5">
							<h3 className="text-heading-h4 text-[var(--color-primary)]">
								INFORMATIONS
							</h3>

							<div className="space-y-2">
								<label htmlFor="fullName" className="text-label-input text-[#364153]">
									Full Name
								</label>
								<input
									id="fullName"
									name="fullName"
									type="text"
									value={formData.fullName}
									onChange={handleChange}
									placeholder="Text input"
									className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
								/>
							</div>

							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<div className="space-y-2">
									<label htmlFor="emailAddress" className="text-label-input text-[#364153]">
										Email Address
									</label>
									<input
										id="emailAddress"
										name="emailAddress"
										type="email"
										value={formData.emailAddress}
										onChange={handleChange}
										placeholder="Text input"
										className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="institutionName" className="text-label-input text-[#364153]">
										Institution Name
									</label>
									<input
										id="institutionName"
										name="institutionName"
										type="text"
										value={formData.institutionName}
										onChange={handleChange}
										placeholder="Text input"
										className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label htmlFor="rolePosition" className="text-label-input text-[#364153]">
									Role/Position
								</label>
								<select
									id="rolePosition"
									name="rolePosition"
									value={formData.rolePosition}
									onChange={handleChange}
									className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
								>
									{roleOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-2">
								<label htmlFor="institutionSize" className="text-label-input text-[#364153]">
									Institution Size
								</label>
								<select
									id="institutionSize"
									name="institutionSize"
									value={formData.institutionSize}
									onChange={handleChange}
									className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
								>
									{institutionSizeOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</section>

						<section className="space-y-5 border-t border-[var(--color-default)] pt-6">
							<h3 className="text-heading-h4 text-[var(--color-primary)]">DATE/TIME</h3>

							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<div className="space-y-2">
									<label htmlFor="preferredDemoDate" className="text-label-input text-[#364153]">
										Preferred Demo Date
									</label>
									<input
										id="preferredDemoDate"
										name="preferredDemoDate"
										type="date"
										value={formData.preferredDemoDate}
										onChange={handleChange}
										className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="preferredDemoTime" className="text-label-input text-[#364153]">
										Preferred Demo Time
									</label>
									<input
										id="preferredDemoTime"
										name="preferredDemoTime"
										type="time"
										value={formData.preferredDemoTime}
										onChange={handleChange}
										className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label htmlFor="message" className="text-label-input text-[#364153]">
									Message (Optional)
								</label>
								<textarea
									id="message"
									name="message"
									value={formData.message}
									onChange={handleChange}
									placeholder="Text input"
									className="text-body-small h-36 w-full resize-none rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-high-emphasis)] shadow-level-1"
								/>
							</div>
						</section>
					</div>

					<div className="flex items-center justify-end gap-3 border-t border-[var(--color-default)] px-6 py-5">
						<button
							type="button"
							onClick={handleCancel}
							className="text-label-button h-10 rounded-lg border border-[var(--color-light-primary)] bg-[var(--color-card)] px-6 text-[var(--color-light-primary)] shadow-level-1"
						>
							Cancel
						</button>

						<button
							type="submit"
							className="text-label-button h-10 rounded-lg bg-[var(--color-primary)] px-6 text-white shadow-level-1"
						>
							Schedule Demo
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
