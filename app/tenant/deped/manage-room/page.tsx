"use client";

import { useMemo, useState } from "react";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import AssignSubjectModal, {
	type AssignSubjectValues,
} from "@/components/Features/Deped/manage-room/components/AssignSubjectModal";
import RoomFormModal, {
	type RoomFormValues,
} from "@/components/Features/Deped/manage-room/components/RoomFormModal";
import RoomsTable, {
	type RoomRow,
} from "@/components/Features/Deped/manage-room/components/RoomsTable";
import ScheduleTable, {
	type ScheduleRow,
} from "@/components/Features/Deped/manage-room/components/ScheduleTable";
import { ICON_SVGS } from "@/public/icons";

type ModalState =
	| { mode: "create"; room: null }
	| { mode: "edit"; room: RoomRow };

const buildScheduleRow = (values: AssignSubjectValues): ScheduleRow => ({
	id: `schedule-${Date.now()}`,
	subject: values.subject,
	department: values.department,
	day: values.day,
	timeStart: values.timeStart,
	timeEnd: values.timeEnd,
});

const timeToMinutes = (time: string) => {
	const [hour = "0", minute = "0"] = time.split(":");
	return Number(hour) * 60 + Number(minute);
};

const hasScheduleConflict = (
	currentRows: ScheduleRow[],
	values: AssignSubjectValues,
) => {
	const newStart = timeToMinutes(values.timeStart);
	const newEnd = timeToMinutes(values.timeEnd);

	return currentRows.some((row) => {
		if (row.day !== values.day) {
			return false;
		}

		const existingStart = timeToMinutes(row.timeStart);
		const existingEnd = timeToMinutes(row.timeEnd);
		return newStart < existingEnd && newEnd > existingStart;
	});
};

export default function RoomManagementPage() {
	const [rooms, setRooms] = useState<RoomRow[]>([]);
	const [scheduleRowsByRoom, setScheduleRowsByRoom] = useState<Record<string, ScheduleRow[]>>({});
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	const [modalState, setModalState] = useState<ModalState | null>(null);
	const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
	const [assignSubjectError, setAssignSubjectError] = useState("");

	const selectedRoom = useMemo(
		() => rooms.find((room) => room.id === selectedRoomId) ?? null,
		[rooms, selectedRoomId],
	);

	const selectedScheduleRows = selectedRoom
		? (scheduleRowsByRoom[selectedRoom.id] ?? [])
		: [];

	const handleSubmitRoom = (values: RoomFormValues) => {
		if (modalState?.mode === "edit") {
			setRooms((currentRooms) =>
				currentRooms.map((room) =>
					room.id === modalState.room.id ? { ...room, ...values } : room,
				),
			);
			setSelectedRoomId(modalState.room.id);
		} else {
			const newRoom: RoomRow = {
				id: `room-${Date.now()}`,
				...values,
			};
			setRooms((currentRooms) => [...currentRooms, newRoom]);
			setSelectedRoomId(newRoom.id);
		}

		setModalState(null);
	};

	const handleAssignSubject = (values: AssignSubjectValues) => {
		if (!selectedRoom) {
			return;
		}

		const currentRows = scheduleRowsByRoom[selectedRoom.id] ?? [];
		if (hasScheduleConflict(currentRows, values)) {
			setAssignSubjectError("This room already has a subject scheduled during that time.");
			return;
		}

		setScheduleRowsByRoom((currentRows) => ({
			...currentRows,
			[selectedRoom.id]: [
				...(currentRows[selectedRoom.id] ?? []),
				buildScheduleRow(values),
			],
		}));
		setAssignSubjectError("");
		setIsAssignSubjectOpen(false);
	};

	return (
		<>
			<AssignSubjectModal
				isOpen={isAssignSubjectOpen}
				errorMessage={assignSubjectError}
				onClose={() => {
					setAssignSubjectError("");
					setIsAssignSubjectOpen(false);
				}}
				onSubmit={handleAssignSubject}
			/>

			<RoomFormModal
				key={
					modalState?.mode === "edit"
						? `edit-${modalState.room.id}`
						: modalState?.mode ?? "closed"
				}
				isOpen={modalState !== null}
				mode={modalState?.mode ?? "create"}
				initialValues={modalState?.mode === "edit" ? modalState.room : null}
				onClose={() => setModalState(null)}
				onSubmit={handleSubmitRoom}
			/>

			<TenantRoleLayout
				tenantType="Deped"
				role="subject-room-manager"
				title="Deped Menu"
				iconSvg={ICON_SVGS.menu}
				requiredFeatureKey="deped-room-management"
				contentClassName="px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8"
			>
				<div className="mx-auto w-full max-w-none space-y-4">
					<div>
						<h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
							Room Management
						</h1>
					</div>

					<RoomsTable
						rooms={rooms}
						selectedRoomNo={selectedRoom?.roomNo ?? ""}
						onRoomSelect={(room) => setSelectedRoomId(room.id)}
						onAddRoomClick={() => setModalState({ mode: "create", room: null })}
						onEditRoomClick={(room) => setModalState({ mode: "edit", room })}
					/>

					{selectedRoom ? (
						<ScheduleTable
							roomName={selectedRoom.roomNo}
							scheduleRows={selectedScheduleRows}
							onAssignSubjectClick={() => {
								setAssignSubjectError("");
								setIsAssignSubjectOpen(true);
							}}
						/>
					) : null}
				</div>
			</TenantRoleLayout>
		</>
	);
}
