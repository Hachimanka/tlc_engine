"use client";

import { useMemo, useState } from "react";
import AddFacultyForms from "./AddFacultyForms";
import SubjectAssignmentModal from "./SubjectAssignmentModal";
import VersionHistory from "./VersionHistory";

type FacultyRow = {
	name: string;
	specialization: string;
	employmentType: string;
	teachingHours: string;
	highlighted?: boolean;
};

type AssignmentRow = {
	subjectTitle: string;
	section: string;
	schedule: string;
	room: string;
	hoursPerDay: string;
};

const facultyRows: FacultyRow[] = [
	{
		name: "John Michael Montero Inoc",
		specialization: "Filipino",
		employmentType: "Full Time",
		teachingHours: "24/30",
	},
	{
		name: "Michael Montero",
		specialization: "Filipino",
		employmentType: "Full Time",
		teachingHours: "16/30",
		highlighted: true,
	},
	{
		name: "Michael Inoc",
		specialization: "Filipino",
		employmentType: "Full Time",
		teachingHours: "30/30",
	},
	{
		name: "John Michael",
		specialization: "Filipino",
		employmentType: "Full Time",
		teachingHours: "6/30",
	},
];

const assignmentsByFaculty: Record<string, AssignmentRow[]> = {
	"John Michael Montero Inoc": [
		{
			subjectTitle: "Filipino 10",
			section: "Grade 10 Amethyst",
			schedule: "Mon-Fri 7:00 - 7:45",
			room: "Room 1",
			hoursPerDay: "45 minutes",
		},
		{
			subjectTitle: "Panitikan at Wika",
			section: "Grade 10 Ruby",
			schedule: "Mon-Wed 8:00 - 8:45",
			room: "Room 2",
			hoursPerDay: "45 minutes",
		},
	],
	"Michael Montero": [
		{
			subjectTitle: "Filipino",
			section: "Grade 7 Amethyst",
			schedule: "Mon-Fri 7:00 - 7:45",
			room: "Room 1",
			hoursPerDay: "45 minutes",
		},
		{
			subjectTitle: "Fundamentals of Mixed Signals and Sensors",
			section: "Grade 7 Ruby",
			schedule: "Mon-Fri 8:00 - 8:45",
			room: "Room 2",
			hoursPerDay: "45 minutes",
		},
		{
			subjectTitle: "Data Structures and Algorithm",
			section: "Grade 7 Pearl",
			schedule: "Mon-Fri 1:00 - 1:45",
			room: "Room 3",
			hoursPerDay: "45 minutes",
		},
	],
	"Michael Inoc": [
		{
			subjectTitle: "Filipino 11",
			section: "Grade 11 Garnet",
			schedule: "Tue-Thu 9:00 - 9:45",
			room: "Room 4",
			hoursPerDay: "45 minutes",
		},
		{
			subjectTitle: "Komunikasyon",
			section: "Grade 11 Topaz",
			schedule: "Tue-Thu 10:00 - 10:45",
			room: "Room 5",
			hoursPerDay: "45 minutes",
		},
	],
	"John Michael": [
		{
			subjectTitle: "Filipino 8",
			section: "Grade 8 Emerald",
			schedule: "Mon-Wed 2:00 - 2:45",
			room: "Room 6",
			hoursPerDay: "45 minutes",
		},
	],
};

