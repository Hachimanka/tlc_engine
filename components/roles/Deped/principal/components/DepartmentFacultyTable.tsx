"use client";

import { useMemo, useState } from "react";
import AddFacultyForms from "./AddFacultyForms";
import SubjectAssignmentModal from "./SubjectAssignmentModal";
import VersionHistory from "./VersionHistory";

type DepartmentFacultyTableProps = {
  departmentName?: string;
};

type FacultyRow = {
  id: string;
  name: string;
  specialization: string;
  employmentType: string;
  totalTeachingHours: string;
};

type SubjectRow = {
  id: string;
  subjectTitle: string;
  section: string;
  schedule: string;
  room: string;
  hoursPerDay: string;
};

type FacultyDetail = {
  subjects: SubjectRow[];
};

const facultyRows: FacultyRow[] = [
  {
    id: "faculty-1",
    name: "John Michael Montero Inoc",
    specialization: "Filipino",
    employmentType: "Full Time",
    totalTeachingHours: "24/30",
  },
  {
    id: "faculty-2",
    name: "Michael Montero",
    specialization: "Filipino",
    employmentType: "Full Time",
    totalTeachingHours: "16/30",
  },
  {
    id: "faculty-3",
    name: "Michael Inoc",
    specialization: "Filipino",
    employmentType: "Full Time",
    totalTeachingHours: "30/30",
  },
  {
    id: "faculty-4",
    name: "John Michael",
    specialization: "Filipino",
    employmentType: "Full Time",
    totalTeachingHours: "6/30",
  },
];

const facultyDetails: Record<string, FacultyDetail> = {
  "faculty-1": {
    subjects: [
      {
        id: "faculty-1-subject-1",
        subjectTitle: "Filipino",
        section: "Grade 7 Amethyst",
        schedule: "Mon-Fri 7:00 - 7:45",
        room: "Room 1",
        hoursPerDay: "45 minutes",
      },
      {
        id: "faculty-1-subject-2",
        subjectTitle: "Fundamentals of Mixed Signals and Sensors",
        section: "Grade 7 Ruby",
        schedule: "Mon-Fri 8:00 - 8:45",
        room: "Room 2",
        hoursPerDay: "45 minutes",
      },
      {
        id: "faculty-1-subject-3",
        subjectTitle: "Data Structures and Algorithm",
        section: "Grade 7 Pearl",
        schedule: "Mon-Fri 1:00 - 1:45",
        room: "Room 3",
        hoursPerDay: "45 minutes",
      },
    ],
  },
  "faculty-2": {
    subjects: [
      {
        id: "faculty-2-subject-1",
        subjectTitle: "Filipino",
        section: "Grade 7 Amethyst",
        schedule: "Mon-Fri 7:00 - 7:45",
        room: "Room 4",
        hoursPerDay: "45 minutes",
      },
      {
        id: "faculty-2-subject-2",
        subjectTitle: "Reading and Writing",
        section: "Grade 7 Topaz",
        schedule: "Mon-Fri 8:00 - 8:45",
        room: "Room 6",
        hoursPerDay: "45 minutes",
      },
      {
        id: "faculty-2-subject-3",
        subjectTitle: "21st Century Literature",
        section: "Grade 8 Emerald",
        schedule: "Mon-Fri 1:00 - 1:45",
        room: "Room 8",
        hoursPerDay: "45 minutes",
      },
    ],
  },
  "faculty-3": {
    subjects: [
      {
        id: "faculty-3-subject-1",
        subjectTitle: "Filipino",
        section: "Grade 9 Rizal",
        schedule: "Mon-Fri 7:00 - 7:45",
        room: "Room 9",
        hoursPerDay: "45 minutes",
      },
      {
        id: "faculty-3-subject-2",
        subjectTitle: "Research in Daily Life",
        section: "Grade 9 Mabini",
        schedule: "Mon-Fri 8:00 - 8:45",
        room: "Room 10",
        hoursPerDay: "45 minutes",
      },
      {
        id: "faculty-3-subject-3",
        subjectTitle: "Practical Research",
        section: "Grade 10 Bonifacio",
        schedule: "Mon-Fri 1:00 - 1:45",
        room: "Room 12",
        hoursPerDay: "45 minutes",
      },
    ],
  },
  "faculty-4": {
    subjects: [
      {
        id: "faculty-4-subject-1",
        subjectTitle: "Filipino",
        section: "Grade 7 Amethyst",
        schedule: "Mon-Fri 7:00 - 7:45",
        room: "Room 5",
        hoursPerDay: "45 minutes",
      },
      {
        id: "faculty-4-subject-2",
        subjectTitle: "Values Education",
        section: "Grade 7 Pearl",
        schedule: "Mon-Fri 8:00 - 8:45",
        room: "Room 7",
        hoursPerDay: "45 minutes",
      },
    ],
  },
};

