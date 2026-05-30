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
  startMinutes: number;
  endMinutes: number;
  subjectCode: string;
  section: string;
  room: string;
};

type ScheduleBlock = {
  id: string;
  day: string;
  startMinutes: number;
  endMinutes: number;
  assignments: ScheduleAssignment[];
};

type TeachingScheduleGridProps = {
  rows: TeachingScheduleRow[];
  timeSlots?: string[];
};

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const dayAliasMap: Record<string, string> = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
  sun: "Sunday",
  sunday: "Sunday",
};

const scheduleStart = 7 * 60;
const scheduleEnd = 21 * 60;
const scheduleRowHeight = 68;

const scheduleSlots = Array.from(
  { length: (scheduleEnd - scheduleStart) / 60 },
  (_, index) => scheduleStart + index * 60,
);

const assignmentPattern =
  /\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi;

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const minutePart = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${String(displayHour).padStart(2, "0")}:${String(minutePart).padStart(
    2,
    "0",
  )} ${period}`;
};

const parseTimeToMinutes = (value: string) => {
  const match = value.trim().replace(/\s+/g, "").match(/^(\d{1,2}):(\d{2})(am|pm)?$/i);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  if (meridiem === "pm" && hour < 12) {
    hour += 12;
  } else if (meridiem === "am" && hour === 12) {
    hour = 0;
  } else if (!meridiem && hour > 0 && hour < 7) {
    hour += 12;
  }

  return hour * 60 + minute;
};

const buildDisplaySlots = (timeSlots?: string[]) => {
  if (!timeSlots?.length) {
    return scheduleSlots.map((slot) => ({
      start: slot,
      end: slot + 60,
      label: `${formatMinutes(slot)} - ${formatMinutes(slot + 60)}`,
    }));
  }

  const parsedSlots = timeSlots
    .map((slot) => {
      const [startValue, endValue] = slot.split("-").map((part) => part.trim());
      const start = parseTimeToMinutes(startValue ?? "");
      const end = parseTimeToMinutes(endValue ?? "");

      if (start === null || end === null || start >= end) {
        return null;
      }

      return {
        start,
        end,
        label: `${formatMinutes(start)} - ${formatMinutes(end)}`,
      };
    })
    .filter((slot): slot is { start: number; end: number; label: string } => Boolean(slot));

  return parsedSlots.length > 0
    ? parsedSlots
    : scheduleSlots.map((slot) => ({
        start: slot,
        end: slot + 60,
        label: `${formatMinutes(slot)} - ${formatMinutes(slot + 60)}`,
      }));
};

const parseScheduleAssignments = (row: TeachingScheduleRow): ScheduleAssignment[] => {
  const assignments: ScheduleAssignment[] = [];

  for (const match of row.schedule.matchAll(assignmentPattern)) {
    const day = dayAliasMap[match[1].toLowerCase()];
    const startMinutes = parseTimeToMinutes(match[2]);
    const endMinutes = parseTimeToMinutes(match[3]);

    if (!day || startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
      continue;
    }

    assignments.push({
      id: row.id,
      day,
      startMinutes,
      endMinutes,
      subjectCode: row.subjectCode,
      section: row.section,
      room: row.room,
    });
  }

  return assignments;
};

const buildScheduleBlocks = (rows: TeachingScheduleRow[]) => {
  const groups = new Map<string, ScheduleBlock>();

  rows.flatMap(parseScheduleAssignments).forEach((assignment) => {
    const key = `${assignment.day}|${assignment.startMinutes}|${assignment.endMinutes}`;
    const current = groups.get(key);

    if (current) {
      groups.set(key, {
        ...current,
        assignments: [...current.assignments, assignment],
      });
      return;
    }

    groups.set(key, {
      id: key,
      day: assignment.day,
      startMinutes: assignment.startMinutes,
      endMinutes: assignment.endMinutes,
      assignments: [assignment],
    });
  });

  return Array.from(groups.values());
};

export default function TeachingScheduleGrid({
  rows,
  timeSlots,
}: TeachingScheduleGridProps) {
  const displaySlots = buildDisplaySlots(timeSlots);
  const activeScheduleStart = displaySlots[0]?.start ?? scheduleStart;
  const activeScheduleEnd = displaySlots[displaySlots.length - 1]?.end ?? scheduleEnd;
  const bodyHeight = displaySlots.length * scheduleRowHeight;
  const scheduleBlocks = buildScheduleBlocks(rows);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1220px] overflow-hidden rounded-lg border border-[var(--color-primary)] bg-white shadow-level-1">
        <div
          className="grid bg-[var(--color-primary)] text-xs font-bold text-white"
          style={{ gridTemplateColumns: "150px repeat(7, minmax(145px, 1fr))" }}
        >
          <div className="sticky left-0 z-20 border-r border-white/30 bg-[var(--color-primary)] px-3 py-4 text-center">
            Time
          </div>
          {weekDays.map((day) => (
            <div
              key={day}
              className="border-r border-white/20 px-3 py-4 text-center last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "150px repeat(7, minmax(145px, 1fr))",
            minHeight: bodyHeight,
          }}
        >
          <div className="sticky left-0 z-10 bg-white shadow-[2px_0_0_var(--color-default)]">
            {displaySlots.map((slot) => (
              <div
                key={`${slot.start}-${slot.end}`}
                className="flex items-center justify-center border-b border-[var(--color-default)] bg-[var(--color-background)] px-2 text-center text-[11px] font-semibold text-[var(--color-high-emphasis)] last:border-b-0"
                style={{ height: scheduleRowHeight }}
              >
                {slot.label}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const dayBlocks = scheduleBlocks.filter((block) => block.day === day);

            return (
              <div
                key={day}
                className="relative border-r border-[var(--color-default)] last:border-r-0"
                style={{ height: bodyHeight }}
              >
                {displaySlots.map((slot) => (
                  <div
                    key={`${slot.start}-${slot.end}`}
                    className="border-b border-[var(--color-default)] last:border-b-0"
                    style={{ height: scheduleRowHeight }}
                  />
                ))}

                {dayBlocks.map((block) => {
                  const clampedStart = Math.max(activeScheduleStart, block.startMinutes);
                  const clampedEnd = Math.min(activeScheduleEnd, Math.max(block.endMinutes, clampedStart + 15));
                  const top = ((clampedStart - activeScheduleStart) / 60) * scheduleRowHeight;
                  const height = ((clampedEnd - clampedStart) / 60) * scheduleRowHeight;

                  return (
                    <div
                      key={block.id}
                      className="absolute left-2 right-2 flex min-h-10 flex-col items-center justify-center overflow-hidden rounded-md bg-[var(--color-primary)] px-2 py-1 text-center text-white shadow-sm"
                      style={{ top, height: Math.max(height - 6, 42) }}
                      title={`${formatMinutes(block.startMinutes)} - ${formatMinutes(block.endMinutes)}`}
                    >
                      {block.assignments.map((assignment) => (
                        <div key={`${assignment.id}-${assignment.subjectCode}`} className="w-full py-0.5">
                          <p className="truncate text-xs font-bold leading-4">
                            {assignment.subjectCode}
                          </p>
                          <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-semibold leading-4">
                            <span className="rounded bg-white/20 px-1.5 py-0.5">
                              {assignment.section}
                            </span>
                            <span className="truncate">{assignment.room}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
