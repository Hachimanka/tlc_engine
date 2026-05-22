"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BrandedSkeletonBlock from "@/components/Global/BrandedSkeleton";
import StyledSelect from "@/components/Global/StyledSelect";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  RefreshCw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type InstitutionType = "higher_ed" | "deped" | "tesda" | "training" | null;
type AcademicApprovalWorkflow =
  | "dean_vpaa"
  | "chairman_only"
  | "chairman_dean"
  | "chairman_dean_vpaa";
type TabKey = "calendar" | "teachingLoad" | "workload" | "curriculum" | "grading" | "approvals";

type CalendarTerm = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type GradingComponent = {
  id: string;
  name: string;
  weight: string;
};

type CurriculumItem = {
  id: string;
  label: string;
  category: string;
  detail: string;
  hoursPerWeek: string;
};

type PolicyState = {
  calendar: {
    label: string;
    type: string;
    gradeDeadline: string;
    terms: CalendarTerm[];
  };
  teachingLoad: {
    computationType: string;
    maximum: string;
    minimum: string;
    unit: string;
    allowOverload: boolean;
    overload: string;
  };
  workload: {
    fullTimeHours: string;
    partTimeHours: string;
    teachingTime: string;
    nonTeachingTime: string;
    minutesPerSubject: string;
    workStart: string;
    workEnd: string;
  };
  curriculum: {
    mappingMode: string;
    prerequisiteMode: string;
    notes: string;
    items: CurriculumItem[];
  };
  grading: {
    passing: string;
    scale: string;
    assessmentType: string;
    components: GradingComponent[];
  };
  approvals: {
    workflow: AcademicApprovalWorkflow;
  };
};

function PoliciesSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading academic policies">
      <span className="sr-only">Loading academic policies</span>
      <div className="flex animate-pulse flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <BrandedSkeletonBlock className="h-7 w-40 rounded-full" />
          <BrandedSkeletonBlock className="h-8 w-72" />
          <BrandedSkeletonBlock className="h-4 w-[520px] max-w-full" />
        </div>
        <div className="flex gap-2">
          <BrandedSkeletonBlock className="h-10 w-24" />
          <BrandedSkeletonBlock className="h-10 w-32" strong />
        </div>
      </div>

      <div className="grid animate-pulse gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="rounded-lg bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
            <BrandedSkeletonBlock className="h-3 w-24" />
            <BrandedSkeletonBlock className="mt-3 h-6 w-20" />
          </div>
        ))}
      </div>

      <div className="animate-pulse rounded-lg bg-white p-2 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <BrandedSkeletonBlock key={index} className="h-10 w-32" />
          ))}
        </div>
      </div>

      <div className="animate-pulse rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <BrandedSkeletonBlock className="h-6 w-56" />
        <BrandedSkeletonBlock className="mt-3 h-4 w-[560px] max-w-full" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <BrandedSkeletonBlock key={index} className="h-20" />
          ))}
        </div>
      </div>
    </div>
  );
}

type PolicyPayload = {
  institutionType?: InstitutionType;
  onboardingConfig?: unknown;
  policies?: unknown;
  error?: string;
};

const tabConfig: {
  key: TabKey;
  label: string;
  description: string;
  icon: typeof CalendarDays;
}[] = [
  {
    key: "calendar",
    label: "Calendar",
    description: "Terms, dates, and submission windows",
    icon: CalendarDays,
  },
  {
    key: "teachingLoad",
    label: "Teaching Load",
    description: "Maximum load and overload rules",
    icon: SlidersHorizontal,
  },
  {
    key: "workload",
    label: "Workload",
    description: "Working hours and class time",
    icon: Clock,
  },
  {
    key: "curriculum",
    label: "Curriculum",
    description: "Setup-linked curriculum policy",
    icon: BookOpen,
  },
  {
    key: "grading",
    label: "Grading",
    description: "Assessment rules and components",
    icon: ClipboardList,
  },
  {
    key: "approvals",
    label: "Approvals",
    description: "Academic request routing workflow",
    icon: CheckCircle2,
  },
];

const visibleTabsForInstitution = (institutionType: InstitutionType) =>
  tabConfig.filter((tab) => institutionType === "higher_ed" || tab.key !== "approvals");

const approvalWorkflowOptions: {
  value: AcademicApprovalWorkflow;
  label: string;
  description: string;
}[] = [
  {
    value: "dean_vpaa",
    label: "Dean -> VPAA",
    description: "Current default workflow for existing tenants.",
  },
  {
    value: "chairman_only",
    label: "Chairman only",
    description: "The assigned department chairman gives the final approval.",
  },
  {
    value: "chairman_dean",
    label: "Chairman -> Dean",
    description: "Department chairman reviews first, then the assigned college dean gives final approval.",
  },
  {
    value: "chairman_dean_vpaa",
    label: "Chairman -> Dean -> VPAA",
    description: "Department chairman, college dean, then VPAA approval are all required.",
  },
];

