"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const [state, setState] = useState("loading"); // "loading" | "allowed" | "denied"

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setState("denied");
        return;
      }
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const allowed = !adminEmail || session.user.email === adminEmail;
      setState(allowed ? "allowed" : "denied");
    });
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white dir-rtl">
        <Shield className="w-12 h-12 text-rose-500" />
        <h1 className="text-xl font-bold">غير مسموح بالدخول</h1>
        <p className="text-slate-400 text-sm">هذه الصفحة للمسؤولين فقط.</p>
        <Link href="/login" className="text-cyan-400 underline text-sm">
          تسجيل الدخول بحساب آخر
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dir-rtl">
      <header className="bg-slate-950 text-white px-6 py-4 flex items-center gap-3 shadow-lg">
        <Shield className="w-5 h-5 text-cyan-400" />
        <span className="font-bold text-sm">لوحة إدارة معركة سيادة</span>
        <div className="flex-1" />
        <Link href="/" className="text-[11px] text-slate-400 hover:text-white transition">
          ← الواجهة الرئيسية
        </Link>
      </header>
      {children}
    </div>
  );
}
