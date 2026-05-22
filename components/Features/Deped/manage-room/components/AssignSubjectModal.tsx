"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import StyledSelect, {
	type StyledSelectOption,
} from "@/components/Global/StyledSelect";

export type AssignSubjectValues = {
	department: string;
	subjectId: string;
	subject: string;
	timeStart: string;
	timeEnd: string;
	day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
};

type AssignSubjectModalProps = {
	isOpen: boolean;
	subjectOptions: AssignSubjectOption[];
	errorMessage?: string;
	onClose: () => void;
	onSubmit: (values: AssignSubjectValues) => void;
};

export type AssignSubjectOption = {
	id: string;
	title: string;
	code: string;
	department: string;
};

type FormErrors = Partial<Record<keyof AssignSubjectValues, string>>;

const dayOptions: Array<{ value: AssignSubjectValues["day"]; label: string }> = [
	{ value: "monday", label: "Monday" },
	{ value: "tuesday", label: "Tuesday" },
	{ value: "wednesday", label: "Wednesday" },
	{ value: "thursday", label: "Thursday" },
	{ value: "friday", label: "Friday" },
	{ value: "saturday", label: "Saturday" },
	{ value: "sunday", label: "Sunday" },
];

const emptyValues: AssignSubjectValues = {
	department: "",
	subjectId: "",
	subject: "",
	timeStart: "",
	timeEnd: "",
	day: "monday",
};

const toSelectOptions = (options: string[]): StyledSelectOption[] =>
	options.map((option) => ({ value: option, label: option }));

export default function AssignSubjectModal({
	isOpen,
	subjectOptions,
	errorMessage,
	onClose,
	onSubmit,
}: AssignSubjectModalProps) {
	const [formValues, setFormValues] = useState<AssignSubjectValues>(emptyValues);
	const [errors, setErrors] = useState<FormErrors>({});

	const filteredSubjectOptions = useMemo(
		() => subjectOptions.filter((subject) => subject.department === formValues.department),
		[formValues.department, subjectOptions],
	);

	const departmentOptions = useMemo(
		() =>
			Array.from(new Set(subjectOptions.map((subject) => subject.department).filter(Boolean))).sort(
				(left, right) => left.localeCompare(right),
			),
		[subjectOptions],
	);

	const handleClose = useCallback(() => {
		setFormValues(emptyValues);
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
				handleClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleClose, isOpen]);

	const toMinutes = (time: string) => {
		const [hour = "0", minute = "0"] = time.split(":");
		return Number(hour) * 60 + Number(minute);
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setFormValues((prev) => ({
			...prev,
			[name]: value,
		}));
		setErrors((prev) => ({ ...prev, [name]: undefined }));
	};

	const handleSelectChange = (name: keyof AssignSubjectValues, value: string) => {
		setFormValues((prev) => ({
			...prev,
			[name]: value,
			...(name === "department" ? { subject: "", subjectId: "" } : null),
			...(name === "subjectId"
				? {
						subject: subjectOptions.find((subject) => subject.id === value)?.title ?? "",
					}
				: null),
		}));
		setErrors((prev) => ({ ...prev, [name]: undefined }));
	};

	const validate = () => {
		const nextErrors: FormErrors = {};

		const minStart = toMinutes("07:30");
		const maxEnd = toMinutes("18:00");

		if (!formValues.department) nextErrors.department = "Department is required.";
		if (!formValues.subjectId) nextErrors.subjectId = "Subject is required.";
		if (!formValues.timeStart) nextErrors.timeStart = "Start time is required.";
		if (!formValues.timeEnd) nextErrors.timeEnd = "End time is required.";
		if (formValues.timeStart && formValues.timeEnd && formValues.timeEnd <= formValues.timeStart) {
			nextErrors.timeEnd = "End time must be after start time.";
		}
		if (formValues.timeStart && toMinutes(formValues.timeStart) < minStart) {
			nextErrors.timeStart = "Start time must be 07:30 AM or later.";
		}
		if (formValues.timeEnd && toMinutes(formValues.timeEnd) > maxEnd) {
			nextErrors.timeEnd = "End time must be 06:00 PM or earlier.";
		}
		if (!formValues.day) nextErrors.day = "Day is required.";

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!validate()) {
			return;
		}

		onSubmit(formValues);
		setFormValues(emptyValues);
		setErrors({});
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
			onClick={handleClose}
		>
			<div
				className="flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-white shadow-level-2"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-start justify-between bg-[var(--color-primary)] px-6 py-5 text-white">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-white/75">
							Room schedule
						</p>
						<h2 className="mt-1 text-[22px] font-semibold leading-tight">Assign Subject</h2>
					</div>
					<button
						type="button"
						onClick={handleClose}
						aria-label="Close modal"
						className="flex h-9 w-9 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
					>
						<span aria-hidden="true" className="text-xl leading-none">x</span>
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
					<div className="grid gap-5 px-6 py-6 md:grid-cols-2">
						{errorMessage ? (
							<div className="rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#d92d20] md:col-span-2">
								{errorMessage}
							</div>
						) : null}

						<Field label="Department" error={errors.department} required>
							<StyledSelect
								value={formValues.department}
								onChange={(value) => handleSelectChange("department", value)}
								options={toSelectOptions(departmentOptions)}
								placeholder="Select department"
							/>
						</Field>

						<Field label="Subject" error={errors.subjectId} required>
							<StyledSelect
								value={formValues.subjectId}
								disabled={!formValues.department}
								onChange={(value) => handleSelectChange("subjectId", value)}
								options={filteredSubjectOptions.map((subject) => ({
									value: subject.id,
									label: `${subject.code} - ${subject.title}`,
								}))}
								placeholder="Select subject"
							/>
						</Field>

						<Field label="Time Start" error={errors.timeStart} required>
							<input
								name="timeStart"
								type="time"
								value={formValues.timeStart}
								onChange={handleChange}
								className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
							/>
						</Field>

						<Field label="Time End" error={errors.timeEnd} required>
							<input
								name="timeEnd"
								type="time"
								value={formValues.timeEnd}
								onChange={handleChange}
								className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
							/>
						</Field>

						<Field label="Day of the Week" error={errors.day} required>
							<StyledSelect
								value={formValues.day}
								onChange={(value) => handleSelectChange("day", value as AssignSubjectValues["day"])}
								options={dayOptions}
							/>
						</Field>
					</div>

					<div className="flex flex-col-reverse gap-3 border-t border-[var(--color-default)] bg-[#fbfefd] px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
						<button
							type="button"
							onClick={handleClose}
							className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 sm:min-w-[150px]"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 sm:min-w-[180px]"
						>
							Assign Subject
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function Field({
	label,
	error,
	required,
	children,
}: {
	label: string;
	error?: string;
	required?: boolean;
	children: ReactNode;
}) {
	return (
		<div className="space-y-2 text-sm font-medium text-[var(--color-high-emphasis)]">
			<span>
				{label} {required ? <span className="text-[#f04444]">*</span> : null}
			</span>
			{children}
			{error ? <p className="text-xs text-[#f04444]">{error}</p> : null}
		</div>
	);
}
