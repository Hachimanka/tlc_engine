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
import { isRecoverableSupabaseSessionError } from "@/lib/supabaseAuthErrors";
import { supabase } from "@/lib/supabaseClient";

export default function SuperAdminPage() {
  const [activeKey, setActiveKey] = useState("dashboard");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState({
    displayName: "Super Admin",
    email: "",
    avatarUrl: "",
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError && isRecoverableSupabaseSessionError(userError)) {
          await supabase.auth.signOut({ scope: "local" });
          router.replace("/superadmin/login");
          return;
        }

        if (userError) {
          throw userError;
        }

        const user = data?.user;
        const role = (user?.user_metadata as { role?: string } | undefined)?.role;

        if (!user || role !== "superadmin") {
          await supabase.auth.signOut();
          router.replace("/superadmin/login");
          return;
        }

        const metadata = user.user_metadata as { full_name?: string; name?: string };
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        let profilePayload: {
          displayName?: string;
          email?: string;
          avatarUrl?: string;
        } = {};

        if (token) {
          const response = await fetch("/api/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            profilePayload = await response.json().catch(() => ({}));
          }
        }

        setProfile({
          displayName:
            profilePayload.displayName ||
            metadata.full_name ||
            metadata.name ||
            user.email ||
            "Super Admin",
          email: profilePayload.email || user.email || "",
          avatarUrl: profilePayload.avatarUrl || "",
        });
        setCheckingAuth(false);
      } catch {
        router.replace("/superadmin/login");
      }
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
        profile={{
          displayName: profile.displayName,
          email: profile.email,
          roleName: "Super Admin",
          avatarUrl: profile.avatarUrl,
        }}
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
