"use client";
import SuperAdminLoginPage from "../loginPage";

import { useRouter } from "next/navigation";

export default function SuperAdminLoginRoute() {
  const router = useRouter();
  return <SuperAdminLoginPage onLogin={() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("superadmin_logged_in", "true");
    }
    router.replace("/superadmin");
  }} />;
}
