"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = () => {
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSuccess(true);
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1F2125] mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-[#C5EEEA] p-6 max-w-sm">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Lock size={18} className="text-[#006B5F]" />
          <h2 className="text-base font-semibold text-[#1F2125]">Change password</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#1F2125] mb-1">Old password</label>
            <input
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              placeholder="Enter old password"
              className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
            />
          </div>

          <div>
            <label className="block text-sm text-[#1F2125] mb-1">New password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
            />
          </div>

          <div>
            <label className="block text-sm text-[#1F2125] mb-1">Confirm password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className="w-full border border-[#C5EEEA] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-[#006B5F] text-xs font-medium">✓ Password changed successfully!</p>}

          <button
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f] transition-colors mt-2"
          >
            Change password
          </button>
        </div>
      </div>
    </div>
  );
}