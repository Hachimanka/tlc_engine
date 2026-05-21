"use client";

import { useMemo, useState, type ReactNode } from "react";
import DepartmentListTable from "@/components/Features/Deped/load-admin/components/DepartmentListTable";
import DepedDepartmentFacultyTable from "@/components/Features/Deped/manage-load/components/DepartmentFacultyTable";
import DepedRoomsTable, {
  type RoomRow,
} from "@/components/Features/Deped/manage-room/components/RoomsTable";
import AssignSubjectModal, {
  type AssignSubjectValues,
} from "@/components/Features/Deped/manage-room/components/AssignSubjectModal";
import RoomFormModal, {
  type RoomFormValues,
} from "@/components/Features/Deped/manage-room/components/RoomFormModal";
import DepedScheduleTable, {
  type ScheduleRow,
} from "@/components/Features/Deped/manage-room/components/ScheduleTable";
import DepedSubjectManagementForm, {
  type SubjectFormValues,
} from "@/components/Features/Deped/manage-subject/components/SubjectManagementForm";
import DepedSubjectTable, {
  type SubjectRow,
} from "@/components/Features/Deped/manage-subject/components/SubjectTable";
import DepedExportForm from "@/components/Features/Deped/view-teaching-load/components/ExportFrom";
import DepedRequestForm from "@/components/Features/Deped/view-teaching-load/components/RequestForm";
import DepedTeachingLoadTable from "@/components/Features/Deped/view-teaching-load/components/TeachingLoadTable";
import CollegeRoomsTable from "@/components/Features/College/manage-room/components/RoomsTable";
import CollegeSubjectManagementTable from "@/components/Features/College/manage-subject/components/SubjectManagementTable";
import AcademicApprovalsDashboard from "@/components/Features/College/academic-approvals/AcademicApprovalsDashboard";
import CollegeExportForm from "@/components/Features/College/view-teaching-load/components/ExportForm";
import CollegeRequestForm from "@/components/Features/College/view-teaching-load/components/RequestForm";
import CollegeTeachingLoadTable from "@/components/Features/College/view-teaching-load/components/TeachingLoadTable";
import type { FeatureKey } from "@/features/tenant-feature-catalog";
import { ICON_SVGS } from "@/public/icons";

type TenantFeatureContentProps = {
  featureKey: string;
  children: ReactNode;
};

function PageShell({
  title,
  children,
  maxWidth = "max-w-none",
}: {
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className={`mx-auto w-full ${maxWidth} space-y-4`}>
      <div>
        <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}

function PlaceholderContent({ title }: { title: string }) {
  return (
    <div className="text-[28px] font-semibold text-[var(--color-high-emphasis)]">
      {title}
    </div>
  );
}

function DepedSubjectContent() {
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>([]);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  const handleCreateSubject = (values: SubjectFormValues) => {
    setSubjectRows((currentRows) => [
      {
        id: `sub-${Date.now()}`,
        subjectTitle: values.subjectTitle,
        department: values.department,
        yearLevel: values.yearLevel,
        classDuration: values.classDuration,
        dateCreated: values.dateCreated,
        status: "Pending",
        description: values.description,
      },
      ...currentRows,
    ]);
    setIsCreateSubjectOpen(false);
  };

  return (
    <>
      <DepedSubjectManagementForm
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        onSubmit={handleCreateSubject}
      />
      <PageShell title="Subject Management">
        <DepedSubjectTable
          subjectRows={subjectRows}
          onCreateSubjectClick={() => setIsCreateSubjectOpen(true)}
        />
      </PageShell>
    </>
  );
}

function DepedRoomContent() {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [scheduleRowsByRoom, setScheduleRowsByRoom] = useState<Record<string, ScheduleRow[]>>({});
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomModal, setRoomModal] = useState<
    { mode: "create"; room: null } | { mode: "edit"; room: RoomRow } | null
  >(null);
  const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
  const [assignSubjectError, setAssignSubjectError] = useState("");

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

  const handleSubmitRoom = (values: RoomFormValues) => {
    if (roomModal?.mode === "edit") {
      setRooms((currentRooms) =>
        currentRooms.map((room) =>
          room.id === roomModal.room.id ? { ...room, ...values } : room,
        ),
      );
      setSelectedRoomId(roomModal.room.id);
    } else {
      const newRoom: RoomRow = {
        id: `room-${Date.now()}`,
        ...values,
      };
      setRooms((currentRooms) => [...currentRooms, newRoom]);
      setSelectedRoomId(newRoom.id);
    }

    setRoomModal(null);
  };

  const selectedScheduleRows = selectedRoom
    ? (scheduleRowsByRoom[selectedRoom.id] ?? [])
    : [];

  const handleAssignSubject = (values: AssignSubjectValues) => {
    if (!selectedRoom) {
      return;
    }

    const currentRows = scheduleRowsByRoom[selectedRoom.id] ?? [];
    if (hasDepedScheduleConflict(currentRows, values)) {
      setAssignSubjectError("This room already has a subject scheduled during that time.");
      return;
    }

    setScheduleRowsByRoom((currentRows) => ({
      ...currentRows,
      [selectedRoom.id]: [
        ...(currentRows[selectedRoom.id] ?? []),
        buildDepedScheduleRow(values),
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
          roomModal?.mode === "edit"
            ? `edit-${roomModal.room.id}`
            : roomModal?.mode ?? "closed"
        }
        isOpen={roomModal !== null}
        mode={roomModal?.mode ?? "create"}
        initialValues={roomModal?.mode === "edit" ? roomModal.room : null}
        buildingOptions={buildingOptions}
        onClose={() => setRoomModal(null)}
        onSubmit={handleSubmitRoom}
      />

      <PageShell title="Room Management">
        <DepedRoomsTable
          rooms={rooms}
          selectedRoomNo={selectedRoom?.roomNo ?? ""}
          onRoomSelect={(room) => setSelectedRoomId(room.id)}
          onAddRoomClick={() => setRoomModal({ mode: "create", room: null })}
          onEditRoomClick={(room) => setRoomModal({ mode: "edit", room })}
        />
        {selectedRoom ? (
          <DepedScheduleTable
            roomName={selectedRoom.roomNo}
            scheduleRows={selectedScheduleRows}
            onAssignSubjectClick={() => {
              setAssignSubjectError("");
              setIsAssignSubjectOpen(true);
            }}
          />
        ) : null}
      </PageShell>
    </>
  );
}

const buildDepedScheduleRow = (values: AssignSubjectValues): ScheduleRow => ({
  id: `schedule-${Date.now()}`,
  subject: values.subject,
  department: values.department,
  day: values.day,
  timeStart: values.timeStart,
  timeEnd: values.timeEnd,
});

const depedTimeToMinutes = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
};

const hasDepedScheduleConflict = (
  currentRows: ScheduleRow[],
  values: AssignSubjectValues,
) => {
  const newStart = depedTimeToMinutes(values.timeStart);
  const newEnd = depedTimeToMinutes(values.timeEnd);

  return currentRows.some((row) => {
    if (row.day !== values.day) {
      return false;
    }

    const existingStart = depedTimeToMinutes(row.timeStart);
    const existingEnd = depedTimeToMinutes(row.timeEnd);
    return newStart < existingEnd && newEnd > existingStart;
  });
};

function DepedTeachingLoadContent() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  return (
    <>
      <div className="mx-auto w-full max-w-[1120px] space-y-3">
        <div className="flex items-center justify-between gap-4 px-1 py-1">
          <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
            Teaching Load
          </h1>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-[12px] font-medium text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)]"
          >
            <span
              className="flex h-4 w-4 items-center justify-center"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: ICON_SVGS.download }}
            />
            Export
          </button>
        </div>

        <DepedTeachingLoadTable />

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsRequestOpen(true)}
            className="group relative inline-flex min-w-[150px] items-center justify-center overflow-visible rounded-[18px] bg-[var(--color-primary)] px-6 py-3 text-[13px] font-semibold text-white shadow-none transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-light-primary)] sm:min-w-[180px]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 inset-y-0 translate-x-1.5 translate-y-1.5 rounded-[18px] bg-[rgba(2,147,131,0.30)] transition-transform duration-200 group-hover:translate-x-2 group-hover:translate-y-2"
            />
            <span className="relative z-10 text-center">Send Request</span>
          </button>
        </div>
      </div>

      <DepedExportForm isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <DepedRequestForm isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
    </>
  );
}

