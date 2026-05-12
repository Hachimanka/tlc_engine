"use client";
import { useEffect, useState } from "react";
import { ICON_SVGS } from "@/public/icons";


export interface SidebarItem {
  key: string;
  label: string;
  icon?: string;
}

interface SidebarProps {
  activeKey: string;
  setActiveKey: (key: string) => void;
  items?: SidebarItem[];
  title?: string;
  iconSvg?: string;
  profile?: Partial<SidebarProfile>;
}

type SidebarProfile = {
  displayName: string;
  email: string;
  roleName: string;
  avatarUrl: string;
};

const defaultSidebarItems: SidebarItem[] = [
  { key: "dashboard", label: "Dashboard", icon: ICON_SVGS.menu },
  { key: "organizations", label: "Organizations", icon: ICON_SVGS.people },
  { key: "subscription", label: "Subscription", icon: ICON_SVGS.subscription },
  { key: "demorequests", label: "Demo Requests", icon: ICON_SVGS.file },
  { key: "analytics", label: "Analytics", icon: ICON_SVGS.analytics },
  { key: "activitylogs", label: "Activity Logs", icon: ICON_SVGS.files },
  { key: "settings", label: "Settings", icon: ICON_SVGS.settings },
];

const getRoleFallback = (title: string) => title.replace(/\s+menu$/i, "").trim();

export default function Sidebar({
  activeKey,
  setActiveKey,
  items,
  title = "Super Admin",
  iconSvg,
  profile: profileInput,
}: SidebarProps) {
  const [minimized, setMinimized] = useState(false);
  const [profileOverride, setProfileOverride] = useState<Partial<SidebarProfile>>({});
  const sidebarItems = items || defaultSidebarItems;
  const fallbackRoleName = getRoleFallback(title);
  const profile = {
    displayName: "User",
    email: "",
    roleName: fallbackRoleName,
    avatarUrl: "",
    ...profileInput,
    ...profileOverride,
  };
  const displayName = profile.displayName || "User";
  const displayRole = profile.roleName || fallbackRoleName;
  const profileFallbackIcon = ICON_SVGS.user || iconSvg || ICON_SVGS.people;

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<Partial<SidebarProfile>>).detail;
      if (detail) {
        setProfileOverride((current) => ({
          ...current,
          displayName: detail.displayName ?? current.displayName,
          avatarUrl: detail.avatarUrl ?? current.avatarUrl,
        }));
      }
    };

    window.addEventListener("tlc-profile-updated", handleProfileUpdated);

    return () => window.removeEventListener("tlc-profile-updated", handleProfileUpdated);
  }, []);

  return (
    <aside
      className={`${minimized ? "w-[4.5rem]" : "w-64"} min-h-screen shrink-0 overflow-hidden bg-[var(--color-card)] flex flex-col items-start py-4 px-2 shadow-md transition-all duration-300`}
    >
      <div className="w-full px-1 pb-3">
        <div
          className={`flex w-full items-center rounded-lg px-2 py-2 transition-all duration-300 ${
            minimized ? "justify-center" : "gap-3"
          }`}
        >
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-default)] text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-default)]"
            onClick={() => setMinimized((m) => !m)}
            aria-label="Toggle sidebar"
            title={`${displayName}${displayRole ? ` - ${displayRole}` : ""}`}
            type="button"
          >
            {profile.avatarUrl ? (
              <span
                className="h-11 w-11 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url("${profile.avatarUrl}")` }}
                aria-hidden="true"
              />
            ) : (
              <span
                dangerouslySetInnerHTML={{ __html: profileFallbackIcon }}
                className="themed-svg-icon flex h-5 w-5 items-center justify-center"
              />
            )}
          </button>

          {!minimized ? (
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-bold leading-5 text-[var(--color-primary)]"
                title={displayName}
              >
                {displayName}
              </p>
              <p
                className="mt-0.5 max-w-full overflow-hidden break-words text-[11px] font-semibold leading-[14px] text-[var(--color-light-primary)]"
                title={displayRole}
                style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                }}
              >
                {displayRole}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="w-full border-b border-[var(--color-primary)] mb-2"></div>
      <nav className="flex flex-col gap-1 w-full">
        {sidebarItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveKey(item.key)}
            tabIndex={activeKey === item.key ? -1 : 0}
            disabled={activeKey === item.key}
            className={`flex min-h-11 items-center rounded-lg text-[var(--color-primary)] w-full focus:bg-[var(--color-default)] active:bg-[var(--color-primary)] active:text-white outline-none ${
              minimized ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
            } ${
              activeKey === item.key
                ? "bg-[var(--color-primary)] text-white cursor-default pointer-events-none"
                : "hover:bg-[var(--color-default)] cursor-pointer"
            }`}
          >
            {item.icon && (
              <span
                className="themed-svg-icon w-5 h-5 flex items-center justify-center"
                style={{ color: activeKey === item.key ? "#fff" : "var(--color-primary)" }}
                dangerouslySetInnerHTML={{ __html: item.icon }}
              />
            )}
            <span
              className={`min-w-0 text-left text-xs font-semibold leading-4 transition-all duration-300 ${
                minimized ? "w-0 opacity-0" : "flex-1 opacity-100"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
