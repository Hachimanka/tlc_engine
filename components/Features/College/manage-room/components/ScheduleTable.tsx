"use client";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const timeSlots = [
  "07:00 - 08:00",
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
];

const mockSchedule: Record<string, Record<string, { subject: string; room: string; teacher: string }>> = {
  "07:00 - 08:00": {
    Monday: { subject: "CS101", room: "CEA 101", teacher: "J. Dela Cruz" },
    Wednesday: { subject: "CS101", room: "CEA 101", teacher: "J. Dela Cruz" },
  },
  "09:00 - 10:00": {
    Tuesday: { subject: "CS102", room: "CEA LAB 1", teacher: "M. Santos" },
    Thursday: { subject: "CS102", room: "CEA LAB 1", teacher: "M. Santos" },
  },
  "13:00 - 14:00": {
    Monday: { subject: "CS201", room: "CEA 102", teacher: "J. Reyes" },
    Friday: { subject: "CS301", room: "CEA 102", teacher: "J. Reyes" },
  },
};

export default function ScheduleTable() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2125]">Schedule Table</h1>
        <p className="text-sm text-[#717182] mt-1">Weekly class schedule overview</p>
      </div>

      <div className="bg-white rounded-xl border border-[#C5EEEA] overflow-auto">
        <table className="w-full text-sm min-w-[800px]">
          {/* Header */}
          <thead>
            <tr className="bg-[#006B5F] text-white">
              <th className="px-4 py-3 text-left font-semibold w-[130px]">Time</th>
              {days.map((day) => (
                <th key={day} className="px-4 py-3 text-left font-semibold">{day}</th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {timeSlots.map((slot, i) => (
              <tr
                key={slot}
                className={`border-b border-[#C5EEEA]/60 ${i % 2 === 1 ? "bg-[#C5EEEA]/10" : "bg-white"}`}
              >
                <td className="px-4 py-3 text-[#717182] font-medium whitespace-nowrap">{slot}</td>
                {days.map((day) => {
                  const cell = mockSchedule[slot]?.[day];
                  return (
                    <td key={day} className="px-4 py-3">
                      {cell ? (
                        <div className="bg-[#006B5F] text-white rounded-lg px-3 py-2 text-xs">
                          <p className="font-semibold">{cell.subject}</p>
                          <p className="text-white/80">{cell.room}</p>
                          <p className="text-white/70">{cell.teacher}</p>
                        </div>
                      ) : (
                        <div className="h-8" />
                      )}
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