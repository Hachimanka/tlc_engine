import { createClient } from "@supabase/supabase-js";

const cleanEnvValue = (value: string | undefined) =>
	value?.trim().replace(/^["']|["']$/g, "");

const normalizeSupabaseUrl = (value: string | undefined) =>
	cleanEnvValue(value)?.replace(/\/+$/, "");

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabaseFetch: typeof fetch = async (input, init) => {
	try {
		return await fetch(input, init);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Network request failed";

		return new Response(
			JSON.stringify({
				error: "network_error",
				error_description: `Unable to connect to Supabase: ${message}`,
				message: "Unable to connect to Supabase.",
			}),
			{
				status: 503,
				statusText: "Supabase Network Error",
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	global: {
		fetch: supabaseFetch,
	},
});
