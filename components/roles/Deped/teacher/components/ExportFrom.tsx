"use client";

import { useEffect, type ReactNode } from "react";
import { teacherLoadRows, type TeacherLoadRow } from "./teacher-load-data";

type ExportFromProps = {
	isOpen: boolean;
	onClose: () => void;
	teacherName?: string;
	subjectArea?: string;
	advisoryClass?: string;
	timeIn?: string;
	timeOut?: string;
	region?: string;
	division?: string;
	district?: string;
	schoolName?: string;
	schoolYear?: string;
	reviewedBy?: string;
	reviewedPosition?: string;
	approvedBy?: string;
	approvedPosition?: string;
	address?: string;
	rows?: TeacherLoadRow[];
};

const scheduleRows = [
	"6:00-6:45",
	"6:45-7:30",
	"7:30-8:15",
	"8:15-8:30",
	"8:30-9:15",
	"9:00-9:15",
	"9:15-10:00",
	"10:00-10:45",
	"10:45-11:30",
	"11:30-12:15",
	"12:30-1:15",
	"1:15-2:00",
	"2:00-2:45",
	"2:45-3:00",
	"3:30-3:45",
	"3:00-3:45",
	"3:45-4:30",
	"4:30-5:15",
	"5:15-6:00",
];

function createPrintableAssignments(rows: TeacherLoadRow[]) {
	const teachingRows = rows.filter((row) => row.subjectTitle.trim().length > 0);
	let rowIndex = 0;

	return scheduleRows.map((time) => {
		if (time === "8:15-8:30" || time === "9:00-9:15" || time === "2:45-3:00" || time === "3:30-3:45") {
			return {
				time,
				subject: "RECESS",
				section: "",
			};
		}

		const currentRow = teachingRows[rowIndex];
		rowIndex += 1;

		return {
			time,
			subject: currentRow ? `${currentRow.subjectTitle} (${currentRow.subjectCode})` : "",
			section: currentRow ? `${currentRow.section}` : "",
		};
	});
}