const institutionLabels: Record<Exclude<InstitutionType, null>, string> = {
  higher_ed: "Higher Education",
  deped: "DepEd Basic Education",
  tesda: "TESDA / TVET",
  training: "Training Center",
};

const policyTitles: Record<Exclude<InstitutionType, null>, string> = {
  higher_ed: "Academic Policies",
  deped: "School Policies",
  tesda: "Assessment Policies",
  training: "Training Policies",
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const asRecordArray = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => item as Record<string, unknown>);
};

const toText = (value: unknown, fallback = "") => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
};

const toBool = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
};

const normalizeInstitutionType = (value: unknown): InstitutionType => {
  if (value === "higher_ed" || value === "deped" || value === "tesda" || value === "training") {
    return value;
  }

  return null;
};

const normalizeApprovalWorkflow = (value: unknown): AcademicApprovalWorkflow => {
  if (
    value === "dean_vpaa" ||
    value === "chairman_only" ||
    value === "chairman_dean" ||
    value === "chairman_dean_vpaa"
  ) {
    return value;
  }

  return "dean_vpaa";
};

const normalizeStructure = (value: unknown, institutionType: InstitutionType) => {
  const structure = toText(value).toLowerCase();

  if (structure === "trimestral") {
    return { type: "Trimester", names: ["First Trimester", "Second Trimester", "Third Trimester"] };
  }

  if (structure === "quarterly" || institutionType === "deped") {
    return {
      type: "Quarterly",
      names: ["First Quarter", "Second Quarter", "Third Quarter", "Fourth Quarter"],
    };
  }

  return { type: "Semester", names: ["First Semester", "Second Semester"] };
};

const buildCalendarTerms = (
  institutionType: InstitutionType,
  academic: Record<string, unknown>,
): CalendarTerm[] => {
  if (institutionType === "tesda" || institutionType === "training") {
    return [
      {
        id: "batch-1",
        name: toText(academic.batchName, toText(academic.label, "Active Batch")),
        startDate: toText(academic.batchStart),
        endDate: toText(academic.batchEnd),
      },
    ];
  }

  const structure = normalizeStructure(academic.structure, institutionType);

  return structure.names.map((name, index) => {
    const position = index + 1;

    return {
      id: `term-${position}`,
      name,
      startDate: toText(academic[`period${position}Start`]),
      endDate: toText(academic[`period${position}End`]),
    };
  });
};

const getTeachingDefaults = (institutionType: InstitutionType): PolicyState["teachingLoad"] => {
  if (institutionType === "deped") {
    return {
      computationType: "Hours",
      maximum: "6",
      minimum: "4",
      unit: "hours/day",
      allowOverload: true,
      overload: "1",
    };
  }

  if (institutionType === "tesda" || institutionType === "training") {
    return {
      computationType: "Hours",
      maximum: "40",
      minimum: "20",
      unit: "hours/week",
      allowOverload: false,
      overload: "0",
    };
  }

  return {
    computationType: "Units",
    maximum: "18",
    minimum: "12",
    unit: "units/week",
    allowOverload: true,
    overload: "3",
  };
};

const getWorkloadDefaults = (institutionType: InstitutionType): PolicyState["workload"] => {
  if (institutionType === "deped") {
    return {
      fullTimeHours: "40",
      partTimeHours: "20",
      teachingTime: "6",
      nonTeachingTime: "2",
      minutesPerSubject: "45",
      workStart: "07:00",
      workEnd: "17:00",
    };
  }

  return {
    fullTimeHours: "40",
    partTimeHours: "20",
    teachingTime: institutionType === "higher_ed" ? "18" : "30",
    nonTeachingTime: institutionType === "higher_ed" ? "10" : "5",
    minutesPerSubject: institutionType === "higher_ed" ? "60" : "50",
    workStart: "08:00",
    workEnd: "17:00",
  };
};

