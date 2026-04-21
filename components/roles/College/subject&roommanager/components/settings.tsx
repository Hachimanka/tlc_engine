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
      <h1 className="text-[28px] font-bold text-[#1F2125] mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-sm">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-[#006B5F]" />
          <h2 className="text-base font-semibold text-[#1F2125]">Change password</h2>
        </div>

        <div className="space-y-4">
          {[
            { name: "oldPassword", label: "Old password", placeholder: "Enter old password" },
            { name: "newPassword", label: "New password", placeholder: "Enter new password" },
            { name: "confirmPassword", label: "Confirm password", placeholder: "Confirm password" },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm text-[#1F2125] mb-1">{label}</label>
              <input
                type="password"
                name={name}
                value={(form as any)[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full border border-[#C5EEEA] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#006B5F] placeholder:text-gray-300"
              />
            </div>
          ))}

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs font-medium text-[#006B5F]">✓ Password changed successfully!</p>}

          <button
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#006B5F] text-white hover:bg-[#005a4f] transition-colors"
          >
            Change password
          </button>
        </div>
      </div>
    </div>
  );
}