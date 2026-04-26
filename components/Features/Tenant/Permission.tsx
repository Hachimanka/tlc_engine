"use client";

export type PermissionId =
  | "view-faculty"
  | "add-faculty"
  | "assign-subject-teachers"
  | "manage-subject-teachers"
  | "view-teaching-load"
  | "export-teaching-load"
  | "send-requests"
  | "restore-version-history"
  | "view-departments"
  | "add-department"
  | "view-subjects"
  | "add-subject"
  | "view-rooms"
  | "add-rooms"
  | "assign-rooms-subjects"
  | "approve-subjects"
  | "approve-load"
  | "approve-room-assignments";

export type PermissionValues = Record<PermissionId, boolean>;

type PermissionItem = {
  id: PermissionId;
  label: string;
  description: string;
};

type PermissionGroup = {
  title: string;
  items: PermissionItem[];
};

type PermissionRoleUser = {
  idNo: string;
  fullName: string;
  role: string;
  description: string;
};

type PermissionProps = {
  selectedRoleUser: PermissionRoleUser | null;
  permissions: PermissionValues;
  onPermissionChange: (permissionId: PermissionId, checked: boolean) => void;
  onSave: () => void;
};

export const permissionGroups: PermissionGroup[] = [
  {
    title: "Manage Load",
    items: [
      {
        id: "view-faculty",
        label: "View Faculty",
        description: "Allows the user to see faculty records and assigned teaching load details.",
      },
      {
        id: "add-faculty",
        label: "Add Faculty",
        description: "Allows the user to add faculty members to department load management.",
      },
      {
        id: "assign-subject-teachers",
        label: "Assign Subject to Teachers",
        description: "Allows the user to assign subjects and schedules to available teachers.",
      },
      {
        id: "manage-subject-teachers",
        label: "Manage Subject Teacher Assignments",
        description: "Allows the user to update or remove teacher subject assignments.",
      },
    ],
  },
  {
    title: "View Teaching Load",
    items: [
      {
        id: "view-teaching-load",
        label: "View Teaching Load",
        description: "Allows the user to review assigned teaching loads and class schedules.",
      },
      {
        id: "export-teaching-load",
        label: "Export Teaching Load",
        description: "Allows the user to generate printable or exportable teaching load records.",
      },
      {
        id: "send-requests",
        label: "Send Requests",
        description: "Allows the user to submit load adjustment or schedule change requests.",
      },
    ],
  },
  {
    title: "Department Load",
    items: [
      {
        id: "restore-version-history",
        label: "Restore Version History",
        description: "Allows the user to restore previous department load assignment versions.",
      },
      {
        id: "view-departments",
        label: "View Departments Table",
        description: "Allows the user to view department lists, heads, and load summaries.",
      },
      {
        id: "add-department",
        label: "Add Department",
        description: "Allows the user to create department records for load administration.",
      },
    ],
  },
  {
    title: "Manage Subjects",
    items: [
      {
        id: "view-subjects",
        label: "View Subjects Table",
        description: "Allows the user to view subject records, status, and assigned departments.",
      },
      {
        id: "add-subject",
        label: "Add Subject",
        description: "Allows the user to create new subject records for review or approval.",
      },
    ],
  },
  {
    title: "Manage Rooms",
    items: [
      {
        id: "view-rooms",
        label: "View Rooms Table",
        description: "Allows the user to view rooms, capacity, status, and room assignments.",
      },
      {
        id: "add-rooms",
        label: "Add Rooms",
        description: "Allows the user to add rooms and update available teaching spaces.",
      },
      {
        id: "assign-rooms-subjects",
        label: "Assign Rooms to Subjects",
        description: "Allows the user to connect subjects with rooms and class schedules.",
      },
    ],
  },
  {
    title: "Approvals",
    items: [
      {
        id: "approve-subjects",
        label: "Approve Subjects",
        description: "Allows the user to approve or reject submitted subject records.",
      },
      {
        id: "approve-load",
        label: "Approve Load",
        description: "Allows the user to approve teaching load assignments before release.",
      },
      {
        id: "approve-room-assignments",
        label: "Approve Room Assignments",
        description: "Allows the user to approve room assignments connected to subjects.",
      },
    ],
  },
];

