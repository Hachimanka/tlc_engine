import type { IconName } from "@/public/icons";

export type InstitutionType = "higher_ed" | "deped" | "tesda" | "training" | null;

export type FeatureStatus = "active" | "planned";

export type FeatureKey =
  | "dashboard"
  | "users"
  | "roles-feature-access"
  | "people-directory"
  | "policies"
  | "reports-exports"
  | "activity-logs"
  | "settings"
  | "higher-departments"
  | "higher-programs"
  | "higher-faculty-load-assignment"
  | "higher-teaching-load-view"
  | "higher-subject-management"
  | "higher-room-schedule-management"
  | "higher-academic-calendar"
  | "higher-grading-gwa"
  | "higher-dean-vpaa-approvals"
  | "higher-adjustment-requests"
  | "higher-compliance"
  | "deped-grade-levels-sections"
  | "deped-shs-tracks"
  | "deped-teacher-load-assignment"
  | "deped-teaching-load-view"
  | "deped-subject-management"
  | "deped-room-management"
  | "deped-department-load"
  | "deped-school-year-calendar"
  | "deped-grading"
  | "deped-adjustment-requests"
  | "deped-compliance"
  | "tesda-qualifications"
  | "tesda-trainers"
  | "tesda-training-batches"
  | "tesda-trainee-records"
  | "tesda-competency-assessment"
  | "tesda-assessment-results"
  | "tesda-training-hours-compliance"
  | "tesda-qualification-completion"
  | "tesda-certificates-reports"
  | "training-courses"
  | "training-facilitators"
  | "training-sessions-batches"
  | "training-participants"
  | "training-attendance"
  | "training-evaluation-assessment"
  | "training-completion-certificates"
  | "training-schedule"
  | "training-analytics-reports";

export type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  description: string;
  group: string;
  institutionType: Exclude<InstitutionType, null> | "common";
  status: FeatureStatus;
  href?: string;
  iconName: IconName;
  adminOnly?: boolean;
};

const commonFeatures: FeatureDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Institution overview, setup status, alerts, and quick actions.",
    group: "Institution Admin",
    institutionType: "common",
    status: "planned",
    iconName: "menu",
  },
  {
    key: "users",
    label: "Users",
    description: "Create accounts for users that belong to the institution.",
    group: "Institution Admin",
    institutionType: "common",
    status: "active",
    href: "/tenant/tenant-admin",
    iconName: "people",
    adminOnly: true,
  },
  {
    key: "roles-feature-access",
    label: "Roles & Feature Access",
    description: "Create roles and assign the features each role can use.",
    group: "Institution Admin",
    institutionType: "common",
    status: "active",
    href: "/tenant/tenant-admin",
    iconName: "shield",
    adminOnly: true,
  },
  {
    key: "people-directory",
    label: "People Directory",
    description: "Manage faculty, teachers, trainers, facilitators, and staff records.",
    group: "Institution Admin",
    institutionType: "common",
    status: "active",
    href: "/tenant/tenant-admin",
    iconName: "files",
    adminOnly: true,
  },
  {
    key: "policies",
    label: "Policies",
    description: "Configure institution rules for calendar, load, workload, and curriculum.",
    group: "Institution Admin",
    institutionType: "common",
    status: "active",
    href: "/tenant/tenant-admin",
    iconName: "file",
    adminOnly: true,
  },
  {
    key: "reports-exports",
    label: "Reports / Exports",
    description: "Generate downloadable reports and exports.",
    group: "Institution Admin",
    institutionType: "common",
    status: "planned",
    iconName: "download",
  },
  {
    key: "activity-logs",
    label: "Activity Logs",
    description: "Review user actions and important system events.",
    group: "Institution Admin",
    institutionType: "common",
    status: "planned",
    iconName: "activityLog",
  },
  {
    key: "settings",
    label: "Settings",
    description: "Manage institution profile, preferences, and system options.",
    group: "Institution Admin",
    institutionType: "common",
    status: "planned",
    iconName: "settings",
  },
];

