"use client";

import { type FormEventHandler, useEffect, useState } from "react";

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

	const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
		event.preventDefault();
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
			<div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--color-card)] shadow-2xl">
				<div className="px-5 py-4 text-[1.05rem] font-semibold text-white bg-[var(--color-primary)]">
					Filipino Department
				</div>

				<form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
					<div className="px-5 pb-4 pt-5">
						<p className="text-lg font-medium text-[var(--color-low-emphasis)]">
							Adding new Faculty
						</p>
					</div>

					<div className="flex-1 space-y-5 px-5 pb-6">
						<div className="space-y-2">
							<label className="text-sm font-semibold text-[var(--color-high-emphasis)]" htmlFor="faculty-select">
								Select Faculty*
							</label>
							<div className="relative">
								<select
									id="faculty-select"
									value={selectedFaculty}
									onChange={(event) => handleFacultyChange(event.target.value)}
									className="w-full appearance-none rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-4 py-3 pr-12 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.12)]"
								>
									{facultyOptions.map((option) => (
										<option key={option.label} value={option.label}>
											{option.label}
										</option>
									))}
								</select>
								<div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
									<svg aria-hidden="true" className="h-4 w-4 text-[var(--color-high-emphasis)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
										<path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
									</svg>
								</div>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<label className="text-sm font-semibold text-[var(--color-high-emphasis)]" htmlFor="faculty-name">
									Faculty Name
								</label>
								<input
									id="faculty-name"
									value={selectedFacultyDetails.label}
									readOnly
									className="w-full rounded-lg border border-[var(--color-default)] bg-[#f8fbfa] px-4 py-3 text-sm text-[var(--color-high-emphasis)] outline-none"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-semibold text-[var(--color-high-emphasis)]" htmlFor="employment-type">
									Employment Type
								</label>
								<input
									id="employment-type"
									value={selectedFacultyDetails.employmentType}
									readOnly
									className="w-full rounded-lg border border-[var(--color-default)] bg-[#f8fbfa] px-4 py-3 text-sm text-[var(--color-high-emphasis)] outline-none"
								/>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2 sm:col-span-2">
								<label className="text-sm font-semibold text-[var(--color-high-emphasis)]" htmlFor="specialization">
									Specialization
								</label>
								<input
									id="specialization"
									value={selectedFacultyDetails.specialization}
									readOnly
									className="w-full rounded-lg border border-[var(--color-default)] bg-[#f8fbfa] px-4 py-3 text-sm text-[var(--color-high-emphasis)] outline-none"
								/>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-end gap-3 border-t border-[var(--color-default)] px-5 py-5">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
						>
							Add New Faculty
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
