export type SuperAdminNotificationPreferences = {
  demoRequests: boolean;
  newOrganizations: boolean;
  subscriptions: boolean;
  systemAlerts: boolean;
  loginAlerts: boolean;
  weeklyReports: boolean;
};

export const SUPERADMIN_NOTIFICATION_PREFERENCES_KEY =
  "tlc:superadmin-notification-preferences";

export const SUPERADMIN_NOTIFICATION_PREFERENCES_UPDATED_EVENT =
  "tlc:superadmin-notification-preferences-updated";

export const DEFAULT_SUPERADMIN_NOTIFICATION_PREFERENCES: SuperAdminNotificationPreferences = {
  demoRequests: true,
  newOrganizations: true,
  subscriptions: true,
  systemAlerts: true,
  loginAlerts: true,
  weeklyReports: false,
};

export function readSuperAdminNotificationPreferences() {
  if (typeof window === "undefined") {
    return DEFAULT_SUPERADMIN_NOTIFICATION_PREFERENCES;
  }

  try {
    const stored = window.localStorage.getItem(SUPERADMIN_NOTIFICATION_PREFERENCES_KEY);
    const parsed = stored ? JSON.parse(stored) : {};

    return {
      ...DEFAULT_SUPERADMIN_NOTIFICATION_PREFERENCES,
      ...(parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}),
    } as SuperAdminNotificationPreferences;
  } catch {
    return DEFAULT_SUPERADMIN_NOTIFICATION_PREFERENCES;
  }
}

export function saveSuperAdminNotificationPreferences(
  preferences: SuperAdminNotificationPreferences,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SUPERADMIN_NOTIFICATION_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );
  window.dispatchEvent(
    new CustomEvent(SUPERADMIN_NOTIFICATION_PREFERENCES_UPDATED_EVENT, {
      detail: preferences,
    }),
  );
}
