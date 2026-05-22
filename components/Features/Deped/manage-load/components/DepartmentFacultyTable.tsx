"use client";

import { useEffect, useMemo, useState } from "react";
import SubjectAssignmentModal, { type SubjectOption } from "./SubjectAssignmentModal";
import VersionHistory from "./VersionHistory";
import { supabase } from "@/lib/supabaseClient";

type FacultyRow = {
	id: string;
	accountId: string;
	name: string;
	specialization: string;
	employmentType: string;
};

type FacultyApiRow = FacultyRow & {
	email?: string;
	department?: string;
};

type SubjectRow = {
	id: string;
	subjectTitle: string;
	section: string;
	schedule: string;
	room: string;
	hoursPerDay: string;
};

type DepartmentFacultyTableProps = {
	departmentName?: string;
};

const approvedDepedSubjects: SubjectOption[] = [
	{
		id: "filipino-7-approved",
		subjectTitle: "Filipino 7",
		department: "Filipino Department",
		yearLevel: "Grade 7",
		schedule: "Mon-Fri 7:00 - 7:45",
		room: "Room 1",
		section: "Amethyst",
		hoursPerDay: "45 minutes",
		status: "Approved",
	},
	{
		id: "filipino-8-approved",
		subjectTitle: "Filipino 8",
		department: "Filipino Department",
		yearLevel: "Grade 8",
		schedule: "Mon-Fri 8:00 - 8:45",
		room: "Room 11",
		section: "Mercury",
		hoursPerDay: "45 minutes",
		status: "Approved",
	},
	{
		id: "english-7-approved",
		subjectTitle: "English 7",
		department: "English Department",
		yearLevel: "Grade 7",
		schedule: "Mon-Fri 9:00 - 9:45",
		room: "Room 2",
		section: "Daisy",
		hoursPerDay: "45 minutes",
		status: "Approved",
	},
	{
		id: "math-7-approved",
		subjectTitle: "Mathematics 7",
		department: "Math Department",
		yearLevel: "Grade 7",
		schedule: "Mon-Fri 10:00 - 10:45",
		room: "Room 3",
		section: "Ruby",
		hoursPerDay: "45 minutes",
		status: "Approved",
	},
];

