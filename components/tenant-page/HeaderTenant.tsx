"use client";

import LogoContainer from "./LogoContainer";
import NotificationBadge from "./NotificationBadge";
import ProfileBadge from "./ProfileBadge";
import { useState } from "react";

function HeaderTenant() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    // Trigger the badge "pulse" animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);

    // Toggle the actual dropdown
    setIsNotificationOpen(!isNotificationOpen);
  };

  return (
    <div>
      <nav className="h-[72px] bg-[var(--color-primary)]">
        <div className="flex h-full w-full items-center justify-between px-4 md:px-6">
          <LogoContainer />
          <div className="flex items-center gap-4">
            <NotificationBadge onTrigger={handleToggle} active={isAnimating} />
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
                  ✕
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-3 text-sm text-gray-500 mb-5">
                  No notifications
                </div>
              </div>
            </div>

            <div className="w-px h-10 bg-white/30" />
            <ProfileBadge />
          </div>
        </div>
      </nav>
    </div>
  );
}

export default HeaderTenant;
