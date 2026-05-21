"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type StyledSelectOption = {
	value: string;
	label: string;
};

type StyledSelectProps = {
	value: string;
	options: StyledSelectOption[];
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
};

export default function StyledSelect({
	value,
	options,
	onChange,
	placeholder = "Select option",
	disabled = false,
	className = "",
}: StyledSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const listboxId = useId();
	const selectedOption = options.find((option) => option.value === value);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		const handleKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const moveSelection = (direction: 1 | -1) => {
		if (options.length === 0) {
			return;
		}

		const currentIndex = Math.max(0, options.findIndex((option) => option.value === value));
		const nextIndex = (currentIndex + direction + options.length) % options.length;
		onChange(options[nextIndex].value);
	};

	const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			setIsOpen(true);
			moveSelection(event.key === "ArrowDown" ? 1 : -1);
		}
	};

	return (
		<div ref={rootRef} className={`relative ${className}`}>
			<button
				type="button"
				disabled={disabled}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-controls={listboxId}
				onClick={() => setIsOpen((current) => !current)}
				onKeyDown={handleButtonKeyDown}
				className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-default,#d9e2df)] bg-[var(--color-card,#ffffff)] px-3 text-left text-sm font-medium text-[var(--color-high-emphasis,#1f2937)] outline-none transition hover:border-[var(--color-primary,#007f73)] focus:border-[var(--color-primary,#007f73)] focus:ring-2 focus:ring-[var(--color-default,#d9e2df)] disabled:cursor-not-allowed disabled:bg-[var(--color-background,#f8fafc)] disabled:text-[var(--color-low-emphasis,#8a9099)]"
			>
				<span className={selectedOption ? "truncate" : "truncate text-[var(--color-low-emphasis,#8a9099)]"}>
					{selectedOption?.label ?? placeholder}
				</span>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					fill="none"
					className={`h-4 w-4 shrink-0 text-[var(--color-low-emphasis,#8a9099)] transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				>
					<path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>

			{isOpen && !disabled ? (
				<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[140] overflow-hidden rounded-lg border border-[var(--color-default,#d9e2df)] bg-[var(--color-card,#ffffff)] py-1 shadow-level-2">
					<div id={listboxId} role="listbox" className="max-h-56 overflow-y-auto px-1">
						{options.map((option) => {
							const isSelected = option.value === value;

							return (
								<button
									key={option.value}
									type="button"
									role="option"
									aria-selected={isSelected}
									onClick={() => {
										onChange(option.value);
										setIsOpen(false);
									}}
									className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
										isSelected
											? "bg-[var(--color-default,#e0f4f1)] font-semibold text-[var(--color-primary,#007f73)]"
											: "text-[var(--color-high-emphasis,#1f2937)] hover:bg-[var(--color-background,#ecf8f6)]"
									}`}
								>
									<span className="min-w-0 truncate">{option.label}</span>
									{isSelected ? (
										<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
											<path d="M5 12.5L9.2 16.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									) : null}
								</button>
							);
						})}
					</div>
				</div>
			) : null}
		</div>
	);
}
