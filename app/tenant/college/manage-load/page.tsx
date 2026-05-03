import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";

export default function SubjectRoomPage() {
  return (
    <TenantRoleLayout
      tenantType="College"
      role="load-manager"
      title="College Menu"
      iconSvg={ICON_SVGS.menu}
      contentClassName="p-6"
    >
      <div className="text-[28px] font-semibold text-[var(--color-high-emphasis)]">
        LOAD MANAGER
      </div>
    </TenantRoleLayout>
  );
}