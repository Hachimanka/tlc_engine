import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
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
      <div className="text-[28px] font-semibold text-[var(--color-high-emphasis)]">
        VPAA
      </div>
    </TenantRoleLayout>
  );
}