const buildCurriculumItems = (
  institutionType: InstitutionType,
  config: Record<string, unknown>,
): CurriculumItem[] => {
  if (institutionType === "deped") {
    const gradeLevels = asRecord(config.gradeLevels);
    const items: CurriculumItem[] = [];

    [
      ["kinder", "Kindergarten"],
      ["elementary", "Elementary"],
      ["jhs", "Junior High School"],
      ["shs", "Senior High School"],
    ].forEach(([key, label]) => {
      if (gradeLevels[key] === true) {
        items.push({
          id: `grade-${key}`,
          label,
          category: "Grade level",
          detail: key === "shs" ? "Senior High curriculum enabled" : "Enabled in setup",
          hoursPerWeek: "",
        });
      }
    });

    if (gradeLevels.shs === true) {
      const oldTracks = asRecord(gradeLevels.shsTracksOld);
      const newTracks = asRecord(gradeLevels.shsTracksNew);

      [
        ["stem", "STEM"],
        ["abm", "ABM"],
        ["humss", "HUMSS"],
        ["tvl", "TVL"],
      ].forEach(([key, label]) => {
        if (oldTracks[key] === true) {
          items.push({
            id: `shs-${key}`,
            label,
            category: "SHS track",
            detail: "Old SHS track model",
            hoursPerWeek: "",
          });
        }
      });

      [
        ["academic", "Academic"],
        ["techpro", "TechPro"],
      ].forEach(([key, label]) => {
        if (newTracks[key] === true) {
          items.push({
            id: `shs-${key}`,
            label,
            category: "SHS track",
            detail: "New SHS track model",
            hoursPerWeek: "",
          });
        }
      });
    }

    return items;
  }

  if (institutionType === "higher_ed") {
    const programs = asRecordArray(config.programs);
    const departments = asRecordArray(config.departments);
    const programItems = programs
      .filter((program) => toText(program.name))
      .map((program, index) => ({
        id: `program-${toText(program.code, String(index + 1))}`,
        label: toText(program.name),
        category: "Program",
        detail: [toText(program.code), toText(program.duration) ? `${toText(program.duration)} years` : ""]
          .filter(Boolean)
          .join(" - "),
        hoursPerWeek: "",
      }));

    if (programItems.length > 0) {
      return programItems;
    }

    return departments
      .filter((department) => toText(department.name))
      .map((department, index) => ({
        id: `department-${toText(department.code, String(index + 1))}`,
        label: toText(department.name),
        category: "Department",
        detail: toText(department.head, "Department setup"),
        hoursPerWeek: "",
      }));
  }

  if (institutionType === "tesda") {
    return asRecordArray(config.qualifications)
      .filter((qualification) => toText(qualification.name))
      .map((qualification, index) => ({
        id: `qualification-${index + 1}`,
        label: toText(qualification.name),
        category: toText(qualification.ncLevel, "Qualification"),
        detail: [toText(qualification.duration), toText(qualification.sector)].filter(Boolean).join(" - "),
        hoursPerWeek: "",
      }));
  }

  if (institutionType === "training") {
    return asRecordArray(config.courses)
      .filter((course) => toText(course.name))
      .map((course, index) => ({
        id: `course-${index + 1}`,
        label: toText(course.name),
        category: toText(course.category, "Course"),
        detail: toText(course.duration),
        hoursPerWeek: "",
      }));
  }

  return [];
};

const mergeCurriculumItems = (
  setupItems: CurriculumItem[],
  storedItems: Record<string, unknown>[],
) => {
  const storedById = new Map(storedItems.map((item) => [toText(item.id), item]));

  return setupItems.map((item) => {
    const storedItem = storedById.get(item.id);

    return {
      ...item,
      hoursPerWeek: toText(storedItem?.hoursPerWeek, item.hoursPerWeek),
    };
  });
};

const defaultGradingComponents = (institutionType: InstitutionType, grading: Record<string, unknown>) => {
  const configured = asRecordArray(grading.components)
    .filter((component) => toText(component.name))
    .map((component, index) => ({
      id: `component-${index + 1}`,
      name: toText(component.name),
      weight: toText(component.weight, "0"),
    }));

  if (configured.length > 0) {
    return configured;
  }

  if (institutionType === "deped") {
    return [
      { id: "written-works", name: "Written Works", weight: "25" },
      { id: "performance-tasks", name: "Performance Tasks", weight: "50" },
      { id: "quarterly-assessment", name: "Quarterly Assessment", weight: "25" },
    ];
  }

  return [{ id: "final-grade", name: "Final Grade", weight: "100" }];
};

