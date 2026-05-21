"use client";

import { useState } from "react";
import SubjectTable from "@/components/Features/Deped/manage-subject/components/SubjectTable";
import SubjectManagementForm, {
  type SubjectFormValues,
} from "@/components/Features/Deped/manage-subject/components/SubjectManagementForm";
import { type SubjectRow } from "@/components/Features/Deped/manage-subject/components/SubjectTable";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";

export default function TenantPage() {
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>([]);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  const handleCreateSubject = (values: SubjectFormValues) => {
    setSubjectRows((currentRows) => [
      {
        id: `sub-${Date.now()}`,
        subjectTitle: values.subjectTitle,
        department: values.department,
        yearLevel: values.yearLevel,
        classDuration: values.classDuration,
        dateCreated: values.dateCreated,
        status: "Pending",
        description: values.description,
      },
      ...currentRows,
    ]);
    setIsCreateSubjectOpen(false);
  };

  return (
    <TenantRoleLayout
      tenantType="Deped"
      role="subject-room-manager"
      title="Deped Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="deped-subject-management"
      contentClassName="px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8"
    >
      <SubjectManagementForm
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        onSubmit={handleCreateSubject}
      />

      <div className="mx-auto w-full max-w-none space-y-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
            Subject Management
          </h1>
        </div>

        <SubjectTable
          subjectRows={subjectRows}
          onCreateSubjectClick={() => setIsCreateSubjectOpen(true)}
        />
      </div>
    </TenantRoleLayout>
  );
}
