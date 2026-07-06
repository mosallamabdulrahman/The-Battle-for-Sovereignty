"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { Shield } from "lucide-react";
import GameLogo from "../../components/GameLogo";

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
        <h1 className="text-xl font-bold">ما تقدر تدش هني</h1>
        <p className="text-slate-400 text-sm">هالصفحة للمشرفين بس.</p>
        <Link href="/login" className="text-cyan-400 underline text-sm">
          سجل دخول بحساب ثاني
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans antialiased dir-rtl flex flex-col">
      {/* WordPress-style Top Admin Bar */}
      <div className="h-8 bg-[#1d2327] text-[#c3c4c7] text-[13px] flex items-center justify-between px-4 select-none z-[190] shrink-0 border-b border-[#2c3338]">
        {/* Right side (RTL) - Brand & Visit Site */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:bg-[#2c3338] hover:text-[#72aee6] h-8 px-2 transition"
          >
            <span className="text-[12px]">بطل الموقع</span>
          </Link>
        </div>

        {/* Left side (RTL) - User Profile */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 hover:bg-[#2c3338] hover:text-[#72aee6] h-8 px-3 cursor-pointer transition">
            <span className="text-[12px] text-slate-300">شلونك، مسلّم</span>
            <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] text-white font-bold border border-slate-500">
              م
            </div>
          </div>
        </div>
      </div>

      {/* Page Content Shell */}
      <div className="flex-1 flex flex-col min-h-[calc(100vh-32px)]">
        {children}
      </div>
    </div>
  );
}