const buildPolicyState = (
  institutionType: InstitutionType,
  onboardingConfigValue: unknown,
  storedPoliciesValue: unknown,
): PolicyState => {
  const config = asRecord(onboardingConfigValue);
  const academic = asRecord(config.academic);
  const grading = asRecord(config.grading);
  const storedPolicies = asRecord(storedPoliciesValue);
  const storedCalendar = asRecord(storedPolicies.calendar);
  const storedTeachingLoad = asRecord(storedPolicies.teachingLoad);
  const storedWorkload = asRecord(storedPolicies.workload);
  const storedCurriculum = asRecord(storedPolicies.curriculum);
  const storedGrading = asRecord(storedPolicies.grading);
  const storedApprovals = asRecord(storedPolicies.approvals);
  const defaultCalendar = {
    label: toText(academic.label),
    type:
      institutionType === "tesda" || institutionType === "training"
        ? "Batch-based"
        : normalizeStructure(academic.structure, institutionType).type,
    gradeDeadline: toText(academic.gradeDeadline, "14"),
    terms: buildCalendarTerms(institutionType, academic),
  };
  const defaultTeachingLoad = getTeachingDefaults(institutionType);
  const defaultWorkload = getWorkloadDefaults(institutionType);
  const setupCurriculumItems = buildCurriculumItems(institutionType, config);
  const storedCurriculumItems = asRecordArray(storedCurriculum.items);
  const defaultGrading = {
    passing: toText(grading.passing, institutionType === "higher_ed" ? "75" : "75"),
    scale: toText(grading.scale, institutionType === "higher_ed" ? "gwa" : "percentage"),
    assessmentType: toText(
      grading.assessmentType,
      institutionType === "tesda" ? "competency" : "percentage",
    ),
    components: defaultGradingComponents(institutionType, grading),
  };

  return {
    calendar: {
      label: toText(storedCalendar.label, defaultCalendar.label),
      type: toText(storedCalendar.type, defaultCalendar.type),
      gradeDeadline: toText(storedCalendar.gradeDeadline, defaultCalendar.gradeDeadline),
      terms:
        asRecordArray(storedCalendar.terms).length > 0
          ? asRecordArray(storedCalendar.terms).map((term, index) => ({
              id: toText(term.id, `term-${index + 1}`),
              name: toText(term.name),
              startDate: toText(term.startDate),
              endDate: toText(term.endDate),
            }))
          : defaultCalendar.terms,
    },
    teachingLoad: {
      computationType: toText(storedTeachingLoad.computationType, defaultTeachingLoad.computationType),
      maximum: toText(storedTeachingLoad.maximum, defaultTeachingLoad.maximum),
      minimum: toText(storedTeachingLoad.minimum, defaultTeachingLoad.minimum),
      unit: toText(storedTeachingLoad.unit, defaultTeachingLoad.unit),
      allowOverload: toBool(storedTeachingLoad.allowOverload, defaultTeachingLoad.allowOverload),
      overload: toText(storedTeachingLoad.overload, defaultTeachingLoad.overload),
    },
    workload: {
      fullTimeHours: toText(storedWorkload.fullTimeHours, defaultWorkload.fullTimeHours),
      partTimeHours: toText(storedWorkload.partTimeHours, defaultWorkload.partTimeHours),
      teachingTime: toText(storedWorkload.teachingTime, defaultWorkload.teachingTime),
      nonTeachingTime: toText(storedWorkload.nonTeachingTime, defaultWorkload.nonTeachingTime),
      minutesPerSubject: toText(storedWorkload.minutesPerSubject, defaultWorkload.minutesPerSubject),
      workStart: toText(storedWorkload.workStart, defaultWorkload.workStart),
      workEnd: toText(storedWorkload.workEnd, defaultWorkload.workEnd),
    },
    curriculum: {
      mappingMode: toText(storedCurriculum.mappingMode, "Synced with setup"),
      prerequisiteMode: toText(
        storedCurriculum.prerequisiteMode,
        institutionType === "tesda" || institutionType === "training" ? "Advisory" : "Strict",
      ),
      notes: toText(storedCurriculum.notes),
      items: mergeCurriculumItems(setupCurriculumItems, storedCurriculumItems),
    },
    grading: {
      passing: toText(storedGrading.passing, defaultGrading.passing),
      scale: toText(storedGrading.scale, defaultGrading.scale),
      assessmentType: toText(storedGrading.assessmentType, defaultGrading.assessmentType),
      components:
        asRecordArray(storedGrading.components).length > 0
          ? asRecordArray(storedGrading.components).map((component, index) => ({
              id: toText(component.id, `component-${index + 1}`),
              name: toText(component.name),
              weight: toText(component.weight, "0"),
            }))
          : defaultGrading.components,
    },
    approvals: {
      workflow: normalizeApprovalWorkflow(storedApprovals.workflow),
    },
  };
};

const countConfiguredValues = (config: Record<string, unknown>) => {
  return [
    asRecordArray(config.colleges).length,
    asRecordArray(config.departments).length,
    asRecordArray(config.programs).length,
    asRecordArray(config.qualifications).length,
    asRecordArray(config.courses).length,
    asRecordArray(config.instructors).length,
  ].reduce((total, value) => total + value, 0);
};

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date" | "time";
  suffix?: string;
}) => (
  <label className="flex flex-col gap-1.5 text-sm font-medium text-[#344054]">
    {label}
    <div className="flex h-11 items-center rounded-lg border border-[#d0d5dd] bg-white px-3 transition focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[rgba(0,107,95,0.14)]">
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none"
      />
      {suffix ? <span className="ml-2 text-xs text-[var(--color-low-emphasis)]">{suffix}</span> : null}
    </div>
  </label>
);

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <div className="flex flex-col gap-1.5 text-sm font-medium text-[#344054]">
    {label}
    <StyledSelect
      value={value}
      onChange={onChange}
      options={options.map((option) => ({ value: option, label: option }))}
    />
  </div>
);

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
    <div className="mb-5">
      <h2 className="text-lg font-bold text-[var(--color-high-emphasis)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">{description}</p>
    </div>
    {children}
  </section>
);