const higherEducationFeatures: FeatureDefinition[] = [
  {
    key: "higher-departments",
    label: "Colleges / Departments",
    description: "Maintain colleges, departments, heads, and academic units.",
    group: "Higher Education Setup",
    institutionType: "higher_ed",
    status: "planned",
    iconName: "files",
  },
  {
    key: "higher-programs",
    label: "Academic Programs",
    description: "Maintain degree programs, codes, and program durations.",
    group: "Higher Education Setup",
    institutionType: "higher_ed",
    status: "planned",
    iconName: "file",
  },
  {
    key: "higher-faculty-load-assignment",
    label: "Faculty Load Assignment",
    description: "Assign subjects, schedules, and workload to faculty.",
    group: "Load Management",
    institutionType: "higher_ed",
    status: "active",
    href: "/tenant/college/manage-load",
    iconName: "menu",
  },
  {
    key: "higher-teaching-load-view",
    label: "Teaching Load View",
    description: "View assigned teaching load and class schedule details.",
    group: "Load Management",
    institutionType: "higher_ed",
    status: "active",
    href: "/tenant/college/view-teaching-load",
    iconName: "hat",
  },
  {
    key: "higher-subject-management",
    label: "Subject / Course Management",
    description: "Create and review subjects, courses, and curriculum assignments.",
    group: "Academic Operations",
    institutionType: "higher_ed",
    status: "active",
    href: "/tenant/college/manage-subject",
    iconName: "file",
  },
  {
    key: "higher-room-schedule-management",
    label: "Room / Schedule Management",
    description: "Manage rooms, class schedules, and subject-room assignments.",
    group: "Academic Operations",
    institutionType: "higher_ed",
    status: "planned",
    iconName: "menu",
  },
  {
    key: "higher-academic-calendar",
    label: "Academic Calendar",
    description: "Manage semesters, trimesters, grading windows, and deadlines.",
    group: "Academic Policies",
    institutionType: "higher_ed",
    status: "planned",
    iconName: "settings",
  },
  {
    key: "higher-grading-gwa",
    label: "Grading / GWA Setup",
    description: "Configure grading scale, GWA rules, and grade components.",
    group: "Academic Policies",
    institutionType: "higher_ed",
    status: "planned",
    iconName: "analytics",
  },
  {
    key: "higher-dean-vpaa-approvals",
    label: "Dean / VPAA Approvals",
    description: "Review and approve academic loads, subjects, and room assignments.",
    group: "Approvals",
    institutionType: "higher_ed",
    status: "active",
    href: "/tenant/college/dean",
    iconName: "shield",
  },
  {
    key: "higher-adjustment-requests",
    label: "Adjustment Requests",
    description: "Submit and review teaching load or schedule change requests.",
    group: "Approvals",
    institutionType: "higher_ed",
    status: "planned",
    iconName: "flow",
  },
  {
    key: "higher-compliance",
    label: "Compliance Monitoring",
    description: "Track policy violations, overloads, and approval exceptions.",
    group: "Approvals",
    institutionType: "higher_ed",
    status: "planned",
    iconName: "signal",
  },
];

const depedFeatures: FeatureDefinition[] = [
  {
    key: "deped-grade-levels-sections",
    label: "Grade Levels / Sections",
    description: "Maintain Kinder, Elementary, JHS, SHS, and section structure.",
    group: "DepEd Setup",
    institutionType: "deped",
    status: "planned",
    iconName: "files",
  },
  {
    key: "deped-shs-tracks",
    label: "SHS Tracks / Strands",
    description: "Configure STEM, ABM, HUMSS, TVL, Academic, or TechPro tracks.",
    group: "DepEd Setup",
    institutionType: "deped",
    status: "planned",
    iconName: "hat",
  },
  {
    key: "deped-teacher-load-assignment",
    label: "Teacher Load Assignment",
    description: "Assign subjects, schedules, and teaching load to teachers.",
    group: "Load Management",
    institutionType: "deped",
    status: "active",
    href: "/tenant/deped/manage-load",
    iconName: "menu",
  },
  {
    key: "deped-teaching-load-view",
    label: "Teaching Load View",
    description: "View assigned teaching load and class schedule details.",
    group: "Load Management",
    institutionType: "deped",
    status: "active",
    href: "/tenant/deped/view-teaching-load",
    iconName: "hat",
  },
  {
    key: "deped-subject-management",
    label: "Subject Management",
    description: "Create, review, and maintain subjects by grade level.",
    group: "Academic Operations",
    institutionType: "deped",
    status: "active",
    href: "/tenant/deped/manage-subject",
    iconName: "file",
  },
  {
    key: "deped-room-management",
    label: "Room Management",
    description: "Manage rooms, class schedules, and subject-room assignments.",
    group: "Academic Operations",
    institutionType: "deped",
    status: "active",
    href: "/tenant/deped/manage-room",
    iconName: "menu",
  },
  {
    key: "deped-department-load",
    label: "Department Load",
    description: "Review department load summaries and version history.",
    group: "Load Management",
    institutionType: "deped",
    status: "active",
    href: "/tenant/deped/load-admin",
    iconName: "files",
  },
  {
    key: "deped-school-year-calendar",
    label: "School Year / Quarter Calendar",
    description: "Manage quarterly grading periods and grade submission deadlines.",
    group: "DepEd Policies",
    institutionType: "deped",
    status: "planned",
    iconName: "settings",
  },
  {
    key: "deped-grading",
    label: "DepEd Grading Components",
    description: "Configure written works, performance tasks, quarterly assessment, and descriptors.",
    group: "DepEd Policies",
    institutionType: "deped",
    status: "planned",
    iconName: "analytics",
  },
  {
    key: "deped-adjustment-requests",
    label: "Adjustment Requests",
    description: "Submit and review teaching load or schedule change requests.",
    group: "Approvals",
    institutionType: "deped",
    status: "planned",
    iconName: "flow",
  },
  {
    key: "deped-compliance",
    label: "Compliance Monitoring",
    description: "Track workload, teaching hours, and policy compliance.",
    group: "Approvals",
    institutionType: "deped",
    status: "planned",
    iconName: "signal",
  },
];

