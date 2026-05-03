"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TenantOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/tenant/login");
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleFinish = async () => {
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        first_login: false,
        onboarding_complete: true,
      },
    });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace("/tenant/tenant-admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading onboarding...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-teal-800">Institution Onboarding</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete the setup to unlock your admin dashboard.
        </p>

        <ol className="mt-6 space-y-3 text-sm text-gray-700">
          <li>1. Update your temporary password</li>
          <li>2. Confirm profile information</li>
          <li>3. Add departments</li>
          <li>4. Add instructors</li>
          <li>5. Set academic year</li>
        </ol>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleFinish}
            className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : "Finish Onboarding"}
          </button>
        </div>
      </div>
    </div>
  );
}
