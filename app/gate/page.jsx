"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Lock, ShieldCheck, User, Loader2 } from "lucide-react";
import GameLogo from "../../components/GameLogo";
import { getSafeRedirect } from "../../lib/auth";

export default function SiteGatePage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/site-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "بيانات الدخول غير صحيحة.");
        setIsLoading(false);
        return;
      }
      window.location.replace(getSafeRedirect("/"));
    } catch {
      setError("صار خلل بالاتصال. جرب مرة ثانية.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center"
      >
        <div className="flex justify-center mb-4">
          <GameLogo className="w-20 h-20" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">
          الموقع محمي
        </h1>
        <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed font-semibold">
          هذا الموقع خاص — لازم تدخل بيانات الدخول عشان تكمل.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-right">
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اسم المستخدم"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pr-9 text-sm font-bold text-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pr-9 pl-9 text-sm font-bold text-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full bg-gradient-to-r from-cyan-600 to-sky-500 hover:shadow-md py-3 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            دخول
          </button>
        </form>
      </motion.div>
    </div>
  );
}
