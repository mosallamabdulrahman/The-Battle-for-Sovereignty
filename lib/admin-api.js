import { supabasePanel } from "./supabase-panel";

// Shared fetch wrapper for the /api/admin/* routes: attaches the panel
// session's bearer token (every route re-checks is_admin() server-side) and
// unwraps the JSON error shape those routes return.
export const callAdminApi = async (path, method = "GET", body) => {
  const {
    data: { session },
  } = await supabasePanel.auth.getSession();

  if (!session?.access_token) {
    throw new Error("لازم تسجل دخول الأول.");
  }

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "صار خطأ غير متوقع.");
  }
  return json;
};
