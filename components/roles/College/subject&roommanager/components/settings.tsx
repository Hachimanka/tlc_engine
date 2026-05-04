"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import PasswordChangedModal from "./PasswordChangedModal"; // create this if you don't have it yet

export default function SettingsPage() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

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
    setShowSuccess(true);
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1F2125] mb-6">Settings</h1>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-md p-6 space-y-4">

        {/* Card Header */}
        <div className="flex items-center gap-2 mb-2">
          <Lock size={18} className="text-[#006B5F]" />
          <h2 className="text-base font-semibold text-[#1F2125]">Change password</h2>
        </div>

        {/* Fields */}
        <div className="space-y-1">
          <label className="text-sm text-[#1F2125]">Old password</label>
          <input
            type="password"
            name="oldPassword"
            value={form.oldPassword}
            onChange={handleChange}
            placeholder="Enter old password"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#006B5F] focus:ring-1 focus:ring-[#006B5F]/20 transition"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-[#1F2125]">New password</label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#006B5F] focus:ring-1 focus:ring-[#006B5F]/20 transition"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-[#1F2125]">Confirm password</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#006B5F] focus:ring-1 focus:ring-[#006B5F]/20 transition"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          className="w-full py-2.5 bg-[#006B5F] text-white text-sm font-medium rounded-lg hover:bg-[#005549] transition"
        >
          Change password
        </button>
      </div>

      {showSuccess && (
        <PasswordChangedModal onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}