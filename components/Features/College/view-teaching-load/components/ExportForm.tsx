"use client";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  teacherLoadRows,
  type TeacherLoadRow,
} from "./teacher-load-data-college";

type ExportFromProps = {
  isOpen: boolean;
  onClose: () => void;
  rows?: TeacherLoadRow[];
};

type TeacherProfile = {
  teacherName: string;
  schoolYear: string;
  reviewedBy: string;
  reviewedPosition: string;
  approvedBy: string;
  approvedPosition: string;
  address: string;
  orgLogoUrl: string | null;
};

const DEFAULT_PROFILE: TeacherProfile = {
  teacherName: "—",
  schoolYear: "SY 2024-2025",
  reviewedBy: "—",
  reviewedPosition: "Designation/Position",
  approvedBy: "—",
  approvedPosition: "Acting Secondary School Principal",
  address: "Public Schools District Supervisor",
  orgLogoUrl: null,
};

const scheduleTimes = [
  "7:30-8:30",
  "8:30-9:30",
  "9:30-10:30",
  "10:30-11:30",
  "11:30-12:30",
  "12:30-1:30",
  "1:30-2:30",
  "2:30-3:30",
  "3:30-4:30",
];

const days = ["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const dayAbbreviationMap: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
  Sun: "Sun",
};

const parseTimeToMinutes = (time: string) => {
  const normalized = time.trim().toUpperCase();
  const [, hourText, minuteText, meridiem] =
    normalized.match(/^(\d{1,2}):(\d{2})(AM|PM)?$/) ?? [];
  if (!hourText || !minuteText) return 0;
  let hour = Number(hourText);
  const minutes = Number(minuteText);
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return hour * 60 + minutes;
};

const buildTimeSlotLabel = (startMinutes: number) => {
  const endMinutes = startMinutes + 60;
  const format = (m: number) =>
    `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`;
  return `${format(startMinutes)}-${format(endMinutes)}`;
};

const extractScheduleSlots = (schedule: string) =>
  schedule
    .split("/")
    .map((p) => p.trim())
    .flatMap((part) => {
      const match = part.match(
        /^([A-Za-z]+)\s+(\d{1,2}:\d{2}(?:AM|PM)?)\s*-\s*(\d{1,2}:\d{2}(?:AM|PM)?)$/i,
      );
      if (!match) return [];
      const [, rawDay, rawStart, rawEnd] = match;
      const dayAbbr = dayAbbreviationMap[rawDay] ?? rawDay;
      const startMinutes = parseTimeToMinutes(rawStart);
      const endMinutes = parseTimeToMinutes(rawEnd);
      const slots: { dayAbbr: string; time: string }[] = [];
      for (let cur = startMinutes; cur < endMinutes; cur += 60)
        slots.push({ dayAbbr, time: buildTimeSlotLabel(cur) });
      return slots;
    });

// CHED logo — hosted locally is most reliable for print.
// Drop ched-logo.png into /public and this just works.
// Falls back to the Wikimedia SVG if the local file is absent.
const CHED_LOGO = "/ched-logo.png";

function OrgLogo({ url }: { url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt="Organization logo"
        className="h-16 w-16 rounded-full object-contain"
      />
    );
  }
  // Fallback: circle outline matching the original design
  return (
    <div
      className="h-16 w-16 rounded-full border-2 bg-contain bg-center bg-no-repeat"
      style={{ borderColor: "var(--color-primary)" }}
    />
  );
}

function ChedLogo() {
  return (
    <img
      src={CHED_LOGO}
      alt="CHED logo"
      className="h-16 w-16 object-contain"
      onError={(e) => {
        // Fallback to Wikimedia SVG if local file missing
        const img = e.currentTarget;
        if (!img.dataset.fallback) {
          img.dataset.fallback = "1";
          img.src =
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/CHED_logo.svg/240px-CHED_logo.svg.png";
        }
      }}
    />
  );
}

