"use client";

import LogoContainer from "./LogoContainer";
import NotificationBadge from "./NotificationBadge";
import ProfileBadge from "./ProfileBadge";

function HeaderTenant() {
  return (
    <nav className="h-[72px] bg-[var(--color-primary)]">
      <div className="flex h-full w-full items-center justify-between px-4 md:px-6">
        <LogoContainer />
        <div className="flex items-center gap-4">
          <NotificationBadge />
          <div className="w-px h-10 bg-white/30" />
          <ProfileBadge />
        </div>
      </div>
    </nav>
  );
}

export default HeaderTenant;
