import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";
export const PROFILE_AVATAR_SIGNED_URL_SECONDS = 60 * 60;

export type UserProfileRow = {
  display_name: string | null;
  avatar_path: string | null;
};

export async function getUserProfileRow(authUserId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("display_name, avatar_path")
    .eq("auth_user_id", authUserId)
    .maybeSingle<UserProfileRow>();

  if (error) {
    if (error.code === "42P01") {
      return null;
    }

    throw new Error(error.message || "Failed to load user profile.");
  }

  return data ?? null;
}

export async function createSignedAvatarUrl(avatarPath?: string | null) {
  if (!avatarPath) {
    return "";
  }

  const { data, error } = await supabaseAdmin.storage
    .from(PROFILE_AVATAR_BUCKET)
    .createSignedUrl(avatarPath, PROFILE_AVATAR_SIGNED_URL_SECONDS);

  if (error) {
    return "";
  }

  return data?.signedUrl ?? "";
}