function PrintablePage({ children }: { children: ReactNode }) {
  return (
    <section
      className="teacher-export-page mb-6 flex h-[212mm] w-[297mm] flex-col bg-white px-[15mm] py-[15mm] text-[11pt] text-black shadow-lg print:mb-0 print:h-[210mm] print:w-[297mm] print:shadow-none print:break-after-page"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      {children}
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <span className="animate-pulse space-y-1">
      {/* <div className="h-3 w-40 rounded bg-gray-200" /> */}
      {/* <div className="h-3 w-28 rounded bg-gray-200" /> */}
    </span>
  );
}

export default function ExportFrom({
  isOpen,
  onClose,
  rows = teacherLoadRows,
}: ExportFromProps) {
  const [profile, setProfile] = useState<TeacherProfile>(DEFAULT_PROFILE);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Fetch all teacher + org details from DB
  useEffect(() => {
    if (!isOpen) return;

    async function fetchProfile() {
      setIsLoadingProfile(true);
      setProfileError("");

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setProfileError("Session expired. Please log in again.");
          return;
        }

        // ── 1. Logged-in teacher's own profile ──────────────────────────────
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        console.log("User ID:", userId);

        const { data: orgUserData, error: orgUserError } = await supabase
          .from("org_users")
          .select("full_name, org_id")
          .eq("auth_user_id", userId)
          .maybeSingle();

        console.log("Org user data:", orgUserData);
        console.log("Org user error:", orgUserError);

        // ── 2. Organization / school details ────────────────────────────────
        let orgData = null;
        let orgError = null;

        if (orgUserData?.org_id) {
          const result = await supabase
            .from("organizations")
            .select(
              "reviewed_by, reviewed_position, approved_by, approved_position, address, logo_url",
            )
            .eq("id", orgUserData.org_id)
            .maybeSingle();
          orgData = result.data;
          orgError = result.error;
        }

        console.log("Org data:", orgData);
        console.log("Org error:", orgError);

        if (orgUserError || !orgUserData) {
          // Non-fatal: use defaults but surface a soft warning
          // console.error("Org user error:", orgUserError);
          setProfileError("Could not load teacher profile — showing defaults.");
        }

        if (orgError || !orgData) {
          // console.error("Org error:", orgError);
          setProfileError(
            "Could not load organization data — showing defaults.",
          );
        }

        setProfile({
          teacherName: orgUserData?.full_name ?? DEFAULT_PROFILE.teacherName,
          schoolYear: DEFAULT_PROFILE.schoolYear,
          reviewedBy: orgData?.reviewed_by ?? DEFAULT_PROFILE.reviewedBy,
          reviewedPosition:
            orgData?.reviewed_position ?? DEFAULT_PROFILE.reviewedPosition,
          approvedBy: orgData?.approved_by ?? DEFAULT_PROFILE.approvedBy,
          approvedPosition:
            orgData?.approved_position ?? DEFAULT_PROFILE.approvedPosition,
          address: orgData?.address ?? DEFAULT_PROFILE.address,
          orgLogoUrl: orgData?.logo_url ?? null,
        });
      } catch {
        setProfileError(
          "Unable to load profile. Check your connection and try again.",
        );
      } finally {
        setIsLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [isOpen]);

  if (!isOpen) return null;

  const {
    teacherName,
    schoolYear,
    reviewedBy,
    reviewedPosition,
    approvedBy,
    approvedPosition,
    address,
    orgLogoUrl,
  } = profile;

  return (
    <>
      <div className="teacher-export-overlay fixed inset-0 z-50 overflow-auto bg-black/50 px-4 py-6">
        <div className="mx-auto flex min-h-max w-[95vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">PDF Preview</h2>
              <p className="text-sm text-gray-500">
                Landscape Letter Class Schedule
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="cursor-pointer rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)]"
              >
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-[var(--color-default)] px-4 py-2 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>

          {/* ── Preview area ── */}
          <div className="rounded-b-2xl bg-[var(--color-background)] p-8">
            {profileError && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                {profileError}
              </div>
            )}

            <div className="teacher-export-print-root max-h-[80vh] overflow-auto">
              <PrintablePage>
                <div className="space-y-6">
                  {/* ── Header: Org logo | Title | CHED logo ── */}
                  <div className="grid grid-cols-[1fr_2fr_1fr] items-center">
                    <OrgLogo url={orgLogoUrl} />

                    <div className="text-center">
                      <h1 className="text-xl font-bold uppercase">
                        Class Program / Schedule
                      </h1>
                      {isLoadingProfile ? (
                        <div className="mx-auto mt-1 h-3 w-24 animate-pulse rounded bg-gray-200" />
                      ) : (
                        <p className="text-sm">{schoolYear}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <ChedLogo />
                    </div>
                  </div>

                  {/* ── Teacher info bar ── */}
                  <div className="grid grid-cols-2 gap-4 border border-black p-2 text-sm">
                    <p>
                      <strong>Name of Teacher:</strong>{" "}
                      {isLoadingProfile ? <ProfileSkeleton /> : teacherName}
                    </p>
                    <p>
                      <strong>School Year:</strong>{" "}
                      {isLoadingProfile ? <ProfileSkeleton /> : schoolYear}
                    </p>
                  </div>

                  {/* ── Schedule table ── */}
                  <table className="w-full border-collapse border border-black text-center text-[10pt]">
                    <thead>
                      <tr className="bg-gray-50">
                        {days.map((day) => (
                          <th
                            key={day}
                            className="border border-black p-2 font-bold"
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleTimes.map((time) => (
                        <tr key={time} className="h-12">
                          <td className="border border-black p-1 font-semibold bg-gray-50">
                            {time}
                          </td>
                          {[1, 2, 3, 4, 5].map((i) => {
                            const dayName = days[i];
                            const dayAbbr =
                              dayAbbreviationMap[dayName] ?? dayName;
                            const matchedRow = rows.find((row) =>
                              extractScheduleSlots(row.schedule).some(
                                (slot) =>
                                  slot.dayAbbr === dayAbbr &&
                                  slot.time === time,
                              ),
                            );
                            return (
                              <td
                                key={i}
                                className={`border border-black p-1 text-[8pt] ${
                                  matchedRow ? "text-[var(--color-card)]" : ""
                                }`}
                                style={
                                  matchedRow
                                    ? {
                                        backgroundColor: "var(--color-primary)",
                                      }
                                    : {}
                                }
                              >
                                {matchedRow && (
                                  <div className="flex flex-col leading-tight">
                                    <span className="font-bold">
                                      {matchedRow.subjectCode}
                                    </span>
                                    <span>{matchedRow.section}</span>
                                    <span className="text-[7pt] italic">
                                      {matchedRow.room}
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* ── Signatures ── */}
                  <div className="mt-3 grid grid-cols-2 gap-20 text-sm">
                    <div>
                      <p className="font-bold">Reviewed by:</p>
                      <div className="mt-3 border-t border-black pt-1">
                        {isLoadingProfile ? (
                          <ProfileSkeleton />
                        ) : (
                          <>
                            <p className="font-bold uppercase">{reviewedBy}</p>
                            <p>{reviewedPosition}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold">Approved by:</p>
                      <div className="mt-3 border-t border-black pt-1">
                        {isLoadingProfile ? (
                          <ProfileSkeleton />
                        ) : (
                          <>
                            <p className="font-bold uppercase">{approvedBy}</p>
                            <p>{approvedPosition}</p>
                            <p className="text-[9pt] italic">{address}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </PrintablePage>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: Letter landscape;
            margin: 0;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            visibility: hidden;
          }
          .teacher-export-print-root,
          .teacher-export-print-root * {
            visibility: visible;
          }
          .teacher-export-print-root {
            position: fixed;
            inset: 0;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            width: 100vw;
            max-width: none;
            margin: 0;
            padding: 0;
            overflow: visible;
          }
          .teacher-export-overlay {
            visibility: hidden !important;
          }
        }
      `}</style>
    </>
  );
}
