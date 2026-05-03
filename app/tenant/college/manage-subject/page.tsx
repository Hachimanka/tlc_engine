import SubjectRoomManagerPage from "@/components/Features/College/manage-subject/components/SubjectRoomManagerPage";
import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import { ICON_SVGS } from "@/public/icons";

export default function Page() {
  return (
    <TenantRoleLayout
      tenantType="College"
      role="subject-room-manager"
      title="College Menu"
      iconSvg={ICON_SVGS.menu}
      contentClassName="p-6"
    >
      <SubjectRoomManagerPage />
    </TenantRoleLayout>
  );
}