const tesdaFeatures: FeatureDefinition[] = [
  {
    key: "tesda-qualifications",
    label: "Qualifications / NC Programs",
    description: "Maintain TESDA qualifications, NC levels, durations, and sectors.",
    group: "TESDA Setup",
    institutionType: "tesda",
    status: "planned",
    iconName: "file",
  },
  {
    key: "tesda-trainers",
    label: "Trainers",
    description: "Manage trainer accounts and qualification assignments.",
    group: "TESDA Setup",
    institutionType: "tesda",
    status: "planned",
    iconName: "people",
  },
  {
    key: "tesda-training-batches",
    label: "Training Batches",
    description: "Manage batch schedules, training windows, and deadlines.",
    group: "Training Operations",
    institutionType: "tesda",
    status: "planned",
    iconName: "settings",
  },
  {
    key: "tesda-trainee-records",
    label: "Trainee Records",
    description: "Maintain enrolled trainees and their program details.",
    group: "Training Operations",
    institutionType: "tesda",
    status: "planned",
    iconName: "files",
  },
  {
    key: "tesda-competency-assessment",
    label: "Competency Assessment",
    description: "Configure competency-based assessments and evidence requirements.",
    group: "Assessment",
    institutionType: "tesda",
    status: "planned",
    iconName: "shield",
  },
  {
    key: "tesda-assessment-results",
    label: "Assessment Results",
    description: "Record competent and not yet competent assessment outcomes.",
    group: "Assessment",
    institutionType: "tesda",
    status: "planned",
    iconName: "checkMarked",
  },
  {
    key: "tesda-training-hours-compliance",
    label: "Training Hours Compliance",
    description: "Track program hours against qualification requirements.",
    group: "Compliance",
    institutionType: "tesda",
    status: "planned",
    iconName: "signal",
  },
  {
    key: "tesda-qualification-completion",
    label: "Qualification Completion",
    description: "Monitor trainee completion by qualification and batch.",
    group: "Compliance",
    institutionType: "tesda",
    status: "planned",
    iconName: "analytics",
  },
  {
    key: "tesda-certificates-reports",
    label: "Certificates / Reports",
    description: "Generate certificates, completion records, and TESDA reports.",
    group: "Compliance",
    institutionType: "tesda",
    status: "planned",
    iconName: "download",
  },
];

const trainingFeatures: FeatureDefinition[] = [
  {
    key: "training-courses",
    label: "Training Courses",
    description: "Maintain course titles, categories, and durations.",
    group: "Training Setup",
    institutionType: "training",
    status: "planned",
    iconName: "file",
  },
  {
    key: "training-facilitators",
    label: "Facilitators",
    description: "Manage facilitator accounts and course assignments.",
    group: "Training Setup",
    institutionType: "training",
    status: "planned",
    iconName: "people",
  },
  {
    key: "training-sessions-batches",
    label: "Sessions / Batches",
    description: "Manage training sessions, cohorts, and batch schedules.",
    group: "Training Operations",
    institutionType: "training",
    status: "planned",
    iconName: "settings",
  },
  {
    key: "training-participants",
    label: "Participants",
    description: "Maintain participant records and course enrollment.",
    group: "Training Operations",
    institutionType: "training",
    status: "planned",
    iconName: "files",
  },
  {
    key: "training-attendance",
    label: "Attendance",
    description: "Track session attendance and completion readiness.",
    group: "Training Operations",
    institutionType: "training",
    status: "planned",
    iconName: "checkMarked",
  },
  {
    key: "training-evaluation-assessment",
    label: "Evaluation / Assessment",
    description: "Configure pass/fail, rated, or scored participant evaluations.",
    group: "Assessment",
    institutionType: "training",
    status: "planned",
    iconName: "shield",
  },
  {
    key: "training-completion-certificates",
    label: "Completion / Certificates",
    description: "Issue completion records and participant certificates.",
    group: "Assessment",
    institutionType: "training",
    status: "planned",
    iconName: "download",
  },
  {
    key: "training-schedule",
    label: "Schedule",
    description: "Manage training calendars, facilitators, and room assignments.",
    group: "Training Operations",
    institutionType: "training",
    status: "planned",
    iconName: "menu",
  },
  {
    key: "training-analytics-reports",
    label: "Analytics / Reports",
    description: "Review course performance, attendance, and completion reports.",
    group: "Reports",
    institutionType: "training",
    status: "planned",
    iconName: "analytics",
  },
];

