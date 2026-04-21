"use client";

import App from "next/app";
import LogoContainer from "../tenant-page/LogoContainer";
import NotificationBadge from "./NotificationBadge";
import ProfileBadge from "../Global/ProfileBadge";
import { useState } from "react";
import { AppIcon } from "@/public/icons";

function HeaderTenant() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAnimatingNotification, setIsAnimatingNotification] = useState(false);
  const [isAnimatingProfile, setIsAnimatingProfile] = useState(false);

  const handleToggle = () => {
    // Trigger the badge "pulse" animation
    setIsAnimatingNotification(true);
    setTimeout(() => setIsAnimatingNotification(false), 200);

    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleProfileToggle = () => {
    // Trigger the badge "pulse" animation
    setIsAnimatingProfile(true);
    setTimeout(() => setIsAnimatingProfile(false), 200);

    // Toggle the actual dropdown
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <div>
      <nav className="h-[72px] bg-[var(--color-primary)]">
        <div className="flex h-full w-full items-center justify-between px-4 md:px-6">
          <LogoContainer />
          <div className="flex items-center gap-4">
            <NotificationBadge
              onTrigger={handleToggle}
              active={isAnimatingNotification}
            />
            <div
              className={`
                absolute right-13 mt-45 w-60 bg-[var(--color-card)] border-1 border-[var(--color-primary)] 
                rounded-lg shadow-md z-50 overflow-hidden transition-all duration-300 ease-out
                ${
                  isNotificationOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-4 pointer-events-none"
                }
              `}
            >
              <div className="p-3 border-b font-semibold text-header-large mb-4 flex justify-between items-center">
                Notifications
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="font-bold cursor-pointer"
                >
                  <AppIcon
                    name="close"
                    className="w-4 h-4 text-gray-500 hover:text-gray-700"
                    title="Close Notifications"
                  />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-3 text-sm text-gray-500 mb-5">
                  No notifications
                </div>
              </div>
            </div>

            <div className="w-px h-10 bg-white/30" />
            <ProfileBadge
              onTtrigger={handleProfileToggle}
              active={isAnimatingProfile}
            />
            <div
              className={`
                absolute right-7 mt-40 w-50 bg-[var(--color-card)] border-1 border-[var(--color-primary)] 
                rounded-lg shadow-md z-50 overflow-hidden transition-all duration-300 ease-out
                ${
                  isProfileOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-4 pointer-events-none"
                }
              `}
            >
              <div className="px-3 py-2  font-semibold text-header-large flex justify-between items-center">
                Profile Name
              </div>
              <div className="px-3  text-body-small text-[var(--color-accent)]">
                Position
              </div>

              <div>
                <div className="p-3 text-sm text-[var(--color-primary)] cursor-pointer">
                  Log Out
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default HeaderTenant;
