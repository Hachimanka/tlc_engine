import { NextResponse } from "next/server";
import { getBearerToken } from "@/lib/tenantAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createSignedAvatarUrl,
  getUserProfileRow,
  PROFILE_AVATAR_BUCKET,
} from "@/lib/userProfiles";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 750_000;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type AuthenticatedUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type OrgUserProfileRow = {
  full_name: string | null;
  email: string | null;
};

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const authenticate = async (req: Request) => {
  const token = getBearerToken(req);

  if (!token) {
    return { error: jsonError("Missing authorization token.", 401) } as const;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;

  if (error || !user) {
    return { error: jsonError("Unauthorized.", 401) } as const;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
  } as const;
};

const getMetadataString = (
  metadata: Record<string, unknown> | undefined,
  key: string,
) => {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
};

const getOrgUserProfile = async (authUserId: string) => {
  const { data, error } = await supabaseAdmin
    .from("org_users")
    .select("full_name, email")
    .eq("auth_user_id", authUserId)
    .maybeSingle<OrgUserProfileRow>();

  if (error) {
    return null;
  }

  return data ?? null;
};

const buildProfilePayload = async (user: AuthenticatedUser) => {
  const [profile, orgUser] = await Promise.all([
    getUserProfileRow(user.id),
    getOrgUserProfile(user.id),
  ]);
  const avatarUrl = await createSignedAvatarUrl(profile?.avatar_path);
  const metadataName =
    getMetadataString(user.user_metadata, "full_name") ||
    getMetadataString(user.user_metadata, "name");

  return {
    displayName:
      profile?.display_name ||
      orgUser?.full_name ||
      metadataName ||
      user.email ||
      "User",
    email: orgUser?.email || user.email || "",
    avatarPath: profile?.avatar_path ?? null,
    avatarUrl,
  };
};

const getAvatarFile = (formData: FormData) => {
  const avatarEntry = formData.get("avatar");

  if (!avatarEntry) {
    return { file: null as File | null };
  }

  if (!(avatarEntry instanceof File)) {
    return { file: null as File | null, error: "Avatar must be an image file." };
  }

  if (avatarEntry.size === 0) {
    return { file: null as File | null };
  }

  const extension = ALLOWED_IMAGE_TYPES[avatarEntry.type];

  if (!extension) {
    return {
      file: null as File | null,
      error: "Please choose a JPG, PNG, WEBP, or GIF image.",
    };
  }

  if (avatarEntry.size > MAX_AVATAR_BYTES) {
    return {
      file: null as File | null,
      error: "Please choose an image below 750 KB.",
    };
  }

  return { file: avatarEntry, extension };
};

const uploadAvatar = async (
  authUserId: string,
  file: File,
  extension: string,
) => {
  const filePath = `${authUserId}/avatar-${Date.now()}.${extension}`;
  const fileBody = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(filePath, fileBody, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Failed to upload profile picture.");
  }

  return filePath;
};

export async function GET(req: Request) {
  const auth = await authenticate(req);

  if ("error" in auth) {
    return auth.error;
  }

  try {
    return NextResponse.json(await buildProfilePayload(auth.user));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load profile.",
      500,
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await authenticate(req);

  if ("error" in auth) {
    return auth.error;
  }

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return jsonError("Expected multipart form data.", 400);
  }

  const displayNameEntry = formData.get("displayName");
  const hasDisplayName = typeof displayNameEntry === "string";
  const requestedDisplayName = hasDisplayName ? displayNameEntry.trim() : undefined;

  if (hasDisplayName && !requestedDisplayName) {
    return jsonError("Display name is required.", 400);
  }

  if (requestedDisplayName && requestedDisplayName.length > 120) {
    return jsonError("Display name must be 120 characters or fewer.", 400);
  }

  const avatar = getAvatarFile(formData);

  if (avatar.error) {
    return jsonError(avatar.error, 400);
  }

  try {
    const currentProfile = await getUserProfileRow(auth.user.id);
    const orgUser = await getOrgUserProfile(auth.user.id);
    const metadataName =
      getMetadataString(auth.user.user_metadata, "full_name") ||
      getMetadataString(auth.user.user_metadata, "name");
    const nextDisplayName =
      requestedDisplayName ||
      currentProfile?.display_name ||
      orgUser?.full_name ||
      metadataName ||
      auth.user.email ||
      "User";
    const uploadedAvatarPath =
      avatar.file && avatar.extension
        ? await uploadAvatar(auth.user.id, avatar.file, avatar.extension)
        : null;
    const nextAvatarPath = uploadedAvatarPath ?? currentProfile?.avatar_path ?? null;
    const now = new Date().toISOString();

    const { data: savedProfile, error: saveError } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        {
          auth_user_id: auth.user.id,
          display_name: nextDisplayName,
          avatar_path: nextAvatarPath,
          updated_at: now,
        },
        { onConflict: "auth_user_id" },
      )
      .select("display_name, avatar_path")
      .single();

    if (saveError || !savedProfile) {
      throw new Error(saveError?.message || "Failed to save profile.");
    }

    if (requestedDisplayName && requestedDisplayName !== orgUser?.full_name) {
      const { error: orgUserError } = await supabaseAdmin
        .from("org_users")
        .update({
          full_name: requestedDisplayName,
          updated_at: now,
        })
        .eq("auth_user_id", auth.user.id);

      if (orgUserError) {
        throw new Error(orgUserError.message || "Failed to update tenant profile name.");
      }
    }

    const avatarUrl = await createSignedAvatarUrl(savedProfile.avatar_path);
    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(auth.user.id, {
        user_metadata: {
          ...(auth.user.user_metadata ?? {}),
          full_name: savedProfile.display_name,
          name: savedProfile.display_name,
          avatar_path: savedProfile.avatar_path,
          avatar_url: avatarUrl,
        },
      });

    if (authUpdateError) {
      throw new Error(authUpdateError.message || "Failed to update auth metadata.");
    }

    if (
      uploadedAvatarPath &&
      currentProfile?.avatar_path &&
      currentProfile.avatar_path !== uploadedAvatarPath
    ) {
      await supabaseAdmin.storage
        .from(PROFILE_AVATAR_BUCKET)
        .remove([currentProfile.avatar_path]);
    }

    return NextResponse.json({
      displayName: savedProfile.display_name || nextDisplayName,
      email: orgUser?.email || auth.user.email || "",
      avatarPath: savedProfile.avatar_path ?? null,
      avatarUrl,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to save profile.",
      500,
    );
  }
}