function CollegeTeachingLoadContent() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  return (
    <>
      <div className="mx-auto w-full max-w-[1120px] space-y-3">
        <div className="flex items-center justify-between gap-4 px-1 py-1">
          <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
            Teaching Load
          </h1>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-[12px] font-medium text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)] cursor-pointer"
          >
            <span
              className="flex h-4 w-4 items-center justify-center"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: ICON_SVGS.download }}
            />
            Export
          </button>
        </div>

        <CollegeTeachingLoadTable />

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsRequestOpen(true)}
            className="group relative inline-flex min-w-[150px] items-center justify-center overflow-visible rounded-[18px] bg-[var(--color-primary)] px-6 py-3 text-[13px] font-semibold text-white shadow-none transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-light-primary)] sm:min-w-[180px]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 inset-y-0 translate-x-1.5 translate-y-1.5 rounded-[18px] bg-[rgba(2,147,131,0.30)] transition-transform duration-200 group-hover:translate-x-2 group-hover:translate-y-2"
            />
            <span className="relative z-10 text-center cursor-pointer">Send Request</span>
          </button>
        </div>
      </div>

      <CollegeExportForm isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <CollegeRequestForm isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
    </>
  );
}

function renderFeatureContent(featureKey: FeatureKey, children: ReactNode) {
  const contentMap: Partial<Record<FeatureKey, ReactNode>> = {
    "higher-faculty-load-assignment": <PlaceholderContent title="LOAD MANAGER" />,
    "higher-teaching-load-view": <CollegeTeachingLoadContent />,
    "higher-subject-management": <CollegeSubjectManagementTable />,
    "higher-room-schedule-management": <CollegeRoomsTable />,
    "higher-dean-vpaa-approvals": <AcademicApprovalsDashboard />,
    "deped-teacher-load-assignment": (
      <PageShell title="Teacher Load Assignment">
        <DepedDepartmentFacultyTable />
      </PageShell>
    ),
    "deped-teaching-load-view": <DepedTeachingLoadContent />,
    "deped-subject-management": <DepedSubjectContent />,
    "deped-room-management": <DepedRoomContent />,
    "deped-department-load": (
      <PageShell title="All Departments View">
        <DepartmentListTable />
      </PageShell>
    ),
  };

  return contentMap[featureKey] ?? children;
}

export default function TenantFeatureContent({
  featureKey,
  children,
}: TenantFeatureContentProps) {
  return renderFeatureContent(featureKey as FeatureKey, children);
}
