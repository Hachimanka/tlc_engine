"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { RoomRow } from "@/components/Features/Deped/manage-room/components/RoomsTable";

export type RoomFormValues = Omit<RoomRow, "id">;

type RoomFormModalProps = {
	isOpen: boolean;
	mode: "create" | "edit";
	initialValues?: RoomRow | null;
	onClose: () => void;
	onSubmit: (values: RoomFormValues) => void;
};

type FormErrors = Partial<Record<keyof RoomFormValues, string>>;

const emptyValues: RoomFormValues = {
	roomNo: "",
	section: "",
	building: "",
	type: "",
	capacity: "",
	status: "Available",
	yearLevel: "",
};

const roomTypeOptions = ["Classroom", "Laboratory", "Computer Room", "Library", "Office"];
const statusOptions: RoomFormValues["status"][] = ["Available", "Not Available"];
const yearLevelOptions = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "N/A"];

const getInitialValues = (room?: RoomRow | null): RoomFormValues => {
	if (!room) {
		return emptyValues;
	}

	return {
		roomNo: room.roomNo,
		section: room.section,
		building: room.building,
		type: room.type,
		capacity: room.capacity,
		status: room.status,
		yearLevel: room.yearLevel,
	};
};

export default function RoomFormModal({
	isOpen,
	mode,
	initialValues,
	onClose,
	onSubmit,
}: RoomFormModalProps) {
	const [formValues, setFormValues] = useState<RoomFormValues>(() => getInitialValues(initialValues));
	const [errors, setErrors] = useState<FormErrors>({});

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

	const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target;
		setFormValues((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: undefined }));
	};

	const validate = () => {
		const nextErrors: FormErrors = {};
		const capacityNumber = Number(formValues.capacity);

		if (!formValues.roomNo.trim()) nextErrors.roomNo = "Room number is required.";
		if (!formValues.section.trim()) nextErrors.section = "Section is required.";
		if (!formValues.building.trim()) nextErrors.building = "Building is required.";
		if (!formValues.type.trim()) nextErrors.type = "Room type is required.";
		if (!formValues.capacity.trim()) {
			nextErrors.capacity = "Capacity is required.";
		} else if (!Number.isFinite(capacityNumber) || capacityNumber <= 0) {
			nextErrors.capacity = "Enter a valid capacity.";
		}
		if (!formValues.status) nextErrors.status = "Status is required.";
		if (!formValues.yearLevel) nextErrors.yearLevel = "Year level is required.";

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!validate()) {
			return;
		}

		onSubmit({
			roomNo: formValues.roomNo.trim(),
			section: formValues.section.trim(),
			building: formValues.building.trim(),
			type: formValues.type.trim(),
			capacity: String(Number(formValues.capacity)),
			status: formValues.status,
			yearLevel: formValues.yearLevel,
		});
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
				className="flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl bg-white shadow-level-2"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-start justify-between bg-[var(--color-primary)] px-6 py-5 text-white">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-white/75">
							DepEd room manager
						</p>
						<h2 className="mt-1 text-[22px] font-semibold leading-tight">
							{mode === "edit" ? "Edit Room" : "Add Room"}
						</h2>
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
					<div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
						<div className="grid gap-5 md:grid-cols-2">
							<Field label="Room No." error={errors.roomNo} required>
								<input
									name="roomNo"
									value={formValues.roomNo}
									onChange={handleChange}
									placeholder="e.g., Room 1"
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								/>
							</Field>

							<Field label="Section" error={errors.section} required>
								<input
									name="section"
									value={formValues.section}
									onChange={handleChange}
									placeholder="e.g., Amethyst"
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								/>
							</Field>

							<Field label="Building" error={errors.building} required>
								<input
									name="building"
									value={formValues.building}
									onChange={handleChange}
									placeholder="e.g., Senior High School Building"
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								/>
							</Field>

							<Field label="Room Type" error={errors.type} required>
								<select
									name="type"
									value={formValues.type}
									onChange={handleChange}
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								>
									<option value="">Select room type</option>
									{roomTypeOptions.map((option) => (
										<option key={option} value={option}>{option}</option>
									))}
								</select>
							</Field>

							<Field label="Capacity" error={errors.capacity} required>
								<input
									name="capacity"
									type="number"
									min="1"
									inputMode="numeric"
									value={formValues.capacity}
									onChange={handleChange}
									placeholder="e.g., 40"
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								/>
							</Field>

							<Field label="Status" error={errors.status} required>
								<select
									name="status"
									value={formValues.status}
									onChange={handleChange}
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								>
									{statusOptions.map((option) => (
										<option key={option} value={option}>{option}</option>
									))}
								</select>
							</Field>

							<Field label="Year Level" error={errors.yearLevel} required>
								<select
									name="yearLevel"
									value={formValues.yearLevel}
									onChange={handleChange}
									className="h-11 w-full rounded-lg border border-[var(--color-default)] bg-white px-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
								>
									<option value="">Select year level</option>
									{yearLevelOptions.map((option) => (
										<option key={option} value={option}>{option}</option>
									))}
								</select>
							</Field>
						</div>
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
							{mode === "edit" ? "Save Changes" : "Add Room"}
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
		<label className="space-y-2 text-sm font-medium text-[var(--color-high-emphasis)]">
			<span>
				{label} {required ? <span className="text-[#f04444]">*</span> : null}
			</span>
			{children}
			{error ? <p className="text-xs text-[#f04444]">{error}</p> : null}
		</label>
	);
}
