import {
  getAssignableFeatureKeysForInstitution,
  getFeatureKeysForInstitution,
  normalizeInstitutionType,
  type FeatureKey,
  type InstitutionType,
} from "@/features/tenant-feature-catalog";

export type SystemRoleDefinition = {
  key: string;
  name: string;
  description: string;
  featureKeys: FeatureKey[];
};

const orgAdminRole: SystemRoleDefinition = {
  key: "org_admin",
  name: "Org Admin",
  description: "Full access to manage institution settings and users.",
  featureKeys: [],
};

const depedSystemRoles: SystemRoleDefinition[] = [
  orgAdminRole,
  {
    key: "school_head",
    name: "School Head / Principal",
    description: "Oversees school load planning, academic operations, and approvals.",
    featureKeys: [
      "deped-teacher-load-assignment",
      "deped-department-load",
      "deped-subject-management",
      "deped-room-management",
      "deped-teaching-load-view",
    ],
  },
  {
    key: "load_admin",
    name: "Load Admin",
    description: "Manages teacher load assignments and department load summaries.",
    featureKeys: [
      "deped-teacher-load-assignment",
      "deped-department-load",
      "deped-teaching-load-view",
    ],
  },
  {
    key: "department_head",
    name: "Department Head",
    description: "Manages department teacher loads and reviews assignments.",
    featureKeys: [
      "deped-teacher-load-assignment",
      "deped-department-load",
      "deped-teaching-load-view",
    ],
  },
  {
    key: "subject_room_manager",
    name: "Subject & Room Manager",
    description: "Manages subjects, rooms, and schedule assignments.",
    featureKeys: ["deped-subject-management", "deped-room-management"],
  },
  {
    key: "teacher",
    name: "Teacher",
    description: "Views assigned teaching load and class schedule details.",
    featureKeys: ["deped-teaching-load-view"],
  },
];

const higherEdSystemRoles: SystemRoleDefinition[] = [
  orgAdminRole,
  {
    key: "vpaa",
    name: "VPAA",
    description: "Reviews final academic approvals and monitors teaching load schedules.",
    featureKeys: [
      "higher-dean-vpaa-approvals",
      "higher-teaching-load-view",
    ],
  },
  {
    key: "dean",
    name: "Dean",
    description: "Oversees college load planning and academic operations.",
    featureKeys: [
      "higher-dean-vpaa-approvals",
      "higher-faculty-load-assignment",
      "higher-subject-management",
      "higher-room-schedule-management",
    ],
  },
  {
    key: "department_head",
    name: "Department Head / Program Chair",
    description: "Manages program faculty loads and reviews teaching schedules.",
    featureKeys: [
      "higher-faculty-load-assignment",
      "higher-teaching-load-view",
    ],
  },
  {
    key: "subject_manager",
    name: "Subject Manager",
    description: "Creates subjects and submits them for academic approval.",
    featureKeys: ["higher-subject-management"],
  },
  {
    key: "room_manager",
    name: "Room Manager",
    description: "Creates rooms and assigns approved subjects to room schedules.",
    featureKeys: ["higher-room-schedule-management"],
  },
  {
    key: "load_manager",
    name: "Load Manager",
    description: "Assigns faculty teaching load and reviews assigned schedules.",
    featureKeys: [
      "higher-faculty-load-assignment",
      "higher-teaching-load-view",
    ],
  },
  {
    key: "faculty",
    name: "Faculty",
    description: "Views assigned teaching load and class schedule details.",
    featureKeys: ["higher-teaching-load-view"],
  },
];

const legacyRoleTargets: Partial<
  Record<Exclude<InstitutionType, null>, Record<string, string>>
> = {
  deped: {
    dean: "school_head",
    vpaa: "school_head",
    principal: "school_head",
    coordinator: "subject_room_manager",
    load_manager: "load_admin",
    department_head: "department_head",
    teacher: "teacher",
    faculty: "teacher",
  },
  higher_ed: {
    teacher: "faculty",
    department_head: "department_head",
    dean: "dean",
    vpaa: "vpaa",
    load_manager: "load_manager",
  },
};

export function normalizeRoleKey(value: string) {
  return value.toLowerCase().trim().replace(/-/g, "_");
}

export const departmentRequiredRoleKeys = new Set([
  "faculty",
  "teacher",
  "department_head",
  "load_manager",
  "subject_room_manager",
  "load_admin",
]);

export function isDepartmentRequiredRole(roleKey?: string | null) {
  if (!roleKey) {
    return false;
  }

  return departmentRequiredRoleKeys.has(normalizeRoleKey(roleKey));
}

export function getBootstrapSystemRoleDefinitions(): SystemRoleDefinition[] {
  return [orgAdminRole];
}

export function getSystemRoleDefinitionsForInstitution(
  institutionType: InstitutionType,
): SystemRoleDefinition[] {
  const normalizedType = normalizeInstitutionType(institutionType);

  if (normalizedType === "deped") {
    return depedSystemRoles;
  }

  if (normalizedType === "higher_ed") {
    return higherEdSystemRoles;
  }

  return getBootstrapSystemRoleDefinitions();
}

export function getLegacySystemRoleTargetKey(
  roleKey: string,
  institutionType: InstitutionType,
): string | null {
  const normalizedType = normalizeInstitutionType(institutionType);
  const normalizedRole = normalizeRoleKey(roleKey);

  if (!normalizedType) {
    return null;
  }

  return legacyRoleTargets[normalizedType]?.[normalizedRole] ?? null;
}

export function getDefaultFeatureKeysForRole(
  roleKey: string,
  institutionType: InstitutionType,
): FeatureKey[] {
  const normalizedRole = normalizeRoleKey(roleKey);

  if (normalizedRole === "org_admin") {
    return getFeatureKeysForInstitution(institutionType);
  }

  const roleDefinition = getSystemRoleDefinitionsForInstitution(
    institutionType,
  ).find((role) => role.key === normalizedRole);

  if (!roleDefinition) {
    return [];
  }

  const assignableKeys = new Set(
    getAssignableFeatureKeysForInstitution(institutionType),
  );

  return roleDefinition.featureKeys.filter((key) => assignableKeys.has(key));
}
