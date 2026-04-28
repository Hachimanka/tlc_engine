"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActivityLogsTable from "@/components/superadmin/activitylogs";
import AnalyticsDashboard from "@/components/superadmin/analytics";
import Dashboard from "@/components/superadmin/dashboard";
import DemoRequestTable from "@/components/superadmin/demorequest";
import Navbar from "@/components/superadmin/navbar";
import OrganizationTable from "@/components/superadmin/organization";
import Sidebar from "@/components/superadmin/sidebar";
import SuperAdminSettings from "@/components/superadmin/settings";
import SubscriptionCards from "@/components/superadmin/subscription";

export default function SuperAdminPage() {
  const [activeKey, setActiveKey] = useState("dashboard");
  const router = useRouter();

  useEffect(() => {
    const loggedIn = localStorage.getItem("superadmin_logged_in");

    if (loggedIn !== "true") {
      router.replace("/superadmin/login");
    }
  }, [router]);

  let contentComponent = null;

  if (activeKey === "dashboard") contentComponent = <Dashboard />;
  else if (activeKey === "organizations") contentComponent = <OrganizationTable />;
  else if (activeKey === "subscription") contentComponent = <SubscriptionCards />;
  else if (activeKey === "demorequests") contentComponent = <DemoRequestTable />;
  else if (activeKey === "analytics") contentComponent = <AnalyticsDashboard />;
  else if (activeKey === "activitylogs") contentComponent = <ActivityLogsTable />;
  else if (activeKey === "settings") contentComponent = <SuperAdminSettings />;
  else contentComponent = <div className="p-8 text-gray-400">Coming soon...</div>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        onLogout={() => {
          localStorage.removeItem("superadmin_logged_in");
          router.replace("/superadmin/login");
        }}
      />
      <div className="flex flex-1">
        <Sidebar activeKey={activeKey} setActiveKey={setActiveKey} />
        <div className="flex-1 bg-gray-50">{contentComponent}</div>
      </div>
    </div>
  );
}
