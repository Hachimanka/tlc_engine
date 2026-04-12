import { AppIcon } from "@/public/icons";
import { NotificationBadge } from "./NotificationBadge";

export const ProfileBadge = () => {
  return (
    <div className="rounded-full border border-white/15 bg-white  px-1 py-1 flex items-center justify-start text-body-medium text-[var(--high-emphasis)] ">
      <AppIcon
        name="people"
        className="rounded-full p-2 flex items-center justify-center [&_svg_path]:stroke-[var(--color-primary)] bg-[#C5EEEA] text-white w-8 h-8"
        title="People Icon"
      />
      <div className="px-3 mr-2">Leonard Forrosuelo</div>
    </div>
  );
};

export default ProfileBadge;
