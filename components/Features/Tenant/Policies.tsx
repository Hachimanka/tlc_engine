"use client";

import {
  type ChangeEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppIcon } from "@/public/icons";

type TabKey =
  | "calendar-structure"
  | "teaching-load-policy"
  | "workload-time-policy"
  | "subject-curriculum-policy";

type Term = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isPlaceholder?: boolean;
};

type CalendarType = "Quarterly" | "Semester" | "Trimester";

type SubjectRow = {
  id: number;
  subjectName: string;
  hoursPerWeek: string;
  gradeLevel: string;
};

type PolicyCard = {
  title: string;
  description: string;
  value: string;
};

type WorkloadFieldConfig = {
  id: string;
  sectionTitle: string;
  label: string;
  unit: string;
  helperText?: string;
  defaultValue: string;
};

const workloadFieldRows: WorkloadFieldConfig[][] = [
  [
    {
      id: "fullTimeHours",
      sectionTitle: "Working Hours",
      label: "Full-Time Hours per Week",
      unit: "hours/week",
      defaultValue: "0",
    },
    {
      id: "partTimeHours",
      sectionTitle: "",
      label: "Part-Time Hours per Week",
      unit: "hours/week",
      defaultValue: "0",
    },
  ],
  [
    {
      id: "teachingTime",
      sectionTitle: "Time Allocation Breakdown",
      label: "Teaching Time",
      unit: "hours/day",
      helperText: "Default DepEd standard: 6 hours",
      defaultValue: "0",
    },
    {
      id: "nonTeachingTime",
      sectionTitle: "",
      label: "Non-Teaching Time",
      unit: "hours/week",
      helperText: "Default DepEd standard: 2 hours",
      defaultValue: "0",
    },
  ],
  [
    {
      id: "minutesPerSubject",
      sectionTitle: "Subject Time Allocation",
      label: "Minutes per Subject",
      unit: "minutes",
      helperText: "Default DepEd standard: 45 minutes per subject",
      defaultValue: "0",
    },
  ],
];

const calendarTypeTermCounts: Record<CalendarType, number> = {
  Quarterly: 4,
  Semester: 2,
  Trimester: 3,
};

const calendarTypeTermNames: Record<CalendarType, string[]> = {
  Quarterly: ["First Quarter", "Second Quarter", "Third Quarter", "Fourth Quarter"],
  Semester: ["First Semester", "Second Semester"],
  Trimester: ["First Trimester", "Second Trimester", "Third Trimester"],
};

const getDefaultTermName = (type: CalendarType, position: number) => {
  return calendarTypeTermNames[type][position - 1] ?? `Term ${position}`;
};

const createPlaceholderTerm = (type: CalendarType, position: number): Term => ({
  id: -position,
  name: getDefaultTermName(type, position),
  startDate: "--/--/----",
  endDate: "--/--/----",
  isPlaceholder: true,
});

const syncTermsToCalendarType = (
  type: CalendarType,
  currentTerms: Term[],
): Term[] => {
  const maxTerms = calendarTypeTermCounts[type];

  return Array.from({ length: maxTerms }, (_, index) => {
    const position = index + 1;
    const currentTerm = currentTerms[index];

    if (currentTerm && !currentTerm.isPlaceholder) {
      return currentTerm;
    }

    return createPlaceholderTerm(type, position);
  });
};

const WorkloadInputField = ({
  field,
  value,
  onChange,
}: {
  field: WorkloadFieldConfig;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) => {
  const reactId = useId();
  const inputId = `${field.id}-${reactId}`;
  const helperId = field.helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="flex w-full min-w-[280px] flex-1 flex-col items-start gap-3 xl:max-w-[520px]">
      <div className="min-h-[24px] text-heading-h4 text-[var(--color-high-emphasis)]">
        {field.sectionTitle}
      </div>
      <label
        htmlFor={inputId}
        className="text-body-large text-[var(--color-high-emphasis)]"
      >
        {field.label}
      </label>
      <div className="flex w-full items-center gap-2.5">
        <div className="flex h-[50px] min-w-0 flex-1 items-center rounded-md border border-[var(--color-default)] bg-[var(--color-card)] px-3 shadow-level-1 xl:max-w-[400px]">
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={value}
            onChange={onChange}
            aria-describedby={helperId}
            className="h-full w-full text-body-small text-[var(--color-high-emphasis)]"
          />
        </div>
        <div className="whitespace-nowrap text-label-table-header text-[var(--color-low-emphasis)]">
          {field.unit}
        </div>
      </div>
      {field.helperText ? (
        <p id={helperId} className="text-body-small text-[var(--color-high-emphasis)]">
          {field.helperText}
        </p>
      ) : null}
    </div>
  );
};

