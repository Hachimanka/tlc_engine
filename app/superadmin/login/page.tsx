"use client";
import SuperAdminLoginPage from "../loginPage";

import { useRouter } from "next/navigation";

export default function SuperAdminLoginRoute() {
  const router = useRouter();
  return (
    <SuperAdminLoginPage
      onLogin={() => {
        router.replace("/superadmin");
      }}
    />
  );
}
