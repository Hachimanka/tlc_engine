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
				<div className="px-5 py-4 text-white" style={{ background: "var(--teal-primary)" }}>
					<h2 className="text-xl font-semibold">Assign Subject to {selectedFacultyName}</h2>
					<p className="mt-1 text-sm text-white/90">Filipino Department</p>
				</div>

				<div className="flex-1 overflow-y-auto px-5 py-6">
					<h3 className="mb-4 text-lg font-semibold" style={{ color: "var(--text-dark)" }}>
						Available Subjects
					</h3>

					<div className="overflow-hidden rounded-2xl border border-[#d6e8e4]">
						<div className="grid grid-cols-[80px_1.4fr_1fr_1.3fr_1fr_1fr] bg-[var(--teal-primary)] px-4 py-4 text-sm font-medium text-white">
							<div className="text-center">Select</div>
							<div>Subject Title</div>
							<div>Year Level</div>
							<div>Schedule</div>
							<div>Room</div>
							<div>Section</div>
						</div>

						<div className="divide-y divide-[#edf3f1] bg-white">
							{subjectOptions.map((subject) => {
								const isSelected = selectedSubjectId === subject.id;

								return (
									<label
										key={subject.id}
										className={`grid cursor-pointer grid-cols-[80px_1.4fr_1fr_1.3fr_1fr_1fr] items-center px-4 py-3 text-sm transition-colors hover:bg-[#ecf8f6] ${
											isSelected ? "bg-[#d7f2ee]" : "bg-white"
										}`}
									>
										<div className="flex justify-center">
											<input
												type="radio"
												name="subject-option"
												checked={isSelected}
												onChange={() => setSelectedSubjectId(subject.id)}
												className="h-5 w-5 cursor-pointer accent-[var(--teal-primary)]"
											/>
										</div>
										<div className="font-medium" style={{ color: "var(--text-dark)" }}>
											{subject.subjectTitle}
										</div>
										<div style={{ color: "var(--text-mid)" }}>{subject.yearLevel}</div>
										<div style={{ color: "var(--text-mid)" }}>{subject.schedule}</div>
										<div style={{ color: "var(--text-mid)" }}>{subject.room}</div>
										<div style={{ color: "var(--text-mid)" }}>{subject.section}</div>
									</label>
								);
							})}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-[#edf3f1] px-5 py-5">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-[var(--teal-primary)] px-5 py-3 text-sm font-medium transition hover:bg-[#ecf8f6]"
						style={{ color: "var(--text-dark)" }}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
						style={{ background: "var(--teal-primary)" }}
					>
						Assign Subject
					</button>
				</div>
			</div>
		</div>
	);
}
