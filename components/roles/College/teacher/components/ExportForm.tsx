"use client";
import { useEffect, type ReactNode } from "react";
import {
  teacherLoadRows,
  type TeacherLoadRow,
} from "./teacher-load-data-college";

type ExportFromProps = {
  isOpen: boolean;
  onClose: () => void;
  teacherName?: string;
  schoolYear?: string;
  reviewedBy?: string;
  reviewedPosition?: string;
  approvedBy?: string;
  approvedPosition?: string;
  address?: string;
  rows?: TeacherLoadRow[];
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

function HeaderPlaceholder() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2  text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
      Logo
    </div>
  );
}

function PrintablePage({ children }: { children: ReactNode }) {
  return (
    <section
      className="teacher-export-page mb-6 flex h-[220mm] w-[297mm] flex-col bg-white px-[15mm] py-[15mm] text-[11pt] text-black shadow-lg print:mb-0 print:h-[210mm] print:w-[297mm] print:shadow-none print:break-after-page"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      {children}
    </section>
  );
}

export default function ExportFrom({
  isOpen,
  onClose,
  teacherName = "JOSEPHINE F. BRACKEN",
  schoolYear = "SY 2024-2025",
  reviewedBy = "ZARA P. YATUS",
  reviewedPosition = "Designation/Position",
  approvedBy = "CRISTOPHER C. PIODOS",
  approvedPosition = "Acting Secondary School Principal",
  address = "Public Schools District Supervisor",
}: ExportFromProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="teacher-export-overlay fixed inset-0 z-50 bg-black/50 px-4 py-6 overflow-auto">
        <div className="mx-auto flex min-h-max w-[95vw] max-w-[1400px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 ">
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
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-light-primary)] cursor-pointer"
              >
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[var(--color-default)] px-4 py-2 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* Printing? */}
          <div className="p-8 bg-[var(--color-background)] rounded-b-2xl">
            <div className="teacher-export-print-root max-h-[80vh] overflow-auto">
              <PrintablePage>
                <div className="space-y-6">
                  {/* Title Section */}
                  <div className="grid grid-cols-[1fr_2fr_1fr] items-center">
                    <HeaderPlaceholder />
                    <div className="text-center">
                      <h1 className="text-xl font-bold uppercase">
                        Class Program / Schedule
                      </h1>
                      <p className="text-sm">{schoolYear}</p>
                    </div>
                    <div className="flex justify-end">
                      <HeaderPlaceholder />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border border-black p-2 text-sm">
                    <p>
                      <strong>Name of Teacher:</strong> {teacherName}
                    </p>
                    <p>
                      <strong>School Year:</strong> {schoolYear}
                    </p>
                  </div>

                  {/* Table sa schedule wa pa na human */}
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

                          {[1, 2, 3, 4, 5].map((i) => (
                            <td
                              key={i}
                              className="border border-black p-1 text-[9pt]"
                            >
                              {/* {scheduleData[time]?.[i] || (
                                <span className="text-gray-500">-</span>
                              )} */}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Signature sa mga higher position */}
                  <div className="mt-8 grid grid-cols-2 gap-20 text-sm">
                    <div>
                      <p className="font-bold">Reviewed by:</p>
                      <div className="mt-8 border-t border-black pt-1">
                        <p className="font-bold uppercase">{reviewedBy}</p>
                        <p>{reviewedPosition}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold">Approved by:</p>
                      <div className="mt-8 border-t border-black pt-1">
                        <p className="font-bold uppercase">{approvedBy}</p>
                        <p>{approvedPosition}</p>
                        <p className="text-[9pt] italic">{address}</p>
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
            @top-left {
              content: none;
            }
            @top-center {
              content: none;
            }
            @top-right {
              content: none;
            }
            @bottom-left {
              content: none;
            }
            @bottom-center {
              content: none;
            }
            @bottom-right {
              content: none;
            }
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
            padding-top: 8mm;
            width: 100vw;
            max-width: none;
            margin: 0;
            padding: 0;
            overflow: visible;
          }

          .teacher-export-overlay {
            visibility: hidden !important;
            pointer-events: none;
          }
        }
      `}</style>
    </>
  );
}