export default function Policies() {
  const [activeTab, setActiveTab] = useState<TabKey>("calendar");
  const [institutionType, setInstitutionType] = useState<InstitutionType>(null);
  const [onboardingConfig, setOnboardingConfig] = useState<Record<string, unknown>>({});
  const [policies, setPolicies] = useState<PolicyState | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const hasSetup = Boolean(institutionType && Object.keys(onboardingConfig).length > 0);
  const isDirty = Boolean(policies && JSON.stringify(policies) !== savedSnapshot);
  const policyTitle = institutionType ? policyTitles[institutionType] : "Policies";
  const institutionLabel = institutionType ? institutionLabels[institutionType] : "Institution not set";
  const setupItemCount = useMemo(() => countConfiguredValues(onboardingConfig), [onboardingConfig]);
  const visibleTabs = useMemo(
    () => visibleTabsForInstitution(institutionType),
    [institutionType],
  );

  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    setSaveMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setLoadError("Please sign in to manage policies.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/tenant/policies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = (await response.json().catch(() => ({}))) as PolicyPayload;

      if (!response.ok) {
        setLoadError(payload.error || "Failed to load policies.");
        setIsLoading(false);
        return;
      }

      const nextInstitutionType = normalizeInstitutionType(payload.institutionType);
      const nextConfig = asRecord(payload.onboardingConfig);
      const nextPolicies = buildPolicyState(nextInstitutionType, nextConfig, payload.policies);

      setInstitutionType(nextInstitutionType);
      setOnboardingConfig(nextConfig);
      setPolicies(nextPolicies);
      setSavedSnapshot(JSON.stringify(nextPolicies));
      setIsLoading(false);
    } catch {
      setLoadError("Unable to load policies. Please check your connection and try again.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPolicies();
  }, [loadPolicies]);

  const updateCalendar = (updates: Partial<PolicyState["calendar"]>) => {
    setPolicies((current) =>
      current ? { ...current, calendar: { ...current.calendar, ...updates } } : current,
    );
    setSaveMessage("");
  };

  const updateTeachingLoad = (updates: Partial<PolicyState["teachingLoad"]>) => {
    setPolicies((current) =>
      current ? { ...current, teachingLoad: { ...current.teachingLoad, ...updates } } : current,
    );
    setSaveMessage("");
  };

  const updateWorkload = (updates: Partial<PolicyState["workload"]>) => {
    setPolicies((current) =>
      current ? { ...current, workload: { ...current.workload, ...updates } } : current,
    );
    setSaveMessage("");
  };

  const updateCurriculum = (updates: Partial<PolicyState["curriculum"]>) => {
    setPolicies((current) =>
      current ? { ...current, curriculum: { ...current.curriculum, ...updates } } : current,
    );
    setSaveMessage("");
  };

  const updateGrading = (updates: Partial<PolicyState["grading"]>) => {
    setPolicies((current) =>
      current ? { ...current, grading: { ...current.grading, ...updates } } : current,
    );
    setSaveMessage("");
  };

  const updateApprovals = (updates: Partial<PolicyState["approvals"]>) => {
    setPolicies((current) =>
      current ? { ...current, approvals: { ...current.approvals, ...updates } } : current,
    );
    setSaveMessage("");
  };

  const handleSave = async () => {
    if (!policies) {
      return;
    }

    setIsSaving(true);
    setLoadError("");
    setSaveMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setLoadError("Session expired. Please sign in again.");
        setIsSaving(false);
        return;
      }

      const response = await fetch("/api/tenant/policies", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ policies }),
      });
      const payload = (await response.json().catch(() => ({}))) as PolicyPayload;

      if (!response.ok) {
        setLoadError(payload.error || "Failed to save policies.");
        setIsSaving(false);
        return;
      }

      const nextInstitutionType = normalizeInstitutionType(payload.institutionType);
      const nextConfig = asRecord(payload.onboardingConfig);
      const nextPolicies = buildPolicyState(nextInstitutionType, nextConfig, payload.policies);

      setInstitutionType(nextInstitutionType);
      setOnboardingConfig(nextConfig);
      setPolicies(nextPolicies);
      setSavedSnapshot(JSON.stringify(nextPolicies));
      setSaveMessage("Policies saved.");
      setIsSaving(false);
    } catch {
      setLoadError("Unable to save policies. Please check your connection and try again.");
      setIsSaving(false);
    }
  };

  const updateTerm = (termId: string, updates: Partial<CalendarTerm>) => {
    if (!policies) {
      return;
    }

    updateCalendar({
      terms: policies.calendar.terms.map((term) =>
        term.id === termId ? { ...term, ...updates } : term,
      ),
    });
  };

  const updateCurriculumItem = (itemId: string, hoursPerWeek: string) => {
    if (!policies) {
      return;
    }

    updateCurriculum({
      items: policies.curriculum.items.map((item) =>
        item.id === itemId ? { ...item, hoursPerWeek } : item,
      ),
    });
  };

  const updateGradingComponent = (
    componentId: string,
    updates: Partial<GradingComponent>,
  ) => {
    if (!policies) {
      return;
    }

    updateGrading({
      components: policies.grading.components.map((component) =>
        component.id === componentId ? { ...component, ...updates } : component,
      ),
    });
  };

  const addGradingComponent = () => {
    if (!policies) {
      return;
    }

    updateGrading({
      components: [
        ...policies.grading.components,
        {
          id: `component-${Date.now()}`,
          name: "New Component",
          weight: "0",
        },
      ],
    });
  };

  const removeGradingComponent = (componentId: string) => {
    if (!policies) {
      return;
    }

    updateGrading({
      components: policies.grading.components.filter((component) => component.id !== componentId),
    });
  };

  if (isLoading) {
    return <PoliciesSkeleton />;
  }

  if (loadError && !policies) {
    return (
      <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-bold text-[var(--color-high-emphasis)]">
            Policies unavailable
          </h1>
          <p className="mt-2 text-sm text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={loadPolicies}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-default)] px-4 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!policies) {
    return null;
  }

  const activeTabConfig = visibleTabs.find((tab) => tab.key === activeTab) ?? visibleTabs[0] ?? tabConfig[0];
  const ActiveIcon = activeTabConfig.icon ?? ClipboardList;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ecf8f6] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            {institutionLabel}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-black">{policyTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-low-emphasis)]">
            Rules are aligned with the institution setup saved during onboarding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveMessage ? (
            <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#abefc6] bg-[#ecfdf3] px-3 text-xs font-semibold text-[#027a48]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {saveMessage}
            </span>
          ) : null}
          {isDirty ? (
            <span className="inline-flex h-10 items-center rounded-md border border-[#fedf89] bg-[#fffaeb] px-3 text-xs font-semibold text-[#b54708]">
              Unsaved changes
            </span>
          ) : null}
          <button
            type="button"
            onClick={loadPolicies}
            disabled={isSaving}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-default)] px-4 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <span className="h-4 w-4 animate-pulse rounded bg-white/50" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {isSaving ? "Saving..." : "Save Policies"}
          </button>
        </div>
      </div>

      {!hasSetup ? (
        <div className="rounded-lg border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-sm text-[#b54708]">
          Institution setup is incomplete. Policies can still be reviewed, but calendar,
          grading, and curriculum defaults will become more accurate after onboarding is
          finished.
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
            Calendar
          </p>
          <p className="mt-2 text-lg font-bold text-[var(--color-high-emphasis)]">
            {policies.calendar.type || "-"}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
            Terms
          </p>
          <p className="mt-2 text-lg font-bold text-[var(--color-high-emphasis)]">
            {policies.calendar.terms.length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
            Curriculum Items
          </p>
          <p className="mt-2 text-lg font-bold text-[var(--color-high-emphasis)]">
            {policies.curriculum.items.length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-low-emphasis)]">
            Setup Records
          </p>
          <p className="mt-2 text-lg font-bold text-[var(--color-high-emphasis)]">
            {setupItemCount}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white p-2 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="flex min-w-max gap-1">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={
                  isActive
                    ? "inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
                    : "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-4 py-3">
        <div className="flex items-start gap-3">
          <ActiveIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold text-[var(--color-high-emphasis)]">
              {activeTabConfig.label}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
              {activeTabConfig.description}
            </p>
          </div>
        </div>
      </div>

      {activeTab === "approvals" && institutionType === "higher_ed" ? (
        <Section
          title="Academic Approval Workflow"
          description="Choose how submitted academic requests move through the institution before final approval."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {approvalWorkflowOptions.map((option) => {
              const isSelected = policies.approvals.workflow === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateApprovals({ workflow: option.value })}
                  className={
                    isSelected
                      ? "rounded-lg border border-[var(--color-primary)] bg-[#ecf8f6] p-4 text-left shadow-level-1"
                      : "rounded-lg border border-[#d0d5dd] bg-white p-4 text-left transition hover:border-[var(--color-primary)] hover:bg-[#f8fafc]"
                  }
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={
                        isSelected
                          ? "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white"
                          : "mt-0.5 h-5 w-5 rounded-full border border-[#cbd5e1] bg-white"
                      }
                      aria-hidden="true"
                    >
                      {isSelected ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-[var(--color-high-emphasis)]">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--color-low-emphasis)]">
                        {option.description}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-4 py-3 text-sm text-[var(--color-low-emphasis)]">
            Assigned department chairmen and college deans review their workflow steps. VPAA reviewers need Academic Approvals feature access.
          </div>
        </Section>
      ) : null}

      {activeTab === "calendar" ? (
        <Section
          title="Calendar Structure"
          description="Set the official calendar rhythm and policy dates derived from onboarding."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <InputField
              label={institutionType === "tesda" || institutionType === "training" ? "Batch / term label" : "Academic year label"}
              value={policies.calendar.label}
              onChange={(value) => updateCalendar({ label: value })}
            />
            <SelectField
              label="Calendar type"
              value={policies.calendar.type}
              options={
                institutionType === "tesda" || institutionType === "training"
                  ? ["Batch-based", "Monthly", "Quarterly"]
                  : ["Semester", "Trimester", "Quarterly"]
              }
              onChange={(value) => updateCalendar({ type: value })}
            />
            <InputField
              label="Grade submission deadline"
              type="number"
              suffix="days"
              value={policies.calendar.gradeDeadline}
              onChange={(value) => updateCalendar({ gradeDeadline: value })}
            />
          </div>

          <div className="mt-5 overflow-x-auto rounded-lg border border-[#d0d5dd]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-primary)] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Term / Batch</th>
                  <th className="px-4 py-3 font-semibold">Start Date</th>
                  <th className="px-4 py-3 font-semibold">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0] bg-white">
                {policies.calendar.terms.map((term) => (
                  <tr key={term.id}>
                    <td className="px-4 py-3">
                      <input
                        value={term.name}
                        onChange={(event) => updateTerm(term.id, { name: event.target.value })}
                        className="h-10 w-full rounded-md border border-[#d0d5dd] px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={term.startDate}
                        onChange={(event) => updateTerm(term.id, { startDate: event.target.value })}
                        className="h-10 w-full rounded-md border border-[#d0d5dd] px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={term.endDate}
                        onChange={(event) => updateTerm(term.id, { endDate: event.target.value })}
                        className="h-10 w-full rounded-md border border-[#d0d5dd] px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {activeTab === "teachingLoad" ? (
        <Section
          title="Teaching Load Policy"
          description="Control load limits and overload behavior used by scheduling modules."
        >
          <div className="grid gap-4 lg:grid-cols-4">
            <SelectField
              label="Computation type"
              value={policies.teachingLoad.computationType}
              options={["Units", "Hours", "Competency hours"]}
              onChange={(value) => updateTeachingLoad({ computationType: value })}
            />
            <InputField
              label="Maximum load"
              type="number"
              suffix={policies.teachingLoad.unit}
              value={policies.teachingLoad.maximum}
              onChange={(value) => updateTeachingLoad({ maximum: value })}
            />
            <InputField
              label="Minimum load"
              type="number"
              suffix={policies.teachingLoad.unit}
              value={policies.teachingLoad.minimum}
              onChange={(value) => updateTeachingLoad({ minimum: value })}
            />
            <InputField
              label="Load unit"
              value={policies.teachingLoad.unit}
              onChange={(value) => updateTeachingLoad({ unit: value })}
            />
          </div>

          <div className="mt-5 rounded-lg border border-[#d0d5dd] bg-[#f8fafc] p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-high-emphasis)]">
                  Allow overload
                </h3>
                <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
                  Permit approved assignments beyond the maximum teaching load.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={policies.teachingLoad.allowOverload}
                onClick={() =>
                  updateTeachingLoad({ allowOverload: !policies.teachingLoad.allowOverload })
                }
                className={
                  policies.teachingLoad.allowOverload
                    ? "inline-flex h-8 w-14 justify-end rounded-full bg-[var(--color-primary)] p-1"
                    : "inline-flex h-8 w-14 justify-start rounded-full bg-[#98a2b3] p-1"
                }
              >
                <span className="h-6 w-6 rounded-full bg-white shadow-sm" />
              </button>
            </div>
            {policies.teachingLoad.allowOverload ? (
              <div className="mt-4 max-w-xs">
                <InputField
                  label="Allowed overload"
                  type="number"
                  suffix={policies.teachingLoad.unit}
                  value={policies.teachingLoad.overload}
                  onChange={(value) => updateTeachingLoad({ overload: value })}
                />
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {activeTab === "workload" ? (
        <Section
          title="Workload & Time Policy"
          description="Set time expectations used for teaching assignments and compliance checks."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InputField
              label="Full-time hours"
              type="number"
              suffix="hours/week"
              value={policies.workload.fullTimeHours}
              onChange={(value) => updateWorkload({ fullTimeHours: value })}
            />
            <InputField
              label="Part-time hours"
              type="number"
              suffix="hours/week"
              value={policies.workload.partTimeHours}
              onChange={(value) => updateWorkload({ partTimeHours: value })}
            />
            <InputField
              label="Teaching time"
              type="number"
              suffix={institutionType === "higher_ed" ? "units/week" : "hours/day"}
              value={policies.workload.teachingTime}
              onChange={(value) => updateWorkload({ teachingTime: value })}
            />
            <InputField
              label="Non-teaching time"
              type="number"
              suffix="hours/week"
              value={policies.workload.nonTeachingTime}
              onChange={(value) => updateWorkload({ nonTeachingTime: value })}
            />
            <InputField
              label="Minutes per subject"
              type="number"
              suffix="minutes"
              value={policies.workload.minutesPerSubject}
              onChange={(value) => updateWorkload({ minutesPerSubject: value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Work starts"
                type="time"
                value={policies.workload.workStart}
                onChange={(value) => updateWorkload({ workStart: value })}
              />
              <InputField
                label="Work ends"
                type="time"
                value={policies.workload.workEnd}
                onChange={(value) => updateWorkload({ workEnd: value })}
              />
            </div>
          </div>
        </Section>
      ) : null}

      {activeTab === "curriculum" ? (
        <Section
          title="Subject & Curriculum Policy"
          description="Use onboarding setup as the list of policy-covered curriculum areas."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <SelectField
              label="Curriculum mapping"
              value={policies.curriculum.mappingMode}
              options={["Synced with setup", "Manual review", "Locked"]}
              onChange={(value) => updateCurriculum({ mappingMode: value })}
            />
            <SelectField
              label="Prerequisite checks"
              value={policies.curriculum.prerequisiteMode}
              options={["Strict", "Advisory", "Disabled"]}
              onChange={(value) => updateCurriculum({ prerequisiteMode: value })}
            />
          </div>

          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-[#344054]">
            Policy notes
            <textarea
              value={policies.curriculum.notes}
              onChange={(event) => updateCurriculum({ notes: event.target.value })}
              rows={3}
              className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              placeholder="Add curriculum-specific policy notes..."
            />
          </label>

          <div className="mt-5 overflow-x-auto rounded-lg border border-[#d0d5dd]">
            {policies.curriculum.items.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[var(--color-low-emphasis)]">
                No curriculum setup items found yet.
              </div>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--color-primary)] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Setup Detail</th>
                    <th className="px-4 py-3 font-semibold">Policy Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaecf0] bg-white">
                  {policies.curriculum.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-[var(--color-high-emphasis)]">
                        {item.label}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-high-emphasis)]">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-low-emphasis)]">
                        {item.detail || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={item.hoursPerWeek}
                          onChange={(event) => updateCurriculumItem(item.id, event.target.value)}
                          className="h-10 w-32 rounded-md border border-[#d0d5dd] px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Section>
      ) : null}

      {activeTab === "grading" ? (
        <Section
          title="Grading & Assessment Policy"
          description="Configure passing marks, scale, and weighted assessment components."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <InputField
              label="Passing mark"
              type="number"
              value={policies.grading.passing}
              onChange={(value) => updateGrading({ passing: value })}
            />
            <SelectField
              label="Grading scale"
              value={policies.grading.scale}
              options={["percentage", "gwa", "letter", "pass_fail"]}
              onChange={(value) => updateGrading({ scale: value })}
            />
            <SelectField
              label="Assessment type"
              value={policies.grading.assessmentType}
              options={["percentage", "competency", "pass_fail"]}
              onChange={(value) => updateGrading({ assessmentType: value })}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-high-emphasis)]">
                Assessment Components
              </h3>
              <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
                Component weights should total 100 when percentage grading is used.
              </p>
            </div>
            <button
              type="button"
              onClick={addGradingComponent}
              className="inline-flex h-10 items-center rounded-md border border-[var(--color-default)] px-4 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
            >
              Add Component
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {policies.grading.components.map((component) => (
              <div
                key={component.id}
                className="grid gap-3 rounded-lg border border-[#d0d5dd] bg-[#f8fafc] p-3 sm:grid-cols-[1fr_140px_auto]"
              >
                <InputField
                  label="Component"
                  value={component.name}
                  onChange={(value) => updateGradingComponent(component.id, { name: value })}
                />
                <InputField
                  label="Weight"
                  type="number"
                  suffix="%"
                  value={component.weight}
                  onChange={(value) => updateGradingComponent(component.id, { weight: value })}
                />
                <button
                  type="button"
                  onClick={() => removeGradingComponent(component.id)}
                  className="self-end rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
