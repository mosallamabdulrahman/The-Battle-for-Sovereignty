import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { getSupabaseAdmin } from "../../../../../lib/supabase-admin";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const username = (body.username || "").trim();
  const password = (body.password || "").trim();

  if (username && (username.length < 2 || username.length > 40)) {
    return NextResponse.json(
      { error: "اسم المستخدم لازم يكون بين 2 و40 حرف." },
      { status: 400 },
    );
  }
  if (password && password.length < 6) {
    return NextResponse.json(
      { error: "الباسورد لازم يكون 6 أحرف على الأقل." },
      { status: 400 },
    );
  }
  if (!username && !password) {
    return NextResponse.json({ error: "مفيش حاجة تتغيّر." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const attrs = {};
  if (password) attrs.password = password;
  // Updating raw_user_meta_data fires the profiles-sync trigger, which
  // keeps profiles.display_name in sync via its own ON CONFLICT upsert.
  if (username) attrs.user_metadata = { display_name: username };

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    id,
    attrs,
  );

  if (updateError) {
    const message = updateError.message?.includes("duplicate key")
      ? "اسم المستخدم ده متاخد، اختار واحد تاني."
      : updateError.message || "ما قدرنا نحدّث المستخدم.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (id === auth.user.id) {
    return NextResponse.json(
      { error: "ما تقدر تحذف حسابك الحالي." },
      { status: 400 },
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { count } = await supabaseAdmin
    .from("admin_users")
    .select("*", { count: "exact", head: true });

  if ((count || 0) <= 1) {
    return NextResponse.json(
      { error: "لازم يبقى فيه أدمن واحد على الأقل." },
      { status: 400 },
    );
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message || "ما قدرنا نحذف المستخدم." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