function HeaderPlaceholder() {
	return (
		<div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[rgba(0,107,95,0.35)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
			Logo
		</div>
	);
}

function PrintablePage({ children }: { children: ReactNode }) {
	return (
		<section
			className="teacher-export-page mx-auto mb-6 flex h-[297mm] w-[210mm] flex-col bg-white px-[25.4mm] pt-[31mm] pb-[22mm] text-[12pt] text-black shadow-[0_10px_30px_rgba(0,0,0,0.12)] print:mb-0 print:h-[297mm] print:w-[210mm] print:shadow-none print:break-after-page"
			style={{ fontFamily: '"Times New Roman", Times, serif' }}
		>
			{children}
		</section>
	);
}

export default function ExportFrom({
	isOpen,
	onClose,
	teacherName = "JOSEPHINE F. BRACKEN",
	subjectArea = "Edukasyon sa Pagpapakatao",
	advisoryClass = "GR 7 - GREEN",
	timeIn = "",
	timeOut = "",
	region = "Region VII, Central Visayas",
	division = "DIVISION OF CEBU PROVINCE",
	district = "Balamban District III",
	schoolName = "BUANOY NATIONAL HIGH SCHOOL",
	schoolYear = "SY 2024-2025",
	reviewedBy = "ZARA P. YATUS",
	reviewedPosition = "Designation/Position",
	approvedBy = "CRISTOPHER C. PIODOS",
	approvedPosition = "Acting Secondary School Principal",
	address = "Public Schools District Supervisor",
	rows = teacherLoadRows,
}: ExportFromProps) {
	const printableAssignments = createPrintableAssignments(rows);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			window.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	if (!isOpen) {
		return null;
	}

	return (
		<>
			<div className="teacher-export-overlay fixed inset-0 z-50 bg-black/50 px-4 py-6">
				<div className="mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-[var(--color-background)] shadow-2xl">
					<div className="flex items-center justify-between gap-4 border-b border-[rgba(0,0,0,0.08)] bg-white px-5 py-4">
						<div>
							<h2 className="text-lg font-semibold text-[var(--color-high-emphasis)]">PDF Preview</h2>
							<p className="text-sm text-[var(--color-low-emphasis)]">Portrait A4 export preview for the class program form.</p>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => window.print()}
								className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)]"
							>
								Print / Save PDF
							</button>
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg border border-[var(--color-default)] px-4 py-2 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-white"
							>
								Close
							</button>
						</div>
					</div>

					<div className="flex-1 overflow-auto p-4">
						<div className="teacher-export-print-root mx-auto flex w-[210mm] flex-col gap-6">
							<PrintablePage>
								<div className="space-y-4">
									<div className="grid grid-cols-[64px_1fr_64px] items-center gap-4">
										<HeaderPlaceholder />
										<div className="space-y-1 text-center">
											<p className="text-[11px]">{region}</p>
											<p className="text-[11px] font-semibold uppercase">{division}</p>
											<p className="text-[11px] underline decoration-[rgba(0,0,0,0.4)] underline-offset-2">{district}</p>
											<p className="text-[12px] font-bold uppercase tracking-[0.02em]">{schoolName}</p>
										</div>
										<HeaderPlaceholder />
									</div>

									<div className="space-y-1 text-center">
										<p className="text-[14px] font-bold uppercase">Class Program</p>
										<p className="text-[11px]">{schoolYear}</p>
									</div>

									<table className="w-full border-collapse text-[11pt]">
										<tbody>
											<tr>
												<td className="w-[26%] border border-black px-1 py-0.5 font-semibold">Name of Teacher:</td>
												<td className="border border-black px-1 py-0.5">{teacherName}</td>
												<td className="w-[22%] border border-black px-1 py-0.5 font-semibold">Subject Area:</td>
												<td className="border border-black px-1 py-0.5">{subjectArea}</td>
											</tr>
											<tr>
												<td className="border border-black px-1 py-0.5 font-semibold">Advisory Class:</td>
												<td className="border border-black px-1 py-0.5">{advisoryClass}</td>
												<td className="border border-black px-1 py-0.5 font-semibold">Time In:</td>
												<td className="border border-black px-1 py-0.5">{timeIn}</td>
											</tr>
											<tr>
												<td className="border border-black px-1 py-0.5 font-semibold">Time Out:</td>
												<td className="border border-black px-1 py-0.5">{timeOut}</td>
												<td className="border border-black px-1 py-0.5" colSpan={2} />
											</tr>
										</tbody>
									</table>

									<table className="w-full border-collapse text-[11pt] leading-tight">
										<thead>
											<tr>
												<th className="border border-black px-1 py-0.5 text-left font-semibold">Time</th>
												<th className="border border-black px-1 py-0.5 text-left font-semibold">Subject</th>
												<th className="border border-black px-1 py-0.5 text-left font-semibold">Grade Level &amp; Section</th>
											</tr>
										</thead>
										<tbody>
											{printableAssignments.map((slot) => (
												<tr key={slot.time}>
													<td className="border border-black px-1 py-0.5 align-top">{slot.time}</td>
													<td className="border border-black px-1 py-0.5 align-top">{slot.subject}</td>
													<td className="border border-black px-1 py-0.5 align-top">{slot.section}</td>
												</tr>
											))}
										</tbody>
									</table>

									<div className="mt-4 grid grid-cols-2 gap-8 text-[10pt] leading-snug">
										<div className="space-y-3">
											<p className="font-semibold">Reviewed by:</p>
											<div className="pt-4">
												<p className="font-medium uppercase">{reviewedBy}</p>
												<p className="mt-1">{reviewedPosition}</p>
											</div>
										</div>

										<div className="space-y-3">
											<p className="font-semibold">Approved:</p>
											<div className="pt-4">
												<p className="font-medium uppercase">{approvedBy}</p>
												<p className="mt-1">{approvedPosition}</p>
												<p className="mt-1">{address}</p>
											</div>
										</div>
									</div>
								</div>
							</PrintablePage>
						</div>
					</div>
				</div>
			</div>

			<style jsx global>{`
				@media print {
					@page {
						size: A4 portrait;
						margin: 0;
					}

					body {
						background: white !important;
						-webkit-print-color-adjust: exact;
						print-color-adjust: exact;
					}

					body * {
						visibility: hidden;
					}

					.teacher-export-print-root,
					.teacher-export-print-root * {
						visibility: visible;
					}

					.teacher-export-print-root {
						position: static;
						display: block;
						width: 100%;
						max-width: none;
						margin: 0;
						padding: 0;
						overflow: visible;
					}

					.teacher-export-overlay {
						visibility: hidden !important;
						pointer-events: none;
					}
				}
			`}</style>
		</>
	);
}