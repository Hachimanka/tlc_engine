"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActivityLogsTable from "@/components/superadmin/activitylogs";
import AnalyticsDashboard from "@/components/superadmin/analytics";
import Dashboard from "@/components/superadmin/dashboard";
import DemoRequestTable from "@/components/superadmin/demorequest";
import Navbar from "@/components/Global/navbar";
import OrganizationTable from "@/components/superadmin/organization";
import Sidebar from "@/components/superadmin/sidebar";
import SuperAdminSettings from "@/components/superadmin/settings";
import SubscriptionCards from "@/components/superadmin/subscription";
import { supabase } from "@/lib/supabaseClient";

export default function SuperAdminPage() {
  const [activeKey, setActiveKey] = useState("dashboard");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      const role = (user?.user_metadata as { role?: string } | undefined)?.role;

      if (!user || role !== "superadmin") {
        await supabase.auth.signOut();
        router.replace("/superadmin/login");
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Checking session...</div>
      </div>
    );
  }

  let ContentComponent = null;
  if (activeKey === "dashboard") ContentComponent = <Dashboard onNavigate={setActiveKey} />;
  else if (activeKey === "organizations") ContentComponent = <OrganizationTable />;
  else if (activeKey === "subscription") ContentComponent = <SubscriptionCards />;
  else if (activeKey === "demorequests") ContentComponent = <DemoRequestTable />;
  else if (activeKey === "analytics") ContentComponent = <AnalyticsDashboard />;
  else if (activeKey === "activitylogs") ContentComponent = <ActivityLogsTable />;
  else if (activeKey === "settings") ContentComponent = <SuperAdminSettings />;
  else ContentComponent = <div className="p-8 text-gray-400">Coming soon...</div>;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        onLogout={() => {
          supabase.auth.signOut();
          router.replace("/superadmin/login");
        }}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar activeKey={activeKey} setActiveKey={setActiveKey} />
        <div className="flex-1 overflow-y-auto bg-gray-50">{ContentComponent}</div>
      </div>
    </div>
  );
}
