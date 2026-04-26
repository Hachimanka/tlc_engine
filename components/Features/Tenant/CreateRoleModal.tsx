"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Employee = {
  idNo: string;
  fullName: string;
  schoolEmail: string;
};

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

const employees: Employee[] = [
  {
    idNo: "TLC-2015",
    fullName: "Isabella Grace Tan",
    schoolEmail: "isabella.tan@tlc.edu",
  },
  {
    idNo: "TLC-2016",
    fullName: "Nathaniel Cruz",
    schoolEmail: "nathaniel.cruz@tlc.edu",
  },
  {
    idNo: "TLC-2017",
    fullName: "Camille Fernandez",
    schoolEmail: "camille.fernandez@tlc.edu",
  },
  {
    idNo: "TLC-2018",
    fullName: "Gabriel Mendoza",
    schoolEmail: "gabriel.mendoza@tlc.edu",
  },
];

export default function CreateRoleModal({
  isOpen,
  onClose,
  onCreateRole,
}: CreateRoleModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [roleName, setRoleName] = useState("");

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.idNo === selectedEmployeeId) ?? null,
    [selectedEmployeeId],
  );

  const canCreate = Boolean(selectedEmployee && roleName.trim());

  const resetForm = useCallback(() => {
    setSelectedEmployeeId("");
    setRoleName("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

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
      idNo: selectedEmployee.idNo,
      fullName: selectedEmployee.fullName,
      schoolEmail: selectedEmployee.schoolEmail,
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
            <label htmlFor="employee" className="text-sm font-medium text-[#344054]">
              Select Employee
            </label>
            <div className="relative">
              <select
                id="employee"
                value={selectedEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-[#d0d5dd] bg-white px-3 pr-10 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.idNo} value={employee.idNo}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-high-emphasis)]"
                aria-hidden="true"
              />
            </div>
          </div>

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
              value={selectedEmployee?.schoolEmail ?? ""}
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
              value={selectedEmployee?.idNo ?? ""}
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
