"use client";

import { useMemo, useState } from "react";
import StyledSelect from "@/components/Global/StyledSelect";

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

const departmentOptions = [
	"All Department",
	"Filipino Department",
	"English Department",
	"Math Department",
	"Science Department",
	"TLE Department",
	"ESP Department",
	"Araling Panlipunan Department",
	"Physical Education Department",
	"Senior High Department",
];

const yearLevelOptions = [
	"All Level",
	"Grade 7",
	"Grade 8",
	"Grade 9",
	"Grade 10",
	"Grade 11",
	"Grade 12",
];

function getStatusClass(status: SubjectRow["status"]) {
	switch (status) {
		case "Approved":
			return "bg-[#ecfdf5] text-[var(--color-primary)] ring-[#b7e4d3]";
		case "Rejected":
			return "bg-[#fff1f2] text-[#d92d20] ring-[#fecdd3]";
		case "Pending":
		default:
			return "bg-[#fffbeb] text-[#b54708] ring-[#fedf89]";
	}
}

export default function SubjectTable({ subjectRows, onCreateSubjectClick }: SubjectTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState("All Department");
	const [yearLevelFilter, setYearLevelFilter] = useState("All Level");

	const filteredRows = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		return subjectRows.filter((row) => {
			const matchesSearch =
				normalizedSearch.length === 0 ||
				row.subjectTitle.toLowerCase().includes(normalizedSearch) ||
				row.department.toLowerCase().includes(normalizedSearch) ||
				row.yearLevel.toLowerCase().includes(normalizedSearch) ||
				row.classDuration.toLowerCase().includes(normalizedSearch) ||
				row.dateCreated.toLowerCase().includes(normalizedSearch) ||
				row.status.toLowerCase().includes(normalizedSearch) ||
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
						<div className="min-w-[220px]">
							<StyledSelect
								value={departmentFilter}
								onChange={setDepartmentFilter}
								options={departmentOptions.map((option) => ({ value: option, label: option }))}
								className="[&_button]:h-10"
							/>
						</div>

						<div className="min-w-[160px]">
							<StyledSelect
								value={yearLevelFilter}
								onChange={setYearLevelFilter}
								options={yearLevelOptions.map((option) => ({ value: option, label: option }))}
								className="[&_button]:h-10"
							/>
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
							{filteredRows.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-6 py-12 text-center">
										<div className="mx-auto flex max-w-sm flex-col items-center gap-3">
											<div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ecf8f6] text-[var(--color-primary)]">
												<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
													<path
														d="M7 4H17C18.1046 4 19 4.89543 19 6V20L12 16.5L5 20V6C5 4.89543 5.89543 4 7 4Z"
														stroke="currentColor"
														strokeWidth="1.8"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											</div>
											<div>
												<p className="text-sm font-semibold text-[var(--color-high-emphasis)]">
													No subjects yet
												</p>
												<p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
													Create a DepEd subject to add it to this manager.
												</p>
											</div>
										</div>
									</td>
								</tr>
							) : filteredRows.map((row) => (
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
									<td className="px-4 py-3 text-[12px]">
										<span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getStatusClass(row.status)}`}>
											{row.status}
										</span>
									</td>
									<td className="px-4 py-3 text-[12px] text-[var(--color-high-emphasis)]">
										{row.description || "-"}
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
