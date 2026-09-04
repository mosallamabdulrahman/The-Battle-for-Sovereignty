import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { loadAllCategoryGroups } from "@/lib/admin-content";

// GET /api/admin/groups — all category groups (التصنيفات).
export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { rows, error } = await loadAllCategoryGroups(getSupabaseAdmin());

    if (error) {
      return NextResponse.json(
        { error: error.message || "ما قدرنا نجيب التصنيفات." },
        { status: 400 },
      );
    }

    return NextResponse.json({ groups: rows || [] });
  } catch (err) {
    console.error("GET /api/admin/groups failed:", err);
    return NextResponse.json(
      { error: err?.message || "صار خطأ غير متوقع في السيرفر." },
      { status: 500 },
    );
  }
}
