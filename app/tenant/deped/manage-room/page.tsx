"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import AssignSubjectModal, {
	type AssignSubjectOption,
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
import { supabase } from "@/lib/supabaseClient";

type ModalState =
	| { mode: "create"; room: null }
	| { mode: "edit"; room: RoomRow };

const timeToMinutes = (time: string) => {
	const [hour = "0", minute = "0"] = time.split(":");
	return Number(hour) * 60 + Number(minute);
};

type ApiRoom = {
	id: string;
	name: string;
	building: string;
	type: string;
	capacity: number;
	status: "available" | "occupied" | "under_maintenance";
	section?: string;
	yearLevel?: string;
};

type RoomsPayload = {
	rooms?: ApiRoom[];
	room?: ApiRoom;
	subjects?: AssignSubjectOption[];
	assignments?: ApiRoomAssignment[];
	assignment?: ApiRoomAssignment;
	error?: string;
};

type ApiRoomAssignment = {
	id: string;
	section: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	subject: {
		id: string;
		title: string;
		code: string;
		department: string;
	} | null;
	room: {
		id: string;
		name: string;
	} | null;
};

const mapApiRoom = (room: ApiRoom): RoomRow => ({
	id: room.id,
	roomNo: room.name,
	section: room.section || "-",
	building: room.building,
	type: room.type,
	capacity: String(room.capacity),
	status: room.status === "available" ? "Available" : "Not Available",
	yearLevel: room.yearLevel || "N/A",
});

const mapRoomStatusForApi = (status: RoomRow["status"]) =>
	status === "Available" ? "available" : "occupied";

const normalizeScheduleDay = (value: string): ScheduleRow["day"] => {
	const normalized = value.trim().toLowerCase();

	if (
		normalized === "monday" ||
		normalized === "tuesday" ||
		normalized === "wednesday" ||
		normalized === "thursday" ||
		normalized === "friday" ||
		normalized === "saturday" ||
		normalized === "sunday"
	) {
		return normalized;
	}

	return "monday";
};

