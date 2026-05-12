"use client";

import { useMemo, useState, type ReactNode } from "react";
import DepartmentListTable from "@/components/Features/Deped/load-admin/components/DepartmentListTable";
import DepedDepartmentFacultyTable from "@/components/Features/Deped/manage-load/components/DepartmentFacultyTable";
import DepedRoomsTable, {
  type RoomRow,
} from "@/components/Features/Deped/manage-room/components/RoomsTable";
import DepedScheduleTable, {
  type ScheduleRow,
} from "@/components/Features/Deped/manage-room/components/ScheduleTable";
import DepedSubjectManagementForm, {
  type SubjectFormValues,
} from "@/components/Features/Deped/manage-subject/components/SubjectManagementForm";
import DepedSubjectTable, {
  initialSubjectRows,
  type SubjectRow,
} from "@/components/Features/Deped/manage-subject/components/SubjectTable";
import DepedExportForm from "@/components/Features/Deped/view-teaching-load/components/ExportFrom";
import DepedRequestForm from "@/components/Features/Deped/view-teaching-load/components/RequestForm";
import DepedTeachingLoadTable from "@/components/Features/Deped/view-teaching-load/components/TeachingLoadTable";
import CollegeRoomsTable from "@/components/Features/College/manage-room/components/RoomsTable";
import CollegeRoomScheduleCalendar from "@/components/Features/College/manage-room/components/RoomScheduleCalendar";
import CollegeSubjectRoomAssignmentTable from "@/components/Features/College/manage-room/components/SubjectRoomAssignmentTable";
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

const depedRoomRows: RoomRow[] = [
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

const depedScheduleTimeline = [
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

const depedScheduleSubjectMap: Record<string, string[]> = {
  "Room 1": ["English", "Math", "Science", "TLE", "English", "English", "English", "English", "English", "English", "English"],
  "Room 2": ["Filipino", "Math", "Science", "MAPEH", "Filipino", "Filipino", "Filipino", "Filipino", "Filipino", "Filipino", "Filipino"],
  "Room 3": ["Science", "Science", "Science", "AP", "Science", "Science", "Science", "Science", "Science", "Science", "Science"],
  "Room 10": ["English", "Math", "Science", "TLE", "English", "English", "English", "English", "English", "English", "English"],
};

function buildDepedScheduleRows(subjects: string[]) {
  let subjectIndex = 0;

  return depedScheduleTimeline.map((slot) => {
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

const depedScheduleRowsByRoom: Record<string, ScheduleRow[]> = Object.fromEntries(
  Object.entries(depedScheduleSubjectMap).map(([roomNo, subjects]) => [
    roomNo,
    buildDepedScheduleRows(subjects),
  ]),
) as Record<string, ScheduleRow[]>;

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
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>(initialSubjectRows);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  const handleCreateSubject = (values: SubjectFormValues) => {
    setSubjectRows((currentRows) => [
      {
        id: `sub-${Date.now()}`,
        subjectTitle: values.subjectTitle,
        department: values.department,
        yearLevel: values.yearLevel,
        classDuration: values.classDuration,
        dateCreated: new Date().toLocaleDateString("en-US"),
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
  const [selectedRoomNo, setSelectedRoomNo] = useState(depedRoomRows[0].roomNo);

  const selectedRoom = useMemo(
    () => depedRoomRows.find((room) => room.roomNo === selectedRoomNo) ?? depedRoomRows[0],
    [selectedRoomNo],
  );

  const selectedScheduleRows =
    depedScheduleRowsByRoom[selectedRoom.roomNo] ??
    depedScheduleRowsByRoom[depedRoomRows[0].roomNo];

  return (
    <PageShell title="Room Management">
      <DepedRoomsTable
        rooms={depedRoomRows}
        selectedRoomNo={selectedRoomNo}
        onRoomSelect={(room) => setSelectedRoomNo(room.roomNo)}
        onAddRoomClick={() => {}}
      />
      <DepedScheduleTable roomName={selectedRoom.roomNo} scheduleRows={selectedScheduleRows} />
    </PageShell>
  );
}

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
    "higher-subject-room-assignment": <CollegeSubjectRoomAssignmentTable />,
    "higher-room-schedule-calendar": <CollegeRoomScheduleCalendar />,
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
