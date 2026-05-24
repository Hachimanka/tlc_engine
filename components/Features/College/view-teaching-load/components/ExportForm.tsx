"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  orgLogoAlt: string;
};

const DEFAULT_PROFILE: TeacherProfile = {
  teacherName: "—",
  schoolYear: "SY 2024-2025",
  reviewedBy: "—",
  reviewedPosition: "Dean / Department Head",
  approvedBy: "—",
  approvedPosition: "VPAA / School Director",
  address: "",
  orgLogoUrl: null,
  orgLogoAlt: "Organization logo",
};

const fallbackScheduleTimes = [
  "07:00 AM - 08:00 AM",
  "08:00 AM - 09:00 AM",
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "01:00 PM - 02:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
  "06:00 PM - 07:00 PM",
  "07:00 PM - 08:00 PM",
  "08:00 PM - 09:00 PM",
];

const days = ["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const scheduleDayIndexes = [1, 2, 3, 4, 5, 6, 7];

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
  if (!meridiem && hour >= 1 && hour <= 6) hour += 12;
  return hour * 60 + minutes;
};

const buildTimeSlotLabel = (startMinutes: number) => {
  const endMinutes = startMinutes + 60;
  const format = (m: number) => {
    const hour24 = Math.floor(m / 60);
    const hour12 = hour24 % 12 || 12;
    const suffix = hour24 >= 12 ? "PM" : "AM";
    return `${hour12.toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")} ${suffix}`;
  };
  return `${format(startMinutes)} - ${format(endMinutes)}`;
};

type ScheduleBlock = {
  dayAbbr: string;
  startTime: string;
  startMinutes: number;
  endMinutes: number;
  rowSpan: number;
  row: TeacherLoadRow;
};

const extractScheduleBlocks = (row: TeacherLoadRow): ScheduleBlock[] =>
  row.schedule
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
      const durationMinutes = Math.max(60, endMinutes - startMinutes);

      return [{
        dayAbbr,
        startTime: buildTimeSlotLabel(startMinutes),
        startMinutes,
        endMinutes,
        rowSpan: Math.max(1, Math.ceil(durationMinutes / 60)),
        row,
      }];
    });

const buildVisibleScheduleTimes = () => fallbackScheduleTimes;

const getCoveredTimeSlots = (block: ScheduleBlock, timeSlots: string[]) => {
  const startIndex = timeSlots.indexOf(block.startTime);

  if (startIndex < 0) {
    return [];
  }

  return timeSlots.slice(startIndex, startIndex + block.rowSpan);
};

// CHED logo — hosted locally is most reliable for print.
// Drop ched-logo.png into /public and this just works.
// Falls back to the Wikimedia SVG if the local file is absent.
const CHED_LOGO = "/ched-logo.png";

