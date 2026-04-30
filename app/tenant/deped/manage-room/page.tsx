"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Global/HeaderTenant";
import RoomsTable, {
	type RoomRow,
} from "@/components/Features/Deped/manage-room/components/RoomsTable";
import ScheduleTable, {
	type ScheduleRow,
} from "@/components/Features/Deped/manage-room/components/ScheduleTable";
import Sidebar from "@/components/Features/sidebar";
import { getFeatureSidebarItems } from "@/features.config";

const sidebarItems = getFeatureSidebarItems("Deped", "subject-room-manager");

const roomRows: RoomRow[] = [
	{
		roomNo: "Room 1",
		section: "Amethyst",
		building: "Senior High School Building",
		type: "Classroom",
		capacity: "40",
		yearLevel: "Grade 8",
		description: "Room No.",
		subjectTitle: "Room No.",
	},
	{
		roomNo: "Room 2",
		section: "Daisy",
		building: "Senior High School Building",
		type: "Classroom",
		capacity: "40",
		yearLevel: "Grade 9",
		description: "Room No.",
		subjectTitle: "Room No.",
	},
	{
		roomNo: "Room 3",
		section: "Ruby",
		building: "Senior High School Building",
		type: "Classroom",
		capacity: "40",
		yearLevel: "Grade 9",
		description: "Room No.",
		subjectTitle: "Room No.",
	},
	{
		roomNo: "Room 10",
		section: "Science Laboratory",
		building: "Senior High School Building",
		type: "Laboratory",
		capacity: "40",
		yearLevel: "N/A",
		description: "Room No.",
		subjectTitle: "Room No.",
	},
];

const scheduleTimeline = [
	{ kind: "class", time: "07:30 - 08:15 AM" },
	{ kind: "class", time: "08:15 - 09:00 AM" },
	{ kind: "class", time: "09:00 - 09:45 AM" },
	{ kind: "break", time: "09:45 - 10:00 AM", label: "Break" },
	{ kind: "class", time: "10:00 - 10:45 AM" },
	{ kind: "class", time: "10:45 - 11:30 AM" },
	{ kind: "class", time: "11:30 - 12:15 PM" },
	{ kind: "lunch", time: "12:15 - 01:00 PM", label: "Lunch Break" },
	{ kind: "class", time: "01:00 - 01:45 PM" },
	{ kind: "class", time: "01:45 - 02:30 PM" },
	{ kind: "class", time: "02:30 - 03:15 PM" },
	{ kind: "class", time: "03:15 - 04:00 PM" },
	{ kind: "class", time: "04:00 - 04:45 PM" },
] as const;

const scheduleSubjectMap: Record<string, string[]> = {
	"Room 1": ["English", "Math", "Science", "TLE", "English", "English", "English", "English", "English", "English", "English"],
	"Room 2": ["Filipino", "Math", "Science", "MAPEH", "Filipino", "Filipino", "Filipino", "Filipino", "Filipino", "Filipino", "Filipino"],
	"Room 3": ["Science", "Science", "Science", "AP", "Science", "Science", "Science", "Science", "Science", "Science", "Science"],
	"Room 10": ["English", "Math", "Science", "TLE", "English", "English", "English", "English", "English", "English", "English"],
};

function buildScheduleRows(subjects: string[]) {
	let subjectIndex = 0;

	return scheduleTimeline.map((slot) => {
		if (slot.kind === "class") {
			const subject = subjects[subjectIndex] ?? "N/A";
			subjectIndex += 1;

			return {
				kind: "class",
				time: slot.time,
				monday: subject,
				tuesday: subject,
				wednesday: subject,
				thursday: subject,
				friday: subject,
				saturday: "N/A",
				sunday: "N/A",
			} satisfies ScheduleRow;
		}

		return slot.kind === "break"
			? ({ kind: "break", time: slot.time, label: slot.label } satisfies ScheduleRow)
			: ({ kind: "lunch", time: slot.time, label: slot.label } satisfies ScheduleRow);
	});
}

const scheduleRowsByRoom: Record<string, ScheduleRow[]> = Object.fromEntries(
	Object.entries(scheduleSubjectMap).map(([roomNo, subjects]) => [roomNo, buildScheduleRows(subjects)]),
) as Record<string, ScheduleRow[]>;

export default function RoomManagementPage() {
	const [selectedRoomNo, setSelectedRoomNo] = useState(roomRows[0].roomNo);

	const selectedRoom = useMemo(
		() => roomRows.find((room) => room.roomNo === selectedRoomNo) ?? roomRows[0],
		[selectedRoomNo],
	);

	const selectedScheduleRows = scheduleRowsByRoom[selectedRoom.roomNo] ?? scheduleRowsByRoom[roomRows[0].roomNo];

	return (
		<main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
			<Navbar />

			<div className="flex min-h-0 flex-1 overflow-hidden">
				<Sidebar title="Deped Menu" items={sidebarItems} />

				<section className="min-w-0 flex-1 overflow-y-auto px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8">
					<div className="mx-auto w-full max-w-none space-y-4">
						<div>
							<h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
								Room Management
							</h1>
						</div>

						<RoomsTable
							rooms={roomRows}
							selectedRoomNo={selectedRoomNo}
							onRoomSelect={(room) => setSelectedRoomNo(room.roomNo)}
							onAddRoomClick={() => {}}
						/>

						<ScheduleTable
							roomName={selectedRoom.roomNo}
							scheduleRows={selectedScheduleRows}
						/>
					</div>
				</section>
			</div>
		</main>
	);
}
