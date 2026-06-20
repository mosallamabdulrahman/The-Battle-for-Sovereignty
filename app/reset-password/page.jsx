"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Shield } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsReady(Boolean(session));
      if (!session) {
        setIsError(true);
        setMessage("رابط استعادة كلمة المرور غير صالح أو انتهت صلاحيته.");
      }
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsError(false);

    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setIsError(true);
      setMessage("كلمة المرور يجب ألا تقل عن 8 أحرف وتحتوي على حرف ورقم.");
      return;
    }

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("كلمة المرور وتأكيدها غير متطابقين.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      setIsError(true);
      setMessage(`تعذر تحديث كلمة المرور: ${error.message}`);
      return;
    }

    setMessage("تم تحديث كلمة المرور بنجاح. جاري تحويلك للرئيسية...");
    window.setTimeout(() => window.location.assign("/"), 800);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 dir-rtl">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mx-auto mb-5 w-fit rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-500 p-3 text-white">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900">
          تعيين كلمة مرور جديدة
        </h1>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              كلمة المرور الجديدة
            </span>
            <span className="relative block">
              <Lock className="absolute right-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 outline-none focus:border-cyan-500"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              تأكيد كلمة المرور
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </label>

          {message && (
            <p
              className={`rounded-xl border p-3 text-center text-sm font-bold ${
                isError
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={!isReady || isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-5 block text-center text-sm font-bold text-cyan-600"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>
    </main>
  );
}
