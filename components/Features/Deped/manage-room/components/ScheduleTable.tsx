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

const formatTime = (time: string) => {
	const [hourValue, minute = "00"] = time.split(":");
	const hour = Number(hourValue);
	const suffix = hour >= 12 ? "PM" : "AM";
	const displayHour = hour % 12 || 12;
	return `${String(displayHour).padStart(2, "0")}:${minute} ${suffix}`;
};

const getSlotAssignment = (
	scheduleRows: ScheduleRow[],
	day: ScheduleDay,
	slotStart: string,
	slotEnd: string,
) => {
	const slotStartMinutes = toMinutes(slotStart);
	const slotEndMinutes = toMinutes(slotEnd);

	return scheduleRows.find((row) => {
		if (row.day !== day) {
			return false;
		}

		const rowStartMinutes = toMinutes(row.timeStart);
		const rowEndMinutes = toMinutes(row.timeEnd);
		return rowStartMinutes < slotEndMinutes && rowEndMinutes > slotStartMinutes;
	});
};

export default function ScheduleTable({
	roomName,
	scheduleRows,
	onAssignSubjectClick,
}: ScheduleTableProps) {
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
				<table className="min-w-full border-collapse text-left">
					<thead>
						<tr>
							<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold text-white sm:px-4">
								Time
							</th>
							<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold text-white sm:px-4">
								Monday
							</th>
							<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold text-white sm:px-4">
								Tuesday
							</th>
							<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold text-white sm:px-4">
								Wednesday
							</th>
							<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold text-white sm:px-4">
								Thursday
							</th>
							<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold text-white sm:px-4">
								Friday
							</th>
							<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold text-white sm:px-4">
								Saturday
							</th>
							<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold text-white sm:px-4">
								Sunday
							</th>
						</tr>
					</thead>

					<tbody>
						{scheduleSlots.map((slot) => (
							<tr key={`${slot.start}-${slot.end}`}>
								<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] font-medium text-[var(--color-high-emphasis)] sm:px-4">
									{formatTime(slot.start)} - {formatTime(slot.end)}
								</td>
								{dayColumns.map((day) => {
									const assignment = getSlotAssignment(scheduleRows, day.key, slot.start, slot.end);

									return (
										<td
											key={day.key}
											className="h-[72px] border border-[var(--color-default)] px-3 py-3 text-[12px] text-[var(--color-high-emphasis)] sm:px-4"
										>
											{assignment ? (
												<div className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-white shadow-level-1">
													<p className="font-semibold">{assignment.subject}</p>
													<p className="mt-1 text-[11px] text-white/80">
														{formatTime(assignment.timeStart)} - {formatTime(assignment.timeEnd)}
													</p>
												</div>
											) : (
												null
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
