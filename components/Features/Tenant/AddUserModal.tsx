"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import StyledSelect from "@/components/Global/StyledSelect";
import type {
  FeatureDefinition,
  FeatureKey,
} from "@/features/tenant-feature-catalog";

export type RoleOption = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  requiresDepartment?: boolean;
  requires_department?: boolean;
};

export type AddUserPayload = {
  fullName: string;
  recipientEmail: string;
  roleId?: string;
  customRoleName?: string;
  customRoleFeatureKeys?: string[];
  customRoleRequiresDepartment?: boolean;
  department?: string | null;
  departmentId?: string | null;
  teacherMajor?: string | null;
  qualifiedSubjects?: string[];
  preferredSubject?: string | null;
  teacherSetupDetails?: TeacherSetupDetails | null;
};

export type TeacherSetupDetails = {
  gradeLevelAssignment?: string;
  gradeYearLevel?: string;
  section?: string;
  teacherRole?: string;
  subjectDomainTrack?: string;
  teachingLoad?: string;
  workload?: string;
  adviserStatus?: string;
  learningDomain?: string;
  curricularTheme?: string;
  track?: string;
  strand?: string;
  subjectType?: string;
};

export type CreatedUser = {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string | null;
  department?: string | null;
  departmentId?: string | null;
  teacherMajor?: string | null;
  qualifiedSubjects?: string[];
  preferredSubject?: string | null;
  teacherSetupDetails?: TeacherSetupDetails | null;
  roleId: string;
  roleKey: string;
  roleName: string;
  description: string;
};

export type AddUserResult = {
  tempPassword: string;
  user: CreatedUser;
  emailSentTo: string;
  loginUrl?: string | null;
};

export type DepartmentOption = {
  id: string;
  name: string;
  code?: string | null;
  collegeId?: string | null;
};

type AddUserModalProps = {
  isOpen: boolean;
  roles: RoleOption[];
  features: FeatureDefinition[];
  departments?: DepartmentOption[];
  assignmentLabel?: string;
  assignmentPlaceholder?: string;
  assignmentHint?: string;
  assignmentOptions?: string[];
  assignmentRequiredError?: string;
  showTeacherProfileFields?: boolean;
  subjectOptions?: string[];
  emailDomain?: string | null;
  onClose: () => void;
  onCreate: (payload: AddUserPayload) => Promise<AddUserResult>;
};

const gradeLevelAssignments = [
  "Kindergarten",
  "Elementary",
  "Junior High School",
  "Senior High School",
];

const elementaryGrades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
const juniorHighGrades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];
const seniorHighGrades = ["Grade 11", "Grade 12"];
const learningDomains = [
  "Language, Literacy and Communication",
  "Mathematics",
  "Physical Health and Motor Development",
  "Aesthetic / Creative Development",
  "Socio-Emotional Development",
  "Understanding the Physical and Natural Environment",
];
const curricularThemes = [
  "Myself",
  "My Family",
  "My School",
  "My Community",
  "More Things Around Me",
];
const elementarySubjects = [
  "English",
  "Filipino",
  "Mathematics",
  "Science",
  "Araling Panlipunan",
  "MAPEH",
  "Edukasyon sa Pagpapakatao",
  "EPP",
];
const juniorHighSubjects = [
  "English",
  "Filipino",
  "Mathematics",
  "Science",
  "Araling Panlipunan",
  "MAPEH",
  "TLE",
  "Edukasyon sa Pagpapakatao",
];
const shsTracks = ["Academic", "Technical-Vocational-Livelihood", "Sports", "Arts and Design"];
const shsStrands = ["STEM", "ABM", "HUMSS", "GAS", "TVL", "Sports", "Arts and Design"];
const shsSubjectTypes = ["Core", "Applied", "Specialized", "Work Immersion"];
const shsSubjects = [
  "Oral Communication",
  "Reading and Writing",
  "General Mathematics",
  "Statistics and Probability",
  "Earth and Life Science",
  "Practical Research",
  "Empowerment Technologies",
  "Work Immersion",
];

