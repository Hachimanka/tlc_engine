import DepedSubjectApprovalsDashboard from "@/components/Features/Deped/subject-approvals/DepedSubjectApprovalsDashboard";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";

export default function DepedSubjectApprovalsPage() {
  return (
    <TenantRoleLayout
      tenantType="Deped"
      role="principal"
      title="Deped Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="deped-subject-approvals"
      contentClassName="p-6"
    >
      <DepedSubjectApprovalsDashboard />
    </TenantRoleLayout>
  );
}