function formatTotalTime(rows: AssignmentRow[]) {
	const totalMinutes = rows.reduce((sum, row) => {
		const match = row.hoursPerDay.match(/(\d+)/);
		return sum + (match ? Number(match[1]) : 0);
	}, 0);

	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours === 0) {
		return `${minutes} minutes`;
	}

	if (minutes === 0) {
		return `${hours} hour${hours > 1 ? "s" : ""}`;
	}

	return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`;
}

export default function DepartmentFacultyTable() {
	const defaultSelectedFaculty = facultyRows.find((row) => row.highlighted) ?? facultyRows[0];
	const [selectedFaculty, setSelectedFaculty] = useState(defaultSelectedFaculty.name);
	const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
	const [isSubjectAssignmentOpen, setIsSubjectAssignmentOpen] = useState(false);
	const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

	const selectedAssignments = assignmentsByFaculty[selectedFaculty] ?? [];
	const totalTime = useMemo(() => formatTotalTime(selectedAssignments), [selectedAssignments]);

	return (
		<section className="w-full overflow-hidden rounded-2xl border border-[#d7e6e2] bg-white shadow-sm">
			<div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
				<h2 className="text-lg font-semibold sm:text-xl" style={{ color: "var(--text-dark)" }}>
					Filipino Department Faculty
				</h2>

				<button
					type="button"
					onClick={() => setIsAddFacultyOpen(true)}
					className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
					style={{ background: "var(--teal-primary)" }}
				>
					<span className="text-base leading-none">+</span>
					Add Faculty
				</button>
			</div>

			<div className="overflow-x-auto">
				<table className="min-w-full border-collapse">
					<thead>
						<tr style={{ background: "var(--teal-primary)" }}>
							<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
								Faculty Name
							</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
								Specialization
							</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
								Employment Type
							</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
								Total Teaching hours
							</th>
						</tr>
					</thead>
					<tbody>
						{facultyRows.map((row) => {
							const isSelected = row.name === selectedFaculty;

							return (
								<tr
									key={row.name}
									role="button"
									tabIndex={0}
									onClick={() => setSelectedFaculty(row.name)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											setSelectedFaculty(row.name);
										}
									}}
									aria-selected={isSelected}
									className="cursor-pointer border-b border-[#edf3f1] last:border-b-0 transition-colors hover:bg-[#ecf8f6] focus:outline-none focus-visible:bg-[#ecf8f6]"
									style={{ background: isSelected ? "#bfe9e4" : "white" }}
								>
									<td className="px-4 py-3 text-sm font-semibold sm:px-5" style={{ color: "var(--text-dark)" }}>
										{row.name}
									</td>
									<td className="px-4 py-3 text-sm sm:px-5" style={{ color: "var(--text-mid)" }}>
										{row.specialization}
									</td>
									<td className="px-4 py-3 text-sm sm:px-5" style={{ color: "var(--text-mid)" }}>
										{row.employmentType}
									</td>
									<td className="px-4 py-3 text-sm sm:px-5" style={{ color: "var(--text-mid)" }}>
										{row.teachingHours}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<div className="border-t border-[#e4ece9] bg-white px-0">
				<div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
					<h3 className="text-lg font-semibold" style={{ color: "var(--teal-primary)" }}>
						{selectedFaculty}
					</h3>

					<button
						type="button"
						onClick={() => setIsSubjectAssignmentOpen(true)}
						className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
						style={{ background: "var(--teal-primary)" }}
					>
						<span className="text-base leading-none">+</span>
						Assign Subject
					</button>
				</div>

				<div className="overflow-x-auto border-t border-[#edf3f1]">
					<table className="min-w-full border-collapse">
						<thead>
							<tr style={{ background: "var(--teal-primary)" }}>
								<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
									Subject Title
								</th>
								<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
									Section
								</th>
								<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
									Schedule
								</th>
								<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
									Room
								</th>
								<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
									Hours/Day
								</th>
								<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white sm:px-5">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{selectedAssignments.map((row) => (
								<tr key={`${selectedFaculty}-${row.subjectTitle}`} className="border-b border-[#edf3f1] last:border-b-0">
									<td className="px-4 py-3 text-sm font-medium sm:px-5" style={{ color: "var(--text-dark)" }}>
										{row.subjectTitle}
									</td>
									<td className="px-4 py-3 text-sm sm:px-5" style={{ color: "var(--text-mid)" }}>
										{row.section}
									</td>
									<td className="px-4 py-3 text-sm sm:px-5" style={{ color: "var(--text-mid)" }}>
										{row.schedule}
									</td>
									<td className="px-4 py-3 text-sm sm:px-5" style={{ color: "var(--text-mid)" }}>
										{row.room}
									</td>
									<td className="px-4 py-3 text-sm sm:px-5" style={{ color: "var(--text-mid)" }}>
										{row.hoursPerDay}
									</td>
									<td className="px-4 py-3 text-sm sm:px-5">
										<button type="button" className="text-sm font-medium text-red-500 hover:underline">
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex justify-end px-4 py-4 sm:px-5">
					<div className="flex flex-col items-end gap-3">
						<p className="text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
							<span className="text-red-500">Total :</span> {totalTime}
						</p>
						<button
							type="button"
							onClick={() => setIsVersionHistoryOpen(true)}
							className="text-base font-medium transition hover:opacity-80"
							style={{ color: "var(--teal-primary)" }}
						>
							View Version History
						</button>
					</div>
				</div>
			</div>

			<AddFacultyForms isOpen={isAddFacultyOpen} onClose={() => setIsAddFacultyOpen(false)} />
			<SubjectAssignmentModal
				isOpen={isSubjectAssignmentOpen}
				onClose={() => setIsSubjectAssignmentOpen(false)}
				selectedFacultyName={selectedFaculty}
			/>
			<VersionHistory
				isOpen={isVersionHistoryOpen}
				onClose={() => setIsVersionHistoryOpen(false)}
				selectedFacultyName={selectedFaculty}
			/>
		</section>
	);
}
