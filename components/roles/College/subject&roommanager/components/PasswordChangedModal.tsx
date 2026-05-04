"use client";

import { CheckCircle2, X } from "lucide-react";

type Props = { onClose: () => void };

export default function PasswordChangedModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[360px] p-8 relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>

        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle2 size={36} className="text-green-500" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#1F2125] mb-2">Success!</h2>
        <p className="text-sm text-gray-500 mb-6">Your password has been successfully changed.</p>

        <button
          onClick={onClose}
          className="px-8 py-2.5 bg-[#006B5F] text-white text-sm font-medium rounded-lg hover:bg-[#005549] transition"
        >
          OK
        </button>
      </div>
    </div>
  );
}