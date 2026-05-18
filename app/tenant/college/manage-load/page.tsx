import TenantRoleLayout from "@/components/Global/TenantRoleLayout";
import DepartmentFacultyTable from "@/components/Features/College/manage-load/components/DepartmentFacultyTable";
import { ICON_SVGS } from "@/public/icons";

export default function SubjectRoomPage() {
  return (
    <TenantRoleLayout
      tenantType="College"
      role="load-manager"
      title="College Menu"
      iconSvg={ICON_SVGS.menu}
      requiredFeatureKey="higher-faculty-load-assignment"
      contentClassName="px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1180px]">
        <DepartmentFacultyTable />
      </div>
    </TenantRoleLayout>
  );
}
