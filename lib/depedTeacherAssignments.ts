type OnboardingConfigRecord = Record<string, unknown>;

const asRecord = (value: unknown): OnboardingConfigRecord => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as OnboardingConfigRecord;
};

const levelOptions = [
  {
    key: "kinder",
    label: "Kindergarten",
    assignment: "Kindergarten",
    detail: "Kinder",
  },
  {
    key: "elementary",
    label: "Elementary",
    assignment: "Elementary",
    detail: "Grades 1-6",
  },
  {
    key: "jhs",
    label: "Junior High School",
    assignment: "Junior High School",
    detail: "Grades 7-10",
  },
  {
    key: "shs",
    label: "Senior High School",
    assignment: "Senior High School",
    detail: "Grades 11-12",
  },
];

export const getDepedTeacherAssignmentOptions = (onboardingConfig: unknown) => {
  const gradeLevels = asRecord(asRecord(onboardingConfig).gradeLevels);

  return levelOptions
    .filter((level) => gradeLevels[level.key] === true)
    .map((level) => level.assignment);
};

export const getDepedSelectedLevelSummary = (onboardingConfig: unknown) => {
  const gradeLevels = asRecord(asRecord(onboardingConfig).gradeLevels);

  return levelOptions
    .filter((level) => gradeLevels[level.key] === true)
    .map((level) => ({
      label: level.label,
      detail: level.detail,
    }));
};

const subjectsByLevel: Record<string, string[]> = {
  kinder: ["Kindergarten Learning Areas"],
  elementary: [
    "English",
    "Filipino",
    "Mathematics",
    "Science",
    "Araling Panlipunan",
    "MAPEH",
    "Edukasyon sa Pagpapakatao",
    "EPP",
  ],
  jhs: [
    "English",
    "Filipino",
    "Mathematics",
    "Science",
    "Araling Panlipunan",
    "MAPEH",
    "TLE",
    "Edukasyon sa Pagpapakatao",
  ],
  shs: [
    "Core Subjects",
    "Applied Subjects",
    "Specialized Subjects",
    "Research",
    "Work Immersion",
  ],
};

export const getDepedSubjectOptions = (onboardingConfig: unknown) => {
  const gradeLevels = asRecord(asRecord(onboardingConfig).gradeLevels);
  const subjects = levelOptions.flatMap((level) =>
    gradeLevels[level.key] === true ? subjectsByLevel[level.key] ?? [] : [],
  );

  return Array.from(new Set(subjects)).sort((left, right) =>
    left.localeCompare(right),
  );
};
