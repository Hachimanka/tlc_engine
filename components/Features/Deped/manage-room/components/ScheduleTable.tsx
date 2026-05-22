"use client";

export type ScheduleDay =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

export type ScheduleRow = {
	id: string;
	subject: string;
	department: string;
	day: ScheduleDay;
	timeStart: string;
	timeEnd: string;
};

type ScheduleTableProps = {
	roomName: string;
	scheduleRows: ScheduleRow[];
	onAssignSubjectClick: () => void;
};

const dayColumns: Array<{ key: ScheduleDay; label: string }> = [
	{ key: "monday", label: "Monday" },
	{ key: "tuesday", label: "Tuesday" },
	{ key: "wednesday", label: "Wednesday" },
	{ key: "thursday", label: "Thursday" },
	{ key: "friday", label: "Friday" },
	{ key: "saturday", label: "Saturday" },
	{ key: "sunday", label: "Sunday" },
];

const scheduleSlots = [
	{ start: "07:30", end: "08:30" },
	{ start: "08:30", end: "09:30" },
	{ start: "09:30", end: "10:30" },
	{ start: "10:30", end: "11:30" },
	{ start: "11:30", end: "12:30" },
	{ start: "12:30", end: "13:30" },
	{ start: "13:30", end: "14:30" },
	{ start: "14:30", end: "15:30" },
	{ start: "15:30", end: "16:30" },
	{ start: "16:30", end: "17:30" },
	{ start: "17:30", end: "18:00" },
];

const toMinutes = (time: string) => {
	const [hour = "0", minute = "0"] = time.split(":");
	return Number(hour) * 60 + Number(minute);
};

const scheduleStart = toMinutes(scheduleSlots[0]?.start ?? "07:30");
const scheduleEnd = toMinutes(scheduleSlots[scheduleSlots.length - 1]?.end ?? "18:00");
const scheduleRowHeight = 98;

const formatTime = (time: string) => {
	const [hourValue, minute = "00"] = time.split(":");
	const hour = Number(hourValue);
	const suffix = hour >= 12 ? "PM" : "AM";
	const displayHour = hour % 12 || 12;
	return `${String(displayHour).padStart(2, "0")}:${minute} ${suffix}`;
};

const getRoomScheduleTag = (department: string) => {
	const words = department
		.replace(/department/i, "")
		.trim()
		.split(/\s+/)
		.filter(Boolean);

	if (words.length === 0) {
		return "CLS";
	}

	return words.map((word) => word[0]).join("").slice(0, 4).toUpperCase();
};

export default function ScheduleTable({
	roomName,
	scheduleRows,
	onAssignSubjectClick,
}: ScheduleTableProps) {
	const assignmentsByDay = dayColumns.map((day) => ({
		...day,
		assignments: scheduleRows.filter((row) => row.day === day.key),
	}));
	const gridHeight = scheduleSlots.length * scheduleRowHeight;

	return (
		<div className="overflow-hidden rounded-[8px] border border-[color:var(--color-default)] bg-white shadow-level-1">
			<div className="flex items-center justify-between gap-3 border-b border-[var(--color-default)] px-4 py-3">
				<div className="text-left text-[16px] font-semibold text-[var(--color-high-emphasis)]">
					{roomName}
				</div>
				<button
					type="button"
					onClick={onAssignSubjectClick}
					className="inline-flex h-9 items-center rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
				>
					Assign Subject
				</button>
			</div>

			<div className="overflow-x-auto">
				<div className="min-w-[1120px]">
					<div className="grid grid-cols-[280px_repeat(7,minmax(120px,1fr))] bg-[var(--color-primary)]">
						<div className="border-r border-white/20 px-5 py-4 text-[12px] font-semibold text-white">
							Time
						</div>
						{dayColumns.map((day) => (
							<div
								key={day.key}
								className="border-r border-white/20 px-5 py-4 text-center text-[12px] font-semibold text-white last:border-r-0"
							>
								{day.label}
							</div>
						))}
					</div>

					<div className="grid grid-cols-[280px_repeat(7,minmax(120px,1fr))]">
						<div>
							{scheduleSlots.map((slot) => (
								<div
									key={`${slot.start}-${slot.end}`}
									className="flex items-center border-b border-r border-[var(--color-default)] px-5 text-[12px] font-medium text-[var(--color-high-emphasis)]"
									style={{ height: scheduleRowHeight }}
								>
									{formatTime(slot.start)} - {formatTime(slot.end)}
								</div>
							))}
						</div>

						{assignmentsByDay.map((day) => (
							<div
								key={day.key}
								className="relative border-r border-[var(--color-default)] last:border-r-0"
								style={{ height: gridHeight }}
							>
								{scheduleSlots.map((slot) => (
									<div
										key={`${day.key}-${slot.start}-${slot.end}`}
										className="border-b border-[var(--color-default)]"
										style={{ height: scheduleRowHeight }}
									/>
								))}

								{day.assignments.map((assignment) => {
									const start = toMinutes(assignment.timeStart);
									const end = toMinutes(assignment.timeEnd);
									const clampedStart = Math.max(scheduleStart, start);
									const clampedEnd = Math.min(scheduleEnd, Math.max(end, clampedStart + 15));
									const top =
										((clampedStart - scheduleStart) / 60) * scheduleRowHeight;
									const height =
										((clampedEnd - clampedStart) / 60) * scheduleRowHeight;

									return (
										<div
											key={assignment.id}
											className="absolute left-4 right-4 flex min-h-10 flex-col justify-center overflow-hidden rounded-md bg-[var(--color-primary)] px-3 py-2 text-white shadow-level-1"
											style={{ top, height: Math.max(height - 8, 42) }}
											title={`${assignment.subject} ${formatTime(assignment.timeStart)} - ${formatTime(assignment.timeEnd)}`}
										>
											<p className="truncate text-xs font-bold">{assignment.subject}</p>
											<p className="mt-1 truncate text-[11px] font-semibold text-white/90">
												{formatTime(assignment.timeStart)} - {formatTime(assignment.timeEnd)}
											</p>
											<p className="mt-1 text-[10px] font-semibold uppercase text-white/75">
												{getRoomScheduleTag(assignment.department)}
											</p>
										</div>
									);
								})}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
