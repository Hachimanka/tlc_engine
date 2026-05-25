"use client";

import { useEffect, useState, type ReactElement } from "react";
import Image from "next/image";
import { CalendarDays, ChevronDown, Clock3 } from "lucide-react";
import StyledSelect from "@/components/Global/StyledSelect";
import { supabase } from "@/lib/supabaseClient";
import { AppIcon } from "@/public/icons";

type RequestDemoModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

const initialFormData = {
	fullName: "",
	emailAddress: "",
	institutionName: "",
	rolePosition: "",
	institutionSize: "",
	preferredDemoDate: "",
	preferredDemoTime: "",
	message: "",
};

const roleOptions = [
	{ value: "", label: "Select Options..." },
	{ value: "administrator", label: "Administrator" },
	{ value: "faculty", label: "Faculty" },
	{ value: "staff", label: "Staff" },
	{ value: "it", label: "IT" },
	{ value: "other", label: "Other" },
];

const institutionSizeOptions = [
	{ value: "", label: "Select Options..." },
	{ value: "small", label: "Small (< 1,000)" },
	{ value: "medium", label: "Medium (1,000 - 10,000)" },
	{ value: "large", label: "Large (10,000 - 50,000)" },
	{ value: "xlarge", label: "Extra Large (> 50,000)" },
];

const dateTimeInputClass =
	"h-14 w-full rounded-xl border border-[#cfe7e3] bg-white pl-14 pr-11 text-sm font-semibold text-[var(--color-high-emphasis)] shadow-level-1 outline-none transition group-hover:border-[var(--color-light-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.16)] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

const modalScrollClass =
	"max-h-[90vh] overflow-y-auto [scrollbar-color:var(--color-secondary)_#eef8f6] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#eef8f6] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#eef8f6] [&::-webkit-scrollbar-thumb]:bg-[var(--color-secondary)] [&::-webkit-scrollbar-thumb:hover]:bg-[var(--color-primary)]";

const formatSelectedDate = (value: string) => {
	if (!value) {
		return "Choose the date that works best";
	}

	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(year, month - 1, day);

	return date.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

const formatSelectedTime = (value: string) => {
	if (!value) {
		return "Choose your preferred time";
	}

	const [hourValue, minuteValue] = value.split(":").map(Number);
	const date = new Date();
	date.setHours(hourValue, minuteValue, 0, 0);

	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
};

type DateTimeFieldProps = {
	id: "preferredDemoDate" | "preferredDemoTime";
	name: "preferredDemoDate" | "preferredDemoTime";
	label: string;
	type: "date" | "time";
	value: string;
	icon: typeof CalendarDays;
	helperText: string;
	selectedLabel: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function DateTimeField({
	id,
	name,
	label,
	type,
	value,
	icon: Icon,
	helperText,
	selectedLabel,
	onChange,
}: DateTimeFieldProps) {
	return (
		<div className="space-y-2">
			<label htmlFor={id} className="text-label-input text-[#364153]">
				{label}
			</label>
			<div className="group rounded-2xl border border-[#dce8e5] bg-[#f6fbfa] p-2 shadow-level-1 transition focus-within:border-[var(--color-primary)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[rgba(0,107,95,0.08)]">
				<div className="relative">
					<span className="pointer-events-none absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-[#e0f4f1] text-[var(--color-primary)]">
						<Icon aria-hidden="true" className="h-5 w-5" />
					</span>
					<input
						id={id}
						name={name}
						type={type}
						value={value}
						onChange={onChange}
						className={dateTimeInputClass}
					/>
					<ChevronDown
						aria-hidden="true"
						className="pointer-events-none absolute right-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--color-low-emphasis)] transition group-focus-within:rotate-180 group-focus-within:text-[var(--color-primary)]"
					/>
				</div>
				<div className="mt-2 flex min-h-7 items-center justify-between gap-3 px-1">
					<p className="truncate text-xs font-medium text-[var(--color-medium-dark)]">
						{helperText}
					</p>
					{value ? (
						<span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)] shadow-level-1">
							{selectedLabel}
						</span>
					) : null}
				</div>
			</div>
		</div>
	);
}

