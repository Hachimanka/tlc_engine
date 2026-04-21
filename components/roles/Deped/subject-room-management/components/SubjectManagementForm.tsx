"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

export type SubjectFormValues = {
	subjectTitle: string;
	department: string;
	yearLevel: string;
	classDuration: string;
	description: string;
};

type SubjectManagementFormProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (values: SubjectFormValues) => void;
};

type FormErrors = Partial<Record<keyof SubjectFormValues, string>>;

const initialFormValues: SubjectFormValues = {
	subjectTitle: "",
	department: "",
	yearLevel: "",
	classDuration: "",
	description: "",
};

const departmentOptions = [
	{ value: "", label: "Select Department" },
	{ value: "Filipino Department", label: "Filipino" },
	{ value: "English Department", label: "English" },
	{ value: "Math Department", label: "Math" },
	{ value: "MAPEH Department", label: "MAPEH" },
	{ value: "Science Department", label: "Science" },
	{ value: "AP Department", label: "AP" },
	{ value: "ESP Department", label: "ESP" },
];

const yearLevelOptions = [
	{ value: "", label: "Select Year Level" },
	{ value: "Grade 7", label: "Grade 7" },
	{ value: "Grade 8", label: "Grade 8" },
	{ value: "Grade 9", label: "Grade 9" },
	{ value: "Grade 10", label: "Grade 10" },
	{ value: "Grade 11", label: "Grade 11" },
	{ value: "Grade 12", label: "Grade 12" },
];

export default function SubjectManagementForm({ isOpen, onClose, onSubmit }: SubjectManagementFormProps) {
	const [formValues, setFormValues] = useState(initialFormValues);
	const [errors, setErrors] = useState<FormErrors>({});

	const handleCancel = () => {
		setFormValues(initialFormValues);
		setErrors({});
		onClose();
	};

	useEffect(() => {
		if (!isOpen) {
			setFormValues(initialFormValues);
			setErrors({});
			return;
		}

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleCancel();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = event.target;
		setFormValues((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: undefined }));
	};

	const validate = () => {
		const nextErrors: FormErrors = {};

		if (!formValues.subjectTitle.trim()) {
			nextErrors.subjectTitle = "Subject title is required.";
		}

		if (!formValues.department) {
			nextErrors.department = "Department is required.";
		}

		if (!formValues.yearLevel) {
			nextErrors.yearLevel = "Year level is required.";
		}

		if (!formValues.classDuration.trim()) {
			nextErrors.classDuration = "Class duration is required.";
		}

		if (!formValues.description.trim()) {
			nextErrors.description = "Description is required.";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!validate()) {
			return;
		}

		onSubmit({
			subjectTitle: formValues.subjectTitle.trim(),
			department: formValues.department,
			yearLevel: formValues.yearLevel,
			classDuration: formValues.classDuration.trim(),
			description: formValues.description.trim(),
		});

		setFormValues(initialFormValues);
		setErrors({});
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={handleCancel}>
			<div
				className="flex max-h-[92vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl bg-white shadow-level-2"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-start justify-between border-b border-[var(--color-default)] px-6 py-5">
					<div>
						<h2 className="text-[20px] font-medium text-[var(--color-high-emphasis)]">Create Subject</h2>
					</div>

					<button
						type="button"
						onClick={handleCancel}
						aria-label="Close modal"
						className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-low-emphasis)] transition-colors hover:bg-[var(--color-default)] hover:text-[var(--color-high-emphasis)]"
					>
						<span aria-hidden="true" className="text-xl leading-none">
							×
						</span>
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
					<div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6">
						<div className="space-y-2">
							<label htmlFor="subjectTitle" className="text-sm font-medium text-[var(--color-high-emphasis)]">
								Subject Title <span className="text-[#f04444]">*</span>
							</label>
							<input
								id="subjectTitle"
								name="subjectTitle"
								value={formValues.subjectTitle}
								onChange={handleChange}
								placeholder="e.g., Filipino"
								className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)] focus:border-[var(--color-primary)]"
							/>
							{errors.subjectTitle ? <p className="text-xs text-[#f04444]">{errors.subjectTitle}</p> : null}
						</div>

						<div className="space-y-2">
							<label htmlFor="department" className="text-sm font-medium text-[var(--color-high-emphasis)]">
								Department <span className="text-[#f04444]">*</span>
							</label>
							<select
								id="department"
								name="department"
								value={formValues.department}
								onChange={handleChange}
								className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)]"
							>
								{departmentOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
							{errors.department ? <p className="text-xs text-[#f04444]">{errors.department}</p> : null}
						</div>

						<div className="space-y-2">
							<label htmlFor="yearLevel" className="text-sm font-medium text-[var(--color-high-emphasis)]">
								Year Level <span className="text-[#f04444]">*</span>
							</label>
							<select
								id="yearLevel"
								name="yearLevel"
								value={formValues.yearLevel}
								onChange={handleChange}
								className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)]"
							>
								{yearLevelOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
							{errors.yearLevel ? <p className="text-xs text-[#f04444]">{errors.yearLevel}</p> : null}
						</div>

						<div className="space-y-2">
							<label htmlFor="classDuration" className="text-sm font-medium text-[var(--color-high-emphasis)]">
								Class Duration <span className="text-[#f04444]">*</span>
							</label>
							<input
								id="classDuration"
								name="classDuration"
								value={formValues.classDuration}
								onChange={handleChange}
								placeholder="e.g., 45 minutes"
								className="h-10 w-full rounded-md border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)] focus:border-[var(--color-primary)]"
							/>
							{errors.classDuration ? <p className="text-xs text-[#f04444]">{errors.classDuration}</p> : null}
						</div>

						<div className="space-y-2">
							<label htmlFor="description" className="text-sm font-medium text-[var(--color-high-emphasis)]">
								Description
							</label>
							<textarea
								id="description"
								name="description"
								value={formValues.description}
								onChange={handleChange}
								placeholder="Brief description of the request"
								className="h-12 w-full resize-none rounded-md border border-[var(--color-default)] bg-white px-3 py-2 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)] focus:border-[var(--color-primary)]"
							/>
							{errors.description ? <p className="text-xs text-[#f04444]">{errors.description}</p> : null}
						</div>
					</div>

					<div className="flex items-center justify-end gap-3 border-t border-[var(--color-default)] px-6 py-5">
						<button
							type="button"
							onClick={handleCancel}
							className="min-w-[160px] rounded-md border border-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[#ecf8f6]"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="min-w-[280px] rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-light-primary)]"
						>
							Submit for approval
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
