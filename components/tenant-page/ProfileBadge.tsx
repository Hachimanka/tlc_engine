import { AppIcon } from "@/public/icons";

interface ProfileBadgeProps {
  onTtrigger: () => void;
  active: boolean; // Add this prop
}

export default function ProfileBadge({
  onTtrigger,
  active,
}: ProfileBadgeProps) {
  return (
    <div
      onClick={onTtrigger}
      className={`transition-transform duration-200 ${active ? "scale-90" : "scale-95"}`}
    >
      <div className="rounded-full border border-white/15 bg-white  px-1 py-1 flex items-center justify-start text-body-medium text-[var(--high-emphasis)] cursor-pointer hover:bg-white/90 transition-colors duration-200">
        <div>
          <AppIcon
            name="people"
            className="rounded-full p-2 flex items-center justify-center [&_svg_path]:stroke-[var(--color-primary)] bg-[#C5EEEA] text-white w-8 h-8"
            title="People Icon"
          />
        </div>
        <div className="px-3 mr-2">Leonard Forrosuelo</div>
      </div>
    </div>
  );
}
