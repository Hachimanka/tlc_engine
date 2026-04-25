"use client";

import { useMemo, useState } from "react";

export type SubjectRow = {
	id: string;
	subjectTitle: string;
	department: string;
	yearLevel: string;
	classDuration: string;
	dateCreated: string;
	status: "Pending" | "Approved" | "Rejected";
	description: string;
};

type SubjectTableProps = {
	subjectRows: SubjectRow[];
	onCreateSubjectClick: () => void;
};

export const initialSubjectRows: SubjectRow[] = [
	{
		id: "sub-1",
		subjectTitle: "Filipino",
		department: "Filipino Department",
		yearLevel: "Grade 7",
		classDuration: "45 minutes",
		dateCreated: "3/20/2026",
		status: "Pending",
		description: "Description",
	},
	{
		id: "sub-2",
		subjectTitle: "Filipino",
		department: "Filipino Department",
		yearLevel: "Grade 8",
		classDuration: "45 minutes",
		dateCreated: "3/20/2026",
		status: "Pending",
		description: "Description",
	},
	{
		id: "sub-3",
		subjectTitle: "English",
		department: "English Department",
		yearLevel: "Grade 9",
		classDuration: "45 minutes",
		dateCreated: "3/20/2026",
		status: "Approved",
		description: "Description",
	},
	{
		id: "sub-4",
		subjectTitle: "MAPEH",
		department: "MAPEH Department",
		yearLevel: "Grade 7",
		classDuration: "45 minutes",
		dateCreated: "3/20/2026",
		status: "Rejected",
		description: "Description",
	},
	{
		id: "sub-5",
		subjectTitle: "Math",
		department: "Math Department",
		yearLevel: "Grade 10",
		classDuration: "45 minutes",
		dateCreated: "3/20/2026",
		status: "Pending",
		description: "Description",
	},
];

const initialDepartmentOptions = ["All Department", ...new Set(initialSubjectRows.map((row) => row.department))];
const initialYearLevelOptions = ["All Level", ...new Set(initialSubjectRows.map((row) => row.yearLevel))];

function getStatusClass(status: SubjectRow["status"]) {
	switch (status) {
		case "Approved":
			return "text-[var(--color-primary)]";
		case "Rejected":
			return "text-[#f04444]";
		case "Pending":
		default:
			return "text-[#f59e0b]";
	}
}

export default function SubjectTable({ subjectRows, onCreateSubjectClick }: SubjectTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState("All Department");
	const [yearLevelFilter, setYearLevelFilter] = useState("All Level");

	const departmentOptions = initialDepartmentOptions;
	const yearLevelOptions = initialYearLevelOptions;

	const filteredRows = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		return subjectRows.filter((row) => {
			const matchesSearch =
				normalizedSearch.length === 0 ||
				row.subjectTitle.toLowerCase().includes(normalizedSearch) ||
				row.department.toLowerCase().includes(normalizedSearch) ||
				row.yearLevel.toLowerCase().includes(normalizedSearch) ||
				row.description.toLowerCase().includes(normalizedSearch);
			const matchesDepartment =
				departmentFilter === "All Department" || row.department === departmentFilter;
			const matchesYearLevel = yearLevelFilter === "All Level" || row.yearLevel === yearLevelFilter;

			return matchesSearch && matchesDepartment && matchesYearLevel;
		});
	}, [departmentFilter, searchTerm, subjectRows, yearLevelFilter]);

	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex-1">
						<label htmlFor="subject-search" className="sr-only">
							Search subjects
						</label>
						<div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3">
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]"
							>
								<path
									d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<input
								id="subject-search"
								type="search"
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								placeholder="Search subject by code or name...."
								className="h-full w-full bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
							/>
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-end gap-2">
						<div className="relative flex items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3 py-2 text-sm text-[var(--color-low-emphasis)]">
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]"
							>
								<path
									d="M4 6H20M7 12H17M10 18H14"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
								/>
							</svg>
							<select
								value={departmentFilter}
								onChange={(event) => setDepartmentFilter(event.target.value)}
								className="appearance-none bg-transparent pr-6 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
							>
								{departmentOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--color-low-emphasis)]"
							>
								<path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>

						<div className="relative flex items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3 py-2 text-sm text-[var(--color-low-emphasis)]">
							<select
								value={yearLevelFilter}
								onChange={(event) => setYearLevelFilter(event.target.value)}
								className="appearance-none bg-transparent pr-6 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
							>
								{yearLevelOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--color-low-emphasis)]"
							>
								<path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>

						<button
							type="button"
							onClick={onCreateSubjectClick}
							className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)]"
						>
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								className="h-4 w-4 shrink-0"
							>
								<path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
							</svg>
							Create Subject
						</button>
					</div>
				</div>

			<div className="overflow-hidden rounded-[8px] border border-[color:var(--color-default)] bg-white shadow-level-1">
				<div className="overflow-x-auto">
					<table className="min-w-full border-collapse text-left">
						<thead>
							<tr>
								<th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
									Subject Title
								</th>
								<th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
									Department
								</th>
								<th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
									Year Level
								</th>
								<th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
									Class Duration
								</th>
								<th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
									Date Created
								</th>
								<th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
									Status
								</th>
								<th className="bg-[var(--color-primary)] px-4 py-3 text-[12px] font-semibold tracking-wide text-white">
									Description
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[color:var(--color-default)] bg-white">
							{filteredRows.map((row) => (
								<tr key={row.id} className="bg-white">
									<td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
										{row.subjectTitle}
									</td>
									<td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
										{row.department}
									</td>
									<td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
										{row.yearLevel}
									</td>
									<td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
										{row.classDuration}
									</td>
									<td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
										{row.dateCreated}
									</td>
									<td className={`px-4 py-3 text-[12px] font-medium ${getStatusClass(row.status)}`}>
										{row.status}
									</td>
									<td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
										{row.description}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
