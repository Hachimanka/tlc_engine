"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StyledSelect from "@/components/Global/StyledSelect";
import TenantLoadingScreen from "@/components/Global/TenantLoadingScreen";
import {
	BasicInstitutionIcon,
	CheckMarkedIcon,
	CorporateIcon,
	HigherEducationIcon,
	TechnicalIcon,
} from "@/public/icons";
import { isRecoverableSupabaseSessionError } from "@/lib/supabaseAuthErrors";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────
type InstitutionType = "higher_ed" | "deped" | "tesda" | "training" | null;

type ProfileForm = {
	institutionName: string;
	adminName: string;
	contactEmail: string;
	phone: string;
	address: string;
	website: string;
	acronym: string;
};

type Department = {
	name: string;
	code: string;
	head: string;
};

type College = {
	name: string;
	code: string;
};

type Instructor = {
	name: string;
	email: string;
	department: string;
	role: string;
};

type GradeComponent = {
	name: string;
	weight: number;
};

type AcademicStructure = "semestral" | "trimestral" | "quarterly";
type ShsTrackModel = "old" | "new";

type AcademicForm = {
	label: string;
	structure: AcademicStructure;
	period1Start: string;
	period1End: string;
	period2Start: string;
	period2End: string;
	period3Start: string;
	period3End: string;
	period4Start: string;
	period4End: string;
	batchName: string;
	batchStart: string;
	batchEnd: string;
	gradeDeadline: string;
};

type PeriodKey =
	| "period1Start"
	| "period1End"
	| "period2Start"
	| "period2End"
	| "period3Start"
	| "period3End"
	| "period4Start"
	| "period4End";

const periodStructures: Record<AcademicStructure, { label: string; count: number; labels: string[] }> = {
	semestral: {
		label: "Semestral",
		count: 2,
		labels: ["1st Semester", "2nd Semester"],
	},
	trimestral: {
		label: "Trimester",
		count: 3,
		labels: ["1st Trimester", "2nd Trimester", "3rd Trimester"],
	},
	quarterly: {
		label: "Quarterly",
		count: 4,
		labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
	},
};

const periodKeyMap: Record<number, { start: PeriodKey; end: PeriodKey }> = {
	1: { start: "period1Start", end: "period1End" },
	2: { start: "period2Start", end: "period2End" },
	3: { start: "period3Start", end: "period3End" },
	4: { start: "period4Start", end: "period4End" },
};

const shsTrackModels: { key: ShsTrackModel; label: string; hint: string }[] = [
	{ key: "old", label: "Old (4 tracks)", hint: "STEM, ABM, HUMSS, TVL" },
	{ key: "new", label: "New (Academic / TechPro)", hint: "Academic and Technical-Professional" },
];

const shsTracksOld = [
	{ key: "stem", label: "STEM", desc: "Science, Tech, Engineering, Math" },
	{ key: "abm", label: "ABM", desc: "Accountancy, Business, Management" },
	{ key: "humss", label: "HUMSS", desc: "Humanities & Social Sciences" },
	{ key: "tvl", label: "TVL", desc: "Technical-Vocational-Livelihood" },
];

const shsTracksNew = [
	{ key: "academic", label: "Academic", desc: "General academic strand" },
	{ key: "techpro", label: "TechPro", desc: "Technical-Professional" },
];

