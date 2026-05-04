"use client";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const timeSlots = [
  "07:00 - 8:00 AM",
  "08:00 - 9:00 AM",
  "09:00 - 10:00 AM",
  "10:00 - 11:00 AM",
  "11:00 - 12:00 PM",
  "12:00 - 01:00 PM",
  "01:00 - 02:00 PM",
  "02:00 - 03:00 PM",
  "03:00 - 04:00 PM",
  "04:00 - 05:00 PM",
];

// Shape: { [timeSlot]: { [day]: label } }
type ScheduleEntry = { subject: string; code: string };
type Schedule = Record<string, Record<string, ScheduleEntry>>;

const mockSchedule: Schedule = {};

export default function ScheduleTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-[#006B5F] text-white">
            <th className="px-4 py-3 text-xs font-medium w-36">Time</th>
            {days.map((day) => (
              <th key={day} className="px-4 py-3 text-xs font-medium">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {timeSlots.map((slot) => (
            <tr key={slot} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-xs text-[#1F2125] whitespace-nowrap border-r border-gray-100">
                {slot}
              </td>
              {days.map((day) => {
                const entry = mockSchedule[slot]?.[day];
                return (
                  <td key={day} className="px-4 py-4 text-xs text-[#1F2125]">
                    {entry ? (
                      <div className="bg-[#006B5F] text-white rounded-lg px-2 py-1.5 text-xs">
                        <p className="font-semibold">{entry.subject}</p>
                        <p className="opacity-80">{entry.code}</p>
                      </div>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}