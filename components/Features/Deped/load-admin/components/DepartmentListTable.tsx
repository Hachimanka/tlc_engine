"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
};

export default function DepartmentFacultyTable() {
  const [departmentRows, setDepartmentRows] = useState<DepartmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [departmentHeadOptions, setDepartmentHeadOptions] = useState<DepartmentHeadOption[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentHeadUserId, setDepartmentHeadUserId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
                  </tr>
                ))
              ) : loadError ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-10 text-center text-body-small font-semibold text-red-700"
                  >
                    {loadError}
                  </td>
                </tr>
              ) : departmentRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-10 text-center text-body-small font-semibold text-[var(--color-low-emphasis)]"
                  >
                    No departments yet. Add a department to start tracking load.
                  </td>
                </tr>
              ) : (
                departmentRows.map((dept) => (
                  <tr
                    key={dept.id}
                    className="group cursor-pointer transition-colors hover:bg-[var(--color-default)]/35"
                  >
                    <td className="p-0" colSpan={2}>
                      <Link
                        href={{
                          pathname: `/tenant/deped/load-admin/facultytable/${dept.id}`,
                          query: { departmentName: dept.departmentName },
                        }}
                        className="grid w-full grid-cols-2 px-4 py-3 no-underline"
                      >
                        <span className="text-body-small font-semibold text-[var(--color-high-emphasis)]">
                          {dept.departmentName}
                        </span>
                        <span className="text-body-small text-[var(--color-low-emphasis)]">
                          {dept.departmentHead || "Unassigned"}
                        </span>
                      </Link>
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
                <select
                  value={departmentHeadUserId}
                  onChange={(event) => setDepartmentHeadUserId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[color:var(--color-default)] px-3 py-2 text-body-small outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  disabled={isSaving}
                >
                  <option value="">Unassigned</option>
                  {departmentHeadOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.roleName}
                    </option>
                  ))}
                </select>
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
    </>
  );
}
