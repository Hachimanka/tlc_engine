"use client";
import { AppIcon } from "@/public/icons";

interface NotifBoxProps {
  onTrigger: () => void;
  active: boolean; // Add this prop
}

export default function NotifBox({ onTrigger, active }: NotifBoxProps) {
  return (
    <div className="">
      <button
        onClick={onTrigger}
        // Use active state to trigger a scale effect
        className={`transition-transform duration-200 ${active ? "scale-90" : "scale-100"}`}
      >
        <AppIcon
          name="bell"
          className="rounded-full p-2 flex items-center justify-center bg-[#C5EEEA] [&_svg_path]:stroke-[var(--color-primary)] w-8 h-8 cursor-pointer hover:bg-[#C5EEEA]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
          title="Bell Icon"
        />
      </button>
    </div>
  );
}
