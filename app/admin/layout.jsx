"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getUserDisplayName } from "../../lib/auth";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";
import GameLogo from "@/components/GameLogo";

function AdminLoginForm({ onSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setError("لازم تكتب اسم المستخدم أو الإيميل والباسورد.");
      return;
    }

    setIsLoading(true);
    try {
      // Login accepts either username or email — resolve to the real email
      // first (lookup_account is a SECURITY DEFINER RPC safe for anon use).
      const { data: lookup, error: lookupError } = await supabase.rpc(
        "lookup_account",
        { p_identifier: cleanIdentifier },
      );

      const email = lookup?.[0]?.matched_email;
      if (lookupError || !email) {
        setError("بيانات الدخول غلط.");
        return;
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !signInData?.session) {
        setError("بيانات الدخول غلط.");
        return;
      }

      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        setError("الحساب ده ما عنده صلاحية دخول اللوحة.");
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err.message || "صار خطأ غير متوقع.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 dir-rtl">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-5"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="border border-cyan-500/30 rounded-2xl p-3">
            <GameLogo className="w-16 h-16" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">دخول لوحة التحكم</h1>
            <p className="text-xs text-slate-400 mt-1">
              للمستخدمين المصرّح لهم فقط
            </p>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400">
            اسم المستخدم أو الإيميل
          </label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoFocus
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            placeholder="اسم المستخدم أو الإيميل"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400">
            الباسورد
          </label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-right w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder="••••••••"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-800 bg-rose-950/60 px-3 py-2 text-xs font-bold text-rose-300 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white hover:bg-cyan-500 transition disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          دخول
        </button>

        <Link
          href="/"
          className="block text-center text-xs font-bold text-slate-500 hover:text-cyan-400 transition"
        >
          ارجع للموقع الرئيسي
        </Link>
      </form>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const [state, setState] = useState("loading"); // "loading" | "allowed" | "denied"
  const [displayName, setDisplayName] = useState("");

  const checkAccess = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setState("denied");
      return;
    }

    // The UI gate is just for UX — every admin_* RPC and API route
    // re-checks is_admin() itself server-side, which is the real boundary.
    const { data: isAdmin, error } = await supabase.rpc("is_admin");
    if (!error && isAdmin) {
      setDisplayName(getUserDisplayName(session.user));
      setState("allowed");
    } else {
      setState("denied");
    }
  };

  useEffect(() => {
    checkAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });
    return () => subscription.unsubscribe();
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
      </div>
    );
  }

  if (state === "denied") {
    return <AdminLoginForm onSuccess={checkAccess} />;
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

        {/* Left side (RTL) - User Profile + Logout */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 h-8 px-3">
            <span className="text-[12px] text-slate-300">
              شلونك، {displayName}
            </span>
            <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] text-white font-bold border border-slate-500">
              {displayName?.[0] || "م"}
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              setState("denied");
            }}
            className="h-8 px-3 text-[12px] text-slate-300 hover:bg-[#2c3338] hover:text-[#72aee6] transition"
          >
            تسجيل خروج
          </button>
        </div>
      </div>

      {/* Page Content Shell */}
      <div className="flex-1 flex flex-col min-h-[calc(100vh-32px)]">
        {children}
      </div>
    </div>
  );
}
