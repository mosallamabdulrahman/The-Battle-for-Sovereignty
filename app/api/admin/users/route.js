import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const friendlyCreateError = (message) => {
  if (!message) return "ما قدرنا ننشئ المستخدم.";
  if (message.includes("already been registered")) {
    return "الإيميل ده مسجل عندنا بالفعل.";
  }
  if (message.includes("display_name") || message.includes("duplicate key")) {
    return "اسم المستخدم ده متاخد، اختار واحد تاني.";
  }
  return message;
};

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const username = (body.username || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (username.length < 2 || username.length > 40) {
      return NextResponse.json(
        { error: "اسم المستخدم لازم يكون بين 2 و40 حرف." },
        { status: 400 },
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "اكتب إيميل صح." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "الباسورد لازم يكون 6 أحرف على الأقل." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Admin login emails live in their own namespace (admin_users.login_email),
    // fully decoupled from auth.users/profiles emails — that's what a site
    // account uses. This is what actually lets the same real email be used
    // for both a site account and an admin account independently.
    const { data: existingAdmin } = await supabaseAdmin
      .from("admin_users")
      .select("user_id")
      .eq("login_email", email)
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json(
        { error: "الإيميل ده مسجل عندنا بالفعل كأدمن." },
        { status: 400 },
      );
    }

    // auth.users still needs *some* unique email — this one is never shown
    // or emailed to anyone, it only exists to satisfy that constraint.
    const syntheticAuthEmail = `admin-${randomUUID()}@internal.7elhmbenhm.com`;

    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: syntheticAuthEmail,
        password,
        email_confirm: true,
        user_metadata: { display_name: username },
      });

    if (createError) {
      return NextResponse.json(
        { error: friendlyCreateError(createError.message) },
        { status: 400 },
      );
    }

    const { error: adminInsertError } = await supabaseAdmin
      .from("admin_users")
      .insert({ user_id: created.user.id, login_email: email });

    if (adminInsertError) {
      // Don't leave an orphaned non-admin auth account behind.
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json(
        { error: adminInsertError.message || "ما قدرنا نضيفه كأدمن." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, user_id: created.user.id });
  } catch (err) {
    console.error("POST /api/admin/users failed:", err);
    return NextResponse.json(
      { error: err?.message || "صار خطأ غير متوقع في السيرفر." },
      { status: 500 },
    );
  }
}
