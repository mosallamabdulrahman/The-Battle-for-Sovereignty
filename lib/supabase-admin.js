import "server-only";
import { createClient } from "@supabase/supabase-js";

let adminClient = null;

// Service-role Supabase client — only usable in server code (API routes).
// `server-only` makes importing this from a "use client" component a build error.
export const getSupabaseAdmin = () => {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing — set it in .env.local (server-only, never NEXT_PUBLIC_).",
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return adminClient;
};
