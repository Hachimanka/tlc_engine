"use client";

import { useState } from "react";

export type SubjectOption = {
	id: string;
	subjectTitle: string;
	subjectCode?: string;
	department: string;
	yearLevel: string;
	schedule: string;
	room: string;
	section: string;
	hoursPerDay: string;
	status: "Approved" | "Pending" | "Rejected";
};

type SubjectAssignmentModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (subject: SubjectOption) => void;
	selectedFacultyName: string;
	departmentName: string;
	subjectOptions: SubjectOption[];
	errorMessage?: string;
	isSubmitting?: boolean;
};

export default function SubjectAssignmentModal({
	isOpen,
	onClose,
	onSubmit,
	selectedFacultyName,
	departmentName,
	subjectOptions,
	errorMessage,
	isSubmitting = false,
}: SubjectAssignmentModalProps) {
	const [selectedSubjectId, setSelectedSubjectId] = useState("");

	if (!isOpen) {
		return null;
	}

	const effectiveSelectedSubjectId = subjectOptions.some((subject) => subject.id === selectedSubjectId)
		? selectedSubjectId
		: subjectOptions[0]?.id ?? "";
	const selectedSubject = subjectOptions.find((subject) => subject.id === effectiveSelectedSubjectId);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
			<div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div className="bg-[var(--color-primary)] px-5 py-4 text-white">
					<h2 className="text-xl font-semibold">Assign Subject to {selectedFacultyName}</h2>
					<p className="mt-1 text-sm text-white/90">{departmentName}</p>
				</div>

				<div className="flex-1 overflow-y-auto px-5 py-6">
					{errorMessage ? (
						<div className="mb-4 rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#d92d20]">
							{errorMessage}
						</div>
					) : null}

					<h3 className="mb-4 text-lg font-semibold text-[var(--color-high-emphasis)]">
						Available Approved Subjects
					</h3>

					<div className="overflow-hidden rounded-2xl border border-[var(--color-default)]">
						<div className="grid grid-cols-[80px_1.4fr_1fr_1.3fr_1fr_1fr] bg-[var(--color-primary)] px-4 py-4 text-sm font-medium text-white">
							<div className="text-center">Select</div>
							<div>Subject Title</div>
							<div>Year Level</div>
							<div>Schedule</div>
							<div>Room</div>
							<div>Section</div>
						</div>

						<div className="divide-y divide-[var(--color-default)] bg-white">
							{subjectOptions.length === 0 ? (
								<div className="px-4 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
									No approved subjects available for this department.
								</div>
							) : subjectOptions.map((subject) => {
								const isSelected = effectiveSelectedSubjectId === subject.id;

								return (
									<label
										key={subject.id}
										className={`group grid cursor-pointer grid-cols-[80px_1.4fr_1fr_1.3fr_1fr_1fr] items-center px-4 py-3 text-sm transition-colors hover:bg-[var(--color-primary-soft)] ${
											isSelected ? "bg-[var(--color-primary-muted)]" : "bg-white"
										}`}
									>
										<div className="flex justify-center">
											<input
												type="radio"
												name="subject-option"
												checked={isSelected}
												onChange={() => setSelectedSubjectId(subject.id)}
												className="peer sr-only"
											/>
											<span
												className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary-ring)] peer-focus-visible:ring-offset-2 ${
													isSelected
														? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
														: "border-[var(--color-primary)] bg-white group-hover:bg-[var(--color-primary-soft)]"
												}`}
											>
												<span
													className={`h-3.5 w-3.5 rounded-full bg-[var(--color-primary)] transition-opacity duration-150 ${
														isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-25"
													}`}
												/>
											</span>
										</div>
										<div className="font-medium text-[var(--color-high-emphasis)]">
											{subject.subjectTitle}
										</div>
										<div className="text-[var(--color-low-emphasis)]">{subject.yearLevel}</div>
										<div className="text-[var(--color-low-emphasis)]">{subject.schedule}</div>
										<div className="text-[var(--color-low-emphasis)]">{subject.room}</div>
										<div className="text-[var(--color-low-emphasis)]">{subject.section}</div>
									</label>
								);
							})}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-[var(--color-default)] px-5 py-5">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-[var(--color-primary-soft)]"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={!selectedSubject || isSubmitting}
						onClick={() => {
							if (selectedSubject) {
								onSubmit(selectedSubject);
							}
						}}
						className="rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? "Assigning..." : "Assign Subject"}
					</button>
				</div>
			</div>
		</div>
	);
}