// ─── Step definitions per institution type ────────────────────────────────────
const getSteps = (type: InstitutionType) => {
	const base = [
		{ key: "type", label: "Institution" },
		{ key: "password", label: "Password" },
		{ key: "profile", label: "Profile" },
	];

	if (type === "higher_ed") return [
		...base,
		{ key: "colleges", label: "Colleges" },
		{ key: "departments", label: "Departments" },
		{ key: "programs", label: "Programs" },
		{ key: "academic", label: "Calendar" },
	];

	if (type === "deped") return [
		...base,
		{ key: "grade_levels", label: "Grade Levels" },
		{ key: "instructors", label: "Teachers" },
		{ key: "academic", label: "School Year" },
		{ key: "grading", label: "Grading" },
	];

	if (type === "tesda") return [
		...base,
		{ key: "qualifications", label: "Qualifications" },
		{ key: "instructors", label: "Trainers" },
		{ key: "academic", label: "Batches" },
		{ key: "grading", label: "Assessment" },
	];

	if (type === "training") return [
		...base,
		{ key: "courses", label: "Courses" },
		{ key: "instructors", label: "Facilitators" },
		{ key: "academic", label: "Schedule" },
		{ key: "grading", label: "Assessment" },
	];

	return base;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 bg-white";
const labelCls = "block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
	return (
		<div>
			<label className={labelCls}>{label}</label>
			{children}
			{hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
		</div>
	);
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<div className="mb-6">
			<h2 className="text-base font-bold text-gray-900">{title}</h2>
			{subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
		</div>
	);
}

const institutionCards = [
	{
		key: "higher_ed" as const,
		title: "Higher Education",
		description: "Universities, colleges, and institutes",
		iconSvg: HigherEducationIcon,
	},
	{
		key: "deped" as const,
		title: "Basic Institution",
		description: "K-12 schools and basic education institutions",
		iconSvg: BasicInstitutionIcon,
	},
	{
		key: "tesda" as const,
		title: "Technical",
		description: "Technical-vocational and skills training",
		iconSvg: TechnicalIcon,
	},
	{
		key: "training" as const,
		title: "Corporate",
		description: "Corporate learning and organizational training",
		iconSvg: CorporateIcon,
	},
];

// ─── Institution Type Card ────────────────────────────────────────────────────
function TypeCard({ icon, title, description, selected, onClick }: {
	icon: string;
	title: string;
	description: string;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={selected}
			className={`group relative flex h-full w-full items-start gap-3 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30
				${selected
					? "border-teal-500 bg-gradient-to-br from-teal-50 via-white to-teal-50 shadow-[0_12px_30px_rgba(2,147,131,0.12)]"
					: "border-gray-100 bg-white hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-md"
				}`}
		>
			<span
				className="-ml-1 flex h-20 w-20 shrink-0 items-center justify-center [&_svg]:h-14 [&_svg]:w-14"
				dangerouslySetInnerHTML={{ __html: icon }}
			/>
			<div className="min-w-0 flex-1 pt-0.5 pr-12">
				<p className={`max-w-[9.5rem] text-[13px] font-semibold leading-tight text-balance ${selected ? "text-teal-900" : "text-gray-900"}`}>{title}</p>
				<p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
			</div>
			{selected && (
				<span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center [&_svg]:h-6 [&_svg]:w-6" dangerouslySetInnerHTML={{ __html: CheckMarkedIcon }} />
			)}
		</button>
	);
}

// ─── Password Strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
	if (!password) return null;
	const strength = password.length < 4 ? 1 : password.length < 7 ? 2 : password.length < 10 ? 3 : 4;
	const labels = ["", "Too short", "Weak", "Fair", "Strong"];
	const colors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
	return (
		<div className="mt-2">
			<div className="flex gap-1 mb-1">
				{[1,2,3,4].map(i => (
					<div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : "bg-gray-200"}`} />
				))}
			</div>
			<p className="text-xs text-gray-400">{labels[strength]}</p>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TenantOnboardingPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [step, setStep] = useState(0);
	const [stepError, setStepError] = useState("");

	// Institution type
	const [institutionType, setInstitutionType] = useState<InstitutionType>(null);
	const steps = useMemo(() => getSteps(institutionType), [institutionType]);

	// Password
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [passwordSaving, setPasswordSaving] = useState(false);
	const [passwordUpdated, setPasswordUpdated] = useState(false);

	// Profile
	const [profile, setProfile] = useState<ProfileForm>({
		institutionName: "",
		adminName: "",
		contactEmail: "",
		phone: "",
		address: "",
		website: "",
		acronym: "",
	});

	// Colleges / Departments (Higher Ed)
	const [colleges, setColleges] = useState<College[]>([{ name: "", code: "" }]);
	const [departments, setDepartments] = useState<Department[]>([{ name: "", code: "", head: "" }]);

	// Programs (Higher Ed)
	const [programs, setPrograms] = useState([{ name: "", code: "", duration: "4" }]);

	// Grade Levels (DepEd)
	const [gradeLevels, setGradeLevels] = useState({
		kinder: false,
		elementary: false,
		jhs: false,
		shs: false,
		shsTrackModel: "old" as ShsTrackModel,
		shsTracksOld: { stem: false, abm: false, humss: false, tvl: false },
		shsTracksNew: { academic: false, techpro: false },
	});

	// Qualifications (TESDA)
	const [qualifications, setQualifications] = useState([{ name: "", ncLevel: "NC II", duration: "", sector: "" }]);

	// Courses (Training)
	const [courses, setCourses] = useState([{ name: "", duration: "", category: "" }]);

	// Instructors
	const [instructors, setInstructors] = useState<Instructor[]>([]);
	const [instForm, setInstForm] = useState({ name: "", email: "", department: "", role: "" });

	// Academic / Calendar
	const [academicForm, setAcademicForm] = useState<AcademicForm>({
		label: "",
		structure: "semestral",
		period1Start: "",
		period1End: "",
		period2Start: "",
		period2End: "",
		period3Start: "",
		period3End: "",
		period4Start: "",
		period4End: "",
		batchName: "",
		batchStart: "",
		batchEnd: "",
		gradeDeadline: "14",
	});

	// Grading
	const [gradeComponents, setGradeComponents] = useState<GradeComponent[]>([
		{ name: "Written Works", weight: 25 },
		{ name: "Performance Tasks", weight: 50 },
		{ name: "Quarterly Assessment", weight: 25 },
	]);
	const [passingGrade, setPassingGrade] = useState("75");
	const [gradingScale, setGradingScale] = useState("percentage");
	const [assessmentType, setAssessmentType] = useState("competency");

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const { data, error: userError } = await supabase.auth.getUser();
				if (userError && isRecoverableSupabaseSessionError(userError)) {
					await supabase.auth.signOut({ scope: "local" });
					router.replace("/login");
					return;
				}

				if (userError) {
					throw userError;
				}

				if (!data?.user) { router.replace("/login"); return; }
				const meta = data.user.user_metadata as { first_login?: boolean; org_name?: string; full_name?: string };
				setProfile(prev => ({
					...prev,
					institutionName: meta?.org_name || "",
					adminName: meta?.full_name || "",
					contactEmail: data.user.email || "",
				}));
				setPasswordUpdated(meta?.first_login !== true);
				setLoading(false);
			} catch {
				setError("Unable to reach Supabase Auth. Please check your connection and try again.");
				setLoading(false);
			}
		};
		checkAuth();
	}, [router]);

	const currentStepKey = steps[step]?.key;

	const gradeTotal = gradeComponents.reduce((s, c) => s + Number(c.weight), 0);

	const hasRequiredPeriods = () => {
		const periodConfig = periodStructures[academicForm.structure];
		for (let i = 1; i <= periodConfig.count; i += 1) {
			const keys = periodKeyMap[i];
			if (!academicForm[keys.start] || !academicForm[keys.end]) {
				return false;
			}
		}
		return true;
	};

	const canProceed = () => {
		if (currentStepKey === "type") return institutionType !== null;
		if (currentStepKey === "password") return passwordUpdated;
		if (currentStepKey === "profile") return Boolean(profile.institutionName && profile.adminName && profile.contactEmail);
		if (currentStepKey === "colleges") return true; // skippable
		if (currentStepKey === "departments") return true; // skippable for Higher Ed
		if (currentStepKey === "grade_levels") return Object.values(gradeLevels).some(v => typeof v === "boolean" && v);
		if (currentStepKey === "qualifications") return qualifications.some(q => q.name.trim());
		if (currentStepKey === "courses") return courses.some(c => c.name.trim());
		if (currentStepKey === "programs") return true; // skippable
		if (currentStepKey === "instructors") return true; // skippable
		if (currentStepKey === "academic") return Boolean(
			academicForm.label &&
			(institutionType === "training" || institutionType === "tesda"
				? academicForm.batchStart && academicForm.batchEnd
				: hasRequiredPeriods())
		);
		if (currentStepKey === "grading") return gradeTotal === 100;
		return true;
	};

	const handlePasswordUpdate = async () => {
		setPasswordError("");
		if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters."); return; }
		if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
		setPasswordSaving(true);
		let updateResult;
		try {
			updateResult = await supabase.auth.updateUser({ password: newPassword, data: { first_login: false } });
		} catch {
			setPasswordSaving(false);
			setPasswordError("Unable to reach Supabase Auth. Please check your connection and try again.");
			return;
		}
		const { error: e } = updateResult;
		setPasswordSaving(false);
		if (e) { setPasswordError(e.message); return; }
		setPasswordUpdated(true);
		setNewPassword(""); setConfirmPassword("");
	};

	const handleNext = () => {
		setStepError("");
		if (!canProceed()) { setStepError("Please complete the required fields to continue."); return; }
		setStep(prev => Math.min(prev + 1, steps.length - 1));
	};

	const handleBack = () => { setStepError(""); setStep(prev => Math.max(prev - 1, 0)); };

	const handleFinish = async () => {
		if (!canProceed()) { setStepError("Please complete the required fields to finish."); return; }
		setSaving(true); setError("");
		let sessionData;
		try {
			const result = await supabase.auth.getSession();
			sessionData = result.data;
		} catch {
			setSaving(false);
			setError("Unable to reach Supabase Auth. Please check your connection and try again.");
			return;
		}
		const token = sessionData?.session?.access_token;

		if (!token) {
			setSaving(false);
			setError("Session expired. Please log in again.");
			return;
		}

		const cleanedColleges = colleges
			.filter(college => college.name.trim())
			.map(college => ({
				name: college.name.trim(),
				code: college.code.trim(),
			}));
		const cleanedDepartments = departments
			.filter(department => department.name.trim())
			.map(department => ({
				name: department.name.trim(),
				code: department.code.trim(),
				head: department.head.trim(),
			}));
		const cleanedPrograms = programs
			.filter(program => program.name.trim())
			.map(program => ({
				name: program.name.trim(),
				code: program.code.trim(),
				duration: program.duration,
			}));
		const isHigherEd = institutionType === "higher_ed";

		let response;
		try {
			response = await fetch("/api/tenant/onboarding", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					institutionType,
					profile,
					colleges: isHigherEd ? cleanedColleges : [],
					departments: isHigherEd ? cleanedDepartments : departments,
					programs: isHigherEd ? cleanedPrograms : programs,
					gradeLevels,
					qualifications,
					courses,
					instructors: isHigherEd ? [] : instructors,
					academic: academicForm,
					grading: isHigherEd
						? null
						: {
							components: gradeComponents,
							passing: passingGrade,
							scale: gradingScale,
							assessmentType,
						},
				}),
			});
		} catch {
			setSaving(false);
			setError("Unable to submit onboarding. Please check your connection and try again.");
			return;
		}

		setSaving(false);
		const payload = await response.json().catch(() => ({}));
		if (!response.ok) {
			setError(payload?.error || "Failed to finish setup.");
			return;
		}
		router.replace("/tenant/tenant-admin");
	};

	if (loading) {
		return (
			<TenantLoadingScreen
				card
				className="flex min-h-screen items-start justify-center bg-[var(--color-background)] px-4 py-10"
				label="Loading onboarding"
				useStoredBranding
			/>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			{/* Top bar */}
			<header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-end">
				<span className="text-xs text-gray-400 font-medium">
					Step {step + 1} of {steps.length}
				</span>
			</header>

			<div className="flex-1 flex items-start justify-center py-10 px-4">
				<div className="w-full max-w-2xl">

					{/* Progress bar */}
					<div className="flex gap-1.5 mb-8">
						{steps.map((s, i) => (
							<div key={s.key} className="flex-1 flex flex-col gap-1">
								<div className={`h-1.5 rounded-full transition-all duration-300
									${i < step ? "bg-teal-400" : i === step ? "bg-teal-700" : "bg-gray-200"}`}
								/>
								<p className={`text-[10px] font-semibold truncate
									${i === step ? "text-teal-700" : i < step ? "text-teal-400" : "text-gray-300"}`}>
									{s.label}
								</p>
							</div>
						))}
					</div>

					{/* Card */}
					<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

						{/* ── Step: Institution Type ── */}
						{currentStepKey === "type" && (
							<>
								<SectionTitle
									title="What type of institution are you setting up?"
									subtitle="This determines your dashboard structure, terminology, and grading system."
								/>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									{institutionCards.map(card => (
										<TypeCard
											key={card.key}
											icon={card.iconSvg}
											title={card.title}
											description={card.description}
											selected={institutionType === card.key}
											onClick={() => {
												setInstitutionType(card.key);
												if (card.key === "deped") {
													setAcademicForm(prev => (prev.structure === "semestral" ? { ...prev, structure: "quarterly" } : prev));
												}
											}}
										/>
									))}
								</div>
								{institutionType && (
									<div className="mt-4 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-xs text-teal-700">
										<div className="flex items-start gap-2">
											<span className="mt-0.5 shrink-0 [&_svg]:h-4 [&_svg]:w-4" dangerouslySetInnerHTML={{ __html: CheckMarkedIcon }} />
											<p>
												{institutionType === "higher_ed" && "You'll set up optional colleges, departments, academic programs, and a semestral calendar."}
												{institutionType === "deped" && "You'll configure grade levels, sections, SHS tracks, quarterly grading periods, and DepEd grading descriptors."}
												{institutionType === "tesda" && "You'll set up TESDA qualifications, NC levels, training batches, and competency-based assessment."}
												{institutionType === "training" && "You'll configure training courses, batch schedules, facilitators, and pass/fail or rated assessment."}
											</p>
										</div>
									</div>
								)}
							</>
						)}

						{/* ── Step: Password ── */}
						{currentStepKey === "password" && (
							<>
								<SectionTitle
									title="Secure your account"
									subtitle="Set a strong password before accessing your dashboard."
								/>
								<div className="flex flex-col gap-4">
									<Field label="New Password">
										<div className="relative">
											<input
												type={showNew ? "text" : "password"}
												className={inputCls}
												value={newPassword}
												onChange={e => setNewPassword(e.target.value)}
												placeholder="At least 8 characters"
											/>
											<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowNew(v => !v)}>
												{showNew
													? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
													: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
												}
											</button>
										</div>
										<PasswordStrength password={newPassword} />
									</Field>

									<Field label="Confirm Password">
										<div className="relative">
											<input
												type={showConfirm ? "text" : "password"}
												className={inputCls}
												value={confirmPassword}
												onChange={e => setConfirmPassword(e.target.value)}
												placeholder="Re-enter your password"
											/>
											<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowConfirm(v => !v)}>
												{showConfirm
													? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
													: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
												}
											</button>
										</div>
									</Field>

									{passwordError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{passwordError}</p>}

									<div className="flex items-center justify-between pt-1">
										{passwordUpdated
											? <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
													<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
													Password updated successfully
												</span>
											: <span className="text-xs text-gray-400">Update your password to continue</span>
										}
										<button
											type="button"
											className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
											onClick={handlePasswordUpdate}
											disabled={passwordSaving || passwordUpdated}
										>
											{passwordSaving ? "Saving..." : passwordUpdated ? "Updated ✓" : "Set Password"}
										</button>
									</div>
								</div>
							</>
						)}

						{/* ── Step: Profile ── */}
						{currentStepKey === "profile" && (
							<>
								<SectionTitle
									title="Institution Profile"
									subtitle="Tell us about your institution. This appears in reports and emails."
								/>
								<div className="flex flex-col gap-4">
									<div className="grid grid-cols-2 gap-4">
										<Field label="Institution Name *">
											<input className={inputCls} value={profile.institutionName}
												onChange={e => setProfile(p => ({ ...p, institutionName: e.target.value }))}
												placeholder="e.g. Cebu Institute of Technology" />
										</Field>
										<Field label="Acronym / Short Name">
											<input className={inputCls} value={profile.acronym}
												onChange={e => setProfile(p => ({ ...p, acronym: e.target.value }))}
												placeholder="e.g. CIT" />
										</Field>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<Field label="Admin Name *">
											<input className={inputCls} value={profile.adminName}
												onChange={e => setProfile(p => ({ ...p, adminName: e.target.value }))}
												placeholder="Full name" />
										</Field>
										<Field label="Contact Number">
											<input className={inputCls} value={profile.phone}
												onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
												placeholder="+63 912 345 6789" />
										</Field>
									</div>
									<Field label="Contact Email *">
										<input className={inputCls} type="email" value={profile.contactEmail}
											onChange={e => setProfile(p => ({ ...p, contactEmail: e.target.value }))}
											placeholder="admin@institution.edu" />
									</Field>
									<Field label="Address">
										<input className={inputCls} value={profile.address}
											onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
											placeholder="Street, City, Province" />
									</Field>
									<Field label="Website">
										<input className={inputCls} value={profile.website}
											onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
											placeholder="https://www.institution.edu" />
									</Field>
								</div>
							</>
						)}

						{/* ── Step: Colleges (Higher Ed) ── */}
						{currentStepKey === "colleges" && (
							<>
								<SectionTitle
									title="Colleges"
									subtitle="Optionally list the college-level units in your institution. You can manage the full hierarchy later."
								/>
								<div className="flex flex-col gap-3">
									{colleges.map((college, i) => (
										<div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60 relative">
											<div className="flex items-center justify-between mb-3">
												<span className="text-xs font-bold text-teal-700">College {i + 1}</span>
												{colleges.length > 1 && (
													<button type="button" className="text-xs text-red-500 hover:text-red-700"
														onClick={() => setColleges(prev => prev.filter((_, idx) => idx !== i))}>
														Remove
													</button>
												)}
											</div>
											<div className="grid grid-cols-3 gap-3">
												<div className="col-span-2">
													<label className={labelCls}>Name</label>
													<input className={inputCls} value={college.name}
														onChange={e => setColleges(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))}
														placeholder="e.g. College of Engineering and Architecture" />
												</div>
												<div>
													<label className={labelCls}>Code</label>
													<input className={inputCls} value={college.code}
														onChange={e => setColleges(prev => prev.map((item, idx) => idx === i ? { ...item, code: e.target.value } : item))}
														placeholder="CEA" />
												</div>
											</div>
										</div>
									))}
									<button type="button"
										className="w-full border-2 border-dashed border-teal-200 rounded-xl py-3 text-sm font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
										onClick={() => setColleges(prev => [...prev, { name: "", code: "" }])}>
										+ Add Another College
									</button>
								</div>
							</>
						)}

						{/* ── Step: Departments (Higher Ed) ── */}
						{currentStepKey === "departments" && (
							<>
								<SectionTitle
									title="Departments"
									subtitle="Optionally list departments now. You can map them under colleges later in Colleges & Departments."
								/>
								<div className="flex flex-col gap-3">
									{departments.map((dept, i) => (
										<div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60 relative">
											<div className="flex items-center justify-between mb-3">
												<span className="text-xs font-bold text-teal-700">Department {i + 1}</span>
												{departments.length > 1 && (
													<button type="button" className="text-xs text-red-500 hover:text-red-700"
														onClick={() => setDepartments(prev => prev.filter((_, idx) => idx !== i))}>
														Remove
													</button>
												)}
											</div>
											<div className="grid grid-cols-3 gap-3">
												<div className="col-span-2">
													<label className={labelCls}>Name</label>
													<input className={inputCls} value={dept.name}
														onChange={e => setDepartments(prev => prev.map((d, idx) => idx === i ? { ...d, name: e.target.value } : d))}
														placeholder="e.g. Computer Engineering" />
												</div>
												<div>
													<label className={labelCls}>Code</label>
													<input className={inputCls} value={dept.code}
														onChange={e => setDepartments(prev => prev.map((d, idx) => idx === i ? { ...d, code: e.target.value } : d))}
														placeholder="CCS" />
												</div>
												<div className="col-span-3">
													<label className={labelCls}>Dean / Head</label>
													<input className={inputCls} value={dept.head}
														onChange={e => setDepartments(prev => prev.map((d, idx) => idx === i ? { ...d, head: e.target.value } : d))}
														placeholder="Dr. Maria Santos" />
												</div>
											</div>
										</div>
									))}
									<button type="button"
										className="w-full border-2 border-dashed border-teal-200 rounded-xl py-3 text-sm font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
										onClick={() => setDepartments(prev => [...prev, { name: "", code: "", head: "" }])}>
										+ Add Another Department
									</button>
								</div>
							</>
						)}

						{/* ── Step: Programs (Higher Ed) ── */}
						{currentStepKey === "programs" && (
							<>
								<SectionTitle
									title="Academic Programs"
									subtitle="What degree programs does your institution offer? (Optional — you can add these later)"
								/>
								<div className="flex flex-col gap-3">
									{programs.map((prog, i) => (
										<div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
											<div className="flex items-center justify-between mb-3">
												<span className="text-xs font-bold text-teal-700">Program {i + 1}</span>
												{programs.length > 1 && (
													<button type="button" className="text-xs text-red-500"
														onClick={() => setPrograms(prev => prev.filter((_, idx) => idx !== i))}>Remove</button>
												)}
											</div>
											<div className="grid grid-cols-3 gap-3">
												<div className="col-span-2">
													<label className={labelCls}>Program Name</label>
													<input className={inputCls} value={prog.name}
														onChange={e => setPrograms(prev => prev.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))}
														placeholder="Bachelor of Science in Information Technology" />
												</div>
												<div>
													<label className={labelCls}>Code</label>
													<input className={inputCls} value={prog.code}
														onChange={e => setPrograms(prev => prev.map((p, idx) => idx === i ? { ...p, code: e.target.value } : p))}
														placeholder="BSIT" />
												</div>
												<div>
													<label className={labelCls}>Duration</label>
													<StyledSelect value={prog.duration}
														onChange={value => setPrograms(prev => prev.map((p, idx) => idx === i ? { ...p, duration: value } : p))}
														options={[
															{ value: "2", label: "2 years" },
															{ value: "3", label: "3 years" },
															{ value: "4", label: "4 years" },
															{ value: "5", label: "5 years" },
														]}
														className="[&_button]:h-10" />
												</div>
											</div>
										</div>
									))}
									<button type="button"
										className="w-full border-2 border-dashed border-teal-200 rounded-xl py-3 text-sm font-semibold text-teal-600 hover:bg-teal-50"
										onClick={() => setPrograms(prev => [...prev, { name: "", code: "", duration: "4" }])}>
										+ Add Another Program
									</button>
								</div>
							</>
						)}

						{/* ── Step: Grade Levels (DepEd) ── */}
						{currentStepKey === "grade_levels" && (
							<>
								<SectionTitle
									title="Grade Levels & Structure"
									subtitle="Select the grade levels your school offers."
								/>
								<div className="flex flex-col gap-4">
									{[
										{ key: "kinder", label: "Kindergarten", desc: "Early childhood education" },
										{ key: "elementary", label: "Elementary (Grades 1–6)", desc: "Primary education" },
										{ key: "jhs", label: "Junior High School (Grades 7–10)", desc: "Secondary education" },
										{ key: "shs", label: "Senior High School (Grades 11–12)", desc: "Upper secondary" },
									].map(level => (
										<div key={level.key}>
											<button type="button"
												className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
													${gradeLevels[level.key as keyof typeof gradeLevels]
														? "border-teal-600 bg-teal-50"
														: "border-gray-100 bg-gray-50/60 hover:border-teal-200"}`}
												onClick={() => setGradeLevels(prev => ({ ...prev, [level.key]: !prev[level.key as keyof typeof prev] }))}>
												<div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
													${gradeLevels[level.key as keyof typeof gradeLevels] ? "bg-teal-600 border-teal-600" : "border-gray-300"}`}>
													{gradeLevels[level.key as keyof typeof gradeLevels] && (
														<svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
													)}
												</div>
												<div>
													<p className="text-sm font-semibold text-gray-800">{level.label}</p>
													<p className="text-xs text-gray-400">{level.desc}</p>
												</div>
											</button>

											{/* SHS Tracks */}
											{level.key === "shs" && gradeLevels.shs && (
												<div className="mt-2 ml-4 border-l-2 border-teal-200 pl-4">
													<p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">SHS Track Model</p>
													<div className="grid grid-cols-2 gap-2 mb-3">
														{shsTrackModels.map(model => (
															<button
																key={model.key}
																type="button"
																className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all
																	${gradeLevels.shsTrackModel === model.key
																		? "border-teal-500 bg-teal-50 text-teal-700"
																		: "border-gray-200 text-gray-600 hover:border-teal-200"}`}
																onClick={() => setGradeLevels(prev => ({ ...prev, shsTrackModel: model.key }))}
															>
																<div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
																	${gradeLevels.shsTrackModel === model.key ? "border-teal-600" : "border-gray-300"}`}>
																	{gradeLevels.shsTrackModel === model.key && <div className="w-2 h-2 rounded-full bg-teal-600" />}
																</div>
																<div>
																	<p className="text-xs font-bold">{model.label}</p>
																	<p className="text-[10px] text-gray-400">{model.hint}</p>
																</div>
															</button>
														))}
													</div>

													<p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">SHS Tracks Offered</p>
													<div className="grid grid-cols-2 gap-2">
														{(gradeLevels.shsTrackModel === "old" ? shsTracksOld : shsTracksNew).map(track => {
															const isOldModel = gradeLevels.shsTrackModel === "old";
															const isSelected = isOldModel
																? gradeLevels.shsTracksOld[track.key as keyof typeof gradeLevels.shsTracksOld]
																: gradeLevels.shsTracksNew[track.key as keyof typeof gradeLevels.shsTracksNew];

															return (
																<button
																	key={track.key}
																	type="button"
																	className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all
																		${isSelected
																			? "border-teal-500 bg-teal-50 text-teal-700"
																			: "border-gray-200 text-gray-600 hover:border-teal-200"}`}
																	onClick={() =>
																		setGradeLevels(prev => ({
																			...prev,
																			shsTracksOld: isOldModel
																				? { ...prev.shsTracksOld, [track.key]: !prev.shsTracksOld[track.key as keyof typeof prev.shsTracksOld] }
																				: prev.shsTracksOld,
																			shsTracksNew: !isOldModel
																				? { ...prev.shsTracksNew, [track.key]: !prev.shsTracksNew[track.key as keyof typeof prev.shsTracksNew] }
																				: prev.shsTracksNew,
																		}))
																	}
																>
																	<div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
																		${isSelected ? "bg-teal-600 border-teal-600" : "border-gray-300"}`}>
																		{isSelected && (
																			<svg width="10" height="10" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
																		)}
																	</div>
																	<div>
																		<p className="text-xs font-bold">{track.label}</p>
																		<p className="text-[10px] text-gray-400">{track.desc}</p>
																	</div>
																</button>
															);
														})}
													</div>
												</div>
											)}
										</div>
									))}
								</div>
							</>
						)}

						{/* ── Step: Qualifications (TESDA) ── */}
						{currentStepKey === "qualifications" && (
							<>
								<SectionTitle
									title="TESDA Qualifications"
									subtitle="Add the qualifications / NC programs your institution offers."
								/>
								<div className="flex flex-col gap-3">
									{qualifications.map((q, i) => (
										<div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
											<div className="flex items-center justify-between mb-3">
												<span className="text-xs font-bold text-teal-700">Qualification {i + 1}</span>
												{qualifications.length > 1 && (
													<button type="button" className="text-xs text-red-500"
														onClick={() => setQualifications(prev => prev.filter((_, idx) => idx !== i))}>Remove</button>
												)}
											</div>
											<div className="grid grid-cols-2 gap-3">
												<div className="col-span-2">
													<label className={labelCls}>Qualification Title *</label>
													<input className={inputCls} value={q.name}
														onChange={e => setQualifications(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))}
														placeholder="e.g. Computer Systems Servicing" />
												</div>
												<div>
													<label className={labelCls}>NC Level</label>
													<StyledSelect value={q.ncLevel}
														onChange={value => setQualifications(prev => prev.map((item, idx) => idx === i ? { ...item, ncLevel: value } : item))}
														options={["NC I", "NC II", "NC III", "NC IV"].map((level) => ({ value: level, label: level }))}
														className="[&_button]:h-10" />
												</div>
												<div>
													<label className={labelCls}>Duration (hours)</label>
													<input className={inputCls} value={q.duration}
														onChange={e => setQualifications(prev => prev.map((item, idx) => idx === i ? { ...item, duration: e.target.value } : item))}
														placeholder="316" />
												</div>
												<div className="col-span-2">
													<label className={labelCls}>Sector</label>
													<input className={inputCls} value={q.sector}
														onChange={e => setQualifications(prev => prev.map((item, idx) => idx === i ? { ...item, sector: e.target.value } : item))}
														placeholder="e.g. Information & Communications Technology" />
												</div>
											</div>
										</div>
									))}
									<button type="button"
										className="w-full border-2 border-dashed border-teal-200 rounded-xl py-3 text-sm font-semibold text-teal-600 hover:bg-teal-50"
										onClick={() => setQualifications(prev => [...prev, { name: "", ncLevel: "NC II", duration: "", sector: "" }])}>
										+ Add Another Qualification
									</button>
								</div>
							</>
						)}

						{/* ── Step: Courses (Training Center) ── */}
						{currentStepKey === "courses" && (
							<>
								<SectionTitle
									title="Training Courses"
									subtitle="Add the courses or training programs your center offers."
								/>
								<div className="flex flex-col gap-3">
									{courses.map((c, i) => (
										<div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
											<div className="flex items-center justify-between mb-3">
												<span className="text-xs font-bold text-teal-700">Course {i + 1}</span>
												{courses.length > 1 && (
													<button type="button" className="text-xs text-red-500"
														onClick={() => setCourses(prev => prev.filter((_, idx) => idx !== i))}>Remove</button>
												)}
											</div>
											<div className="grid grid-cols-2 gap-3">
												<div className="col-span-2">
													<label className={labelCls}>Course Title *</label>
													<input className={inputCls} value={c.name}
														onChange={e => setCourses(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))}
														placeholder="e.g. Leadership & Management Training" />
												</div>
												<div>
													<label className={labelCls}>Duration</label>
													<input className={inputCls} value={c.duration}
														onChange={e => setCourses(prev => prev.map((item, idx) => idx === i ? { ...item, duration: e.target.value } : item))}
														placeholder="3 days / 24 hours" />
												</div>
												<div>
													<label className={labelCls}>Category</label>
													<input className={inputCls} value={c.category}
														onChange={e => setCourses(prev => prev.map((item, idx) => idx === i ? { ...item, category: e.target.value } : item))}
														placeholder="e.g. Management" />
												</div>
											</div>
										</div>
									))}
									<button type="button"
										className="w-full border-2 border-dashed border-teal-200 rounded-xl py-3 text-sm font-semibold text-teal-600 hover:bg-teal-50"
										onClick={() => setCourses(prev => [...prev, { name: "", duration: "", category: "" }])}>
										+ Add Another Course
									</button>
								</div>
							</>
						)}

						{/* ── Step: Instructors / Teachers / Trainers ── */}
						{currentStepKey === "instructors" && (
							<>
								<SectionTitle
									title={
										institutionType === "deped" ? "Invite Your Teachers" :
										institutionType === "tesda" ? "Invite Your Trainers" :
										institutionType === "training" ? "Invite Facilitators" :
										"Invite Faculty"
									}
									subtitle="They will receive an email invitation to create their account. You can skip and add later."
								/>
								<div className="border border-gray-100 rounded-xl p-4 bg-gray-50/60 mb-3">
									<div className="grid grid-cols-3 gap-3">
										<div>
											<label className={labelCls}>Full Name</label>
											<input className={inputCls} value={instForm.name}
												onChange={e => setInstForm(p => ({ ...p, name: e.target.value }))}
												placeholder="Full name" />
										</div>
										<div>
											<label className={labelCls}>Email</label>
											<input className={inputCls} type="email" value={instForm.email}
												onChange={e => setInstForm(p => ({ ...p, email: e.target.value }))}
												placeholder="name@institution.edu" />
										</div>
										<div>
											<label className={labelCls}>
												{institutionType === "higher_ed" ? "Department" :
												institutionType === "deped" ? "Grade Level" :
												"Qualification / Course"}
											</label>
											{departments.length > 0 && institutionType === "higher_ed" ? (
												<StyledSelect value={instForm.department}
													onChange={value => setInstForm(p => ({ ...p, department: value }))}
													options={[
														{ value: "", label: "Select" },
														...departments.filter(d => d.name).map(d => ({ value: d.name, label: d.name })),
													]}
													className="[&_button]:h-10" />
											) : (
												<input className={inputCls} value={instForm.department}
													onChange={e => setInstForm(p => ({ ...p, department: e.target.value }))}
													placeholder="e.g. Grade 7, BSIT" />
											)}
										</div>
									</div>
									<button type="button"
										className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
										disabled={!instForm.name || !instForm.email}
										onClick={() => {
											setInstructors(prev => [...prev, { ...instForm }]);
											setInstForm({ name: "", email: "", department: "", role: "" });
										}}>
										+ Add to List
									</button>
								</div>

								{instructors.length > 0 && (
									<div className="border border-gray-100 rounded-xl overflow-hidden">
										<div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
											<p className="text-xs font-bold text-gray-500">{instructors.length} pending invite{instructors.length !== 1 ? "s" : ""}</p>
										</div>
										{instructors.map((inst, i) => (
											<div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
														{inst.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
													</div>
													<div>
														<p className="text-sm font-semibold text-gray-800">{inst.name}</p>
														<p className="text-xs text-gray-400">{inst.email}{inst.department ? ` · ${inst.department}` : ""}</p>
													</div>
												</div>
												<button type="button" className="text-xs text-red-500 hover:text-red-700"
													onClick={() => setInstructors(prev => prev.filter((_, idx) => idx !== i))}>
													Remove
												</button>
											</div>
										))}
									</div>
								)}

								{instructors.length === 0 && (
									<div className="text-center py-6 text-xs text-gray-400">
										No invites added yet. You can skip this step and add them later.
									</div>
								)}
							</>
						)}

						{/* ── Step: Academic Calendar ── */}
						{currentStepKey === "academic" && (
							<>
								<SectionTitle
									title={
										institutionType === "deped" ? "School Year & Grading Periods" :
										institutionType === "tesda" || institutionType === "training" ? "Training Calendar" :
										"Academic Calendar"
									}
									subtitle="Configure your current academic period."
								/>
								<div className="flex flex-col gap-4">
									<Field label={institutionType === "tesda" || institutionType === "training" ? "Batch / Term Name *" : "Academic Year Label *"}>
										<input className={inputCls}
											value={academicForm.label}
											onChange={e => setAcademicForm(p => ({ ...p, label: e.target.value }))}
											placeholder={
												institutionType === "tesda" ? "e.g. Batch 2025-A" :
												institutionType === "training" ? "e.g. Q1 2025 Batch" :
												"e.g. 2025-2026"
											} />
									</Field>

									{(institutionType === "higher_ed" || institutionType === "deped") && (
										<Field label="Grading Period Structure">
											<div className="flex gap-3">
												{Object.entries(periodStructures).map(([key, config]) => (
													<button
														key={key}
														type="button"
														className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors
															${academicForm.structure === key ? "border-teal-600 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-500 hover:border-teal-300"}`}
														onClick={() => setAcademicForm(p => ({ ...p, structure: key as AcademicStructure }))}
													>
														{config.label}
													</button>
												))}
											</div>
											<p className="text-xs text-gray-400 mt-2">
												Creates {periodStructures[academicForm.structure].count} grading periods for the school year.
											</p>
										</Field>
									)}

									{(institutionType === "tesda" || institutionType === "training") ? (
										<div className="grid grid-cols-2 gap-3">
											<Field label="Start Date *">
												<input type="date" className={inputCls} value={academicForm.batchStart}
													onChange={e => setAcademicForm(p => ({ ...p, batchStart: e.target.value }))} />
											</Field>
											<Field label="End Date *">
												<input type="date" className={inputCls} value={academicForm.batchEnd}
													onChange={e => setAcademicForm(p => ({ ...p, batchEnd: e.target.value }))} />
											</Field>
										</div>
									) : (
										<div className="flex flex-col gap-3">
											{periodStructures[academicForm.structure].labels.map((label, index) => {
												const periodIndex = index + 1;
												const keys = periodKeyMap[periodIndex];
												return (
													<div key={label} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
														<p className="text-xs font-bold text-teal-700 mb-3">{label}</p>
														<div className="grid grid-cols-2 gap-3">
															<Field label="Start Date *">
																<input
																	type="date"
																	className={inputCls}
																	value={academicForm[keys.start]}
																	onChange={e =>
																		setAcademicForm(p => ({ ...p, [keys.start]: e.target.value }))
																	}
																/>
															</Field>
															<Field label="End Date *">
																<input
																	type="date"
																	className={inputCls}
																	value={academicForm[keys.end]}
																	onChange={e =>
																		setAcademicForm(p => ({ ...p, [keys.end]: e.target.value }))
																	}
																/>
															</Field>
														</div>
													</div>
												);
											})}
										</div>
									)}

									<Field label="Grade Submission Deadline" hint="Days after period ends that instructors must submit grades">
										<div className="flex items-center gap-3">
											<input type="number" className={`${inputCls} w-24`} value={academicForm.gradeDeadline}
												onChange={e => setAcademicForm(p => ({ ...p, gradeDeadline: e.target.value }))}
												min="1" max="60" />
											<span className="text-sm text-gray-500">days after period ends</span>
										</div>
									</Field>
								</div>
							</>
						)}

						{/* ── Step: Grading System ── */}
						{currentStepKey === "grading" && (
							<>
								<SectionTitle
									title="Grading System"
									subtitle={
										institutionType === "tesda" ? "Configure how trainees are assessed." :
										institutionType === "training" ? "Configure how participants are evaluated." :
										"Configure how grades are computed for your institution."
									}
								/>
								<div className="flex flex-col gap-5">
									{(institutionType === "tesda" || institutionType === "training") ? (
										<>
											<Field label="Assessment Type">
												<div className="flex flex-col gap-2">
													{[
														{ value: "competency", label: "Competent / Not Yet Competent", desc: "TESDA standard — binary result" },
														{ value: "percentage", label: "Percentage Score", desc: "Numeric score with passing grade" },
														{ value: "pass_fail", label: "Pass / Fail only", desc: "Simple pass or fail" },
													].map(opt => (
														<button key={opt.value} type="button"
															className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all
																${assessmentType === opt.value ? "border-teal-600 bg-teal-50" : "border-gray-100 hover:border-teal-200"}`}
															onClick={() => setAssessmentType(opt.value)}>
															<div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
																${assessmentType === opt.value ? "border-teal-600" : "border-gray-300"}`}>
																{assessmentType === opt.value && <div className="w-2 h-2 rounded-full bg-teal-600" />}
															</div>
															<div>
																<p className="text-sm font-semibold text-gray-800">{opt.label}</p>
																<p className="text-xs text-gray-400">{opt.desc}</p>
															</div>
														</button>
													))}
												</div>
											</Field>
											{assessmentType === "percentage" && (
												<Field label="Passing Grade (%)">
													<input type="number" className={`${inputCls} w-32`} value={passingGrade}
														onChange={e => setPassingGrade(e.target.value)} min="50" max="100" />
												</Field>
											)}
										</>
									) : (
										<>
											<div className="grid grid-cols-2 gap-4">
												<Field label="Passing Grade (%)">
													<input type="number" className={inputCls} value={passingGrade}
														onChange={e => setPassingGrade(e.target.value)} min="50" max="100" />
												</Field>
												<Field label="Grading Scale">
													<StyledSelect value={gradingScale}
														onChange={setGradingScale}
														options={[
															{ value: "percentage", label: "Percentage (0-100)" },
															{ value: "gwa", label: "GWA (1.0-5.0)" },
															{ value: "letter", label: "Letter Grade (A-F)" },
														]}
														className="[&_button]:h-10" />
												</Field>
											</div>

											<div>
												<div className="flex items-center justify-between mb-2">
													<label className={labelCls}>Grade Components</label>
													<span className={`text-xs font-bold ${gradeTotal === 100 ? "text-green-600" : "text-red-500"}`}>
														Total: {gradeTotal}% {gradeTotal === 100 ? "✅" : "(must equal 100%)"}
													</span>
												</div>
												<div className="flex flex-col gap-2">
													{gradeComponents.map((comp, i) => (
														<div key={i} className="flex items-center gap-3 bg-gray-50/60 border border-gray-100 rounded-xl px-4 py-3">
															<input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
																value={comp.name}
																onChange={e => setGradeComponents(prev => prev.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))}
																placeholder="Component name" />
															<div className="flex items-center gap-1.5 shrink-0">
																<input type="number" className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-center"
																	value={comp.weight}
																	onChange={e => setGradeComponents(prev => prev.map((c, idx) => idx === i ? { ...c, weight: Number(e.target.value) } : c))} />
																<span className="text-xs text-gray-400">%</span>
															</div>
															{gradeComponents.length > 1 && (
																<button type="button" className="text-red-400 hover:text-red-600 shrink-0"
																	onClick={() => setGradeComponents(prev => prev.filter((_, idx) => idx !== i))}>
																	<svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
																</button>
															)}
														</div>
													))}
												</div>
												<button type="button"
													className="mt-2 w-full border-2 border-dashed border-teal-200 rounded-xl py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50"
													onClick={() => setGradeComponents(prev => [...prev, { name: "", weight: 0 }])}>
													+ Add Component
												</button>
											</div>

											{institutionType === "deped" && (
												<div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-xs text-teal-700">
													💡 DepEd Order No. 8 s. 2015 standard: Written Works 25% · Performance Tasks 50% · Quarterly Assessment 25%
												</div>
											)}
										</>
									)}
								</div>
							</>
						)}

						{/* Errors */}
						{stepError && (
							<div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-600">
								{stepError}
							</div>
						)}
						{error && (
							<div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-600">
								{error}
							</div>
						)}

						{/* Navigation */}
						<div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
							<button type="button"
								className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 font-medium"
								onClick={handleBack}
								disabled={step === 0}>
								← Back
							</button>

							<div className="flex items-center gap-3">
								{/* Skippable steps */}
								{(currentStepKey === "colleges" || currentStepKey === "departments" || currentStepKey === "programs" || currentStepKey === "instructors") && (
									<button type="button"
										className="rounded-lg px-5 py-2.5 text-sm text-gray-400 hover:text-gray-600 font-medium"
										onClick={() => setStep(prev => Math.min(prev + 1, steps.length - 1))}>
										Skip for now
									</button>
								)}

								{step < steps.length - 1 ? (
									<button type="button"
										className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
										onClick={handleNext}
										disabled={!canProceed()}>
										Continue →
									</button>
								) : (
									<button type="button"
										className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-40 flex items-center gap-2"
										onClick={handleFinish}
										disabled={saving || !canProceed()}>
										{saving ? (
											<><span className="h-4 w-4 animate-pulse rounded bg-white/50" aria-hidden="true" /> Finishing...</>
										) : "Finish Setup 🎉"}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
