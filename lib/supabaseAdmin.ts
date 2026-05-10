'server-only';

import { createClient } from "@supabase/supabase-js";

const cleanEnvValue = (value: string | undefined) =>
  value?.trim().replace(/^["']|["']$/g, "");

const normalizeSupabaseUrl = (value: string | undefined) =>
  cleanEnvValue(value)?.replace(/\/+$/, "");

const supabaseUrl = normalizeSupabaseUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
);
const supabaseServiceKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

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

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  global: {
    fetch: supabaseFetch,
  },
});
