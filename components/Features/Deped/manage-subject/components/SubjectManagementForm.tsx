"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";

export type SubjectFormValues = {
	subjectTitle: string;
	department: string;
	yearLevel: string;
	classDuration: string;
	dateCreated: string;
	description: string;
};

type SubjectManagementFormProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (values: SubjectFormValues) => void;
};

type FormErrors = Partial<Record<keyof SubjectFormValues, string>>;

const getTodayDateInputValue = () => new Date().toISOString().slice(0, 10);

const createInitialFormValues = (): SubjectFormValues => ({
	subjectTitle: "",
	department: "",
	yearLevel: "",
	classDuration: "",
	dateCreated: getTodayDateInputValue(),
	description: "",
});

const departmentOptions = [
	{ value: "", label: "Select Department" },
	{ value: "Filipino Department", label: "Filipino" },
	{ value: "English Department", label: "English" },
	{ value: "Math Department", label: "Math" },
	{ value: "Science Department", label: "Science" },
	{ value: "TLE Department", label: "TLE" },
	{ value: "ESP Department", label: "ESP" },
	{ value: "Araling Panlipunan Department", label: "Araling Panlipunan" },
	{ value: "Physical Education Department", label: "Physical Education" },
	{ value: "Senior High Department", label: "Senior High Department" },
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

const formatDisplayDate = (dateValue: string) => {
	if (!dateValue) {
		return "";
	}

	const date = new Date(`${dateValue}T00:00:00`);
	return Number.isNaN(date.getTime())
		? dateValue
		: date.toLocaleDateString("en-US");
};

export default function SubjectManagementForm({
	isOpen,
	onClose,
	onSubmit,
}: SubjectManagementFormProps) {
	const [formValues, setFormValues] = useState<SubjectFormValues>(createInitialFormValues);
	const [errors, setErrors] = useState<FormErrors>({});

	const handleCancel = useCallback(() => {
		setFormValues(createInitialFormValues());
		setErrors({});
		onClose();
	}, [onClose]);

	useEffect(() => {
		if (!isOpen) {
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
	}, [handleCancel, isOpen]);

	const handleChange = (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
	) => {
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

		const durationMinutes = Number(formValues.classDuration);
		if (!formValues.classDuration.trim()) {
			nextErrors.classDuration = "Class duration is required.";
		} else if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
			nextErrors.classDuration = "Enter a valid duration in minutes.";
		}

		if (!formValues.dateCreated) {
			nextErrors.dateCreated = "Date created is required.";
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
			classDuration: `${Number(formValues.classDuration)} minutes`,
			dateCreated: formatDisplayDate(formValues.dateCreated),
			description: formValues.description.trim(),
		});

		setFormValues(createInitialFormValues());
		setErrors({});
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
			onClick={handleCancel}
		>
			<div
				className="flex max-h-[92vh] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl bg-white shadow-level-2"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-start justify-between bg-[var(--color-primary)] px-6 py-5 text-white">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-white/75">
							DepEd subject manager
						</p>
						<h2 className="mt-1 text-[22px] font-semibold leading-tight">Create Subject</h2>
						<p className="mt-1 text-sm text-white/75">
							Add the subject details used by this workspace.
						</p>
					</div>

					<button
						type="button"
						onClick={handleCancel}
						aria-label="Close modal"
						className="flex h-9 w-9 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
					>
						<span aria-hidden="true" className="text-xl leading-none">
							×
						</span>
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
					<div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
						<div className="grid gap-5 md:grid-cols-2">
							<div className="space-y-2">
								<label
									htmlFor="subjectTitle"
									className="text-sm font-medium text-[var(--color-high-emphasis)]"
								>
									Subject Title <span className="text-[#f04444]">*</span>
								</label>
								<input
									id="subjectTitle"
									name="subjectTitle"
									value={formValues.subjectTitle}
									onChange={handleChange}
									placeholder="e.g., Filipino"
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition placeholder:text-[var(--color-low-emphasis)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								/>
								{errors.subjectTitle ? (
									<p className="text-xs text-[#f04444]">{errors.subjectTitle}</p>
								) : null}
							</div>

							<div className="space-y-2">
								<label
									htmlFor="department"
									className="text-sm font-medium text-[var(--color-high-emphasis)]"
								>
									Department <span className="text-[#f04444]">*</span>
								</label>
								<select
									id="department"
									name="department"
									value={formValues.department}
									onChange={handleChange}
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								>
									{departmentOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
								{errors.department ? (
									<p className="text-xs text-[#f04444]">{errors.department}</p>
								) : null}
							</div>

							<div className="space-y-2">
								<label
									htmlFor="yearLevel"
									className="text-sm font-medium text-[var(--color-high-emphasis)]"
								>
									Year Level <span className="text-[#f04444]">*</span>
								</label>
								<select
									id="yearLevel"
									name="yearLevel"
									value={formValues.yearLevel}
									onChange={handleChange}
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								>
									{yearLevelOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
								{errors.yearLevel ? (
									<p className="text-xs text-[#f04444]">{errors.yearLevel}</p>
								) : null}
							</div>

							<div className="space-y-2">
								<label
									htmlFor="classDuration"
									className="text-sm font-medium text-[var(--color-high-emphasis)]"
								>
									Class Duration <span className="text-[#f04444]">*</span>
								</label>
								<input
									id="classDuration"
									name="classDuration"
									type="number"
									min="1"
									inputMode="numeric"
									value={formValues.classDuration}
									onChange={handleChange}
									placeholder="e.g., 45"
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								/>
								{errors.classDuration ? (
									<p className="text-xs text-[#f04444]">{errors.classDuration}</p>
								) : null}
							</div>

							<div className="space-y-2">
								<label
									htmlFor="dateCreated"
									className="text-sm font-medium text-[var(--color-high-emphasis)]"
								>
									Date Created <span className="text-[#f04444]">*</span>
								</label>
								<input
									id="dateCreated"
									name="dateCreated"
									type="date"
									value={formValues.dateCreated}
									onChange={handleChange}
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								/>
								{errors.dateCreated ? (
									<p className="text-xs text-[#f04444]">{errors.dateCreated}</p>
								) : null}
							</div>

							<div className="space-y-2 md:col-span-2">
								<label
									htmlFor="description"
									className="text-sm font-medium text-[var(--color-high-emphasis)]"
								>
									Description
								</label>
								<textarea
									id="description"
									name="description"
									value={formValues.description}
									onChange={handleChange}
									placeholder="Brief description of the subject"
									className="min-h-[96px] w-full resize-y rounded-lg border border-[var(--color-default)] bg-white px-3 py-2 text-sm text-[var(--color-high-emphasis)] outline-none transition placeholder:text-[var(--color-low-emphasis)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								/>
							</div>
						</div>
					</div>

					<div className="flex flex-col-reverse gap-3 border-t border-[var(--color-default)] bg-[#fbfefd] px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
						<button
							type="button"
							onClick={handleCancel}
							className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[#ecf8f6] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 sm:min-w-[150px]"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 sm:min-w-[220px]"
						>
							Create Subject
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
