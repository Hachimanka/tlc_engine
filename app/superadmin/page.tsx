
"use client";



import Navbar from "@/components/superadmin/navbar";
import Sidebar from "@/components/superadmin/sidebar";
import Dashboard from "@/components/superadmin/dashboard";
import OrganizationTable from "@/components/superadmin/organization";
import SubscriptionCards from "@/components/superadmin/subscription";
import DemoRequestTable from "@/components/superadmin/demorequest";
import AnalyticsDashboard from "@/components/superadmin/analytics";
import ActivityLogsTable from "@/components/superadmin/activitylogs";
import SuperAdminSettings from "@/components/superadmin/settings";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminPage() {
  const [activeKey, setActiveKey] = useState("dashboard");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("superadmin_logged_in");
      if (loggedIn !== "true") {
        router.replace("/superadmin/login");
      }
    }
  }, [router]);

  let ContentComponent = null;
  if (activeKey === "dashboard") ContentComponent = <Dashboard />;
  else if (activeKey === "organizations") ContentComponent = <OrganizationTable />;
  else if (activeKey === "subscription") ContentComponent = <SubscriptionCards />;
  else if (activeKey === "demorequests") ContentComponent = <DemoRequestTable />;
  else if (activeKey === "analytics") ContentComponent = <AnalyticsDashboard />;
  else if (activeKey === "activitylogs") ContentComponent = <ActivityLogsTable />;
  else if (activeKey === "settings") ContentComponent = <SuperAdminSettings />;
  else ContentComponent = <div className="p-8 text-gray-400">Coming soon...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onLogout={() => {
        localStorage.removeItem("superadmin_logged_in");
        router.replace("/superadmin/login");
      }} />
      <div className="flex flex-1">
        <Sidebar activeKey={activeKey} setActiveKey={setActiveKey} />
        <div className="flex-1 bg-gray-50">
          {ContentComponent}
        </div>
      </div>
    </div>
  );
}
