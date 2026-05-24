"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  readSuperAdminNotificationPreferences,
  SUPERADMIN_NOTIFICATION_PREFERENCES_UPDATED_EVENT,
} from "@/lib/superadminNotificationPreferences";
import { supabase } from "@/lib/supabaseClient";
import type { TenantBranding } from "@/lib/tenantBranding";
import { ICON_SVGS } from "@/public/icons";

type NavbarProps = {
  onLogout?: () => void;
  profile?: Partial<NavbarProfile>;
  branding?: Partial<TenantBranding> | null;
  organizationName?: string;
  organizationSlug?: string;
};

type NavbarProfile = {
  displayName: string;
  email: string;
  roleName: string;
  avatarUrl: string;
};

type NavbarNotification = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: "success" | "failed" | "warning" | "info";
  href?: string;
  superAdminSection?: string;
};

type ActivityLogPayload = {
  id?: string;
  action?: string;
  target?: string | null;
  target_type?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type AcademicApprovalPayload = {
  id?: string;
  subjectCode?: string | null;
  subjectTitle?: string | null;
  status?: string | null;
  requestType?: string | null;
  submittedBy?: { name?: string | null } | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  canAct?: boolean;
};

type DemoRequestPayload = {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  institution_name?: string | null;
  status?: string | null;
  created_at?: string | null;
};

const defaultProfile: NavbarProfile = {
  displayName: "User",
  email: "",
  roleName: "",
  avatarUrl: "",
};

const READ_NOTIFICATION_KEY_PREFIX = "tlc:navbar-notifications:read:";

const normalizeNotificationStatus = (status: unknown): NavbarNotification["status"] => {
  if (status === "failed" || status === "warning" || status === "info" || status === "success") {
    return status;
  }

  return "info";
};

const formatNotificationTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const notificationStatusClass: Record<NavbarNotification["status"], string> = {
  success: "bg-emerald-500",
  failed: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
};

const getSuperAdminSectionForActivity = (targetType: string, action: string) => {
  if (targetType.includes("demo") || action.includes("demo")) return "demorequests";
  if (targetType.includes("organization") || action.includes("organization")) return "organizations";
  if (targetType.includes("subscription") || action.includes("subscription") || action.includes("plan")) return "subscription";
  if (targetType.includes("analytics") || action.includes("analytics")) return "analytics";
  if (targetType.includes("setting") || action.includes("setting")) return "settings";
  return "activitylogs";
};

export default function Navbar({
  onLogout,
  profile: profileInput,
  branding,
  organizationName,
  organizationSlug,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NavbarNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationStorageKey, setNotificationStorageKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileOverride, setProfileOverride] = useState<Partial<NavbarProfile>>({});
  const [draftName, setDraftName] = useState("");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState("");
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);
  const profile = {
    ...defaultProfile,
    ...profileInput,
    ...profileOverride,
  };
  const logoUrl = branding?.logoUrl || "";
  const logoAlt = branding?.logoAlt || "TLC Logo";
  const hasTenantBrand = Boolean(organizationName || logoUrl);
  const tenantBrandName = organizationName || logoAlt || "Institution Workspace";
  const normalizedOrganizationSlug = organizationSlug?.trim();
  const unreadNotificationCount = notifications.filter(
    (notification) => !readNotificationIds.includes(notification.id),
  ).length;

  const clearAvatarObjectUrl = () => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
  };

  const resolveLogoutRedirect = () => {
    if (pathname?.startsWith("/superadmin")) return "/superadmin/login";
    if (normalizedOrganizationSlug) {
      return `/login?slug=${encodeURIComponent(normalizedOrganizationSlug)}`;
    }
    if (pathname?.startsWith("/tenant")) return "/login";
    return "/";
  };

  const requestLogout = () => {
    setShowMenu(false);
    setIsLogoutConfirmOpen(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      if (onLogout) {
        await Promise.resolve(onLogout());
        return;
      }

      await supabase.auth.signOut();
      router.replace(resolveLogoutRedirect());
    } catch {
      setIsLoggingOut(false);
    }
  };

  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    setNotificationError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      const token = session?.access_token;
      const user = session?.user;

      if (!token || !user) {
        setNotifications([]);
        setIsLoadingNotifications(false);
        return;
      }

      const userKey = user.id || user.email || profile.email || "anonymous";
      const storageKey = `${READ_NOTIFICATION_KEY_PREFIX}${userKey}`;
      setNotificationStorageKey(storageKey);

      try {
        const storedIds = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
        setReadNotificationIds(Array.isArray(storedIds) ? storedIds.filter((id): id is string => typeof id === "string") : []);
      } catch {
        setReadNotificationIds([]);
      }

      const nextNotifications: NavbarNotification[] = [];
      const role = (user.user_metadata as { role?: string } | undefined)?.role;

      if (role === "superadmin" || pathname?.startsWith("/superadmin")) {
        const preferences = readSuperAdminNotificationPreferences();

        if (preferences.demoRequests) {
          const { data: demoRequests } = await supabase
            .from("demo_requests")
            .select("id, full_name, email, institution_name, status, created_at")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(10);

          for (const request of (demoRequests ?? []) as DemoRequestPayload[]) {
            const createdAt = request.created_at || new Date().toISOString();
            nextNotifications.push({
              id: `demo-request:${request.id ?? `${request.email ?? "demo"}:${createdAt}`}`,
              title: "New demo request",
              description: `${request.institution_name || "Unknown institution"}${request.full_name ? ` from ${request.full_name}` : ""}`,
              createdAt,
              status: "warning",
              superAdminSection: "demorequests",
            });
          }
        }

        const response = await fetch("/api/superadmin/activity-logs?limit=10", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => ({}));

        if (response.ok) {
          for (const log of (payload.logs ?? []) as ActivityLogPayload[]) {
            const targetType = log.target_type?.toLowerCase() ?? "";
            const action = log.action?.toLowerCase() ?? "";
            const status = normalizeNotificationStatus(log.status);
            const isOrganizationEvent =
              targetType.includes("organization") || action.includes("organization");
            const isSubscriptionEvent =
              targetType.includes("subscription") || action.includes("subscription") || action.includes("plan");
            const isLoginEvent = targetType.includes("session") || action.includes("logged in");
            const isSystemAlert = status === "failed" || status === "warning";

            if (isOrganizationEvent && !preferences.newOrganizations) continue;
            if (isSubscriptionEvent && !preferences.subscriptions) continue;
            if (isLoginEvent && !preferences.loginAlerts) continue;
            if (isSystemAlert && !preferences.systemAlerts) continue;

            const createdAt = log.created_at || new Date().toISOString();
            const superAdminSection = getSuperAdminSectionForActivity(targetType, action);
            nextNotifications.push({
              id: `activity:${log.id ?? `${log.action ?? "activity"}:${createdAt}`}`,
              title: log.action || "Super admin activity",
              description: [log.target, log.target_type].filter(Boolean).join(" • ") || "Recent platform activity",
              createdAt,
              status,
              superAdminSection,
            });
          }
        }
      } else {
        const meResponse = await fetch("/api/tenant/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mePayload = await meResponse.json().catch(() => ({}));

        if (meResponse.ok) {
          const plan = mePayload.org?.subscriptionPlan;
          if (mePayload.isOrgAdmin && plan) {
            nextNotifications.push({
              id: `tenant-plan:${mePayload.org?.id ?? userKey}:${plan}`,
              title: "Subscription active",
              description: `${mePayload.org?.name ?? "Your institution"} is currently on the ${plan} plan.`,
              createdAt: new Date().toISOString(),
              status: "info",
              href: "/tenant/tenant-admin",
            });
          }

          if (mePayload.isOrgAdmin && Array.isArray(mePayload.availableFeatures)) {
            nextNotifications.push({
              id: `tenant-features:${mePayload.org?.id ?? userKey}:${mePayload.availableFeatures.length}`,
              title: "Feature access ready",
              description: `${mePayload.availableFeatures.length} workspace features are available for this institution.`,
              createdAt: new Date().toISOString(),
              status: "success",
              href: "/tenant/tenant-admin",
            });
          }

          if (
            mePayload.org?.institutionType === "higher_ed" &&
            (mePayload.isOrgAdmin || (mePayload.enabledFeatureKeys ?? []).includes("higher-dean-vpaa-approvals"))
          ) {
            const approvalsResponse = await fetch("/api/tenant/academic-approvals", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const approvalsPayload = await approvalsResponse.json().catch(() => ({}));

            if (approvalsResponse.ok) {
              const pendingApprovals = ((approvalsPayload.requests ?? []) as AcademicApprovalPayload[])
                .filter((request) => {
                  const status = request.status?.toLowerCase() ?? "";
                  return status && !["approved", "rejected", "cancelled"].includes(status);
                })
                .slice(0, 8);

              for (const request of pendingApprovals) {
                const title = request.canAct ? "Approval needs your review" : "Academic approval pending";
                const subject = [request.subjectCode, request.subjectTitle].filter(Boolean).join(" - ");
                const createdAt = request.updatedAt || request.createdAt || new Date().toISOString();

                nextNotifications.push({
                  id: `approval:${request.id ?? `${subject}:${createdAt}`}`,
                  title,
                  description: subject || request.requestType || "Academic approval request",
                  createdAt,
                  status: request.canAct ? "warning" : "info",
                  href: "/tenant/college/dean",
                });
              }
            }
          }
        }
      }

      setNotifications(nextNotifications);
    } catch {
      setNotificationError("Unable to load notifications.");
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const toggleNotifications = () => {
    setShowMenu(false);
    setShowNotifications((current) => {
      const next = !current;

      if (next) {
        void loadNotifications();
      }

      return next;
    });
  };

  const markAllNotificationsRead = () => {
    const nextIds = Array.from(new Set([...readNotificationIds, ...notifications.map((notification) => notification.id)]));
    setReadNotificationIds(nextIds);

    if (notificationStorageKey) {
      window.localStorage.setItem(notificationStorageKey, JSON.stringify(nextIds));
    }
  };

  const handleNotificationClick = (notification: NavbarNotification) => {
    const nextIds = Array.from(new Set([...readNotificationIds, notification.id]));
    setReadNotificationIds(nextIds);

    if (notificationStorageKey) {
      window.localStorage.setItem(notificationStorageKey, JSON.stringify(nextIds));
    }

    if (notification.href) {
      setShowNotifications(false);
      router.push(notification.href);
      return;
    }

    if (notification.superAdminSection) {
      setShowNotifications(false);
      window.dispatchEvent(
        new CustomEvent("tlc-superadmin-navigate", {
          detail: { section: notification.superAdminSection },
        }),
      );
    }
  };

  const openSettings = () => {
    clearAvatarObjectUrl();
    setDraftName(profile.displayName);
    setDraftAvatarUrl(profile.avatarUrl);
    setDraftAvatarFile(null);
    setSettingsError("");
    setSettingsSuccess("");
    setShowMenu(false);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    clearAvatarObjectUrl();
    setDraftAvatarFile(null);
    setIsSettingsOpen(false);
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSettingsError("Please choose an image file.");
      return;
    }

    if (file.size > 750_000) {
      setSettingsError("Please choose an image below 750 KB.");
      return;
    }

    clearAvatarObjectUrl();
    const nextPreviewUrl = URL.createObjectURL(file);
    avatarObjectUrlRef.current = nextPreviewUrl;
    setDraftAvatarFile(file);
    setDraftAvatarUrl(nextPreviewUrl);
    setSettingsError("");
    setSettingsSuccess("");
  };

  const handleSaveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSettingsError("");
    setSettingsSuccess("");

    const nextName = draftName.trim();
    if (!nextName) {
      setSettingsError("Name is required.");
      return;
    }

    setIsSavingSettings(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setSettingsError("Your session expired. Please log in again.");
        setIsSavingSettings(false);
        return;
      }

      const formData = new FormData();
      formData.set("displayName", nextName);

      if (draftAvatarFile) {
        formData.set("avatar", draftAvatarFile);
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSettingsError(payload?.error || "Failed to update profile.");
        setIsSavingSettings(false);
        return;
      }

      const nextAvatarUrl = payload?.avatarUrl || "";
      const savedName = payload?.displayName || nextName;
      clearAvatarObjectUrl();
      setDraftAvatarFile(null);
      setDraftAvatarUrl(nextAvatarUrl);

      setProfileOverride((current) => ({
        ...current,
        displayName: savedName,
        avatarUrl: nextAvatarUrl,
      }));
      window.dispatchEvent(
        new CustomEvent("tlc-profile-updated", {
          detail: {
            displayName: savedName,
            avatarUrl: nextAvatarUrl,
          },
        }),
      );
      setSettingsSuccess("Profile updated.");
    } catch {
      setSettingsError("Unable to save profile. Please check your connection and try again.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<Partial<NavbarProfile>>).detail;

      if (!detail) {
        return;
      }

      setProfileOverride((current) => ({
        ...current,
        displayName: detail.displayName ?? current.displayName,
        avatarUrl: detail.avatarUrl ?? current.avatarUrl,
      }));
    };

    window.addEventListener("tlc-profile-updated", handleProfileUpdated);

    return () => window.removeEventListener("tlc-profile-updated", handleProfileUpdated);
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    if (showMenu || showNotifications) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu, showNotifications]);

  useEffect(() => {
    const handlePreferencesUpdated = () => {
      void loadNotifications();
    };

    window.addEventListener(
      SUPERADMIN_NOTIFICATION_PREFERENCES_UPDATED_EVENT,
      handlePreferencesUpdated,
    );

    return () =>
      window.removeEventListener(
        SUPERADMIN_NOTIFICATION_PREFERENCES_UPDATED_EVENT,
        handlePreferencesUpdated,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
    <nav className="h-15 flex items-center justify-between bg-[var(--color-primary)] px-4">
      <div className="ml-2 flex min-w-0 items-center gap-2 sm:ml-10">
        {hasTenantBrand ? (
          <div className="flex h-12 min-w-0 max-w-[min(360px,calc(100vw-11rem))] items-center gap-3 py-1.5 text-white">
            {logoUrl ? (
              <span
                className="h-9 w-9 shrink-0 rounded-md bg-white bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${logoUrl}")` }}
                role="img"
                aria-label={logoAlt}
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center text-white">
                <span
                  className="themed-svg-icon flex h-5 w-5 items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: ICON_SVGS.settings }}
                />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-5" title={tenantBrandName}>
                {tenantBrandName}
              </p>
              <p className="truncate text-[11px] font-semibold leading-4 text-white/75">
                Branded workspace
              </p>
            </div>
          </div>
        ) : (
          <Image src="/navbar/tlclogo.png" alt="Logo" width={40} height={40} />
        )}
      </div>

      <div className="flex items-center gap-4 mr-16">
        <div className="relative flex items-center justify-center" ref={notificationRef}>
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Open notifications"
            aria-expanded={showNotifications}
          >
            <Image
              src="/navbar/Notification.png"
              alt=""
              width={24}
              height={24}
              aria-hidden="true"
            />
            {unreadNotificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--color-primary)]">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            ) : null}
          </button>

          {showNotifications ? (
            <div className="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
                  <p className="text-xs text-gray-500">
                    {unreadNotificationCount > 0
                      ? `${unreadNotificationCount} unread`
                      : "All caught up"}
                  </p>
                </div>
                {unreadNotificationCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[#ecf8f6]"
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="px-4 py-6 text-sm text-gray-500">Loading notifications...</div>
                ) : notificationError ? (
                  <div className="px-4 py-6 text-sm text-red-600">{notificationError}</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500">No notifications</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                      const isUnread = !readNotificationIds.includes(notification.id);

                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                            isUnread ? "bg-[#ecf8f6]/60" : "bg-white"
                          }`}
                        >
                          <span
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notificationStatusClass[notification.status]}`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </span>
                              {isUnread ? (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                              ) : null}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-gray-600">
                              {notification.description}
                            </span>
                            <span className="mt-1 block text-[11px] font-medium text-gray-400">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="h-8 w-px bg-gray-300 mx-2" />

        <div className="relative" ref={menuRef}>
          <button
            className="flex min-h-7 max-w-[250px] items-center gap-2 rounded-full bg-white py-0.5 pl-1 pr-3 shadow focus:outline-none"
            onClick={() => setShowMenu((current) => !current)}
            aria-label="Open profile menu"
          >
            {profile.avatarUrl ? (
              <span
                className="h-7 w-7 shrink-0 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url("${profile.avatarUrl}")` }}
                aria-hidden="true"
              />
            ) : (
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-default)]"
                aria-hidden="true"
              >
                <span
                  className="themed-svg-icon flex h-4 w-4 items-center justify-center text-[var(--color-primary)]"
                  dangerouslySetInnerHTML={{ __html: ICON_SVGS.user }}
                />
              </span>
            )}
            <span className="min-w-0 truncate text-[11px] font-semibold text-[var(--color-primary)]">
              {profile.displayName}
            </span>
          </button>

          {showMenu ? (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-lg animate-fade-in">
              <div className="border-b border-gray-100 px-4 pb-2 pt-1">
                <p className="truncate text-sm font-semibold text-gray-800">{profile.displayName}</p>
                <p className="truncate text-xs text-gray-500">{profile.roleName || profile.email}</p>
              </div>
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                onClick={openSettings}
              >
                Profile settings
              </button>
              <button
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm flex items-center gap-2"
                onClick={() => setDarkMode((current) => !current)}
              >
                <span>{darkMode ? "Light" : "Dark"}</span> mode
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                onClick={requestLogout}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
    {isSettingsOpen ? (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={closeSettings}
      >
        <form
          onSubmit={handleSaveSettings}
          className="w-full max-w-[520px] overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="bg-[var(--color-primary)] px-6 py-5">
            <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          </div>

          <div className="space-y-5 px-6 py-6">
            {settingsError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {settingsError}
              </div>
            ) : null}
            {settingsSuccess ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {settingsSuccess}
              </div>
            ) : null}

            <div className="flex items-center gap-4">
              <span
                className="h-20 w-20 shrink-0 rounded-full bg-[var(--color-default)] bg-cover bg-center"
                style={{
                  backgroundImage: draftAvatarUrl ? `url("${draftAvatarUrl}")` : undefined,
                }}
              >
                {!draftAvatarUrl ? (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--color-primary)]">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </span>
                ) : null}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <label className="block text-sm font-medium text-[#344054]">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarFileChange}
                  className="block w-full text-sm text-[#475467] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-name" className="text-sm font-medium text-[#344054]">
                Display Name
              </label>
              <input
                id="profile-name"
                value={draftName}
                onChange={(event) => {
                  setDraftName(event.target.value);
                  setSettingsSuccess("");
                }}
                className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[var(--color-high-emphasis)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,107,95,0.14)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#344054]">Email</label>
                <input
                  value={profile.email || "-"}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-3 text-sm text-[#475467] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#344054]">Role</label>
                <input
                  value={profile.roleName || "-"}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-[#f8fafc] px-3 text-sm text-[#475467] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              {settingsSuccess ? (
                <button
                  type="button"
                  onClick={closeSettings}
                  className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)]"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeSettings}
                    className="rounded-md border border-[var(--color-default)] px-4 py-2 text-xs font-semibold text-[var(--color-high-emphasis)] transition hover:bg-[var(--color-default)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-light-primary)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSavingSettings ? "Saving..." : "Save Settings"}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    ) : null}
    {isLogoutConfirmOpen ? (
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
        onClick={() => {
          if (!isLoggingOut) {
            setIsLogoutConfirmOpen(false);
          }
        }}
      >
        <div
          className="w-full max-w-sm rounded-lg bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.22)]"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
        >
          <h2 id="logout-confirm-title" className="text-lg font-semibold text-gray-900">
            Log out?
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            You will need to sign in again to continue using this account.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(false)}
              disabled={isLoggingOut}
              className="rounded-md border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Stay signed in
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
