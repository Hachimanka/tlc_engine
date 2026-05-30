"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import StyledSelect from "@/components/Global/StyledSelect";

export type FacultyAccountOption = {
	id: string;
	name: string;
	email: string;
	department: string;
	employmentType: string;
	specialization: string;
};

export type FacultyFormValues = {
	accountId: string;
	name: string;
	specialization: string;
	employmentType: string;
};

type AddFacultyFormsProps = {
	isOpen: boolean;
	departmentName: string;
	facultyAccounts: FacultyAccountOption[];
	onClose: () => void;
	onSubmit: (values: FacultyFormValues) => void;
};

type FormErrors = {
	accountId?: string;
	employmentType?: string;
};

const employmentTypes = ["Full Time", "Part Time"];

export default function AddFacultyForms({
	isOpen,
	departmentName,
	facultyAccounts,
	onClose,
	onSubmit,
}: AddFacultyFormsProps) {
	const [selectedAccountId, setSelectedAccountId] = useState("");
	const [employmentType, setEmploymentType] = useState("Full Time");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});

	const selectedAccount = useMemo(
		() => facultyAccounts.find((account) => account.id === selectedAccountId) ?? null,
		[facultyAccounts, selectedAccountId],
	);

	const resetForm = useCallback(() => {
		setSelectedAccountId("");
		setEmploymentType("Full Time");
		setIsDropdownOpen(false);
		setErrors({});
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

		if (!selectedAccount) {
			setErrors({ accountId: "Select a faculty account." });
			return;
		}

		if (!employmentType) {
			setErrors({ employmentType: "Select an employment type." });
			return;
		}

		onSubmit({
			accountId: selectedAccount.id,
			name: selectedAccount.name,
			specialization: selectedAccount.specialization,
			employmentType,
		});
		resetForm();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6" onClick={handleClose}>
			<div
				className="flex w-full max-w-2xl flex-col overflow-visible rounded-2xl bg-[var(--color-card)] shadow-2xl"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="rounded-t-2xl bg-[var(--color-primary)] px-5 py-4 text-white">
					<h2 className="text-xl font-semibold">Add Faculty</h2>
					<p className="mt-1 text-sm text-white/80">{departmentName}</p>
				</div>

				<form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
					<div className="grid gap-4 px-5 py-6 sm:grid-cols-2">
						<div className="space-y-2 sm:col-span-2">
							<label className="text-sm font-semibold text-[var(--color-high-emphasis)]" htmlFor="faculty-account-trigger">
								Faculty Account <span className="text-[#f04444]">*</span>
							</label>
							<div className="relative">
								<button
									id="faculty-account-trigger"
									type="button"
									aria-haspopup="listbox"
									aria-expanded={isDropdownOpen}
									onClick={() => setIsDropdownOpen((current) => !current)}
									className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-default)] bg-white px-4 py-3 text-left text-sm text-[var(--color-high-emphasis)] outline-none transition hover:bg-[var(--color-primary-soft)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
								>
									<span className={selectedAccount ? "text-[var(--color-high-emphasis)]" : "text-[var(--color-low-emphasis)]"}>
										{selectedAccount ? selectedAccount.name : `Select ${departmentName} faculty account`}
									</span>
									<svg aria-hidden="true" className={`h-4 w-4 shrink-0 text-[var(--color-low-emphasis)] transition ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
										<path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
									</svg>
								</button>

								{isDropdownOpen ? (
									<div
										role="listbox"
										className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[var(--color-default)] bg-white p-2 shadow-2xl"
									>
										{facultyAccounts.length === 0 ? (
											<div className="px-3 py-4 text-sm text-[var(--color-low-emphasis)]">
												No available faculty accounts in this department.
											</div>
										) : facultyAccounts.map((account) => {
											const isSelected = account.id === selectedAccountId;

											return (
												<button
													key={account.id}
													type="button"
													role="option"
													aria-selected={isSelected}
													onClick={() => {
														setSelectedAccountId(account.id);
														setIsDropdownOpen(false);
														setErrors({});
													}}
													className={`flex w-full rounded-lg px-3 py-3 text-left transition ${
														isSelected ? "bg-[var(--color-primary-muted)]" : "hover:bg-[var(--color-primary-soft)]"
													}`}
												>
													<span className="block">
														<span className="block text-sm font-semibold text-[var(--color-high-emphasis)]">
															{account.name}
														</span>
														<span className="mt-1 block text-xs text-[var(--color-low-emphasis)]">
															{account.email}
														</span>
													</span>
												</button>
											);
										})}
									</div>
								) : null}
							</div>
							{errors.accountId ? <p className="text-xs text-[#f04444]">{errors.accountId}</p> : null}
						</div>

						<div className="space-y-2">
							<label className="text-sm font-semibold text-[var(--color-high-emphasis)]" htmlFor="employment-type">
								Employment Type <span className="text-[#f04444]">*</span>
							</label>
							<StyledSelect
								value={employmentType}
								onChange={(value) => {
									setEmploymentType(value);
									setErrors((current) => ({ ...current, employmentType: undefined }));
								}}
								options={employmentTypes.map((type) => ({ value: type, label: type }))}
								className="[&_button]:min-h-12 [&_button]:py-3"
							/>
							{errors.employmentType ? <p className="text-xs text-[#f04444]">{errors.employmentType}</p> : null}
						</div>

						<div className="space-y-2">
							<label className="text-sm font-semibold text-[var(--color-high-emphasis)]" htmlFor="specialization">
								Specialization
							</label>
							<input
								id="specialization"
								value={selectedAccount?.specialization ?? ""}
								readOnly
								placeholder="Selected automatically"
								className="w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-high-emphasis)] outline-none placeholder:text-[var(--color-low-emphasis)]"
							/>
						</div>
					</div>

					<div className="flex items-center justify-end gap-3 border-t border-[var(--color-default)] px-5 py-5">
						<button
							type="button"
							onClick={handleClose}
							className="rounded-lg border border-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-[var(--color-primary-soft)]"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={facultyAccounts.length === 0}
						>
							Add Faculty
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