function formatTotalMinutes(subjects: SubjectRow[]) {
	const totalMinutes = subjects.reduce((sum, subject) => {
		const parsedMinutes = Number(subject.hoursPerDay.replace(/[^0-9]/g, ""));
		return sum + parsedMinutes;
	}, 0);

	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (totalMinutes === 0) return "0 minutes";
	if (hours === 0) return `${minutes} minutes`;
	if (minutes === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
	return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`;
}

function getFacultyMaxHours(employmentType: string) {
	return employmentType === "Part Time" ? 3 : 6;
}

function getTotalHours(subjects: SubjectRow[]) {
	const totalMinutes = subjects.reduce((sum, subject) => {
		const parsedMinutes = Number(subject.hoursPerDay.replace(/[^0-9]/g, ""));
		return sum + parsedMinutes;
	}, 0);

	return totalMinutes / 60;
}

function getTotalMinutes(subjects: SubjectRow[]) {
	return subjects.reduce((sum, subject) => {
		const parsedMinutes = Number(subject.hoursPerDay.replace(/[^0-9]/g, ""));
		return sum + parsedMinutes;
	}, 0);
}

function formatHoursLoad(subjects: SubjectRow[], employmentType: string) {
	const totalHours = Math.round(getTotalHours(subjects) * 100) / 100;
	return `${totalHours} hours / ${getFacultyMaxHours(employmentType)} hours`;
}

function formatMinutesCapacity(subjects: SubjectRow[], employmentType: string) {
	const totalMinutes = getTotalMinutes(subjects);
	const maxMinutes = getFacultyMaxHours(employmentType) * 60;
	return `${totalMinutes} minutes / ${maxMinutes} minutes`;
}

export default function DepartmentFacultyTable({ departmentName }: DepartmentFacultyTableProps) {
	const [resolvedDepartmentName, setResolvedDepartmentName] = useState(departmentName ?? "");
	const [isDepartmentLoading, setIsDepartmentLoading] = useState(!departmentName);
	const [departmentError, setDepartmentError] = useState("");
	const [facultyRows, setFacultyRows] = useState<FacultyRow[]>([]);
	const [facultyError, setFacultyError] = useState("");
	const [facultySubjects, setFacultySubjects] = useState<Record<string, SubjectRow[]>>({});
	const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
	const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
	const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
	const [assignSubjectError, setAssignSubjectError] = useState("");
	const activeDepartmentName = departmentName ?? resolvedDepartmentName;

	useEffect(() => {
		if (departmentName) {
			setResolvedDepartmentName(departmentName);
			setIsDepartmentLoading(false);
			setDepartmentError("");
			setFacultyRows([]);
			return;
		}

		let isActive = true;

		const loadDepartmentFaculty = async () => {
			setIsDepartmentLoading(true);
			setDepartmentError("");
			setFacultyError("");

			try {
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();

				if (sessionError) {
					throw sessionError;
				}

				const response = await fetch("/api/tenant/deped/department-faculty", {
					headers: session?.access_token
						? { Authorization: `Bearer ${session.access_token}` }
						: undefined,
				});
				const payload = await response.json().catch(() => ({}));

				if (!response.ok) {
					throw new Error(
						typeof payload?.error === "string"
							? payload.error
							: "Failed to load the current department.",
					);
				}

				if (!isActive) return;

				setResolvedDepartmentName(
					typeof payload?.departmentName === "string" ? payload.departmentName : "",
				);
				setFacultyRows(
					Array.isArray(payload?.faculty)
						? payload.faculty.map((faculty: FacultyApiRow) => ({
								id: faculty.id,
								accountId: faculty.accountId ?? faculty.id,
								name: faculty.name,
								specialization: faculty.specialization,
								employmentType: faculty.employmentType,
							}))
						: [],
				);
			} catch (error) {
				if (!isActive) return;
				setDepartmentError(
					error instanceof Error
						? error.message
						: "Failed to load department faculty.",
				);
				setFacultyRows([]);
			} finally {
				if (isActive) {
					setIsDepartmentLoading(false);
				}
			}
		};

		void loadDepartmentFaculty();

		return () => {
			isActive = false;
		};
	}, [departmentName]);

	const selectedFaculty = facultyRows.find((faculty) => faculty.id === selectedFacultyId) ?? null;
	const selectedSubjects = useMemo(
		() => (selectedFaculty ? (facultySubjects[selectedFaculty.id] ?? []) : []),
		[facultySubjects, selectedFaculty],
	);

	useEffect(() => {
		if (!selectedFacultyId) {
			return;
		}

		if (!facultyRows.some((faculty) => faculty.id === selectedFacultyId)) {
			setSelectedFacultyId(null);
		}
	}, [facultyRows, selectedFacultyId]);

	const availableSubjects = useMemo(
		() =>
			approvedDepedSubjects.filter(
				(subject) =>
					subject.department === activeDepartmentName &&
					subject.status === "Approved" &&
					!selectedSubjects.some((assigned) => assigned.id === subject.id),
			),
		[activeDepartmentName, selectedSubjects],
	);

	const totalTeachingHoursLabel = useMemo(
		() => formatTotalMinutes(selectedSubjects),
		[selectedSubjects],
	);

	const handleAssignSubject = (subject: SubjectOption) => {
		if (!selectedFaculty) return;

		const nextTotalHours =
			getTotalHours(selectedSubjects) + getTotalHours([{ ...subject, id: subject.id }]);
		const maxHours = getFacultyMaxHours(selectedFaculty.employmentType);
		if (nextTotalHours > maxHours) {
			setAssignSubjectError(
				`${selectedFaculty.employmentType} faculty can only have up to ${maxHours} teaching hours.`,
			);
			return;
		}

		const assignedSubject: SubjectRow = {
			id: subject.id,
			subjectTitle: subject.subjectTitle,
			section: `${subject.yearLevel} ${subject.section}`,
			schedule: subject.schedule,
			room: subject.room,
			hoursPerDay: subject.hoursPerDay,
		};

		setFacultySubjects((currentSubjects) => ({
			...currentSubjects,
			[selectedFaculty.id]: [
				...(currentSubjects[selectedFaculty.id] ?? []),
				assignedSubject,
			],
		}));
		setAssignSubjectError("");
		setIsAssignSubjectOpen(false);
	};

	const handleDeleteSubject = (subjectId: string) => {
		if (!selectedFaculty) return;

		setFacultySubjects((currentSubjects) => ({
			...currentSubjects,
			[selectedFaculty.id]: (currentSubjects[selectedFaculty.id] ?? []).filter(
				(subject) => subject.id !== subjectId,
			),
		}));
	};

	if (isDepartmentLoading) {
		return (
			<div className="overflow-hidden rounded-[18px] border border-[color:var(--color-default)] bg-[var(--color-card)] p-5 shadow-level-1">
				<div className="h-7 w-72 animate-pulse rounded bg-[var(--color-default)]" />
				<div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-[var(--color-default)]" />
				<div className="mt-6 h-28 animate-pulse rounded-xl bg-[var(--color-default)]" />
			</div>
		);
	}

	if (departmentError || !activeDepartmentName) {
		return (
			<div className="rounded-[18px] border border-[color:var(--color-default)] bg-[var(--color-card)] p-5 text-body-small text-[var(--color-low-emphasis)] shadow-level-1">
				{departmentError || "Your account has no department assigned yet."}
			</div>
		);
	}

	return (
		<>
			<SubjectAssignmentModal
				isOpen={isAssignSubjectOpen}
				onClose={() => setIsAssignSubjectOpen(false)}
				onSubmit={handleAssignSubject}
				selectedFacultyName={selectedFaculty?.name ?? "Faculty"}
				departmentName={activeDepartmentName}
				subjectOptions={availableSubjects}
				errorMessage={assignSubjectError}
			/>
			<VersionHistory
				isOpen={isVersionHistoryOpen}
				onClose={() => setIsVersionHistoryOpen(false)}
				selectedFacultyName={selectedFaculty?.name ?? "Faculty"}
			/>

			<div className="overflow-hidden rounded-[18px] border border-[color:var(--color-default)] bg-[var(--color-card)] shadow-level-1">
				<div className="flex items-center justify-between gap-4 border-b border-[color:var(--color-default)] px-4 py-3 sm:px-5">
					<div>
						<h1 className="text-2xl text-[var(--color-high-emphasis)]">
							{activeDepartmentName} Faculty
						</h1>
						<p className="mt-1 text-body-small text-[var(--color-low-emphasis)]">
							Click a faculty row to load the assigned subjects below.
						</p>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full border-collapse text-left">
						<thead>
							<tr>
								<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Faculty Name</th>
								<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Specialization</th>
								<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Employment Type</th>
								<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Teaching Minutes</th>
								<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Total Teaching Hours</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[color:var(--color-default)] bg-white">
							{facultyRows.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
										{facultyError || "No teachers found in this department yet."}
									</td>
								</tr>
							) : facultyRows.map((faculty) => {
								const isSelected = faculty.id === selectedFaculty?.id;

								return (
									<tr
										key={faculty.id}
										onClick={() => setSelectedFacultyId(faculty.id)}
										className={`cursor-pointer transition-colors hover:bg-[var(--color-default)]/35 ${isSelected ? "bg-[var(--color-default)]/60" : "bg-white"}`}
									>
										<td className="px-4 py-3 text-body-small font-semibold text-[var(--color-high-emphasis)]">
											{faculty.name}
										</td>
										<td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
											{faculty.specialization}
										</td>
										<td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
											{faculty.employmentType}
										</td>
										<td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
											{formatMinutesCapacity(facultySubjects[faculty.id] ?? [], faculty.employmentType)}
										</td>
										<td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
											{formatHoursLoad(facultySubjects[faculty.id] ?? [], faculty.employmentType)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{selectedFaculty ? (
					<div className="border-t border-[color:var(--color-default)] bg-[var(--color-background)] px-4 py-5 sm:px-5">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<h2 className="text-heading-h4 text-[var(--color-primary)]">
									{selectedFaculty.name}
								</h2>
								<p className="mt-1 text-body-small text-[var(--color-low-emphasis)]">
									{selectedFaculty.specialization} Department • {selectedFaculty.employmentType}
								</p>
							</div>
							<button
								type="button"
								onClick={() => {
									setAssignSubjectError("");
									setIsAssignSubjectOpen(true);
								}}
								className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-label-button text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)]"
							>
								<span className="text-base leading-none">+</span>
								Assign Subject
							</button>
						</div>

						<div className="mt-4 overflow-hidden rounded-[18px] border border-[color:var(--color-default)] bg-white">
							<div className="overflow-x-auto">
								<table className="min-w-full border-collapse text-left">
									<thead>
										<tr>
											<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Subject Title</th>
											<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Section</th>
											<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Schedule</th>
											<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Room</th>
											<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Hours/Day</th>
											<th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[color:var(--color-default)] bg-white">
										{selectedSubjects.length === 0 ? (
											<tr>
												<td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
													No subjects assigned yet.
												</td>
											</tr>
										) : selectedSubjects.map((subject) => (
											<tr key={subject.id} className="bg-white transition-colors hover:bg-[var(--color-default)]/25">
												<td className="px-4 py-3 text-body-small font-semibold text-[var(--color-high-emphasis)]">
													{subject.subjectTitle}
												</td>
												<td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
													{subject.section}
												</td>
												<td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
													{subject.schedule}
												</td>
												<td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
													{subject.room}
												</td>
												<td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
													{subject.hoursPerDay}
												</td>
												<td className="px-4 py-3">
													<button
														type="button"
														onClick={() => handleDeleteSubject(subject.id)}
														className="text-label-button text-[var(--color-error)] transition hover:opacity-80"
													>
														Delete
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="flex items-center justify-end border-t border-[color:var(--color-default)] bg-[var(--color-card)] px-4 py-4 text-base sm:px-5">
								<p>
									<span className="text-label-button text-[var(--color-error)]">Total:</span>{" "}
									<span className="text-label-button text-[var(--color-high-emphasis)]">
										{totalTeachingHoursLabel}
									</span>
								</p>
							</div>
						</div>

						<div className="mt-3 flex justify-end">
							<button
								type="button"
								onClick={() => setIsVersionHistoryOpen(true)}
								className="rounded-md px-1 py-1 text-label-button text-[var(--color-primary)] transition hover:opacity-80"
							>
								View Version History
							</button>
						</div>
					</div>
				) : null}
			</div>
		</>
	);
}
