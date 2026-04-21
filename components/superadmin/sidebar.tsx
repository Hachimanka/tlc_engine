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
      <div className="relative flex items-center mb-3 px-2 w-full" style={{ height: 32 }}>
        <div className="flex items-center gap-2">
          <button
            className="bg-teal-100 w-10 h-10 rounded-full flex items-center justify-center focus:outline-none z-10"
            onClick={() => setMinimized((m) => !m)}
            aria-label="Toggle sidebar"
            style={{ padding: 0 }}
          >
            <span
              dangerouslySetInnerHTML={{ __html: ICON_SVGS.people }}
              className="w-5 h-5 flex items-center justify-center"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </button>
          <span
            className="text-xl font-bold text-teal-800 whitespace-nowrap transition-opacity duration-300 pl-2"
            style={{ opacity: minimized ? 0 : 1, pointerEvents: minimized ? 'none' : 'auto', lineHeight: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center' }}
          >
            TLC
          </span>
        </div>
      </div>
      {/* Divider */}
      <div className="w-full border-b border-teal-500 mb-2"></div>
      {/* Sidebar Items */}
      <nav className="flex flex-col gap-1 w-full">
        {sidebarItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onMouseDown={activeKey === item.key ? undefined : () => setActiveKey(item.key)}
            tabIndex={activeKey === item.key ? -1 : 0}
            disabled={activeKey === item.key}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-teal-800 w-full focus:bg-teal-100 active:bg-teal-800 active:text-white outline-none ${
              activeKey === item.key
                ? "bg-teal-800 text-white cursor-default pointer-events-none"
                : "hover:bg-teal-50 cursor-pointer"
            }`}
          >
            <span
              className="w-5 h-5 flex items-center justify-center"
              style={{ color: activeKey === item.key ? '#fff' : '#0d9488' }}
              dangerouslySetInnerHTML={{ __html: item.icon }}
            />
            <span
              className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ${minimized ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[160px]'}`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
