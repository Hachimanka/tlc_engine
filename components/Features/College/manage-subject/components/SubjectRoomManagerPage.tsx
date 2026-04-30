"use client";

import { useState } from "react";
import { LayoutGrid, Building2, Settings } from "lucide-react";
import Navbar from "@/components/Global/navbar";
import SubjectManagementTable from "./SubjectManagementTable";
import RoomsTable from "@/components/Features/College/manage-room/components/RoomsTable";
import SettingsPage from "./settings";

type ActiveTab = "subjects" | "rooms" | "settings";

const navItems = [
  { key: "subjects" as ActiveTab, label: "Subject Management", icon: <LayoutGrid size={20} /> },
  { key: "rooms" as ActiveTab, label: "Room Management", icon: <Building2 size={20} /> },
  { key: "settings" as ActiveTab, label: "Settings", icon: <Settings size={20} /> },
];

export default function SubjectRoomManagerPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("subjects");

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex flex-1 bg-[#F3F3F1]">
        {/* Sidebar */}
        <aside className="w-[230px] min-h-full bg-white flex flex-col shrink-0 border-r border-gray-200">
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
            <div className="w-9 h-9 rounded-full bg-[#e6f4f2] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#006B5F]" stroke="currentColor" strokeWidth={1.8}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#1F2125]">Leonard Forrosuelo</p>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 p-3 pt-4">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all w-full text-left
                  ${activeTab === item.key
                    ? "bg-[#006B5F] text-white"
                    : "text-[#1F2125] hover:bg-gray-100"
                  }`}
              >
                <span className={activeTab === item.key ? "text-white" : "text-[#006B5F]"}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === "subjects" && <SubjectManagementTable />}
          {activeTab === "rooms" && <RoomsTable />}
          {activeTab === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
