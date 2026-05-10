import RoomsTable from "@/components/Features/College/manage-room/components/RoomsTable";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";

export default function CollegeRoomManagementPage() {
  return (
    <TenantRoleLayout
      tenantType="College"
      role="subject-room-manager"
      title="College Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="higher-room-schedule-management"
      contentClassName="p-6"
    >
      <RoomsTable />
    </TenantRoleLayout>
  );
}
