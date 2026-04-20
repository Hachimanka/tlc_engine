"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

export type RoomRow = {
	roomNo: string;
	section: string;
	building: string;
	type: string;
	capacity: string;
	yearLevel: string;
	description: string;
	subjectTitle: string;
};

type RoomsTableProps = {
	rooms: RoomRow[];
	selectedRoomNo: string;
	onRoomSelect: (room: RoomRow) => void;
	onAddRoomClick: () => void;
};

function handleRowKeyDown(
	event: KeyboardEvent<HTMLTableRowElement>,
	onSelect: () => void,
) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		onSelect();
	}
}

export default function RoomsTable({
	rooms,
	selectedRoomNo,
	onRoomSelect,
	onAddRoomClick,
}: RoomsTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [buildingFilter, setBuildingFilter] = useState("All Buildings");

	const buildingOptions = ["All Buildings", ...new Set(rooms.map((room) => room.building))];

	const filteredRooms = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		return rooms.filter((room) => {
			const matchesSearch =
				normalizedSearch.length === 0 ||
				room.roomNo.toLowerCase().includes(normalizedSearch) ||
				room.section.toLowerCase().includes(normalizedSearch) ||
				room.building.toLowerCase().includes(normalizedSearch) ||
				room.type.toLowerCase().includes(normalizedSearch) ||
				room.description.toLowerCase().includes(normalizedSearch) ||
				room.subjectTitle.toLowerCase().includes(normalizedSearch);

			const matchesBuilding = buildingFilter === "All Buildings" || room.building === buildingFilter;

			return matchesSearch && matchesBuilding;
		});
	}, [buildingFilter, rooms, searchTerm]);

	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex-1">
					<label htmlFor="room-search" className="sr-only">
						Search rooms
					</label>
					<div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--color-default)] bg-white px-3 shadow-level-1">
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
							id="room-search"
							type="search"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Search room..."
							className="h-full w-full bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
						/>
					</div>
				</div>

				<div className="relative w-full max-w-[220px] rounded-lg border border-[var(--color-default)] bg-white px-3 py-2 text-sm text-[var(--color-low-emphasis)] shadow-level-1 lg:max-w-[240px]">
					<select
						value={buildingFilter}
						onChange={(event) => setBuildingFilter(event.target.value)}
						className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-[var(--color-high-emphasis)] outline-none"
					>
						{buildingOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-low-emphasis)]"
					>
						<path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</div>
			</div>

			<div className="overflow-hidden rounded-[8px] border border-[color:var(--color-default)] bg-white shadow-level-1">
				<div className="flex items-center justify-between gap-3 border-b border-[var(--color-default)] px-3 py-2.5 sm:px-4">
					<p className="text-[13px] font-semibold text-[var(--color-high-emphasis)]">Rooms (3)</p>
					<button
						type="button"
						onClick={onAddRoomClick}
						className="inline-flex items-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)]"
					>
						Add Room
					</button>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full border-collapse text-left">
						<thead>
							<tr>
								<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold tracking-wide text-white sm:px-4">
									Room No.
								</th>
								<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold tracking-wide text-white sm:px-4">
									Section
								</th>
								<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold tracking-wide text-white sm:px-4">
									Building
								</th>
								<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold tracking-wide text-white sm:px-4">
									Type
								</th>
								<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold tracking-wide text-white sm:px-4">
									Capacity
								</th>
								<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold tracking-wide text-white sm:px-4">
									Year Level
								</th>
								<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold tracking-wide text-white sm:px-4">
									Description
								</th>
								<th className="bg-[var(--color-primary)] px-3 py-3 text-[12px] font-semibold tracking-wide text-white sm:px-4">
									Subject Title
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[color:var(--color-default)] bg-white">
							{filteredRooms.map((room) => {
								const isSelected = selectedRoomNo === room.roomNo;

								return (
									<tr
										key={room.roomNo}
										onClick={() => onRoomSelect(room)}
										onKeyDown={(event) => handleRowKeyDown(event, () => onRoomSelect(room))}
										tabIndex={0}
										aria-selected={isSelected}
										className={`cursor-pointer outline-none transition-colors hover:bg-[#ecf8f6] focus:bg-[#ecf8f6] ${
											isSelected ? "bg-[#e0f4f1]" : "bg-white"
										}`}
									>
										<td className="px-3 py-3 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{room.roomNo}
										</td>
										<td className="px-3 py-3 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{room.section}
										</td>
										<td className="px-3 py-3 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{room.building}
										</td>
										<td className="px-3 py-3 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{room.type}
										</td>
										<td className="px-3 py-3 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{room.capacity}
										</td>
										<td className="px-3 py-3 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{room.yearLevel}
										</td>
										<td className="px-3 py-3 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{room.description}
										</td>
										<td className="px-3 py-3 text-[12px] text-[var(--color-high-emphasis)] sm:px-4">
											{room.subjectTitle}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
