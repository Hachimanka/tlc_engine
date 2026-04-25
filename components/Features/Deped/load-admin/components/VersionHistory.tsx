"use client";

type VersionEntry = {
	id: string;
	time: string;
	author: string;
	description: string;
};

type VersionHistoryProps = {
	isOpen: boolean;
	onClose: () => void;
	selectedFacultyName?: string;
	selectedSubjectTitle?: string;
};

const versionEntries: VersionEntry[] = [
	{
		id: "v-1",
		time: "2:19 PM",
		author: "Principal",
		description: "Updated the assignment schedule for Filipino 7 and adjusted the room allocation.",
	},
	{
		id: "v-2",
		time: "12:35 PM",
		author: "Assign Load Manager",
		description: "Reassigned a subject section after load balancing across available faculty.",
	},
	{
		id: "v-3",
		time: "Apr 2, 12:27 PM",
		author: "Principal",
		description: "Added a new subject assignment entry for the selected faculty member.",
	},
	{
		id: "v-4",
		time: "Apr 2, 12:08 AM",
		author: "Assign Load Manager",
		description: "Adjusted the faculty details shown in the load manager preview.",
	},
	{
		id: "v-5",
		time: "Apr 1, 11:39 PM",
		author: "Assign Load Manager",
		description: "Refined the assignment list to match the current demo data.",
	},
	{
		id: "v-6",
		time: "Apr 1, 11:32 AM",
		author: "Principal",
		description: "Created the initial faculty schedule layout for the local demo.",
	},
];

export default function VersionHistory({ isOpen, onClose, selectedFacultyName, selectedSubjectTitle }: VersionHistoryProps) {
	if (!isOpen) {
		return null;
	}

	const subtitle = selectedFacultyName || selectedSubjectTitle || "Recent changes for this record";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
			<div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div className="flex items-start justify-between gap-4 bg-[var(--color-primary)] px-5 py-4">
					<div>
						<h2 className="text-lg font-semibold text-white">Version History</h2>
						<p className="mt-1 text-sm text-white/90">{subtitle}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-2xl leading-none text-white/90 transition hover:text-white"
						aria-label="Close version history"
					>
						×
					</button>
				</div>

				<div className="border-b border-[var(--color-default)] bg-[#ecf8f6] px-5 py-3 text-sm font-medium text-[var(--color-primary)]">
					Only Principal and Load Manager can edit
				</div>

				<div className="flex-1 overflow-y-auto px-5 py-5">
					<div className="relative space-y-5 pl-5">
						<div className="absolute left-[14px] top-2 bottom-2 w-px bg-[var(--color-default)]" />

						{versionEntries.map((entry) => (
							<div key={entry.id} className="relative flex items-start justify-between gap-4">
								<div className="absolute left-[-22px] top-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-[var(--color-primary)] shadow-sm" />
								<div className="min-w-0">
									<p className="text-sm font-semibold text-[var(--color-high-emphasis)]">
										{entry.time}
									</p>
									<p className="text-sm text-[var(--color-low-emphasis)]">
										{entry.author}
									</p>
									<p className="mt-1 text-sm leading-6 text-[var(--color-high-emphasis)]">
										{entry.description}
									</p>
								</div>

								<button
									type="button"
									className="shrink-0 text-sm font-medium transition hover:opacity-80"
									style={{ color: "var(--color-primary)" }}
								>
									Restore
								</button>
							</div>
						))}
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-[var(--color-default)] px-5 py-4">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-high-emphasis)] transition hover:bg-[#ecf8f6]"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
