import { redirect } from "next/navigation";
import Navbar from "@/components/superadmin/navbar";
import Sidebar from "@/components/superadmin/sidebar";

export default function SuperAdminPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {/* ...existing content or routes... */}
        </div>
      </div>
    </div>
  );
}
