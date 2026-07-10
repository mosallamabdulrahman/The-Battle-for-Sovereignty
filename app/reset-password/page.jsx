"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import GameLogo from "../../components/GameLogo";
import { supabase } from "../../lib/supabase";
import { generatePassword } from "../../lib/auth";

// "checking" | "ready" | "invalid" | "success"
export default function ResetPasswordPage() {
  const [status, setStatus] = useState("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const checkSession = async () => {
      // The recovery link's tokens are auto-parsed by detectSessionInUrl —
      // give it a moment, then confirm we actually have a valid session.
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isActive) return;
        if (session?.user) {
          setStatus("ready");
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 300));
      }
      if (isActive) setStatus("invalid");
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStatus("ready");
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanPassword = password.trim();
    if (cleanPassword.length < 6) {
      setError("الباسورد لازم يكون 6 أحرف على الأقل.");
      return;
    }
    if (cleanPassword !== confirmPassword.trim()) {
      setError("الباسوردين مش متطابقين.");
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });
      if (updateError) throw updateError;
      setStatus("success");
    } catch (err) {
      setError(err.message || "ما قدرنا نحفظ الباسورد. جرب مرة ثانية.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 dir-rtl">
      <div className="absolute top-6 right-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200/60"
        >
          <ArrowRight className="w-4 h-4" />
          ارجع للرئيسية
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200">
            <GameLogo className="w-14 h-14" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          ضبط باسورد جديد
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-xl py-8 px-5 shadow-2xl shadow-slate-200/50 rounded-3xl border border-slate-200/60 sm:px-10"
        >
          {status === "checking" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              <p className="text-sm font-bold text-slate-500">
                قاعدين نتأكد من الرابط...
              </p>
            </div>
          )}

          {status === "invalid" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <AlertTriangle className="w-9 h-9 text-rose-500" />
              </div>
              <p className="text-lg font-extrabold text-slate-900">
                الرابط ده منتهي أو مش صحيح
              </p>
              <p className="text-sm text-slate-500 font-medium">
                جرب تطلب رابط جديد من صفحة تسجيل الدخول.
              </p>
              <Link
                href="/login"
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-500 hover:shadow-cyan-600/25 transition-all"
              >
                ارجع لصفحة الدخول
              </Link>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </div>
              <p className="text-lg font-extrabold text-slate-900">
                تم حفظ الباسورد الجديد
              </p>
              <p className="text-sm text-slate-500 font-medium">
                تقدر تدخل بيه بعد كده من صفحة تسجيل الدخول.
              </p>
              <Link
                href="/"
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-500 hover:shadow-cyan-600/25 transition-all"
              >
                يلا ندش اللعبة
              </Link>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >
                  الباسورد الجديد
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1 rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="باسورد قوي"
                      className="text-right block w-full pr-11 pl-11 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/70 transition-all font-medium text-sm"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = generatePassword();
                      setShowPassword(true);
                      setPassword(generated);
                      setConfirmPassword(generated);
                    }}
                    title="ولّد باسورد قوي"
                    className="shrink-0 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >
                  أكّد الباسورد
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="اكتبه تاني"
                  className="text-right block w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/70 transition-all font-medium text-sm"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                  6 أحرف على الأقل.
                </p>
              </div>

              {error && (
                <div className="p-3.5 border rounded-xl text-sm font-bold text-center bg-rose-50 border-rose-200 text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-600/10 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-500 hover:shadow-cyan-600/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    قاعدين نحفظ...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    احفظ الباسورد
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
