"use client";

import { useCallback, useEffect, useState } from "react";
import SubjectTable from "@/components/Features/Deped/manage-subject/components/SubjectTable";
import SubjectManagementForm, {
  type SubjectFormValues,
} from "@/components/Features/Deped/manage-subject/components/SubjectManagementForm";
import { type SubjectRow } from "@/components/Features/Deped/manage-subject/components/SubjectTable";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";
import { supabase } from "@/lib/supabaseClient";

type DepedSubjectsPayload = {
  subjects?: SubjectRow[];
  subject?: SubjectRow;
  error?: string;
};

const parseDurationMinutes = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

export default function TenantPage() {
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>([]);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAccessToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token ?? "";
  };

  const loadSubjects = useCallback(async () => {
    setLoadError("");

    const token = await getAccessToken();

    if (!token) {
      setLoadError("Your session expired. Please log in again.");
      return;
    }

    const response = await fetch("/api/tenant/deped/subjects", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload: DepedSubjectsPayload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setLoadError(payload.error || "Unable to load DepEd subjects.");
      return;
    }

    setSubjectRows(payload.subjects ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSubjects();
  }, [loadSubjects]);

  const handleCreateSubject = async (values: SubjectFormValues) => {
    setSubmitError("");

    const token = await getAccessToken();

    if (!token) {
      setSubmitError("Your session expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/tenant/deped/subjects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subjectTitle: values.subjectTitle,
        department: values.department,
        yearLevel: values.yearLevel,
        classDurationMinutes: parseDurationMinutes(values.classDuration),
        dateCreated: values.dateCreated,
        description: values.description,
      }),
    });
    const payload: DepedSubjectsPayload = await response.json().catch(() => ({}));
    setIsSubmitting(false);

    if (!response.ok || !payload.subject) {
      setSubmitError(payload.error || "Unable to create DepEd subject.");
      return;
    }

    setSubjectRows((currentRows) => [payload.subject as SubjectRow, ...currentRows]);
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
          onClose={() => {
            setSubmitError("");
            setIsCreateSubjectOpen(false);
          }}
          onSubmit={handleCreateSubject}
          submitError={submitError}
          isSubmitting={isSubmitting}
        />

        <div className="mx-auto w-full max-w-none space-y-4">
          <div>
            <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
              Subject Management
            </h1>
          </div>

          {loadError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          ) : null}

          <SubjectTable
            subjectRows={subjectRows}
            onCreateSubjectClick={() => {
              setSubmitError("");
              setIsCreateSubjectOpen(true);
            }}
          />
        </div>
      </TenantRoleLayout>
  );
}