function formatTotalMinutes(subjects: SubjectRow[]) {
  const totalMinutes = subjects.reduce((sum, subject) => {
    const parsedMinutes = Number(subject.hoursPerDay.replace(/[^0-9]/g, ""));
    return sum + parsedMinutes;
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} minutes`;
  }

  if (minutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`;
}

export default function DepartmentFacultyTable({
  departmentName = "Department",
}: DepartmentFacultyTableProps) {
  const [selectedFacultyId, setSelectedFacultyId] = useState(facultyRows[1].id);
  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
  const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const selectedFaculty =
    facultyRows.find((faculty) => faculty.id === selectedFacultyId) ??
    facultyRows[0];
  const selectedFacultyDetail = facultyDetails[selectedFaculty.id] ?? {
    subjects: [],
  };

  const totalTeachingHoursLabel = useMemo(() => {
    return formatTotalMinutes(selectedFacultyDetail.subjects);
  }, [selectedFacultyDetail.subjects]);

  return (
    <>
      <AddFacultyForms
        isOpen={isAddFacultyOpen}
        onClose={() => setIsAddFacultyOpen(false)}
      />
      <SubjectAssignmentModal
        isOpen={isAssignSubjectOpen}
        onClose={() => setIsAssignSubjectOpen(false)}
        selectedFacultyName={selectedFaculty.name}
      />
      <VersionHistory
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        selectedFacultyName={selectedFaculty.name}
      />

      <div className="overflow-hidden rounded-[18px] border border-[color:var(--color-default)] bg-[var(--color-card)] shadow-level-1">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--color-default)] px-4 py-3 sm:px-5">
          <div>
            <h1 className="text-2xl text-[var(--color-high-emphasis)]">
              Filipino Department Faculty
            </h1>
            <p className="mt-1 text-body-small text-[var(--color-low-emphasis)]">
              Click a faculty row to load the assigned subjects below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddFacultyOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-label-button text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)]"
          >
            <span className="text-base leading-none">+</span>
            Add Faculty
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                  Faculty Name
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                  Specialization
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                  Employment Type
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                  Total Teaching hours
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-default)] bg-white">
              {facultyRows.map((faculty) => {
                const isSelected = faculty.id === selectedFaculty.id;

                return (
                  <tr
                    key={faculty.id}
                    onClick={() => setSelectedFacultyId(faculty.id)}
                    className={`cursor-pointer transition-colors hover:bg-[var(--color-default)]/35 ${isSelected ? "bg-[var(--color-default)]/60" : "bg-white"}`}
                  >
                    <td className="px-4 py-3 text-body-small font-semibold text-[var(--color-high-emphasis)]">
                      {faculty.name}
                    </td>
                    <td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
                      {faculty.specialization}
                    </td>
                    <td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
                      {faculty.employmentType}
                    </td>
                    <td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
                      {faculty.totalTeachingHours}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[color:var(--color-default)] bg-[var(--color-background)] px-4 py-5 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-heading-h4 text-[var(--color-primary)]">
                {selectedFaculty.name}
              </h2>
              <p className="mt-1 text-body-small text-[var(--color-low-emphasis)]">
                {selectedFaculty.specialization} Department •{" "}
                {selectedFaculty.employmentType}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAssignSubjectOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-label-button text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)]"
            >
              <span className="text-base leading-none">+</span>
              Assign Subject
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[18px] border border-[color:var(--color-default)] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                      Subject Title
                    </th>
                    <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                      Section
                    </th>
                    <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                      Schedule
                    </th>
                    <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                      Room
                    </th>
                    <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                      Hours/Day
                    </th>
                    <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-default)] bg-white">
                  {selectedFacultyDetail.subjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="bg-white transition-colors hover:bg-[var(--color-default)]/25"
                    >
                      <td className="px-4 py-3 text-body-small font-semibold text-[var(--color-high-emphasis)]">
                        {subject.subjectTitle}
                      </td>
                      <td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
                        {subject.section}
                      </td>
                      <td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
                        {subject.schedule}
                      </td>
                      <td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
                        {subject.room}
                      </td>
                      <td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
                        {subject.hoursPerDay}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-label-button text-[var(--color-error)] transition hover:opacity-80"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end border-t border-[color:var(--color-default)] bg-[var(--color-card)] px-4 py-4 text-base sm:px-5">
              <p>
                <span className="text-label-button text-[var(--color-error)]">
                  Total:
                </span>{" "}
                <span className="text-label-button text-[var(--color-high-emphasis)]">
                  {totalTeachingHoursLabel}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setIsVersionHistoryOpen(true)}
              className="rounded-md px-1 py-1 text-label-button text-[var(--color-primary)] transition hover:opacity-80"
            >
              View Version History
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