export const allFeatureDefinitions: FeatureDefinition[] = [
  ...commonFeatures,
  ...higherEducationFeatures,
  ...depedFeatures,
  ...tesdaFeatures,
  ...trainingFeatures,
];

export function normalizeInstitutionType(value: unknown): InstitutionType {
  if (
    value === "higher_ed" ||
    value === "deped" ||
    value === "tesda" ||
    value === "training"
  ) {
    return value;
  }

  return null;
}

export function getFeaturesForInstitution(
  institutionType: InstitutionType,
): FeatureDefinition[] {
  const normalizedType = normalizeInstitutionType(institutionType);

  return allFeatureDefinitions.filter(
    (feature) =>
      feature.institutionType === "common" ||
      (normalizedType && feature.institutionType === normalizedType),
  );
}

export function getFeatureByKey(featureKey: string): FeatureDefinition | undefined {
  return allFeatureDefinitions.find((feature) => feature.key === featureKey);
}

export function getFeatureKeysForInstitution(
  institutionType: InstitutionType,
): FeatureKey[] {
  return getFeaturesForInstitution(institutionType).map((feature) => feature.key);
}

export function getDefaultFeatureKeysForRole(
  roleKey: string,
  institutionType: InstitutionType,
): FeatureKey[] {
  const normalizedRole = roleKey.toLowerCase().replace(/_/g, "-");
  const allKeys = getFeatureKeysForInstitution(institutionType);

  if (normalizedRole === "org-admin") {
    return allKeys;
  }

  if (institutionType === "deped") {
    if (normalizedRole.includes("teacher")) {
      return ["deped-teaching-load-view", "deped-adjustment-requests"];
    }

    if (normalizedRole.includes("load-manager") || normalizedRole.includes("department-head")) {
      return [
        "deped-teacher-load-assignment",
        "deped-department-load",
        "deped-teaching-load-view",
      ];
    }

    if (normalizedRole.includes("coordinator") || normalizedRole.includes("subject")) {
      return ["deped-subject-management", "deped-room-management"];
    }

    if (normalizedRole.includes("dean") || normalizedRole.includes("vpaa") || normalizedRole.includes("principal")) {
      return [
        "deped-department-load",
        "deped-teacher-load-assignment",
        "deped-subject-management",
        "deped-room-management",
        "deped-compliance",
      ];
    }
  }

  if (institutionType === "higher_ed") {
    if (normalizedRole.includes("teacher") || normalizedRole.includes("faculty")) {
      return ["higher-teaching-load-view", "higher-adjustment-requests"];
    }

    if (normalizedRole.includes("load-manager") || normalizedRole.includes("department-head")) {
      return [
        "higher-faculty-load-assignment",
        "higher-teaching-load-view",
        "higher-departments",
      ];
    }

    if (normalizedRole.includes("coordinator") || normalizedRole.includes("subject")) {
      return ["higher-subject-management", "higher-room-schedule-management"];
    }

    if (normalizedRole.includes("dean") || normalizedRole.includes("vpaa")) {
      return [
        "higher-dean-vpaa-approvals",
        "higher-faculty-load-assignment",
        "higher-subject-management",
        "higher-compliance",
      ];
    }
  }

  if (institutionType === "tesda") {
    if (normalizedRole.includes("trainer") || normalizedRole.includes("teacher")) {
      return ["tesda-training-batches", "tesda-competency-assessment", "tesda-assessment-results"];
    }

    if (normalizedRole.includes("coordinator") || normalizedRole.includes("manager")) {
      return ["tesda-qualifications", "tesda-training-batches", "tesda-trainee-records"];
    }
  }

  if (institutionType === "training") {
    if (normalizedRole.includes("facilitator") || normalizedRole.includes("teacher")) {
      return ["training-sessions-batches", "training-attendance", "training-evaluation-assessment"];
    }

    if (normalizedRole.includes("coordinator") || normalizedRole.includes("manager")) {
      return ["training-courses", "training-sessions-batches", "training-participants"];
    }
  }

  return [];
}

export function getActiveFeatureHref(
  featureKeys: string[],
  institutionType: InstitutionType,
): string | null {
  const enabled = new Set(featureKeys);
  const feature = getFeaturesForInstitution(institutionType).find(
    (item) =>
      enabled.has(item.key) &&
      item.status === "active" &&
      Boolean(item.href) &&
      !item.adminOnly,
  );

  return feature?.href ?? null;
}
