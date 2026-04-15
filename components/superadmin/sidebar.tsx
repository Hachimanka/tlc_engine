"use client";
import { useState } from "react";
import { ICON_SVGS } from "@/public/icons";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: ICON_SVGS.menu },
  { key: "organizations", label: "Organizations", icon: ICON_SVGS.people },
  { key: "subscription", label: "Subscription", icon: ICON_SVGS.subscription },
  { key: "demorequests", label: "Demo Requests", icon: ICON_SVGS.file },
  { key: "analytics", label: "Analytics", icon: ICON_SVGS.analytics },
  { key: "activitylogs", label: "Activity Logs", icon: ICON_SVGS.files },
  { key: "settings", label: "Settings", icon: ICON_SVGS.settings },
];

export default function Sidebar() {
  const [minimized, setMinimized] = useState(false);
  const [activeKey, setActiveKey] = useState("dashboard");

  return (
    <aside
      className={`${minimized ? "w-18" : "w-58"} min-h-screen bg-white flex flex-col items-start py-4 px-2 shadow-md transition-all duration-300`}
    >
      {/* Header: Icon and TLC text horizontally */}
      <div className="relative flex items-center mb-6 px-2 w-full" style={{ height: 40 }}>
        <button
          className="bg-teal-100 w-10 h-10 rounded-full flex items-center justify-center focus:outline-none z-10"
          onClick={() => setMinimized((m) => !m)}
          aria-label="Toggle sidebar"
        >
          <span
            dangerouslySetInnerHTML={{ __html: ICON_SVGS.people }}
            className="w-5 h-5 flex items-center justify-center"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </button>
        {/* Reserve space for TLC text, absolutely position for no layout shift */}
        <span
          className="absolute left-14 top-1/2 -translate-y-1/2 text-2xl font-bold text-teal-800 whitespace-nowrap transition-opacity duration-300"
          style={{ opacity: minimized ? 0 : 1, pointerEvents: minimized ? 'none' : 'auto' }}
        >
          TLC
        </span>
      </div>
      {/* Sidebar Items */}
      <nav className="flex flex-col gap-1 w-full">
        {sidebarItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveKey(item.key)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-teal-800 transition-colors w-full hover:bg-teal-50 focus:bg-teal-100 outline-none ${
              activeKey === item.key ? "bg-teal-800 text-white" : ""
            }`}
          >
            <span
              className="w-5 h-5 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: item.icon }}
            />
            <span
              className={`text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ${minimized ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[160px]'}`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
