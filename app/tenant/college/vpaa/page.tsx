import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import AcademicApprovalsDashboard from "@/components/Features/College/academic-approvals/AcademicApprovalsDashboard";
import { ICON_SVGS } from "@/public/icons";

export default function SubjectRoomPage() {
  return (
    <TenantRoleLayout
      tenantType="College"
      role="vpaa"
      title="College Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="higher-dean-vpaa-approvals"
      contentClassName="p-6"
    >
      <AcademicApprovalsDashboard />
    </TenantRoleLayout>
  );
}
