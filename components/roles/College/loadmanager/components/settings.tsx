"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (form.newPassword !== form.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    // TODO: wire up to API
    alert("Password changed successfully!");
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-[#006B5F] mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#1F2125]">Change Password</h2>

        {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-[#1F2125] mb-1">
              {field === "currentPassword"
                ? "Current Password"
                : field === "newPassword"
                ? "New Password"
                : "Confirm New Password"}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name={field}
              value={form[field]}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006B5F]/30 focus:border-[#006B5F]"
              placeholder="••••••••"
            />
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            className="bg-[#006B5F] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#005549] transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}