const allPermissionIds = permissionGroups.flatMap((group) =>
  group.items.map((item) => item.id),
);

const createPermissionValues = (enabledIds: PermissionId[] = []): PermissionValues => {
  const enabled = new Set(enabledIds);

  return allPermissionIds.reduce((values, permissionId) => {
    values[permissionId] = enabled.has(permissionId);
    return values;
  }, {} as PermissionValues);
};

export function createDefaultPermissions(role: string): PermissionValues {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole.includes("dean")) {
    return createPermissionValues([
      "view-faculty",
      "view-teaching-load",
      "add-faculty",
      "assign-subject-teachers",
      "restore-version-history",
      "view-departments",
      "view-subjects",
      "add-subject",
      "view-rooms",
      "add-rooms",
      "assign-rooms-subjects",
      "approve-subjects",
      "approve-load",
      "approve-room-assignments",
    ]);
  }

  if (normalizedRole.includes("vpaa")) {
    return createPermissionValues([
      "view-teaching-load",
      "export-teaching-load",
      "view-subjects",
      "approve-subjects",
      "approve-load",
      "approve-room-assignments",
    ]);
  }

  if (normalizedRole.includes("department head")) {
    return createPermissionValues([
      "view-faculty",
      "add-faculty",
      "assign-subject-teachers",
      "view-teaching-load",
      "restore-version-history",
      "view-departments",
      "view-subjects",
      "view-rooms",
    ]);
  }

  if (normalizedRole.includes("coordinator")) {
    return createPermissionValues([
      "view-teaching-load",
      "send-requests",
      "view-subjects",
      "add-subject",
      "view-rooms",
      "assign-rooms-subjects",
    ]);
  }

  if (normalizedRole.includes("teacher")) {
    return createPermissionValues([
      "view-teaching-load",
      "export-teaching-load",
      "send-requests",
    ]);
  }

  return createPermissionValues();
}

export default function Permission({
  selectedRoleUser,
  permissions,
  onPermissionChange,
  onSave,
}: PermissionProps) {
  if (!selectedRoleUser) {
    return (
      <section className="flex h-full min-h-[360px] flex-1 items-center justify-center rounded-lg bg-white px-6 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold text-[var(--color-high-emphasis)]">
            Select a role
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-low-emphasis)]">
            Choose a role from the list to manage the user permissions and feature access for that account.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-[520px] flex-1 flex-col rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
      <div className="px-6 pb-4 pt-5">
        <h2 className="text-xl font-bold text-[var(--color-high-emphasis)]">
          Permissions from &lt;{selectedRoleUser.fullName}&gt;
        </h2>
        <p className="mt-2 text-sm text-[var(--color-low-emphasis)]">
          {selectedRoleUser.description}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
        <div className="space-y-6">
          {permissionGroups.map((group) => (
            <fieldset key={group.title} className="space-y-3">
              <legend className="text-sm font-bold text-[var(--color-high-emphasis)]">
                {group.title}
              </legend>

              <div className="space-y-4">
                {group.items.map((item) => {
                  const isChecked = permissions[item.id] ?? false;

                  return (
                    <label
                      key={item.id}
                      className="grid cursor-pointer grid-cols-[18px_1fr] gap-3"
                    >
                      <span className="relative mt-1 flex h-4 w-4 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) =>
                            onPermissionChange(item.id, event.target.checked)
                          }
                          className="peer h-4 w-4 cursor-pointer rounded-[4px] border border-[#cfd5dd] bg-[#cfd5dd] checked:border-[var(--color-primary)] checked:bg-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                        />
                        <svg
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                          className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
                          fill="none"
                        >
                          <path
                            d="M3.5 8.2 6.5 11 12.5 5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[var(--color-high-emphasis)]">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--color-low-emphasis)]">
                          {item.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-[var(--color-default)] px-5 py-4">
        <button
          type="button"
          onClick={onSave}
          className="rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        >
          Save Role Permissions
        </button>
      </div>
    </section>
  );
}