function OrgLogo({ url, alt }: { url: string | null; alt: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
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
      className="teacher-export-page mb-6 flex h-[210mm] w-[297mm] flex-col bg-white px-[14mm] py-[11mm] text-[10pt] text-black shadow-lg print:mb-0 print:h-[210mm] print:w-[297mm] print:shadow-none print:break-after-page"
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
  const scheduleBlocks = useMemo(
    () => rows.flatMap((row) => extractScheduleBlocks(row)),
    [rows],
  );
  const visibleScheduleTimes = useMemo(
    () => buildVisibleScheduleTimes(),
    [],
  );
  const scheduleBlocksByStart = useMemo(() => {
    const blockMap = new Map<string, ScheduleBlock>();

    for (const block of scheduleBlocks) {
      blockMap.set(`${block.dayAbbr}:${block.startTime}`, block);
    }

    return blockMap;
  }, [scheduleBlocks]);
  const coveredScheduleCells = useMemo(() => {
    const coveredCells = new Set<string>();

    for (const block of scheduleBlocks) {
      for (const coveredTime of getCoveredTimeSlots(block, visibleScheduleTimes).slice(1)) {
        coveredCells.add(`${block.dayAbbr}:${coveredTime}`);
      }
    }

    return coveredCells;
  }, [scheduleBlocks, visibleScheduleTimes]);

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
        const response = await fetch("/api/tenant/export-profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setProfileError(payload.error || "Could not load export details — showing defaults.");
          setProfile(DEFAULT_PROFILE);
          return;
        }

        setProfile({
          teacherName: payload.teacherName ?? DEFAULT_PROFILE.teacherName,
          schoolYear: payload.schoolYear ?? DEFAULT_PROFILE.schoolYear,
          reviewedBy: payload.reviewedBy ?? DEFAULT_PROFILE.reviewedBy,
          reviewedPosition:
            payload.reviewedPosition ?? DEFAULT_PROFILE.reviewedPosition,
          approvedBy: payload.approvedBy ?? DEFAULT_PROFILE.approvedBy,
          approvedPosition:
            payload.approvedPosition ?? DEFAULT_PROFILE.approvedPosition,
          address: payload.address ?? DEFAULT_PROFILE.address,
          orgLogoUrl: payload.orgLogoUrl ?? DEFAULT_PROFILE.orgLogoUrl,
          orgLogoAlt: payload.orgLogoAlt ?? DEFAULT_PROFILE.orgLogoAlt,
        });
        return;

        /*
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
          orgLogoAlt: DEFAULT_PROFILE.orgLogoAlt,
        });
        */
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
    orgLogoAlt,
  } = profile;

  return (
    <>
      <div className="teacher-export-overlay fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-3">
        <div className="flex max-h-[calc(100vh-24px)] w-[95vw] max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between gap-4 px-5 py-3">
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
                Print
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="cursor-pointer rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)]"
              >
                Save PDF
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
          <div className="rounded-b-2xl bg-[var(--color-background)] p-2">
            {profileError && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                {profileError}
              </div>
            )}

            <div className="teacher-export-print-root overflow-hidden">
              <div className="teacher-export-preview-frame">
                <div className="teacher-export-preview-scale">
                  <PrintablePage>
                <div className="space-y-3">
                  {/* ── Header: Org logo | Title | CHED logo ── */}
                  <div className="grid grid-cols-[1fr_2fr_1fr] items-center">
                    <OrgLogo url={orgLogoUrl} alt={orgLogoAlt} />

                    <div className="text-center">
                      <h1 className="text-lg font-bold uppercase">
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
                  <div className="grid grid-cols-2 gap-4 border border-black p-1.5 text-[9pt]">
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
                  <div className="border border-black text-center text-[8pt]">
                    <div
                      className="grid bg-gray-50 font-bold"
                      style={{ gridTemplateColumns: "124px repeat(7, minmax(0, 1fr))" }}
                    >
                      {days.map((day) => (
                        <div key={day} className="border-b border-r border-black p-1 last:border-r-0">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div
                      className="grid"
                      style={{ gridTemplateColumns: "124px repeat(7, minmax(0, 1fr))" }}
                    >
                      <div>
                        {visibleScheduleTimes.map((time) => (
                          <div
                            key={time}
                            className="flex items-center justify-center whitespace-nowrap border-b border-r border-black bg-gray-50 px-1 text-[7pt] font-semibold last:border-b-0"
                            style={{ height: 29 }}
                          >
                            {time}
                          </div>
                        ))}
                      </div>

                      {scheduleDayIndexes.map((i) => {
                        const dayName = days[i];
                        const dayAbbr = dayAbbreviationMap[dayName] ?? dayName;
                        const dayBlocks = scheduleBlocks.filter((block) => block.dayAbbr === dayAbbr);
                        const gridStart = 7 * 60;
                        const gridEnd = 21 * 60;

                        return (
                          <div
                            key={dayName}
                            className="relative border-r border-black last:border-r-0"
                            style={{ height: visibleScheduleTimes.length * 29 }}
                          >
                            {visibleScheduleTimes.map((time) => (
                              <div key={time} className="border-b border-black last:border-b-0" style={{ height: 29 }} />
                            ))}

                            {dayBlocks.map((block) => {
                              const clampedStart = Math.max(gridStart, block.startMinutes);
                              const clampedEnd = Math.min(gridEnd, Math.max(block.endMinutes, clampedStart + 15));
                              const top = ((clampedStart - gridStart) / 60) * 29;
                              const height = ((clampedEnd - clampedStart) / 60) * 29;

                              return (
                                <div
                                  key={`${block.dayAbbr}-${block.startMinutes}-${block.endMinutes}-${block.row.id}`}
                                  className="absolute left-1 right-1 flex flex-col items-center justify-center rounded-sm px-1 py-0.5 text-white"
                                  style={{
                                    top,
                                    height: Math.max(height - 4, 24),
                                    backgroundColor: "var(--color-primary)",
                                  }}
                                >
                                  <span className="font-bold leading-tight">{block.row.subjectCode}</span>
                                  <span className="leading-tight">{block.row.section}</span>
                                  <span className="text-[7pt] italic leading-tight">{block.row.room}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Signatures ── */}
                  <div className="mt-2 grid grid-cols-2 gap-20 text-[9pt]">
                    <div>
                      <p className="font-bold">Reviewed by:</p>
                      <div className="mt-2 border-t border-black pt-1">
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
                      <div className="mt-2 border-t border-black pt-1">
                        {isLoadingProfile ? (
                          <ProfileSkeleton />
                        ) : (
                          <>
                            <p className="font-bold uppercase">{approvedBy}</p>
                            <p>{approvedPosition}</p>
                            {address ? <p className="text-[9pt] italic">{address}</p> : null}
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
        </div>
      </div>

      <style jsx global>{`
        .teacher-export-preview-frame {
          --teacher-export-preview-scale: 0.54;
          width: calc(297mm * var(--teacher-export-preview-scale));
          height: calc(210mm * var(--teacher-export-preview-scale));
          margin: 0 auto;
          overflow: visible;
        }

        .teacher-export-preview-scale {
          width: 297mm;
          transform: scale(var(--teacher-export-preview-scale));
          transform-origin: top left;
        }

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
          .teacher-export-preview-frame,
          .teacher-export-preview-scale {
            width: auto !important;
            height: auto !important;
            transform: none !important;
          }
          .teacher-export-overlay {
            visibility: hidden !important;
          }
        }
      `}</style>
    </>
  );
}
