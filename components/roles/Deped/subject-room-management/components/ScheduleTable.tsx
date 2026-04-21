"use client";

export type ScheduleRow =
	| {
		kind: "class";
		time: string;
		monday: string;
		tuesday: string;
		wednesday: string;
		thursday: string;
		friday: string;
		saturday: string;
		sunday: string;
	}
	| {
		kind: "break" | "lunch";
		time: string;
		label: string;
	};

type ScheduleTableProps = {
	roomName: string;
	scheduleRows: ScheduleRow[];
};

export default function ScheduleTable({ roomName, scheduleRows }: ScheduleTableProps) {
	return (
		<div className="overflow-hidden rounded-[8px] border border-[color:var(--color-default)] bg-white shadow-level-1">
			<div className="border-b border-[var(--color-default)] px-4 py-3 text-left text-[16px] font-semibold text-[var(--color-high-emphasis)]">
				{roomName}
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
						{scheduleRows.map((row, index) => {
							if (row.kind === "class") {
								return (
									<tr key={`${row.time}-${index}`}>
										<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{row.time}
										</td>
										<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{row.monday}
										</td>
										<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{row.tuesday}
										</td>
										<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{row.wednesday}
										</td>
										<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{row.thursday}
										</td>
										<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{row.friday}
										</td>
										<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{row.saturday}
										</td>
										<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{row.sunday}
										</td>
									</tr>
								);
							}

							return (
								<tr key={`${row.time}-${index}`}>
									<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
										{row.time}
									</td>
									<td
										colSpan={5}
										className={`border border-[var(--color-default)] px-3 py-4 text-center text-[20px] font-semibold text-black ${
											row.kind === "lunch" ? "bg-[#ff4d4d]" : "bg-[#ff4d4d]"
										}`}
									>
										{row.label}
									</td>
									<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
										N/A
									</td>
									<td className="border border-[var(--color-default)] px-3 py-4 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
										N/A
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
