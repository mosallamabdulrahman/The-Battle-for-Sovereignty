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

  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
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
    .insert({ user_id: created.user.id });

  if (adminInsertError) {
    // Don't leave an orphaned non-admin auth account behind.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: adminInsertError.message || "ما قدرنا نضيفه كأدمن." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, user_id: created.user.id });
}