export default function RequestDemoModal({
	isOpen,
	onClose,
}: RequestDemoModalProps): ReactElement | null {
	// All hooks must be called unconditionally at the top
	const [formData, setFormData] = useState(initialFormData);
	const [submitError, setSubmitError] = useState("");
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showWarningModal, setShowWarningModal] = useState(false);
	useEffect(() => {
		if (!isOpen) {
			return;
		}
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	if (!isOpen) {
		return null;
	}

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSelectChange = (name: keyof typeof formData, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleCancel = () => {
		setFormData(initialFormData);
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError("");
		setSubmitSuccess(false);

		// Validate required fields (all except message)
		if (
			!formData.fullName.trim() ||
			!formData.emailAddress.trim() ||
			!formData.institutionName.trim() ||
			!formData.rolePosition.trim() ||
			!formData.institutionSize.trim() ||
			!formData.preferredDemoDate.trim() ||
			!formData.preferredDemoTime.trim()
		) {
			setShowWarningModal(true);
			return;
		}

		setSubmitting(true);
		// Send to Supabase
		const { error } = await supabase.from("demo_requests").insert([
			{
				full_name: formData.fullName,
				email: formData.emailAddress,
				institution_name: formData.institutionName,
				role_position: formData.rolePosition,
				institution_size: formData.institutionSize,
				preferred_demo_date: formData.preferredDemoDate || null,
				preferred_demo_time: formData.preferredDemoTime || null,
				message: formData.message,
				// status and created_at are handled by defaults
			},
		]);
		setSubmitting(false);
		if (error) {
			setSubmitError("Failed to send request. Please try again.");
			return;
		}
		setSubmitSuccess(true);
		setShowSuccessModal(true);
		setFormData(initialFormData);
	};

	 return (
		 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
			 <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-[var(--color-card)] shadow-level-2">
				 <form
					 onSubmit={handleSubmit}
					 className={modalScrollClass}
				 >
					 {submitError && (
						 <div className="mb-2 rounded bg-red-100 px-4 py-2 text-red-700">
							 {submitError}
						 </div>
					 )}
					 {submitSuccess && (
						 <div className="mb-2 rounded bg-green-100 px-4 py-2 text-green-700">
							 Demo request sent successfully!
						 </div>
					 )}
					<div className="sticky top-0 z-20 flex items-center gap-4 border-b border-[var(--color-default)] bg-[var(--color-card)] px-6 py-5 shadow-[0_1px_0_rgba(0,107,95,0.04)]">
						<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-default)]">
							<AppIcon
								name="demo"
								className="inline-block [&_svg]:h-7 [&_svg]:w-7"
								title="Request Demo"
							/>
						</div>

						<div className="flex-1">
							<h2 className="text-heading-h4 text-[var(--color-primary)]">
								Request a Demo
							</h2>
							<p className="text-body-medium text-[var(--color-medium-dark)]">
								Schedule a live demonstration of the TLC Platform for your
								institution
							</p>
						</div>

						<button
							type="button"
							onClick={handleCancel}
							aria-label="Close modal"
							className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-default)]"
						>
							<AppIcon
								name="close"
								className="inline-block [&_svg]:h-4 [&_svg]:w-4"
								title="Close"
							/>
						</button>
					</div>

					<div className="space-y-8 p-6">
						<section className="space-y-5">
							<h3 className="text-heading-h4 text-[var(--color-primary)]">
								INFORMATIONS
							</h3>

							<div className="space-y-2">
								<label htmlFor="fullName" className="text-label-input text-[#364153]">
									Full Name
								</label>
								<input
									id="fullName"
									name="fullName"
									type="text"
									value={formData.fullName}
									onChange={handleChange}
									placeholder="Text input"
									className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
								/>
							</div>

							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<div className="space-y-2">
									<label htmlFor="emailAddress" className="text-label-input text-[#364153]">
										Email Address
									</label>
									<input
										id="emailAddress"
										name="emailAddress"
										type="email"
										value={formData.emailAddress}
										onChange={handleChange}
										placeholder="Text input"
										className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="institutionName" className="text-label-input text-[#364153]">
										Institution/Organization Name
									</label>
									<input
										id="institutionName"
										name="institutionName"
										type="text"
										value={formData.institutionName}
										onChange={handleChange}
										placeholder="Text input"
										className="text-body-small h-10 w-full rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 text-[var(--color-high-emphasis)] shadow-level-1"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label htmlFor="rolePosition" className="text-label-input text-[#364153]">
									Role/Position
								</label>
								<StyledSelect
									value={formData.rolePosition}
									onChange={(value) => handleSelectChange("rolePosition", value)}
									options={roleOptions}
									className="[&_button]:h-10"
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="institutionSize" className="text-label-input text-[#364153]">
									Institution Size
								</label>
								<StyledSelect
									value={formData.institutionSize}
									onChange={(value) => handleSelectChange("institutionSize", value)}
									options={institutionSizeOptions}
									className="[&_button]:h-10"
								/>
							</div>
						</section>

						<section className="space-y-5 border-t border-[var(--color-default)] pt-6">
							<h3 className="text-heading-h4 text-[var(--color-primary)]">DATE/TIME</h3>

							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<DateTimeField
									id="preferredDemoDate"
									name="preferredDemoDate"
									label="Preferred Demo Date"
									type="date"
									value={formData.preferredDemoDate}
									icon={CalendarDays}
									helperText={formatSelectedDate(formData.preferredDemoDate)}
									selectedLabel="Date set"
									onChange={handleChange}
								/>

								<DateTimeField
									id="preferredDemoTime"
									name="preferredDemoTime"
									label="Preferred Demo Time"
									type="time"
									value={formData.preferredDemoTime}
									icon={Clock3}
									helperText={formatSelectedTime(formData.preferredDemoTime)}
									selectedLabel="Time set"
									onChange={handleChange}
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="message" className="text-label-input text-[#364153]">
									Message (Optional)
								</label>
								<textarea
									id="message"
									name="message"
									value={formData.message}
									onChange={handleChange}
									placeholder="Text input"
									className="text-body-small h-36 w-full resize-none rounded-lg border border-[var(--color-default)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-high-emphasis)] shadow-level-1"
								/>
							</div>
						</section>
					</div>

					<div className="flex items-center justify-end gap-3 border-t border-[var(--color-default)] px-6 py-5">
						<button
							type="button"
							onClick={handleCancel}
							className="text-label-button h-10 rounded-lg border border-[var(--color-light-primary)] bg-[var(--color-card)] px-6 text-[var(--color-light-primary)] shadow-level-1"
						>
							Cancel
						</button>

						 <button
							 type="submit"
							 className="text-label-button h-10 rounded-lg bg-[var(--color-primary)] px-6 text-white shadow-level-1 flex items-center justify-center gap-2"
							 disabled={submitting}
						 >
							 {submitting ? (
								 <>
									 <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
									 Sending...
								 </>
							 ) : (
								 "Schedule Demo"
							 )}
						 </button>
					</div>
				</form>
				{/* Warning Modal for required fields */}
				{showWarningModal && (
					<div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
						<div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-sm w-full">
							<Image src="/landingpage/Hero/ensurecompliance.png" alt="Warning" width={80} height={80} className="mb-4 rounded-full" />
							<h2 className="text-xl font-bold text-red-700 mb-2">Missing Required Fields</h2>
							<p className="text-gray-700 mb-4 text-center">Please fill in all required fields before submitting your demo request.</p>
							<button
								className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg text-label-button"
								onClick={() => setShowWarningModal(false)}
							>
								Close
							</button>
						</div>
					</div>
				)}
				{/* Success Modal */}
				{showSuccessModal && (
					<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
						<div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-sm w-full">
							<Image src="/landingpage/Hero/teachingload.png" alt="Success" width={80} height={80} className="mb-4 rounded-full" />
							<h2 className="text-xl font-bold text-green-700 mb-2">Demo Request Sent!</h2>
							<p className="text-gray-700 mb-4 text-center">Thank you for your interest. Our team will contact you soon to schedule your demo.</p>
							<button
								className="mt-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-label-button"
								onClick={() => { setShowSuccessModal(false); onClose(); }}
							>
								Close
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
		);
}