const mapApiAssignment = (assignment: ApiRoomAssignment): ScheduleRow | null => {
	if (!assignment.room?.id || !assignment.subject) {
		return null;
	}

	return {
		id: assignment.id,
		subject: assignment.subject.code || assignment.subject.title,
		department: assignment.subject.department,
		day: normalizeScheduleDay(assignment.dayOfWeek),
		timeStart: assignment.startTime,
		timeEnd: assignment.endTime,
	};
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
	const [subjects, setSubjects] = useState<AssignSubjectOption[]>([]);
	const [scheduleRowsByRoom, setScheduleRowsByRoom] = useState<Record<string, ScheduleRow[]>>({});
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	const [modalState, setModalState] = useState<ModalState | null>(null);
	const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
	const [assignSubjectError, setAssignSubjectError] = useState("");
	const [loadError, setLoadError] = useState("");
	const [formError, setFormError] = useState("");

	const getAccessToken = async () => {
		const { data: sessionData } = await supabase.auth.getSession();
		return sessionData.session?.access_token ?? "";
	};

	const loadRooms = useCallback(async () => {
		setLoadError("");

		const token = await getAccessToken();

		if (!token) {
			setLoadError("Your session expired. Please log in again.");
			return;
		}

		const response = await fetch("/api/tenant/rooms", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const payload: RoomsPayload = await response.json().catch(() => ({}));

		if (!response.ok) {
			setRooms([]);
			setLoadError(payload.error || "Unable to load rooms.");
			return;
		}

		const nextRooms = (payload.rooms ?? []).map(mapApiRoom);
		const nextScheduleRowsByRoom: Record<string, ScheduleRow[]> = {};

		for (const assignment of payload.assignments ?? []) {
			const mappedAssignment = mapApiAssignment(assignment);

			if (!mappedAssignment || !assignment.room?.id) {
				continue;
			}

			nextScheduleRowsByRoom[assignment.room.id] = [
				...(nextScheduleRowsByRoom[assignment.room.id] ?? []),
				mappedAssignment,
			];
		}

		setRooms(nextRooms);
		setSubjects(payload.subjects ?? []);
		setScheduleRowsByRoom(nextScheduleRowsByRoom);
		setSelectedRoomId((currentId) => {
			if (currentId && nextRooms.some((room) => room.id === currentId)) {
				return currentId;
			}

			return nextRooms[0]?.id ?? null;
		});
	}, []);

	useEffect(() => {
		void Promise.resolve().then(loadRooms);
	}, [loadRooms]);

	const selectedRoom = useMemo(
		() => rooms.find((room) => room.id === selectedRoomId) ?? null,
		[rooms, selectedRoomId],
	);

	const buildingOptions = useMemo(
		() =>
			Array.from(new Set(rooms.map((room) => room.building).filter(Boolean))).sort((left, right) =>
				left.localeCompare(right),
			),
		[rooms],
	);

	const selectedScheduleRows = selectedRoom
		? (scheduleRowsByRoom[selectedRoom.id] ?? [])
		: [];

	const handleSubmitRoom = async (values: RoomFormValues) => {
		setFormError("");

		const token = await getAccessToken();

		if (!token) {
			setFormError("Your session expired. Please log in again.");
			return;
		}

		const isEdit = modalState?.mode === "edit";
		const response = await fetch("/api/tenant/rooms", {
			method: isEdit ? "PATCH" : "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				id: isEdit ? modalState.room.id : undefined,
				name: values.roomNo,
				section: values.section,
				building: values.building,
				type: values.type,
				capacity: values.capacity,
				status: mapRoomStatusForApi(values.status),
				yearLevel: values.yearLevel,
			}),
		});
		const payload: RoomsPayload = await response.json().catch(() => ({}));

		if (!response.ok || !payload.room) {
			setFormError(payload.error || "Unable to save room.");
			return;
		}

		const savedRoom = mapApiRoom(payload.room);
		setRooms((currentRooms) => {
			if (isEdit) {
				return currentRooms.map((room) => (room.id === savedRoom.id ? savedRoom : room));
			}

			return [...currentRooms, savedRoom];
		});
		setSelectedRoomId(savedRoom.id);
		setModalState(null);
	};

	const handleAssignSubject = async (values: AssignSubjectValues) => {
		if (!selectedRoom) {
			return;
		}

		const currentRows = scheduleRowsByRoom[selectedRoom.id] ?? [];
		const startMinutes = timeToMinutes(values.timeStart);
		const endMinutes = timeToMinutes(values.timeEnd);
		const minStart = timeToMinutes("07:30");
		const maxEnd = timeToMinutes("18:00");

		if (startMinutes < minStart || endMinutes > maxEnd) {
			setAssignSubjectError("Schedule time must be between 07:30 AM and 06:00 PM.");
			return;
		}

		if (hasScheduleConflict(currentRows, values)) {
			setAssignSubjectError("This room already has a subject scheduled during that time.");
			return;
		}

		const token = await getAccessToken();

		if (!token) {
			setAssignSubjectError("Your session expired. Please log in again.");
			return;
		}

		const response = await fetch("/api/tenant/rooms/assignments", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				roomId: selectedRoom.id,
				subjectId: values.subjectId,
				section: selectedRoom.section && selectedRoom.section !== "-" ? selectedRoom.section : "N/A",
				dayOfWeek: values.day.charAt(0).toUpperCase() + values.day.slice(1),
				startTime: values.timeStart,
				endTime: values.timeEnd,
			}),
		});
		const payload: RoomsPayload = await response.json().catch(() => ({}));

		if (!response.ok || !payload.assignment) {
			setAssignSubjectError(payload.error || "Unable to assign subject to this room.");
			return;
		}

		const savedAssignment = mapApiAssignment(payload.assignment);

		if (!savedAssignment) {
			setAssignSubjectError("Subject was assigned, but the saved schedule could not be displayed.");
			return;
		}

		setScheduleRowsByRoom((currentRows) => ({
			...currentRows,
			[selectedRoom.id]: [
				...(currentRows[selectedRoom.id] ?? []),
				savedAssignment,
			],
		}));
		setAssignSubjectError("");
		setIsAssignSubjectOpen(false);
	};

	return (
		<>
			<AssignSubjectModal
				isOpen={isAssignSubjectOpen}
				subjectOptions={subjects}
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
				buildingOptions={buildingOptions}
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

					{loadError || formError ? (
						<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{formError || loadError}
						</div>
					) : null}

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