const emptyTeacherSetupDetails: TeacherSetupDetails = {
  gradeLevelAssignment: "",
  gradeYearLevel: "",
  section: "",
  teacherRole: "",
  subjectDomainTrack: "",
  teachingLoad: "",
  workload: "",
  adviserStatus: "No",
  learningDomain: "",
  curricularTheme: "",
  track: "",
  strand: "",
  subjectType: "",
};

const compactTeacherSetupDetails = (details: TeacherSetupDetails) => {
  const normalizedEntries = Object.entries(details)
    .map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "",
    ])
    .filter(([, value]) => value);

  return normalizedEntries.length > 0
    ? (Object.fromEntries(normalizedEntries) as TeacherSetupDetails)
    : null;
};

export const isTeacherRoleOption = (role?: Pick<RoleOption, "key" | "name"> | null) => {
  const key = role?.key?.toLowerCase() ?? "";
  const name = role?.name?.toLowerCase() ?? "";

  return key === "teacher" || name.includes("teacher");
};

const textInputClass =
  "h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]";

export function TeacherSetupDetailsSection({
  value,
  onChange,
  employeeIdPreview,
}: {
  value: TeacherSetupDetails;
  onChange: (nextValue: TeacherSetupDetails) => void;
  employeeIdPreview?: string | null;
}) {
  const updateField = (key: keyof TeacherSetupDetails, nextValue: string) => {
    const resetByAssignment =
      key === "gradeLevelAssignment"
        ? {
            gradeYearLevel: "",
            learningDomain: "",
            curricularTheme: "",
            subjectDomainTrack: "",
            track: "",
            strand: "",
            subjectType: "",
          }
        : {};

    onChange({
      ...value,
      ...resetByAssignment,
      [key]: nextValue,
    });
  };

  const assignment = value.gradeLevelAssignment ?? "";
  const gradeOptions =
    assignment === "Elementary"
      ? elementaryGrades
      : assignment === "Junior High School"
      ? juniorHighGrades
      : assignment === "Senior High School"
      ? seniorHighGrades
      : [];
  const subjectOptions =
    assignment === "Elementary"
      ? elementarySubjects
      : assignment === "Junior High School"
      ? juniorHighSubjects
      : assignment === "Senior High School"
      ? shsSubjects
      : [];

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--color-high-emphasis)]">
          Teacher Setup Details
        </h3>
        <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
          Fields adjust based on the selected grade level assignment.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">Employee ID</label>
          <input
            value={employeeIdPreview || "Generated after account creation"}
            readOnly
            className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[#475467] outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">
            Grade Level Assignment
          </label>
          <StyledSelect
            value={assignment}
            onChange={(nextValue) => updateField("gradeLevelAssignment", nextValue)}
            options={[
              { value: "", label: "Select grade level assignment" },
              ...gradeLevelAssignments.map((option) => ({ value: option, label: option })),
            ]}
          />
        </div>
      </div>

      {assignment === "Kindergarten" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#344054]">Learning Domain</label>
            <StyledSelect
              value={value.learningDomain ?? ""}
              onChange={(nextValue) => updateField("learningDomain", nextValue)}
              options={[
                { value: "", label: "Select learning domain" },
                ...learningDomains.map((option) => ({ value: option, label: option })),
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#344054]">Curricular Theme</label>
            <StyledSelect
              value={value.curricularTheme ?? ""}
              onChange={(nextValue) => updateField("curricularTheme", nextValue)}
              options={[
                { value: "", label: "Select curricular theme" },
                ...curricularThemes.map((option) => ({ value: option, label: option })),
              ]}
            />
          </div>
        </div>
      ) : null}

      {gradeOptions.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#344054]">Grade / Year Level</label>
            <StyledSelect
              value={value.gradeYearLevel ?? ""}
              onChange={(nextValue) => updateField("gradeYearLevel", nextValue)}
              options={[
                { value: "", label: "Select grade / year level" },
                ...gradeOptions.map((option) => ({ value: option, label: option })),
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#344054]">
              {assignment === "Senior High School" ? "SHS Subject" : "Subject"}
            </label>
            <StyledSelect
              value={value.subjectDomainTrack ?? ""}
              onChange={(nextValue) => updateField("subjectDomainTrack", nextValue)}
              options={[
                { value: "", label: "Select subject" },
                ...subjectOptions.map((option) => ({ value: option, label: option })),
              ]}
            />
          </div>
        </div>
      ) : null}

      {assignment === "Senior High School" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#344054]">Track</label>
            <StyledSelect
              value={value.track ?? ""}
              onChange={(nextValue) => updateField("track", nextValue)}
              options={[
                { value: "", label: "Select track" },
                ...shsTracks.map((option) => ({ value: option, label: option })),
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#344054]">Strand</label>
            <StyledSelect
              value={value.strand ?? ""}
              onChange={(nextValue) => updateField("strand", nextValue)}
              options={[
                { value: "", label: "Select strand" },
                ...shsStrands.map((option) => ({ value: option, label: option })),
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#344054]">Subject Type</label>
            <StyledSelect
              value={value.subjectType ?? ""}
              onChange={(nextValue) => updateField("subjectType", nextValue)}
              options={[
                { value: "", label: "Select type" },
                ...shsSubjectTypes.map((option) => ({ value: option, label: option })),
              ]}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">Section</label>
          <input
            value={value.section ?? ""}
            onChange={(event) => updateField("section", event.target.value)}
            placeholder="e.g., Sampaguita"
            className={textInputClass}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">Teacher Role</label>
          <StyledSelect
            value={value.teacherRole ?? ""}
            onChange={(nextValue) => updateField("teacherRole", nextValue)}
            options={[
              { value: "", label: "Select teacher role" },
              { value: "Subject Teacher", label: "Subject Teacher" },
              { value: "Class Adviser", label: "Class Adviser" },
              { value: "Coordinator", label: "Coordinator" },
              { value: "Lead Teacher", label: "Lead Teacher" },
            ]}
          />
        </div>
      </div>

      {assignment === "Kindergarten" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">
            Subject / Domain / Track
          </label>
          <input
            value={value.subjectDomainTrack ?? ""}
            onChange={(event) => updateField("subjectDomainTrack", event.target.value)}
            placeholder="e.g., Language, Literacy and Communication"
            className={textInputClass}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">Teaching Load</label>
          <input
            value={value.teachingLoad ?? ""}
            onChange={(event) => updateField("teachingLoad", event.target.value)}
            placeholder="e.g., 6 classes"
            className={textInputClass}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">Workload</label>
          <input
            value={value.workload ?? ""}
            onChange={(event) => updateField("workload", event.target.value)}
            placeholder="e.g., 30 hrs/week"
            className={textInputClass}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#344054]">Adviser Status</label>
          <StyledSelect
            value={value.adviserStatus ?? "No"}
            onChange={(nextValue) => updateField("adviserStatus", nextValue)}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

const normalizeNamePart = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

const getEmailPreview = (fullName: string, emailDomain?: string | null) => {
  const domain = emailDomain || "institution.edu";
  const parts = fullName
    .trim()
    .split(/\s+/)
    .map(normalizeNamePart)
    .filter(Boolean);

  if (parts.length === 0) {
    return `name@${domain}`;
  }

  if (parts.length === 1) {
    return `${parts[0]}@${domain}`;
  }

  return `${parts[0]}.${parts[parts.length - 1]}@${domain}`;
};

const customRoleValue = "__custom_role__";

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const groupFeatures = (features: FeatureDefinition[]) => {
  const groups = features.reduce<Record<string, FeatureDefinition[]>>((currentGroups, feature) => {
    currentGroups[feature.group] = [
      ...(currentGroups[feature.group] ?? []),
      feature,
    ];
    return currentGroups;
  }, {});

  for (const group of Object.keys(groups)) {
    groups[group] = groups[group].sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === "active" ? -1 : 1;
      }

      if (Boolean(left.adminOnly) !== Boolean(right.adminOnly)) {
        return left.adminOnly ? 1 : -1;
      }

      return left.label.localeCompare(right.label);
    });
  }

  return groups;
};

export default function AddUserModal({
  isOpen,
  roles,
  features,
  departments = [],
  assignmentLabel = "Department",
  assignmentPlaceholder = "e.g., Computer Engineering",
  assignmentHint,
  showTeacherProfileFields = false,
  subjectOptions = [],
  emailDomain,
  onClose,
  onCreate,
}: AddUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleFeatureKeys, setCustomRoleFeatureKeys] = useState<string[]>([]);
  const [customRoleRequiresDepartment, setCustomRoleRequiresDepartment] = useState(false);
  const [department, setDepartment] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [teacherMajor, setTeacherMajor] = useState("");
  const [qualifiedSubjects, setQualifiedSubjects] = useState<string[]>([]);
  const [preferredSubject, setPreferredSubject] = useState("");
  const [teacherSetupDetails, setTeacherSetupDetails] =
    useState<TeacherSetupDetails>(emptyTeacherSetupDetails);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<AddUserResult | null>(null);

  const roleOptions = useMemo(() => roles, [roles]);
  const selectedRole = useMemo(
    () => roleOptions.find((role) => role.id === roleId) ?? null,
    [roleId, roleOptions],
  );
  const isCustomRole = roleId === customRoleValue;
  const selectedRoleLabel = isCustomRole
    ? "Custom role"
    : selectedRole?.name ?? "Select a role";
  const selectedRoleRequiresDepartment = Boolean(
    selectedRole?.requiresDepartment ?? selectedRole?.requires_department,
  );
  const showTeacherSetupDetails =
    showTeacherProfileFields && !isCustomRole && isTeacherRoleOption(selectedRole);
  const departmentIsRequired = isCustomRole
    ? customRoleRequiresDepartment
    : selectedRoleRequiresDepartment;
  const hasManagedDepartments = departments.length > 0;
  const assignableFeatures = useMemo(
    () =>
      features.filter(
        (feature) => feature.status === "active" && !feature.adminOnly,
      ),
    [features],
  );
  const groupedFeatures = useMemo(
    () => groupFeatures(assignableFeatures),
    [assignableFeatures],
  );
  const generatedEmailPreview = useMemo(
    () => getEmailPreview(fullName, emailDomain),
    [emailDomain, fullName],
  );
  const teacherGradeLevelAssignment = teacherSetupDetails.gradeLevelAssignment?.trim() ?? "";

  const resetForm = useCallback(() => {
    setFullName("");
    setRecipientEmail("");
    setRoleId("");
    setCustomRoleName("");
    setCustomRoleFeatureKeys([]);
    setCustomRoleRequiresDepartment(false);
    setDepartment("");
    setDepartmentId("");
    setTeacherMajor("");
    setQualifiedSubjects([]);
    setPreferredSubject("");
    setTeacherSetupDetails(emptyTeacherSetupDetails);
    setIsRoleMenuOpen(false);
    setError("");
    setIsSubmitting(false);
    setSuccess(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, resetForm]);

  if (!isOpen) {
    return null;
  }

  const canSubmit = Boolean(
    fullName.trim() &&
      (isCustomRole
        ? customRoleName.trim() && customRoleFeatureKeys.length > 0
        : roleId) &&
      isValidEmail(recipientEmail) &&
      (!departmentIsRequired ||
        (showTeacherSetupDetails
          ? teacherGradeLevelAssignment
          : hasManagedDepartments
          ? departmentId
          : department.trim())),
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(
        !isValidEmail(recipientEmail)
          ? "Enter a valid recipient email."
          : showTeacherSetupDetails && departmentIsRequired && !teacherGradeLevelAssignment
          ? "Grade Level Assignment is required for teacher accounts."
          : departmentIsRequired && hasManagedDepartments && !departmentId
          ? "Department is required for this role."
          : departmentIsRequired && !department.trim()
          ? "Department is required for this role."
          : isCustomRole && customRoleFeatureKeys.length === 0
          ? "Select at least one feature for this custom role."
          : "Please complete all required fields.",
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await onCreate({
        fullName: fullName.trim(),
        recipientEmail: recipientEmail.trim(),
        roleId: isCustomRole ? undefined : roleId,
        customRoleName: isCustomRole
          ? customRoleName.trim().replace(/\s+/g, " ")
          : undefined,
        customRoleFeatureKeys: isCustomRole ? customRoleFeatureKeys : undefined,
        customRoleRequiresDepartment: isCustomRole
          ? customRoleRequiresDepartment
          : undefined,
        department: showTeacherSetupDetails
          ? teacherGradeLevelAssignment
          : hasManagedDepartments
          ? null
          : department.trim()
          ? department.trim().replace(/\s+/g, " ")
          : null,
        departmentId: showTeacherSetupDetails
          ? undefined
          : hasManagedDepartments
          ? departmentId || null
          : undefined,
        teacherMajor: showTeacherSetupDetails
          ? teacherMajor.trim().replace(/\s+/g, " ") || null
          : undefined,
        qualifiedSubjects: showTeacherSetupDetails ? qualifiedSubjects : undefined,
        preferredSubject: showTeacherSetupDetails
          ? preferredSubject.trim().replace(/\s+/g, " ") || null
          : undefined,
        teacherSetupDetails: showTeacherSetupDetails
          ? compactTeacherSetupDetails(teacherSetupDetails)
          : undefined,
      });
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRoleChange = (nextRoleId: string) => {
    setRoleId(nextRoleId);
    setIsRoleMenuOpen(false);

    if (nextRoleId !== customRoleValue) {
      setCustomRoleName("");
      setCustomRoleFeatureKeys([]);
      setCustomRoleRequiresDepartment(false);
    }

    const nextRole = roleOptions.find((role) => role.id === nextRoleId) ?? null;
    if (!isTeacherRoleOption(nextRole)) {
      setTeacherSetupDetails(emptyTeacherSetupDetails);
    }
  };

  const handleFeatureToggle = (featureKey: FeatureKey, enabled: boolean) => {
    setCustomRoleFeatureKeys((current) => {
      if (enabled) {
        return Array.from(new Set([...current, featureKey]));
      }

      return current.filter((key) => key !== featureKey);
    });
  };

  const handleQualifiedSubjectToggle = (subject: string, enabled: boolean) => {
    setQualifiedSubjects((current) => {
      if (enabled) {
        return Array.from(new Set([...current, subject]));
      }

      return current.filter((item) => item !== subject);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className={`w-full overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)] ${
          isCustomRole ? "max-w-[760px]" : "max-w-[520px]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[var(--color-primary)] px-6 py-5">
          <h2 id="add-user-title" className="text-xl font-semibold text-white">
            Add Account
          </h2>
        </div>

        {success ? (
          <div className="space-y-4 px-6 py-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-high-emphasis)]">
                Account created
              </h3>
              <p className="mt-1 text-sm text-[var(--color-low-emphasis)]">
                Login details were emailed to {success.emailSentTo}.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  User
                </div>
                <div className="text-sm font-semibold text-[var(--color-high-emphasis)]">
                  {success.user.fullName}
                </div>
                <div className="text-xs text-[var(--color-low-emphasis)]">
                  {success.user.email} - {success.user.roleName}
                </div>
                {success.user.department ? (
                  <div className="text-xs text-[var(--color-low-emphasis)]">
                    {assignmentLabel}: {success.user.department}
                  </div>
                ) : null}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  Emailed To
                </div>
                <div className="mt-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[var(--color-high-emphasis)]">
                  {success.emailSentTo}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  Temporary Password
                </div>
                <div className="mt-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">
                  {success.tempPassword}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-[var(--color-default)] px-4 py-2 text-xs font-semibold text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
              >
                Add another account
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(100vh-9rem)] space-y-5 overflow-y-auto px-6 py-6"
          >
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="full-name" className="text-sm font-medium text-[#344054]">
                Full Name
              </label>
              <input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g., Maria Santos"
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="generated-email" className="text-sm font-medium text-[#344054]">
                Generated Email
              </label>
              <input
                id="generated-email"
                type="email"
                value={generatedEmailPreview}
                readOnly
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-3 text-sm text-[#475467] outline-none"
              />
              <p className="text-xs text-[var(--color-low-emphasis)]">
                The final email is generated from the full name and made unique if needed.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="recipient-email" className="text-sm font-medium text-[#344054]">
                Recipient Email <span className="text-[var(--color-primary)]">*</span>
              </label>
              <input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                placeholder="e.g., maria.santos@gmail.com"
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              />
              <p className="text-xs text-[var(--color-low-emphasis)]">
                Login credentials will be sent here. This email is not stored on the account.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="generated-employee-id" className="text-sm font-medium text-[#344054]">
                Generated Employee ID
              </label>
              <input
                id="generated-employee-id"
                value={`${new Date().getFullYear().toString().slice(-2)}-####-###`}
                readOnly
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-3 text-sm text-[#475467] outline-none"
              />
              <p className="text-xs text-[var(--color-low-emphasis)]">
                Format follows YY-####-###, for example 23-0001-001.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-[#344054]">
                Role
              </label>
              <div className="relative">
                <button
                  id="role"
                  type="button"
                  onClick={() => setIsRoleMenuOpen((current) => !current)}
                  className="flex h-11 w-full items-center justify-between rounded-lg border border-[#d0d5dd] bg-white px-3 text-left text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                  aria-haspopup="listbox"
                  aria-expanded={isRoleMenuOpen}
                >
                  <span>{selectedRoleLabel}</span>
                  <span className="text-xs text-[var(--color-low-emphasis)]">v</span>
                </button>

                {isRoleMenuOpen ? (
                  <div
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#d0d5dd] bg-white py-1 shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                    role="listbox"
                    aria-label="Role options"
                  >
                    <button
                      type="button"
                      onClick={() => handleRoleChange(customRoleValue)}
                      className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-[#ecf8f6] ${
                        isCustomRole
                          ? "font-semibold text-[var(--color-primary)]"
                          : "text-[var(--color-high-emphasis)]"
                      }`}
                      role="option"
                      aria-selected={isCustomRole}
                    >
                      Custom role
                    </button>
                    {roleOptions.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleChange(role.id)}
                        className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-[#ecf8f6] ${
                          role.id === roleId
                            ? "font-semibold text-[var(--color-primary)]"
                            : "text-[var(--color-high-emphasis)]"
                        }`}
                        role="option"
                        aria-selected={role.id === roleId}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {isCustomRole ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="custom-role-name" className="text-sm font-medium text-[#344054]">
                    Custom Role Name
                  </label>
                  <input
                    id="custom-role-name"
                    value={customRoleName}
                    onChange={(event) => setCustomRoleName(event.target.value)}
                    placeholder="e.g., Laboratory Coordinator"
                    className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-3">
                  <input
                    type="checkbox"
                    checked={customRoleRequiresDepartment}
                    onChange={(event) =>
                      setCustomRoleRequiresDepartment(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-[#cfd5dd] text-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[var(--color-high-emphasis)]">
                      Requires department
                    </span>
                      <span className="mt-1 block text-xs text-[var(--color-low-emphasis)]">
                      Turn this on when every account with this custom role must have a required assignment.
                      </span>
                  </span>
                </label>

                <div className="space-y-4 rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-4">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-high-emphasis)]">
                      Initial Feature Access
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
                      Select at least one available feature so this account can enter the workspace after login.
                    </p>
                  </div>

                  {assignableFeatures.length === 0 ? (
                    <div className="rounded-md border border-[var(--color-default)] bg-white px-3 py-4 text-sm text-[var(--color-low-emphasis)]">
                      No assignable features are available for this institution yet.
                    </div>
                  ) : null}

                  {Object.entries(groupedFeatures).map(([group, groupItems]) => (
                    <fieldset key={group} className="space-y-2">
                      <legend className="text-xs font-bold uppercase tracking-wide text-[var(--color-low-emphasis)]">
                        {group}
                      </legend>
                      <div className="grid gap-2 md:grid-cols-2">
                        {groupItems.map((feature) => {
                          const isSelected = customRoleFeatureKeys.includes(feature.key);

                          return (
                            <label
                              key={feature.key}
                              className={`grid cursor-pointer grid-cols-[18px_1fr] gap-3 rounded-md border px-3 py-2 text-sm transition ${
                                isSelected
                                  ? "border-[var(--color-primary)] bg-[#ecf8f6]"
                                  : "border-[var(--color-default)] bg-white hover:bg-[#ecf8f6]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(event) =>
                                  handleFeatureToggle(feature.key, event.target.checked)
                                }
                                className="sr-only"
                              />
                              <span
                                className={`mt-1 flex h-4 w-4 items-center justify-center rounded border ${
                                  isSelected
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                                    : "border-[#cfd5dd] bg-white"
                                }`}
                                aria-hidden="true"
                              >
                                {isSelected ? (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                ) : null}
                              </span>
                              <span>
                                <span className="font-semibold text-[var(--color-high-emphasis)]">
                                  {feature.label}
                                </span>
                                <span className="mt-0.5 block text-xs leading-5 text-[var(--color-low-emphasis)]">
                                  {feature.description}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </>
            ) : null}

            {!showTeacherSetupDetails ? (
            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-medium text-[#344054]">
                {assignmentLabel}
                {departmentIsRequired ? (
                  <span className="ml-1 text-[var(--color-primary)]">*</span>
                ) : null}
              </label>
              {hasManagedDepartments ? (
                <StyledSelect
                  value={departmentId}
                  onChange={setDepartmentId}
                  options={[
                    {
                      value: "",
                      label: departmentIsRequired ? "Select a department" : "No department",
                    },
                    ...departments.map((departmentOption) => ({
                      value: departmentOption.id,
                      label: departmentOption.code
                        ? `${departmentOption.code} - ${departmentOption.name}`
                        : departmentOption.name,
                    })),
                  ]}
                />
              ) : (
                <input
                  id="department"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  placeholder={assignmentPlaceholder}
                  className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                />
              )}
              <p className="text-xs text-[var(--color-low-emphasis)]">
                {departmentIsRequired
                  ? `Required because the selected role needs a ${assignmentLabel.toLowerCase()}.`
                  : assignmentHint ?? `Optional. Leave blank if this account is not assigned to a ${assignmentLabel.toLowerCase()}.`}
              </p>
            </div>
            ) : null}

            {showTeacherSetupDetails ? (
              <TeacherSetupDetailsSection
                value={teacherSetupDetails}
                onChange={setTeacherSetupDetails}
              />
            ) : null}

            {showTeacherSetupDetails ? (
              <div className="space-y-4 rounded-lg border border-[var(--color-default)] bg-[#f8fafc] p-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-high-emphasis)]">
                    Teacher Qualification
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-low-emphasis)]">
                    Major is used as the primary match. Can-teach subjects are allowed secondary assignments.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="teacher-major" className="text-sm font-medium text-[#344054]">
                      Major / Specialization
                    </label>
                    <input
                      id="teacher-major"
                      value={teacherMajor}
                      onChange={(event) => {
                        setTeacherMajor(event.target.value);
                        if (!preferredSubject) {
                          setPreferredSubject(event.target.value);
                        }
                      }}
                      placeholder="e.g., Science"
                      className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="preferred-subject" className="text-sm font-medium text-[#344054]">
                      Preferred Subject
                    </label>
                    <input
                      id="preferred-subject"
                      value={preferredSubject}
                      onChange={(event) => setPreferredSubject(event.target.value)}
                      placeholder="e.g., Science"
                      className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
                    />
                  </div>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-[#344054]">
                    Can Teach Subjects
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {subjectOptions.map((subject) => {
                      const isSelected = qualifiedSubjects.includes(subject);

                      return (
                        <label
                          key={subject}
                          className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                            isSelected
                              ? "border-[var(--color-primary)] bg-[#ecf8f6] text-[var(--color-primary)]"
                              : "border-[var(--color-default)] bg-white text-[var(--color-high-emphasis)] hover:bg-[#ecf8f6]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) =>
                              handleQualifiedSubjectToggle(subject, event.target.checked)
                            }
                            className="h-4 w-4 rounded border-[#cfd5dd] text-[var(--color-primary)]"
                          />
                          <span className="font-medium">{subject}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-[var(--color-default)] px-4 py-2 text-xs font-semibold text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
