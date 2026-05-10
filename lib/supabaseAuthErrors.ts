export const isMissingSupabaseSessionError = (error: unknown) => {
	if (!error || typeof error !== "object") {
		return false;
	}

	const { message, name } = error as { message?: string; name?: string };
	const normalizedMessage = message?.toLowerCase() ?? "";

	return (
		name === "AuthSessionMissingError" ||
		normalizedMessage.includes("auth session missing") ||
		normalizedMessage.includes("missing auth session")
	);
};

export const isRecoverableSupabaseSessionError = (error: unknown) => {
	if (isMissingSupabaseSessionError(error)) {
		return true;
	}

	if (!error || typeof error !== "object") {
		return false;
	}

	const { code, message, name, status } = error as {
		code?: string;
		message?: string;
		name?: string;
		status?: number;
	};
	const normalizedCode = code?.toLowerCase() ?? "";
	const normalizedMessage = message?.toLowerCase() ?? "";
	const normalizedName = name?.toLowerCase() ?? "";

	if (
		status === 503 ||
		normalizedName.includes("retryablefetch") ||
		normalizedMessage.includes("failed to fetch") ||
		normalizedMessage.includes("unable to connect to supabase")
	) {
		return false;
	}

	const looksLikeSessionFailure = [
		"jwt",
		"session",
		"token",
		"refresh",
		"user from sub claim",
		"user not found",
		"invalid claim",
		"bad_jwt",
	].some((value) =>
		normalizedCode.includes(value) || normalizedMessage.includes(value),
	);

	return looksLikeSessionFailure && (!status || [400, 401, 403].includes(status));
};
