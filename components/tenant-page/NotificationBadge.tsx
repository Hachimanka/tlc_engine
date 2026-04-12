import { AppIcon } from "@/public/icons";

export const NotificationBadge = () => {
  return (
    <div className="">
      <AppIcon
        name="bell"
        className="rounded-full p-2 flex items-center justify-center bg-[#C5EEEA] [&_svg_path]:stroke-[var(--color-primary)]  w-8 h-8 "
        title="Bell Icon"
      />
    </div>
  );
};

export default NotificationBadge;
