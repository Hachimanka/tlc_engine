import RoomScheduleCalendar from "@/components/Features/College/manage-room/components/RoomScheduleCalendar";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";

export default function CollegeRoomSchedulePage() {
  return (
    <TenantRoleLayout
      tenantType="College"
      role="subject-room-assigner"
      title="College Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="higher-room-schedule-calendar"
      contentClassName="p-6"
    >
      <RoomScheduleCalendar />
    </TenantRoleLayout>
  );
}
