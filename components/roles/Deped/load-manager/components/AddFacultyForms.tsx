"use client";

import { FormEvent, useEffect, useState } from "react";

type FacultyOption = {
	label: string;
	specialization: string;
	employmentType: string;
};

type AddFacultyFormsProps = {
	isOpen: boolean;
	onClose: () => void;
};

const facultyOptions: FacultyOption[] = [
	{
		label: "John Michael Montero Inoc",
		specialization: "Filipino",
		employmentType: "Full Time",
	},
	{
		label: "John Michael Inoc",
		specialization: "Filipino",
		employmentType: "Full Time",
	},
	{
		label: "Michael Inoc",
		specialization: "Filipino",
		employmentType: "Part Time",
	},
	{
		label: "Maria Santos",
		specialization: "English",
		employmentType: "Full Time",
	},
];

export default function AddFacultyForms({ isOpen, onClose }: AddFacultyFormsProps) {
	const defaultFaculty = facultyOptions[0];
	const [selectedFaculty, setSelectedFaculty] = useState(defaultFaculty.label);
	const selectedFacultyDetails = facultyOptions.find((option) => option.label === selectedFaculty) ?? defaultFaculty;

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		setSelectedFaculty(defaultFaculty.label);
	}, [defaultFaculty.label, defaultFaculty.employmentType, defaultFaculty.specialization, isOpen]);

	if (!isOpen) {
		return null;
	}

	const handleFacultyChange = (value: string) => {
		setSelectedFaculty(value);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
			<div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div className="px-5 py-4 text-lg font-semibold text-white" style={{ background: "var(--teal-primary)" }}>
					Filipino Department
				</div>

				<form className="space-y-6 px-5 py-6" onSubmit={handleSubmit}>
					<div>
						<p className="text-lg font-medium" style={{ color: "var(--text-mid)" }}>
							Adding new Faculty
						</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-semibold" htmlFor="faculty-select" style={{ color: "var(--text-dark)" }}>
							Select Faculty*
						</label>
						<select
							id="faculty-select"
							value={selectedFaculty}
							onChange={(event) => handleFacultyChange(event.target.value)}
							className="w-full rounded-lg border border-[#bfe9e4] px-4 py-3 text-sm outline-none transition focus:border-[var(--teal-primary)]"
						>
							{facultyOptions.map((option) => (
								<option key={option.label} value={option.label}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<label className="text-sm font-semibold" htmlFor="faculty-name" style={{ color: "var(--text-dark)" }}>
								Faculty Name
							</label>
							<input
								id="faculty-name"
								value={selectedFacultyDetails.label}
								readOnly
								disabled
								className="w-full rounded-lg border border-[#bfe9e4] px-4 py-3 text-sm outline-none transition focus:border-[var(--teal-primary)]"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-semibold" htmlFor="employment-type" style={{ color: "var(--text-dark)" }}>
								Employment Type
							</label>
							<input
								id="employment-type"
								value={selectedFacultyDetails.employmentType}
								readOnly
								disabled
								className="w-full rounded-lg border border-[#bfe9e4] px-4 py-3 text-sm outline-none transition focus:border-[var(--teal-primary)]"
							/>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<label className="text-sm font-semibold" htmlFor="specialization" style={{ color: "var(--text-dark)" }}>
								Specialization
							</label>
							<input
								id="specialization"
								value={selectedFacultyDetails.specialization}
								readOnly
								disabled
								className="w-full rounded-lg border border-[#bfe9e4] px-4 py-3 text-sm outline-none transition focus:border-[var(--teal-primary)]"
							/>
						</div>
					</div>

					<div className="flex items-center justify-end gap-3 pt-10">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-[var(--teal-primary)] px-5 py-3 text-sm font-medium transition hover:bg-[#ecf8f6]"
							style={{ color: "var(--text-dark)" }}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="rounded-lg px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
							style={{ background: "var(--teal-primary)" }}
						>
							Add New Faculty
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