export default function Policies() {
  const calendarTypeId = useId();
  const computationTypeId = useId();
  const maximumLoadId = useId();
  const minimumLoadId = useId();
  const overloadHoursId = useId();

  const tabs = useMemo(
    () => [
      { key: "calendar-structure" as TabKey, label: "Calendar Structure" },
      { key: "teaching-load-policy" as TabKey, label: "Teaching Load Policy" },
      {
        key: "workload-time-policy" as TabKey,
        label: "Workload & Time Policy",
      },
      {
        key: "subject-curriculum-policy" as TabKey,
        label: "Subject & Curriculum Policy",
      },
    ],
    [],
  );

  const initialTerms = useMemo<Term[]>(
    () => [
      {
        id: 1,
        name: "First Quarter",
        startDate: "6/1/2026",
        endDate: "8/31/2026",
      },
      {
        id: 2,
        name: "Second Quarter",
        startDate: "9/1/2026",
        endDate: "11/30/2026",
      },
    ],
    [],
  );

  const initialWorkloadValues = useMemo(
    () =>
      workloadFieldRows
        .flat()
        .reduce<Record<string, string>>((accumulator, field) => {
          accumulator[field.id] = field.defaultValue;
          return accumulator;
        }, {}),
    [],
  );

  const initialSubjectRows = useMemo<SubjectRow[]>(
    () => [
      {
        id: 1,
        subjectName: "Mathematics",
        hoursPerWeek: "5",
        gradeLevel: "Grade 7",
      },
      {
        id: 2,
        subjectName: "English",
        hoursPerWeek: "5",
        gradeLevel: "Grade 8",
      },
    ],
    [],
  );

  const policyCards = useMemo<Record<TabKey, PolicyCard[]>>(
    () => ({
      "calendar-structure": [
        {
          title: "Calendar type",
          description: "Define the academic rhythm that applies to the tenant.",
          value: "Quarterly",
        },
        {
          title: "Terms",
          description: "Set term boundaries and keep the school year in sync.",
          value: "2 terms active",
        },
        {
          title: "Publishing",
          description: "Apply approved dates to downstream workflow modules.",
          value: "Draft",
        },
      ],
      "teaching-load-policy": [
        {
          title: "Load limit",
          description: "Cap the number of teaching units assigned to a faculty.",
          value: "18 units",
        },
        {
          title: "Overload rule",
          description: "Allow controlled overloads with the proper approval flow.",
          value: "Enabled",
        },
        {
          title: "Distribution",
          description: "Spread high-load subjects across the teaching team.",
          value: "Balanced",
        },
      ],
      "workload-time-policy": [
        {
          title: "Work window",
          description: "Keep task assignments within the approved school hours.",
          value: "7:00 AM - 6:00 PM",
        },
        {
          title: "Rest interval",
          description: "Preserve spacing between successive teaching blocks.",
          value: "30 minutes",
        },
        {
          title: "Weekly cap",
          description: "Prevent schedules from exceeding the target workload.",
          value: "40 hours",
        },
      ],
      "subject-curriculum-policy": [
        {
          title: "Curriculum mapping",
          description: "Match subject offerings against the approved curriculum.",
          value: "Synced",
        },
        {
          title: "Prerequisite checks",
          description: "Block schedule changes that violate subject ordering.",
          value: "Strict",
        },
        {
          title: "Subject mix",
          description: "Balance core and specialized subjects across sections.",
          value: "Reviewed",
        },
      ],
    }),
    [],
  );

  const [activeTab, setActiveTab] = useState<TabKey>("calendar-structure");
  const [calendarType, setCalendarType] = useState<CalendarType>("Quarterly");
  const [computationType, setComputationType] = useState("Hourly");
  const [maximumTeachingLoad, setMaximumTeachingLoad] = useState("12");
  const [minimumTeachingLoad, setMinimumTeachingLoad] = useState("8");
  const [allowOverload, setAllowOverload] = useState(true);
  const [overloadHours, setOverloadHours] = useState("0");
  const [workloadValues, setWorkloadValues] = useState<Record<string, string>>(
    initialWorkloadValues,
  );
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [editingTermId, setEditingTermId] = useState<number | null>(null);
  const [termActionMode, setTermActionMode] = useState<'menu' | 'edit' | 'delete'>('menu');
  const [editingTermData, setEditingTermData] = useState<Partial<Term> | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>(initialSubjectRows);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [subjectActionMode, setSubjectActionMode] = useState<'menu' | 'edit' | 'delete'>('menu');
  const [editingSubjectData, setEditingSubjectData] = useState<Partial<SubjectRow> | null>(null);
  const calendarTypeSelectRef = useRef<HTMLSelectElement | null>(null);
  const computationTypeSelectRef = useRef<HTMLSelectElement | null>(null);
  const activePanelId = `${activeTab}-panel`;
  const activeTabId = `${activeTab}-tab`;

  const getMaxTermsForCalendarType = (type: CalendarType): number => {
    return calendarTypeTermCounts[type];
  };

  useEffect(() => {
    setTerms((currentTerms) => {
      const nextTerms = syncTermsToCalendarType(calendarType, currentTerms);
      const isSame =
        currentTerms.length === nextTerms.length &&
        currentTerms.every(
          (term, index) =>
            term.id === nextTerms[index]?.id &&
            term.name === nextTerms[index]?.name &&
            term.startDate === nextTerms[index]?.startDate &&
            term.endDate === nextTerms[index]?.endDate &&
            Boolean(term.isPlaceholder) === Boolean(nextTerms[index]?.isPlaceholder),
        );

      return isSame ? currentTerms : nextTerms;
    });

    setEditingTermId(null);
    setTermActionMode('menu');
    setEditingTermData(null);
  }, [calendarType]);

  const handleReset = () => {
    setActiveTab("calendar-structure");
    setCalendarType("Quarterly");
    setComputationType("Hourly");
    setMaximumTeachingLoad("12");
    setMinimumTeachingLoad("8");
    setAllowOverload(true);
    setOverloadHours("0");
    setWorkloadValues(initialWorkloadValues);
    setTerms(initialTerms);
  };

  const handleSaveChanges = () => {
    console.log("Policy changes saved", {
      activeTab,
      calendarType,
      computationType,
      maximumTeachingLoad,
      minimumTeachingLoad,
      allowOverload,
      overloadHours,
      workloadValues,
      terms,
    });
  };

  const handleAddTerm = () => {
    const placeholderIndex = terms.findIndex((term) => term.isPlaceholder);
    if (placeholderIndex === -1) {
      return;
    }

    const nextPosition = placeholderIndex + 1;
    setTerms((currentTerms) =>
      currentTerms.map((term, index) =>
        index === placeholderIndex
          ? {
              id: term.id,
              name: getDefaultTermName(calendarType, nextPosition),
              startDate: "--/--/----",
              endDate: "--/--/----",
              isPlaceholder: false,
            }
          : term,
      ),
    );
  };

  const handleTermAction = (termId: number, action: 'menu' | 'edit' | 'delete') => {
    if (action === 'edit') {
      const term = terms.find(t => t.id === termId);
      if (term) {
        setEditingTermData({ ...term });
      }
    }
    setEditingTermId(termId);
    setTermActionMode(action);
  };

  const handleEditTermField = (field: keyof Term, value: string) => {
    setEditingTermData(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSaveTerm = () => {
    if (editingTermId !== null && editingTermData) {
      setTerms(terms.map(term =>
        term.id === editingTermId ? { ...term, ...editingTermData } : term
      ));
    }
    setEditingTermId(null);
    setTermActionMode('menu');
    setEditingTermData(null);
  };

  const handleDeleteTerm = (termId: number) => {
    setTerms((currentTerms) =>
      currentTerms.map((term, index) =>
        term.id === termId
          ? createPlaceholderTerm(calendarType, index + 1)
          : term,
      ),
    );
    setEditingTermId(null);
    setTermActionMode('menu');
    setEditingTermData(null);
  };

  const handleCancelTermAction = () => {
    setEditingTermId(null);
    setTermActionMode('menu');
    setEditingTermData(null);
  };

  const handleAddSubject = () => {
    const nextId = Date.now();

    setSubjects((currentSubjects) => [
      ...currentSubjects,
      {
        id: nextId,
        subjectName: "New Subject",
        hoursPerWeek: "0",
        gradeLevel: "",
      },
    ]);
    setEditingSubjectId(nextId);
    setSubjectActionMode('edit');
    setEditingSubjectData({
      id: nextId,
      subjectName: "New Subject",
      hoursPerWeek: "0",
      gradeLevel: "",
    });
  };

  const handleSubjectAction = (
    subjectId: number,
    action: 'menu' | 'edit' | 'delete',
  ) => {
    if (action === 'edit') {
      const subject = subjects.find((row) => row.id === subjectId);

      if (subject) {
        setEditingSubjectData({ ...subject });
      }
    }

    setEditingSubjectId(subjectId);
    setSubjectActionMode(action);
  };

  const handleEditSubjectField = (field: keyof SubjectRow, value: string) => {
    setEditingSubjectData((previous) => (previous ? { ...previous, [field]: value } : null));
  };

  const handleSaveSubject = () => {
    if (editingSubjectId !== null && editingSubjectData) {
      setSubjects((currentSubjects) =>
        currentSubjects.map((subject) =>
          subject.id === editingSubjectId
            ? {
                ...subject,
                ...editingSubjectData,
                subjectName: editingSubjectData.subjectName ?? subject.subjectName,
                hoursPerWeek: editingSubjectData.hoursPerWeek ?? subject.hoursPerWeek,
                gradeLevel: editingSubjectData.gradeLevel ?? subject.gradeLevel,
              }
            : subject,
        ),
      );
    }

    setEditingSubjectId(null);
    setSubjectActionMode('menu');
    setEditingSubjectData(null);
  };

  const handleDeleteSubject = (subjectId: number) => {
    setSubjects((currentSubjects) =>
      currentSubjects.filter((subject) => subject.id !== subjectId),
    );
    setEditingSubjectId(null);
    setSubjectActionMode('menu');
    setEditingSubjectData(null);
  };

  const handleCancelSubjectAction = () => {
    setEditingSubjectId(null);
    setSubjectActionMode('menu');
    setEditingSubjectData(null);
  };

  const handleCalendarTypeArrowClick = () => {
    const select = calendarTypeSelectRef.current;

    if (!select) {
      return;
    }

    if (typeof window !== "undefined" && "showPicker" in select) {
      (select as HTMLSelectElement & { showPicker?: () => void }).showPicker?.();
      return;
    }

    select.focus();
    select.click();
  };

  const handleCalendarTypeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    setCalendarType(event.currentTarget.value as CalendarType);
  };

  const handleComputationTypeArrowClick = () => {
    const select = computationTypeSelectRef.current;

    if (!select) {
      return;
    }

    if (typeof window !== "undefined" && "showPicker" in select) {
      (select as HTMLSelectElement & { showPicker?: () => void }).showPicker?.();
      return;
    }

    select.focus();
    select.click();
  };

  const handleWorkloadValueChange =
    (fieldId: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setWorkloadValues((previous) => ({
        ...previous,
        [fieldId]: nextValue === "" ? "" : nextValue,
      }));
    };

  return (
    <main className="min-h-full w-full bg-[var(--color-background)] px-0 py-0 text-[var(--color-high-emphasis)]">
      <div className="relative mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1504px] flex-col gap-4 rounded-[24px] bg-[var(--color-background)] px-0 pb-0 pt-0 md:gap-6 md:px-0">
        <header className="flex flex-col gap-4 px-2 md:flex-row md:items-start md:justify-between md:px-0">
          <div className="px-4 pt-4 md:px-5 md:pt-5">
            <h1 className="text-display-h1 text-[var(--color-high-emphasis)]">
              Policy Management
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-4 pt-4 md:px-0 md:pt-0">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-12 min-w-[128px] items-center justify-center gap-2 rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-5 text-label-button text-[var(--color-primary)] shadow-level-1 transition-transform duration-150 hover:-translate-y-0.5"
              aria-label="Reset policy management form"
            >
              <AppIcon
                name="rotate"
                className="inline-block [&_svg]:h-4 [&_svg]:w-4"
                title="Reset"
              />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              className="inline-flex h-12 min-w-[142px] items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 text-label-button text-[var(--color-card)] shadow-level-1 transition-transform duration-150 hover:-translate-y-0.5"
              aria-label="Save policy changes"
            >
              <AppIcon
                name="checkMarked"
                className="inline-block [&_svg]:h-4 [&_svg]:w-4"
                title="Save Changes"
              />
              Save Changes
            </button>
          </div>
        </header>

        <nav
          className="mx-2 flex w-fit max-w-full flex-wrap items-center gap-1.5 overflow-hidden rounded-[16px] bg-[var(--color-background-dark)] p-1.5 md:mx-0"
          role="tablist"
          aria-label="Policy management sections"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.key}-panel`}
                id={`${tab.key}-tab`}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center justify-center rounded-[12px] px-3 py-2 text-label-button transition-colors duration-150 ${
                  isActive
                    ? "bg-[var(--color-card)] text-[var(--color-high-emphasis)] shadow-level-1"
                    : "text-[var(--color-high-emphasis)]/85 hover:bg-[rgba(255,255,255,0.72)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section
          id={activePanelId}
          role="tabpanel"
          aria-labelledby={activeTabId}
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[20px] bg-[var(--color-card)] shadow-level-2"
        >
          <header className="flex items-center justify-between gap-4 border-b border-[var(--color-default)] px-5 py-4">
            <div>
              <h2 className="text-heading-h3 text-[var(--color-high-emphasis)]">
                {activeTab === "calendar-structure"
                  ? "Academic Calendar Configuration"
                  : activeTab === "teaching-load-policy"
                    ? "Teaching Load Configuration"
                    : tabs.find((tab) => tab.key === activeTab)?.label}
              </h2>
              <p className="mt-1 text-body-small text-[var(--color-low-emphasis)]">
                {activeTab === "calendar-structure"
                  ? "Set the academic year structure, term dates, and publication timing."
                  : activeTab === "teaching-load-policy"
                    ? "Configure teaching load computation, overload limits, and load thresholds."
                    : "Adjust the active policy group without leaving the tenant workspace."}
              </p>
            </div>
          </header>

          {activeTab === "calendar-structure" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="grid gap-6 px-5 py-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="flex flex-col gap-3">
                  <label
                    htmlFor={calendarTypeId}
                    className="text-body-large text-[var(--color-high-emphasis)]"
                  >
                    Academic Calendar Type
                  </label>
                  <div className="flex h-[50px] items-center rounded-md border border-[var(--color-default)] bg-[var(--color-card)] px-4 shadow-level-1">
                    <div className="flex h-[29px] flex-1 items-center justify-between gap-3">
                      <select
                        ref={calendarTypeSelectRef}
                        id={calendarTypeId}
                        value={calendarType}
                        onChange={handleCalendarTypeChange}
                        className="h-full flex-1 cursor-pointer bg-transparent text-body-medium text-[var(--color-high-emphasis)] outline-none"
                        aria-label="Select academic calendar type"
                      >
                        <option value="Quarterly">Quarterly</option>
                        <option value="Semester">Semester</option>
                        <option value="Trimester">Trimester</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleCalendarTypeArrowClick}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-primary)] transition-colors duration-150 hover:bg-[rgba(2,147,131,0.08)]"
                        aria-label="Open academic calendar type options"
                      >
                        <svg
                          className="h-2 w-3"
                          viewBox="0 0 12 8"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M1 1.5L6 6.5L11 1.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              <section className="flex min-h-0 flex-1 flex-col border-t border-[var(--color-default)]">
                <div className="flex items-center justify-between gap-4 px-5 py-5">
                  <h3 className="text-body-large text-[var(--color-high-emphasis)]">
                    Academic Terms
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddTerm}
                    disabled={terms.every((term) => !term.isPlaceholder)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-label-button text-[var(--color-card)] shadow-level-1 transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Add academic term"
                  >
                    <AppIcon
                      name="plus"
                      className="inline-block [&_svg]:h-4 [&_svg]:w-4"
                      title="Add term"
                    />
                    Add Term
                  </button>
                </div>

                <div className="px-5 pb-5">
                  <div className="overflow-hidden rounded-[16px] border border-[var(--color-default)]">
                    <div className="grid grid-cols-[1.4fr_1fr_1fr_120px] bg-[var(--color-primary)] px-5 py-4 text-center text-label-table-header text-[var(--color-card)]">
                      <div>Term Name</div>
                      <div>Start Date</div>
                      <div>End Date</div>
                      <div>Actions</div>
                    </div>

                    <div className="divide-y divide-[var(--color-default)] bg-[var(--color-card)]">
                      {terms.map((term) => (
                        <div
                          key={term.id}
                          className="grid grid-cols-[1.4fr_1fr_1fr_120px] items-center px-5 py-4 text-center text-body-small text-[var(--color-high-emphasis)] gap-3"
                        >
                          {editingTermId === term.id && editingTermData && termActionMode === 'edit' ? (
                            <input
                              type="text"
                              value={editingTermData.name || ''}
                              onChange={(e) => handleEditTermField('name', e.target.value)}
                              className="w-full rounded border border-[var(--color-default)] bg-[var(--color-card)] px-2 py-1.5 text-body-small text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                              aria-label="Edit term name"
                            />
                          ) : (
                            <div className={term.isPlaceholder ? "text-[var(--color-low-emphasis)]" : ""}>
                              {term.name}
                            </div>
                          )}
                          {editingTermId === term.id && editingTermData && termActionMode === 'edit' ? (
                            <input
                              type="date"
                              value={editingTermData.startDate || ''}
                              onChange={(e) => handleEditTermField('startDate', e.target.value)}
                              className="w-full rounded border border-[var(--color-default)] bg-[var(--color-card)] px-2 py-1.5 text-body-small text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                              aria-label="Edit start date"
                            />
                          ) : (
                            <div className={term.isPlaceholder ? "text-[var(--color-low-emphasis)]" : ""}>
                              {term.startDate}
                            </div>
                          )}
                          {editingTermId === term.id && editingTermData && termActionMode === 'edit' ? (
                            <input
                              type="date"
                              value={editingTermData.endDate || ''}
                              onChange={(e) => handleEditTermField('endDate', e.target.value)}
                              className="w-full rounded border border-[var(--color-default)] bg-[var(--color-card)] px-2 py-1.5 text-body-small text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                              aria-label="Edit end date"
                            />
                          ) : (
                            <div className={term.isPlaceholder ? "text-[var(--color-low-emphasis)]" : ""}>
                              {term.endDate}
                            </div>
                          )}
                          <div className="flex justify-center gap-2">
                            {editingTermId === term.id && termActionMode === 'edit' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleSaveTerm}
                                  className="inline-flex h-8 items-center rounded-md bg-[var(--color-primary)] px-3 text-label-caption text-[var(--color-card)] transition-colors duration-150 hover:bg-[#005a50]"
                                  aria-label={`Save ${term.name}`}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelTermAction}
                                  className="inline-flex h-8 items-center rounded-md border border-[var(--color-default)] bg-[var(--color-background)] px-3 text-label-caption text-[var(--color-high-emphasis)] transition-colors duration-150 hover:bg-[var(--color-default)]"
                                  aria-label={`Cancel editing ${term.name}`}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : editingTermId === term.id && termActionMode === 'delete' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTerm(term.id)}
                                  className="inline-flex h-8 items-center rounded-md bg-[#ff4c4c] px-3 text-label-caption text-white transition-colors duration-150 hover:bg-[#e63939]"
                                  aria-label={`Confirm delete ${term.name}`}
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelTermAction}
                                  className="inline-flex h-8 items-center rounded-md border border-[var(--color-default)] bg-[var(--color-background)] px-3 text-label-caption text-[var(--color-high-emphasis)] transition-colors duration-150 hover:bg-[var(--color-default)]"
                                  aria-label={`Cancel deleting ${term.name}`}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                {editingTermId !== term.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleTermAction(term.id, 'menu')}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-default)] bg-[var(--color-background)] text-[var(--color-primary)] transition-colors duration-150 hover:bg-[rgba(2,147,131,0.08)]"
                                    aria-label={`Open actions for ${term.name}`}
                                  >
                                    <span className="text-lg font-bold">•••</span>
                                  </button>
                                )}
                                {editingTermId === term.id && termActionMode === 'menu' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleTermAction(term.id, 'edit')}
                                      className="inline-flex h-8 items-center rounded-md border border-[var(--color-default)] bg-[var(--color-background)] px-3 text-label-caption text-[var(--color-high-emphasis)] transition-colors duration-150 hover:bg-[var(--color-default)]"
                                      aria-label={`Edit ${term.name}`}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleTermAction(term.id, 'delete')}
                                      className="inline-flex h-8 items-center rounded-md border border-[var(--color-default)] bg-[var(--color-background)] px-3 text-label-caption text-[var(--color-high-emphasis)] transition-colors duration-150 hover:bg-[var(--color-default)]"
                                      aria-label={`Delete ${term.name}`}
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : activeTab === "teaching-load-policy" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-6">
              <section
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[var(--color-default)] bg-[var(--color-background)] shadow-level-1"
                aria-labelledby="teaching-load-configuration-title"
              >
                <header className="flex items-center gap-2.5 border-b border-[var(--color-default)] px-6 py-4">
                  <h3
                    id="teaching-load-configuration-title"
                    className="text-heading-h3 text-[var(--color-high-emphasis)]"
                  >
                    Teaching Load Configuration
                  </h3>
                </header>

                <div className="grid flex-1 gap-8 overflow-auto px-6 py-6 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-5">
                      <label
                        htmlFor={computationTypeId}
                        className="text-body-large text-[var(--color-high-emphasis)]"
                      >
                        Computation Type
                      </label>
                      <div className="flex h-[50px] items-center rounded-md border border-[var(--color-default)] bg-[var(--color-card)] px-3 shadow-level-1">
                        <div className="flex h-[29px] flex-1 items-center justify-between gap-3">
                          <select
                            ref={computationTypeSelectRef}
                            id={computationTypeId}
                            aria-describedby={`${computationTypeId}-hint`}
                            value={computationType}
                            onChange={(event) =>
                              setComputationType(event.target.value)
                            }
                            className="h-full flex-1 cursor-pointer bg-transparent pr-6 text-body-medium text-[var(--color-high-emphasis)] outline-none"
                          >
                            <option value="Hourly">Hourly</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleComputationTypeArrowClick}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-primary)] transition-colors duration-150 hover:bg-[rgba(2,147,131,0.08)]"
                            aria-label="Open computation type options"
                          >
                            <svg
                              className="h-2 w-3"
                              viewBox="0 0 12 8"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M1 1.5L6 6.5L11 1.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p
                        id={`${computationTypeId}-hint`}
                        className="text-label-table-header text-[var(--color-low-emphasis)]"
                      >
                        DepEd policies use hours-based computation
                      </p>
                    </div>

                    <div className="flex flex-col gap-5">
                      <label
                        htmlFor={maximumLoadId}
                        className="text-body-large text-[var(--color-high-emphasis)]"
                      >
                        Maximum Teaching Load
                      </label>
                      <div className="flex h-[50px] items-center rounded-md border border-[var(--color-default)] bg-[var(--color-card)] px-3 shadow-level-1">
                        <input
                          id={maximumLoadId}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={maximumTeachingLoad}
                          onChange={(event) =>
                            setMaximumTeachingLoad(event.target.value)
                          }
                          aria-describedby={`${maximumLoadId}-hint`}
                          className="h-full w-full bg-transparent text-body-medium text-[var(--color-high-emphasis)] outline-none"
                        />
                      </div>
                      <p
                        id={`${maximumLoadId}-hint`}
                        className="text-label-table-header text-[var(--color-low-emphasis)]"
                      >
                        hours/day
                      </p>
                    </div>

                    <div className="flex flex-col gap-5">
                      <label
                        htmlFor={minimumLoadId}
                        className="text-body-large text-[var(--color-high-emphasis)]"
                      >
                        Minimum Teaching Load
                      </label>
                      <div className="flex h-[50px] items-center rounded-md border border-[var(--color-default)] bg-[var(--color-card)] px-3 shadow-level-1">
                        <input
                          id={minimumLoadId}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={minimumTeachingLoad}
                          onChange={(event) =>
                            setMinimumTeachingLoad(event.target.value)
                          }
                          aria-describedby={`${minimumLoadId}-hint`}
                          className="h-full w-full bg-transparent text-body-medium text-[var(--color-high-emphasis)] outline-none"
                        />
                      </div>
                      <p
                        id={`${minimumLoadId}-hint`}
                        className="text-label-table-header text-[var(--color-low-emphasis)]"
                      >
                        hours/day
                      </p>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col">
                    <div className="flex min-h-0 flex-1 flex-col rounded-[18px] bg-[var(--color-background)] p-5 shadow-level-1">
                      <div className="flex items-start justify-between gap-4 border-b border-[var(--color-default)] pb-5">
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor={overloadHoursId}
                            className="text-body-medium text-[var(--color-high-emphasis)]"
                          >
                            Allow Overload
                          </label>
                          <p className="text-body-medium text-[var(--color-low-emphasis)]">
                            Permit faculty to teach beyond maximum load
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={allowOverload}
                          aria-label="Allow Overload"
                          onClick={() => setAllowOverload((previous) => !previous)}
                          className={`inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors ${
                            allowOverload ? "justify-end bg-[#029383]" : "justify-start bg-[#bdbdbd]"
                          }`}
                        >
                          <span className="h-[22px] w-[22px] rounded-full bg-white shadow-sm" />
                        </button>
                      </div>

                      {allowOverload ? (
                        <div className="flex min-h-0 flex-1 flex-col justify-between pt-5">
                          <div className="flex flex-col gap-5">
                            <label
                              htmlFor={overloadHoursId}
                              className="text-body-medium text-[var(--color-high-emphasis)]"
                            >
                              Allowed Overload Number
                            </label>
                            <div className="flex h-[50px] items-center rounded-md border border-[var(--color-default)] bg-[var(--color-card)] px-3 shadow-level-1">
                              <input
                                id={overloadHoursId}
                                type="number"
                                inputMode="numeric"
                                min="0"
                                value={overloadHours}
                                onChange={(event) =>
                                  setOverloadHours(event.target.value)
                                }
                                aria-describedby={`${overloadHoursId}-hint`}
                                className="h-full w-full bg-transparent text-body-small text-[var(--color-high-emphasis)] outline-none"
                              />
                            </div>
                            <p
                              id={`${overloadHoursId}-hint`}
                              className="text-label-table-header text-[var(--color-low-emphasis)]"
                            >
                              hours/day
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : activeTab === "workload-time-policy" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-6">
              <section
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[var(--color-default)] bg-[var(--color-card)] shadow-level-2"
                aria-labelledby="workload-rules-title"
              >
                <header className="flex items-center gap-2.5 border-b border-[var(--color-default)] px-[25px] py-[15px]">
                  <h3
                    id="workload-rules-title"
                    className="text-heading-h3 text-[var(--color-high-emphasis)]"
                  >
                    Workload Rules
                  </h3>
                </header>

                <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                  {workloadFieldRows.map((row, rowIndex) => (
                    <div
                      key={`row-${rowIndex}`}
                      className="flex w-full flex-col items-start gap-5 px-[25px] py-[15px]"
                    >
                      <div className="flex w-full flex-wrap items-start gap-x-10 gap-y-6 xl:gap-x-[150px]">
                        {row.map((field) => (
                          <WorkloadInputField
                            key={field.id}
                            field={field}
                            value={workloadValues[field.id]}
                            onChange={handleWorkloadValueChange(field.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="h-14 w-full" />
                </div>
              </section>
            </div>
          ) : activeTab === "subject-curriculum-policy" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-6">
              <section
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[var(--color-default)] bg-[var(--color-card)] shadow-level-2"
                aria-labelledby="subject-hours-configuration-title"
              >
                <header className="flex items-center gap-2.5 border-b border-[var(--color-default)] px-[25px] py-[15px]">
                  <h3
                    id="subject-hours-configuration-title"
                    className="text-heading-h3 text-[var(--color-high-emphasis)]"
                  >
                    Subject & Curriculum Configuration
                  </h3>
                </header>

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-0 py-4">
                  <div className="flex flex-col items-start gap-[25px] px-0 py-[25px]">
                    <div className="flex w-full flex-wrap items-center justify-between gap-4 px-[25px] py-4">
                      <p className="text-body-large text-[var(--color-high-emphasis)]">
                        Add and manage subjects with curriculum hours by grade level
                      </p>
                      <button
                        type="button"
                        aria-label="Add Subject"
                        onClick={handleAddSubject}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 text-body-small text-[var(--color-card)] shadow-level-1 transition-transform duration-150 hover:-translate-y-0.5"
                      >
                        <AppIcon
                          name="plus"
                          className="inline-block [&_svg]:h-4 [&_svg]:w-4 [&_svg_path]:stroke-[var(--color-card)]"
                          title="Add Subject"
                        />
                        <span>Add Subject</span>
                      </button>
                    </div>

                    <div className="w-full px-[25px]">
                      <div className="overflow-hidden rounded-[16px] border border-[var(--color-default)]">
                        <div className="grid grid-cols-[1.4fr_1fr_1fr_120px] bg-[var(--color-primary)] px-5 py-4 text-center text-label-table-header text-[var(--color-card)]">
                          <div>Subject Name</div>
                          <div>Hours Per Week</div>
                          <div>Grade Level</div>
                          <div>Actions</div>
                        </div>

                        <div className="divide-y divide-[var(--color-default)] bg-[var(--color-card)]">
                          {subjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="grid grid-cols-[1.4fr_1fr_1fr_120px] items-center gap-3 px-5 py-4 text-center text-body-small text-[var(--color-high-emphasis)]"
                            >
                              {editingSubjectId === subject.id && editingSubjectData && subjectActionMode === 'edit' ? (
                                <input
                                  type="text"
                                  value={editingSubjectData.subjectName || ''}
                                  onChange={(event) =>
                                    handleEditSubjectField('subjectName', event.target.value)
                                  }
                                  className="w-full rounded border border-[var(--color-default)] bg-[var(--color-card)] px-2 py-1.5 text-body-small text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                                  aria-label="Edit subject name"
                                />
                              ) : (
                                <div>{subject.subjectName}</div>
                              )}

                              {editingSubjectId === subject.id && editingSubjectData && subjectActionMode === 'edit' ? (
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  step="1"
                                  value={editingSubjectData.hoursPerWeek || ''}
                                  onChange={(event) =>
                                    handleEditSubjectField('hoursPerWeek', event.target.value)
                                  }
                                  className="w-full rounded border border-[var(--color-default)] bg-[var(--color-card)] px-2 py-1.5 text-body-small text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                                  aria-label="Edit hours per week"
                                />
                              ) : (
                                <div>{subject.hoursPerWeek}</div>
                              )}

                              {editingSubjectId === subject.id && editingSubjectData && subjectActionMode === 'edit' ? (
                                <input
                                  type="text"
                                  value={editingSubjectData.gradeLevel || ''}
                                  onChange={(event) =>
                                    handleEditSubjectField('gradeLevel', event.target.value)
                                  }
                                  className="w-full rounded border border-[var(--color-default)] bg-[var(--color-card)] px-2 py-1.5 text-body-small text-[var(--color-high-emphasis)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                                  aria-label="Edit grade level"
                                />
                              ) : (
                                <div>{subject.gradeLevel}</div>
                              )}

                              <div className="flex justify-center gap-2">
                                {editingSubjectId === subject.id && subjectActionMode === 'edit' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={handleSaveSubject}
                                      className="inline-flex h-8 items-center rounded-md bg-[var(--color-primary)] px-3 text-label-caption text-[var(--color-card)] transition-colors duration-150 hover:bg-[#005a50]"
                                      aria-label={`Save ${subject.subjectName}`}
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelSubjectAction}
                                      className="inline-flex h-8 items-center rounded-md border border-[var(--color-default)] bg-[var(--color-background)] px-3 text-label-caption text-[var(--color-high-emphasis)] transition-colors duration-150 hover:bg-[var(--color-default)]"
                                      aria-label={`Cancel editing ${subject.subjectName}`}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : editingSubjectId === subject.id && subjectActionMode === 'delete' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubject(subject.id)}
                                      className="inline-flex h-8 items-center rounded-md bg-[#ff4c4c] px-3 text-label-caption text-white transition-colors duration-150 hover:bg-[#e63939]"
                                      aria-label={`Confirm delete ${subject.subjectName}`}
                                    >
                                      Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelSubjectAction}
                                      className="inline-flex h-8 items-center rounded-md border border-[var(--color-default)] bg-[var(--color-background)] px-3 text-label-caption text-[var(--color-high-emphasis)] transition-colors duration-150 hover:bg-[var(--color-default)]"
                                      aria-label={`Cancel deleting ${subject.subjectName}`}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {editingSubjectId !== subject.id && (
                                      <button
                                        type="button"
                                        onClick={() => handleSubjectAction(subject.id, 'menu')}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-default)] bg-[var(--color-background)] text-[var(--color-primary)] transition-colors duration-150 hover:bg-[rgba(2,147,131,0.08)]"
                                        aria-label={`Open actions for ${subject.subjectName}`}
                                      >
                                        <span className="text-lg font-bold">•••</span>
                                      </button>
                                    )}
                                    {editingSubjectId === subject.id && subjectActionMode === 'menu' && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleSubjectAction(subject.id, 'edit')}
                                          className="inline-flex h-8 items-center rounded-md border border-[var(--color-default)] bg-[var(--color-background)] px-3 text-label-caption text-[var(--color-high-emphasis)] transition-colors duration-150 hover:bg-[var(--color-default)]"
                                          aria-label={`Edit ${subject.subjectName}`}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSubjectAction(subject.id, 'delete')}
                                          className="inline-flex h-8 items-center rounded-md border border-[var(--color-default)] bg-[var(--color-background)] px-3 text-label-caption text-[var(--color-high-emphasis)] transition-colors duration-150 hover:bg-[var(--color-default)]"
                                          aria-label={`Delete ${subject.subjectName}`}
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-[167px] w-full" />
                </div>
              </section>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}