"use client";

import { useState } from "react";
import Navbar from "@/components/Global/navbar";
import { LayoutGrid, Building2, Settings } from "lucide-react";
import SubjectManagementTable from "./components/SubjectManagementTable";
import RoomsTable from "./components/RoomsTable";
import SettingsPage from "./components/settings";

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
        <aside className="w-[230px] min-h-full bg-white flex flex-col pt-4 px-2 shrink-0">
          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#C5EEEA] flex items-center justify-center text-[#006B5F]">
              <LayoutGrid size={18} />
            </div>
            <p className="text-sm font-medium text-[#1F2125]">Leonard Forrosuelo</p>
          </div>

          <div className="w-full border-b border-[#C5EEEA] mb-2" />

          {/* Nav Items */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full text-left
                  ${activeTab === item.key
                    ? "bg-[#006B5F] text-white"
                    : "text-[#1F2125] hover:bg-[#C5EEEA]/30"
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