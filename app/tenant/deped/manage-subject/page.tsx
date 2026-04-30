"use client";

import { useState } from "react";
import SubjectTable from "@/components/Features/Deped/manage-subject/components/SubjectTable";
import SubjectManagementForm, {
  type SubjectFormValues,
} from "@/components/Features/Deped/manage-subject/components/SubjectManagementForm";
import { initialSubjectRows, type SubjectRow } from "@/components/Features/Deped/manage-subject/components/SubjectTable";
import Navbar from "@/components/Global/HeaderTenant";
import Sidebar from "@/components/Features/sidebar";
import { getFeatureSidebarItems } from "@/features.config";

const sidebarItems = getFeatureSidebarItems("Deped", "subject-room-manager");

export default function TenantPage() {
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>(initialSubjectRows);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  const handleCreateSubject = (values: SubjectFormValues) => {
    setSubjectRows((currentRows) => [
      {
        id: `sub-${Date.now()}`,
        subjectTitle: values.subjectTitle,
        department: values.department,
        yearLevel: values.yearLevel,
        classDuration: values.classDuration,
        dateCreated: new Date().toLocaleDateString("en-US"),
        status: "Pending",
        description: values.description,
      },
      ...currentRows,
    ]);
    setIsCreateSubjectOpen(false);
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
    <SubjectManagementForm
      isOpen={isCreateSubjectOpen}
      onClose={() => setIsCreateSubjectOpen(false)}
      onSubmit={handleCreateSubject}
    />

      <Navbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar title="Deped Menu" items={sidebarItems} />

        <section className="min-w-0 flex-1 overflow-y-auto px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8">
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
        </section>
      </div>
    </main>
  )
}
