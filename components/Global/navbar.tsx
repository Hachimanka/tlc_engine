"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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

const defaultProfile: NavbarProfile = {
  displayName: "User",
  email: "",
  roleName: "",
  avatarUrl: "",
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
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

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
        <div className="relative flex items-center justify-center">
          <Image
            src="/navbar/Notification.png"
            alt="Notification"
            width={24}
            height={24}
          />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
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
