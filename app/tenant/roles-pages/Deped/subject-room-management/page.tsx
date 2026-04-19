import SubjectTable from "@/components/roles/Deped/subject-room-management/components/SubjectTable";
import Navbar from "@/components/Global/navbar";
import Sidebar, { type RoleSidebarItem } from "@/components/roles/sidebar";
import { ICON_SVGS } from "@/public/icons";

const sidebarItems: RoleSidebarItem[] = [
  {
    href: "/tenant/roles-pages/Deped/subject-room-management",
    label: "Subject Management",
    icon: ICON_SVGS.menu,
  },
    {
    href: "#",
    label: "Room Management",
    icon: ICON_SVGS.menu,
  },
  {
    href: "#",
    label: "Settings",
    icon: ICON_SVGS.settings,
  },

];

export default function TenantPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-high-emphasis)]">
      <Navbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar title="Deped Menu" items={sidebarItems} />

        <section className="min-w-0 flex-1 overflow-y-auto px-4 py-4 font-ibm-plex-sans sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-none space-y-4">
            <div>
              <h1 className="text-[28px] font-semibold leading-none text-[var(--color-high-emphasis)]">
                Subject Management
              </h1>
            </div>

            <SubjectTable />
          </div>
        </section>
      </div>
    </main>
  )
}