import "server-only";
import { createClient } from "@supabase/supabase-js";

// Verifies the request's bearer token belongs to a real, currently-admin
// user. Must run before any privileged action in an admin API route —
// this is the actual security boundary (the UI gate alone is not enough).
export const requireAdmin = async (request) => {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { error: "لازم تسجل دخول الأول.", status: 401 };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } =
    await callerClient.auth.getUser(token);

  if (userError || !userData?.user) {
    return { error: "جلسة غير صالحة، سجل دخول من جديد.", status: 401 };
  }

  const { data: isAdmin, error: adminError } =
    await callerClient.rpc("is_admin");

  if (adminError || !isAdmin) {
    return { error: "ما عندك صلاحية تسوي هالعملية.", status: 403 };
  }

  return { user: userData.user };
};
