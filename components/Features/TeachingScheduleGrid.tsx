"use client";

type TeachingScheduleRow = {
  id: number | string;
  subjectCode: string;
  schedule: string;
  room: string;
  section: string;
};

type ScheduleAssignment = {
  id: number | string;
  day: string;
  time: string;
  subjectCode: string;
  section: string;
  room: string;
};

type TeachingScheduleGridProps = {
  rows: TeachingScheduleRow[];
  timeSlots?: string[];
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_PATTERN =
  /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/;

const normalizeTime = (value: string) => value.replace(/\s+/g, "");

const getTimeStartMinutes = (value: string) => {
  const start = normalizeTime(value).split("-")[0] ?? "";
  const match = start.match(/^(\d{1,2}):(\d{2})(am|pm)?$/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hour < 12) {
    hour += 12;
  } else if (!meridiem && hour > 0 && hour < 7) {
    hour += 12;
  }

  return hour * 60 + minute;
};

const parseScheduleDays = (schedule: string) => {
  const daysPart = schedule.replace(TIME_PATTERN, "").toLowerCase().replace(/[^a-z]/g, "");
  const days = new Set<string>();

  if (daysPart.includes("mwf")) {
    days.add("Monday");
    days.add("Wednesday");
    days.add("Friday");
  }

  if (daysPart.includes("tth") || daysPart.includes("tuth")) {
    days.add("Tuesday");
    days.add("Thursday");
  }

  if (daysPart.includes("monday") || daysPart.includes("mon") || daysPart === "m") {
    days.add("Monday");
  }

  if (daysPart.includes("tuesday") || daysPart.includes("tue") || daysPart === "t") {
    days.add("Tuesday");
  }

  if (daysPart.includes("wednesday") || daysPart.includes("wed") || daysPart.includes("w")) {
    days.add("Wednesday");
  }

  if (daysPart.includes("thursday") || daysPart.includes("thu") || daysPart === "th") {
    days.add("Thursday");
  }

  if (daysPart.includes("friday") || daysPart.includes("fri") || daysPart.includes("f")) {
    days.add("Friday");
  }

  return WEEKDAYS.filter((day) => days.has(day));
};

const buildAssignments = (rows: TeachingScheduleRow[]) =>
  rows.flatMap((row) => {
    const time = row.schedule.match(TIME_PATTERN)?.[1];

    if (!time) {
      return [];
    }

    return parseScheduleDays(row.schedule).map((day) => ({
      id: row.id,
      day,
      time: normalizeTime(time),
      subjectCode: row.subjectCode,
      section: row.section,
      room: row.room,
    }));
  });

export default function TeachingScheduleGrid({
  rows,
  timeSlots,
}: TeachingScheduleGridProps) {
  const assignments = buildAssignments(rows);
  const resolvedTimeSlots =
    timeSlots?.map(normalizeTime) ??
    Array.from(new Set(assignments.map((assignment) => assignment.time))).sort(
      (a, b) => getTimeStartMinutes(a) - getTimeStartMinutes(b),
    );

  const assignmentsByCell = new Map<string, ScheduleAssignment[]>();

  for (const assignment of assignments) {
    const key = `${assignment.time}|${assignment.day}`;
    const current = assignmentsByCell.get(key) ?? [];
    current.push(assignment);
    assignmentsByCell.set(key, current);
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-black bg-white shadow-level-1">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-center">
          <thead>
            <tr>
              <th className="w-[150px] border border-black bg-[#f8fafc] px-4 py-3 text-[15px] font-bold text-black">
                Time
              </th>
              {WEEKDAYS.map((day) => (
                <th
                  key={day}
                  className="border border-black bg-[#f8fafc] px-4 py-3 text-[15px] font-bold text-black"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resolvedTimeSlots.map((time) => (
              <tr key={time}>
                <td className="border border-black bg-[#f8fafc] px-4 py-4 text-[15px] font-bold text-black">
                  {time}
                </td>
                {WEEKDAYS.map((day) => {
                  const cellAssignments = assignmentsByCell.get(`${time}|${day}`) ?? [];

                  return (
                    <td
                      key={`${time}-${day}`}
                      className="h-[60px] border border-black bg-white p-0 align-middle"
                    >
                      {cellAssignments.map((assignment) => (
                        <div
                          key={`${assignment.id}-${assignment.day}`}
                          className="flex min-h-[60px] flex-col items-center justify-center bg-[var(--color-primary)] px-2 py-1 text-center text-white"
                        >
                          <p className="text-[13px] font-bold leading-4">{assignment.subjectCode}</p>
                          <p className="text-[12px] font-semibold leading-4">{assignment.section}</p>
                          <p className="text-[11px] font-semibold italic leading-4 text-white/90">
                            {assignment.room}
                          </p>
                        </div>
                      ))}
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
