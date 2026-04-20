"use client";

import { useState } from "react";
import Navbar from "@/components/Global/navbar";
import { LayoutGrid, Send, Settings } from "lucide-react";
import TeachingLoadAssignment from "./TeachingLoadAssignment";
import SendRequest from "./SendRequest";
import SettingsPage from "./settings";

type ActiveTab = "assignment" | "sendrequest" | "settings";

const navItems = [
  { key: "assignment" as ActiveTab, label: "Teaching Load Assignment", icon: <LayoutGrid size={20} /> },
  { key: "sendrequest" as ActiveTab, label: "Send Request", icon: <Send size={20} /> },
  { key: "settings" as ActiveTab, label: "Settings", icon: <Settings size={20} /> },
];

export default function LoadManagerPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("assignment");

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 bg-[#F3F3F1]">
        {/* Sidebar */}
        <aside className="w-[230px] min-h-full bg-white flex flex-col pt-4 px-2 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#C5EEEA] flex items-center justify-center text-[#006B5F]">
              <LayoutGrid size={18} />
            </div>
            <p className="text-sm font-medium text-[#1F2125]">Leonard Forrosuelo</p>
          </div>

          <div className="w-full border-b border-[#C5EEEA] mb-2" />

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
          {activeTab === "assignment" && <TeachingLoadAssignment />}
          {activeTab === "sendrequest" && <SendRequest />}
          {activeTab === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}