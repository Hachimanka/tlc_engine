import SubjectRoomAssignmentTable from "@/components/Features/College/manage-room/components/SubjectRoomAssignmentTable";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";

export default function CollegeSubjectRoomAssignmentPage() {
  return (
    <TenantRoleLayout
      tenantType="College"
      role="subject-room-assigner"
      title="College Menu"
      iconSvg={ICON_SVGS.flow}
      requiredFeatureKey="higher-subject-room-assignment"
      contentClassName="p-6"
    >
      <SubjectRoomAssignmentTable />
    </TenantRoleLayout>
  );
}
