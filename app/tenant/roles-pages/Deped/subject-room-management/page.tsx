"use client";

import { useState } from "react";
import SubjectTable from "@/components/roles/Deped/subject-room-management/components/SubjectTable";
import SubjectManagementForm, {
  type SubjectFormValues,
} from "@/components/roles/Deped/subject-room-management/components/SubjectManagementForm";
import { initialSubjectRows, type SubjectRow } from "@/components/roles/Deped/subject-room-management/components/SubjectTable";
import Navbar from "@/components/Global/HeaderTenant";
import Sidebar, { type RoleSidebarItem } from "@/components/roles/sidebar";
import { ICON_SVGS } from "@/public/icons";

const sidebarItems: RoleSidebarItem[] = [
  {
    href: "/tenant/roles-pages/Deped/subject-room-management",
    label: "Subject Management",
    icon: ICON_SVGS.menu,
  },
  {
    href: "/tenant/roles-pages/Deped/subject-room-management/room",
    label: "Room Management",
    icon: ICON_SVGS.menu,
  },
  {
    href: "#",
    label: "Settings",
    icon: ICON_SVGS.settings,
  },

];

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