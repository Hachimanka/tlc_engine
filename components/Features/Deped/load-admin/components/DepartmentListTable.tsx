"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StyledSelect from "@/components/Global/StyledSelect";
import { supabase } from "@/lib/supabaseClient";

type DepartmentRow = {
  id: string;
  departmentName: string;
  departmentHead: string;
  departmentHeadUserId?: string;
};

type DepartmentHeadOption = {
  id: string;
  name: string;
  email: string;
  roleName: string;
  department: string;
  departmentId: string;
};

const normalizeDepartmentName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s+department$/, "");

export default function DepartmentFacultyTable() {
  const router = useRouter();
  const [departmentRows, setDepartmentRows] = useState<DepartmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [departmentHeadOptions, setDepartmentHeadOptions] = useState<DepartmentHeadOption[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentHeadUserId, setDepartmentHeadUserId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentRow | null>(null);
  const [editHeadUserId, setEditHeadUserId] = useState("");
  const [editError, setEditError] = useState("");
  const [isUpdatingHead, setIsUpdatingHead] = useState(false);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState("");

  const loadDepartments = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setDepartmentRows([]);
      setDepartmentHeadOptions([]);
      setLoadError("Please sign in again to load departments.");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/tenant/deped/departments", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setDepartmentRows([]);
      setDepartmentHeadOptions([]);
      setLoadError(payload.error || "Failed to load departments.");
      setIsLoading(false);
      return;
    }

    setDepartmentRows(payload.departments ?? []);
    setDepartmentHeadOptions(payload.departmentHeadOptions ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadDepartments);
  }, [loadDepartments]);

  const resetForm = () => {
    setDepartmentName("");
    setDepartmentHeadUserId("");
    setSaveError("");
  };

  const getHeadOptionsForDepartment = (department: DepartmentRow) =>
    departmentHeadOptions.filter(
      (user) =>
        user.departmentId === department.id ||
        normalizeDepartmentName(user.department) ===
          normalizeDepartmentName(department.departmentName) ||
        user.id === department.departmentHeadUserId,
    );

  const openEditDepartmentHead = (department: DepartmentRow) => {
    setEditingDepartment(department);
    setEditHeadUserId(department.departmentHeadUserId ?? "");
    setEditError("");
  };

  const closeEditDepartmentHead = () => {
    setEditingDepartment(null);
    setEditHeadUserId("");
    setEditError("");
  };

  const handleAddDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError("");

    const trimmedName = departmentName.trim();

    if (!trimmedName) {
      setSaveError("Department name is required.");
      return;
    }

    setIsSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setSaveError("Please sign in again to add a department.");
      setIsSaving(false);
      return;
    }

    const response = await fetch("/api/tenant/deped/departments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        departmentName: trimmedName,
        departmentHeadUserId,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSaveError(payload.error || "Failed to add department.");
      setIsSaving(false);
      return;
    }

    setDepartmentRows(payload.departments ?? []);
    setDepartmentHeadOptions(payload.departmentHeadOptions ?? []);
    setIsSaving(false);
    setIsAddDepartmentOpen(false);
    resetForm();
  };

  const handleUpdateDepartmentHead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingDepartment) {
      return;
    }

    setEditError("");
    setIsUpdatingHead(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setEditError("Please sign in again to update the department head.");
      setIsUpdatingHead(false);
      return;
    }

    const response = await fetch("/api/tenant/deped/departments", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        departmentId: editingDepartment.id,
        departmentHeadUserId: editHeadUserId,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setEditError(payload.error || "Failed to update department head.");
      setIsUpdatingHead(false);
      return;
    }

    setDepartmentRows(payload.departments ?? []);
    setDepartmentHeadOptions(payload.departmentHeadOptions ?? []);
    setIsUpdatingHead(false);
    closeEditDepartmentHead();
  };

  const handleDeleteDepartment = async (department: DepartmentRow) => {
    const confirmed = window.confirm(
      `Delete ${department.departmentName}? Teachers assigned to this department will be unassigned.`,
    );

    if (!confirmed) {
      return;
    }

    setLoadError("");
    setDeletingDepartmentId(department.id);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setLoadError("Please sign in again to delete the department.");
      setDeletingDepartmentId("");
      return;
    }

    const response = await fetch("/api/tenant/deped/departments", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        departmentId: department.id,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setLoadError(payload.error || "Failed to delete department.");
      setDeletingDepartmentId("");
      return;
    }

    setDepartmentRows(payload.departments ?? []);
    setDepartmentHeadOptions(payload.departmentHeadOptions ?? []);
    setDeletingDepartmentId("");
  };

  const openDepartmentFaculty = (department: DepartmentRow) => {
    const params = new URLSearchParams({ departmentName: department.departmentName });
    router.push(`/tenant/deped/load-admin/facultytable/${department.id}?${params.toString()}`);
  };

  return (
    <>
      <div className="overflow-hidden rounded-[18px] border border-[color:var(--color-default)] bg-[var(--color-card)] shadow-level-1">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--color-default)] px-4 py-3 sm:px-5">
          <div>
            <h1 className="text-2xl text-[var(--color-high-emphasis)]">
              Departments Overview
            </h1>
            <p className="mt-1 text-body-small text-[var(--color-low-emphasis)]">
              Click a row to view specific department details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAddDepartmentOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-label-button text-white shadow-level-1 transition hover:bg-[var(--color-light-primary)]"
          >
            <span className="text-base leading-none">+</span>
            Add Department
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                  Department Name
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                  Department Head in Charge
                </th>
                <th className="bg-[var(--color-primary)] px-4 py-4 text-label-table-header text-white">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-default)] bg-white">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`department-skeleton-${index}`}>
                    <td className="px-4 py-4">
                      <div className="h-4 w-44 animate-pulse rounded-full bg-[var(--color-default)]/50" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-56 animate-pulse rounded-full bg-[var(--color-default)]/50" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-9 w-20 animate-pulse rounded-lg bg-[var(--color-default)]/50" />
                    </td>
                  </tr>
                ))
              ) : loadError ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-10 text-center text-body-small font-semibold text-red-700"
                  >
                    {loadError}
                  </td>
                </tr>
              ) : departmentRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-10 text-center text-body-small font-semibold text-[var(--color-low-emphasis)]"
                  >
                    No departments yet. Add a department to start tracking load.
                  </td>
                </tr>
              ) : (
                departmentRows.map((dept) => (
                  <tr
                    key={dept.id}
                    tabIndex={0}
                    onClick={() => openDepartmentFaculty(dept)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDepartmentFaculty(dept);
                      }
                    }}
                    className="group cursor-pointer transition-colors hover:bg-[var(--color-default)]/35 focus-within:bg-[var(--color-default)]/35 focus:outline-none"
                  >
                    <td className="px-4 py-3 text-body-small font-semibold text-[var(--color-high-emphasis)] group-hover:text-[var(--color-primary)]">
                        {dept.departmentName}
                    </td>
                    <td className="px-4 py-3 text-body-small text-[var(--color-low-emphasis)]">
                      {dept.departmentHead || "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditDepartmentHead(dept);
                        }}
                        className="inline-flex min-h-10 items-center rounded-lg border border-[color:var(--color-default)] px-4 py-2 text-label-button text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
                      >
                        Edit
                      </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteDepartment(dept);
                          }}
                          disabled={deletingDepartmentId === dept.id}
                          className="inline-flex min-h-10 items-center rounded-lg border border-red-200 px-4 py-2 text-label-button text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingDepartmentId === dept.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddDepartmentOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-department-title"
        >
          <form
            onSubmit={handleAddDepartment}
            className="w-full max-w-lg overflow-hidden rounded-[18px] bg-white shadow-level-3"
          >
            <div className="bg-[var(--color-primary)] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="add-department-title" className="text-xl font-semibold">
                    Add Department
                  </h2>
                  <p className="mt-1 text-sm text-white/85">
                    Create a department for load assignment.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close add department modal"
                  onClick={() => {
                    setIsAddDepartmentOpen(false);
                    resetForm();
                  }}
                  className="rounded-md px-2 py-1 text-2xl leading-none text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              {saveError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {saveError}
                </div>
              ) : null}

              <label className="block">
                <span className="text-sm font-semibold text-[var(--color-high-emphasis)]">
                  Department Name
                </span>
                <input
                  value={departmentName}
                  onChange={(event) => setDepartmentName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[color:var(--color-default)] px-3 py-2 text-body-small outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  placeholder="e.g., Mathematics Department"
                  disabled={isSaving}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--color-high-emphasis)]">
                  Department Head in Charge
                </span>
                <StyledSelect
                  value={departmentHeadUserId}
                  onChange={setDepartmentHeadUserId}
                  options={departmentHeadOptions.map((user) => ({
                    value: user.id,
                    label: `${user.name} - ${user.roleName}`,
                  }))}
                  placeholder="Unassigned"
                  disabled={isSaving}
                  className="mt-2"
                  ariaLabel="Department Head in Charge"
                  clearable
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-[color:var(--color-default)] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddDepartmentOpen(false);
                  resetForm();
                }}
                disabled={isSaving}
                className="rounded-lg border border-[var(--color-primary)] px-4 py-2 text-label-button text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-label-button text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Adding..." : "Add Department"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {editingDepartment ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-department-head-title"
        >
          <form
            onSubmit={handleUpdateDepartmentHead}
            className="w-full max-w-lg overflow-hidden rounded-[18px] bg-white shadow-level-3"
          >
            <div className="bg-[var(--color-primary)] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="edit-department-head-title" className="text-xl font-semibold">
                    Assign Department Head
                  </h2>
                  <p className="mt-1 text-sm text-white/85">
                    {editingDepartment.departmentName}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close assign department head modal"
                  onClick={closeEditDepartmentHead}
                  className="rounded-md px-2 py-1 text-2xl leading-none text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              {editError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {editError}
                </div>
              ) : null}

              <label className="block">
                <span className="text-sm font-semibold text-[var(--color-high-emphasis)]">
                  Department Head in Charge
                </span>
                <StyledSelect
                  value={editHeadUserId}
                  onChange={setEditHeadUserId}
                  options={getHeadOptionsForDepartment(editingDepartment).map((user) => ({
                    value: user.id,
                    label: `${user.name} - ${user.roleName}`,
                  }))}
                  placeholder="Unassigned"
                  disabled={isUpdatingHead}
                  className="mt-2"
                  ariaLabel="Department Head in Charge"
                  clearable
                />
              </label>

              {getHeadOptionsForDepartment(editingDepartment).length === 0 ? (
                <p className="text-sm text-[var(--color-low-emphasis)]">
                  No faculty members are assigned to this department yet.
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-[color:var(--color-default)] px-5 py-4">
              <button
                type="button"
                onClick={closeEditDepartmentHead}
                disabled={isUpdatingHead}
                className="rounded-lg border border-[var(--color-primary)] px-4 py-2 text-label-button text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingHead}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-label-button text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingHead ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
