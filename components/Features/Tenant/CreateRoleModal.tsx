"use client";

import { ChevronDown, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { tenantEmployees } from "./employeeData";

export type CreatedRole = {
  idNo: string;
  fullName: string;
  schoolEmail: string;
  role: string;
  description: string;
};

type CreateRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateRole: (role: CreatedRole) => void;
};

export default function CreateRoleModal({
  isOpen,
  onClose,
  onCreateRole,
}: CreateRoleModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isEmployeePickerOpen, setIsEmployeePickerOpen] = useState(false);

  const selectedEmployee = useMemo(
    () => tenantEmployees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [selectedEmployeeId],
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = employeeSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return tenantEmployees;
    }

    return tenantEmployees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(normalizedSearch) ||
        employee.id.toLowerCase().includes(normalizedSearch) ||
        employee.email.toLowerCase().includes(normalizedSearch) ||
        employee.department.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [employeeSearch]);

  const canCreate = Boolean(selectedEmployee && roleName.trim());

  const resetForm = useCallback(() => {
    setSelectedEmployeeId("");
    setRoleName("");
    setEmployeeSearch("");
    setIsEmployeePickerOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setEmployeeSearch("");
    setIsEmployeePickerOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedEmployee || !roleName.trim()) {
      return;
    }

    onCreateRole({
      idNo: selectedEmployee.id,
      fullName: selectedEmployee.name,
      schoolEmail: selectedEmployee.email,
      role: roleName.trim(),
      description: "Custom tenant role assignment",
    });

    resetForm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[458px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-role-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[var(--color-primary)] px-6 py-5">
          <h2 id="create-role-title" className="text-xl font-semibold text-white">
            Create Role
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <label id="employee-picker-label" className="text-sm font-medium text-[#344054]">
              Select Employee
            </label>
            <div className="relative" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                aria-labelledby="employee-picker-label"
                aria-expanded={isEmployeePickerOpen}
                aria-haspopup="listbox"
                onClick={() => setIsEmployeePickerOpen((current) => !current)}
                className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#d0d5dd] bg-white px-3 text-left text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              >
                <span className={selectedEmployee ? "truncate" : "truncate text-[#8f8f8f]"}>
                  {selectedEmployee ? selectedEmployee.name : "Select employee"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--color-high-emphasis)] transition ${
                    isEmployeePickerOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isEmployeePickerOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[120] overflow-hidden rounded-lg border border-[#d0d5dd] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]">
                  <label className="flex h-11 items-center gap-2 border-b border-[#eef1f4] px-3">
                    <Search className="h-4 w-4 shrink-0 text-[var(--color-low-emphasis)]" aria-hidden="true" />
                    <span className="sr-only">Search employees</span>
                    <input
                      value={employeeSearch}
                      onChange={(event) => setEmployeeSearch(event.target.value)}
                      placeholder="Search name, ID, email, or department"
                      autoFocus
                      className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f]"
                    />
                  </label>

                  <div className="max-h-56 overflow-y-auto py-1" role="listbox" aria-labelledby="employee-picker-label">
                    {filteredEmployees.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-[var(--color-low-emphasis)]">
                        No employees found.
                      </div>
                    ) : (
                      filteredEmployees.map((employee) => {
                        const isSelected = selectedEmployeeId === employee.id;

                        return (
                          <button
                            key={employee.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelectEmployee(employee.id)}
                            className={`w-full px-3 py-2.5 text-left transition hover:bg-[#ecf8f6] focus:bg-[#ecf8f6] focus:outline-none ${
                              isSelected ? "bg-[#dff3f1]" : ""
                            }`}
                          >
                            <span className="block text-sm font-semibold text-[var(--color-high-emphasis)]">
                              {employee.name}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-[var(--color-low-emphasis)]">
                              {employee.id} | {employee.email} | {employee.department}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {isEmployeePickerOpen ? (
            <button
              type="button"
              aria-label="Close employee picker"
              className="fixed inset-0 z-[110] cursor-default bg-transparent"
              onClick={() => setIsEmployeePickerOpen(false)}
              tabIndex={-1}
            />
          ) : null}

          <div className="space-y-2">
            <label htmlFor="role-name" className="text-sm font-medium text-[#344054]">
              Role Name
            </label>
            <input
              id="role-name"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              placeholder="e.g., Load Manager"
              className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[#8f8f8f] transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="school-email" className="text-sm font-medium text-[#344054]">
              School Email
            </label>
            <input
              id="school-email"
              value={selectedEmployee?.email ?? ""}
              placeholder="Select an employee first"
              disabled
              className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f2f4f7] px-3 text-sm text-[#667085] outline-none placeholder:text-[#a8afb9] disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="id-number" className="text-sm font-medium text-[#344054]">
              ID Number
            </label>
            <input
              id="id-number"
              value={selectedEmployee?.id ?? ""}
              placeholder="Select an employee first"
              disabled
              className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f2f4f7] px-3 text-sm text-[#667085] outline-none placeholder:text-[#a8afb9] disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="h-11 rounded-lg border border-[#d0d5dd] bg-white px-4 text-base font-medium text-[#344054] transition hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canCreate}
              className="h-11 rounded-lg bg-[var(--color-primary)] px-4 text-base font-medium text-white transition hover:bg-[var(--color-light-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#c9ced6] disabled:text-white"
            >
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
