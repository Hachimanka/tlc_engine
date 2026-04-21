"use client";

import { useEffect, useState } from "react";

type SubjectOption = {
	id: string;
	subjectTitle: string;
	yearLevel: string;
	schedule: string;
	room: string;
	section: string;
};

type SubjectAssignmentModalProps = {
	isOpen: boolean;
	onClose: () => void;
	selectedFacultyName: string;
};

const subjectOptions: SubjectOption[] = [
	{
		id: "subj-1",
		subjectTitle: "Filipino",
		yearLevel: "Grade 7",
		schedule: "Mon-Fri 7:00 - 7:45",
		room: "Room 1",
		section: "Amethyst",
	},
	{
		id: "subj-2",
		subjectTitle: "Filipino",
		yearLevel: "Grade 8",
		schedule: "Mon-Fri 7:00 - 7:45",
		room: "Room 11",
		section: "Mercury",
	},
	{
		id: "subj-3",
		subjectTitle: "Filipino",
		yearLevel: "Grade 9",
		schedule: "Mon-Fri 7:00 - 7:45",
		room: "Room 21",
		section: "Gumamela",
	},
];

export default function SubjectAssignmentModal({ isOpen, onClose, selectedFacultyName }: SubjectAssignmentModalProps) {
	const [selectedSubjectId, setSelectedSubjectId] = useState(subjectOptions[0].id);

	useEffect(() => {
		if (isOpen) {
			setSelectedSubjectId(subjectOptions[0].id);
		}
	}, [isOpen]);

	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
			<div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div className="px-5 py-4 text-white bg-[var(--color-primary)]">
					<h2 className="text-xl font-semibold">Assign Subject to {selectedFacultyName}</h2>
					<p className="mt-1 text-sm text-white/90">Filipino Department</p>
				</div>

				<div className="flex-1 overflow-y-auto px-5 py-6">
					<h3 className="mb-4 text-lg font-semibold text-[var(--color-high-emphasis)]">
						Available Subjects
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
							{subjectOptions.map((subject) => {
								const isSelected = selectedSubjectId === subject.id;

								return (
									<label
										key={subject.id}
										className={`group grid cursor-pointer grid-cols-[80px_1.4fr_1fr_1.3fr_1fr_1fr] items-center px-4 py-3 text-sm transition-colors hover:bg-[#ecf8f6] ${
											isSelected ? "bg-[#d7f2ee]" : "bg-white"
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
												className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-[rgba(0,107,95,0.18)] peer-focus-visible:ring-offset-2 ${
													isSelected
														? "border-[var(--color-primary)] bg-[rgba(0,107,95,0.10)]"
														: "border-[var(--color-primary)] bg-white group-hover:bg-[rgba(0,107,95,0.06)]"
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
						className="rounded-lg border border-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
					>
						Assign Subject
					</button>
				</div>
			</div>
		</div>
	);
}
