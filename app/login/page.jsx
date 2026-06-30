"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Mail,
  ArrowRight,
  Loader2,
  MailCheck,
  LogIn,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getSafeRedirect, normalizeEmail } from "../../lib/auth";

const WAS_HERE_KEY = "sovereignty_was_here";

export default function QuickLoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  // true = returning user (has logged in before on this browser)
  const [wasRegistered, setWasRegistered] = useState(false);
  // Show email input for returning users only after they click the button
  const [showLoginForm, setShowLoginForm] = useState(false);
  // 'register' | 'already-registered' | 'login' — controls the success message
  const [successMode, setSuccessMode] = useState("register");

  // Check session + localStorage flag
  useEffect(() => {
    const flag = localStorage.getItem(WAS_HERE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (flag) setWasRegistered(true);

    // If already logged in, go home
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.replace(getSafeRedirect("/"));
      }
    });

    // Handle magic link callback (SIGNED_IN fires when hash is processed)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        localStorage.setItem(WAS_HERE_KEY, "true");
        window.location.replace(getSafeRedirect("/"));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const isUserNotFoundError = (message) => {
    if (!message) return false;
    return (
      message.includes("Signups not allowed") ||
      message.includes("User not found") ||
      message.includes("not allowed")
    );
  };

  // Smart "register" — silently checks if the email already has an account.
  // If it does, sends a login link and tells the user they're already registered.
  // If not, creates the account and sends a registration link.
  const handleRegister = async (e) => {
    e?.preventDefault();
    const cleanEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setIsError(true);
      setMsg("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }

    setMsg("");
    setIsError(false);
    setIsLoading(true);

    try {
      const checkResult = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (!checkResult.error) {
        // Email already has an account — link sent is a login link
        setSuccessMode("already-registered");
        setSent(true);
        return;
      }

      if (!isUserNotFoundError(checkResult.error.message)) {
        setIsError(true);
        setMsg(`تعذر الإرسال: ${checkResult.error.message}`);
        return;
      }

      // Genuinely new email — create the account
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setIsError(true);
        setMsg(`تعذر الإرسال: ${error.message}`);
        return;
      }

      setSuccessMode("register");
      setSent(true);
    } catch (err) {
      setIsError(true);
      setMsg(err.message || "حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // Strict direct login — only works for emails that already have an account.
  const handleDirectLogin = async () => {
    const cleanEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setIsError(true);
      setMsg("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }

    setMsg("");
    setIsError(false);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setIsError(true);
        if (isUserNotFoundError(error.message)) {
          setMsg("لا يوجد حساب مسجل بهذا البريد. استخدم زر 'تسجيل جديد' بالأسفل.");
        } else {
          setMsg(`تعذر تسجيل الدخول: ${error.message}`);
        }
        return;
      }

      setSuccessMode("login");
      setSent(true);
    } catch (err) {
      setIsError(true);
      setMsg(err.message || "حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden dir-rtl">
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-6 right-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200/60"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="bg-gradient-to-tr from-cyan-500 to-sky-400 text-white p-4 rounded-2xl shadow-lg shadow-cyan-500/20"
          >
            <Shield className="w-9 h-9" />
          </motion.div>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight"
        >
          {wasRegistered ? "مرحباً بعودتك" : "الدخول للمعركة"}
        </motion.h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl py-8 px-5 shadow-2xl shadow-slate-200/50 rounded-3xl border border-slate-200/60 sm:px-10"
        >
          <AnimatePresence mode="wait">
            {sent ? (
              /* ── SUCCESS STATE ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-5"
              >
                <div className="flex justify-center">
                  <div className="bg-gradient-to-tr from-emerald-400 to-cyan-500 text-white p-4 rounded-2xl shadow-md">
                    <MailCheck className="w-10 h-10" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-2">
                    {successMode === "already-registered"
                      ? "أنت مسجّل بالفعل ✅"
                      : "تحقق من بريدك!"}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {successMode === "already-registered"
                      ? "هذا البريد مسجّل من قبل — أرسلنا لك رابط تسجيل الدخول إلى"
                      : successMode === "login"
                        ? "أرسلنا رابط تسجيل الدخول إلى"
                        : "أرسلنا رابط التسجيل إلى"}
                  </p>
                  <p className="text-sm font-bold text-cyan-700 mt-1 break-all" dir="ltr">
                    {email}
                  </p>
                  <p className="text-xs text-slate-400 mt-3 font-medium leading-relaxed">
                    افتح الإيميل واضغط على الرابط — ستدخل المعركة تلقائياً بدون أي خطوات إضافية
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setMsg("");
                    setIsError(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                >
                  تغيير البريد أو إعادة الإرسال
                </button>
              </motion.div>
            ) : wasRegistered && !showLoginForm ? (
              /* ── RETURNING USER — show welcome + button ── */
              <motion.div
                key="returning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center text-center gap-3 py-4">
                  <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
                    <UserCheck className="w-10 h-10 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-slate-900">
                      أنت مسجّل بالفعل في المعركة
                    </p>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      اضغط الزر أدناه وأدخل بريدك لتسجيل الدخول
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLoginForm(true)}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-600/10 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-500 hover:shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setWasRegistered(false)}
                    className="text-xs text-slate-400 hover:text-cyan-600 font-bold transition-colors cursor-pointer"
                  >
                    حساب جديد؟ التسجيل من هنا
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── EMAIL FORM (new user OR returning user clicked login) ── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Back button for returning users */}
                {wasRegistered && showLoginForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginForm(false);
                      setMsg("");
                      setIsError(false);
                    }}
                    className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors mb-5 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    رجوع
                  </button>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-bold text-slate-700 mb-2"
                    >
                      البريد الإلكتروني
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="block w-full pr-11 pl-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/70 transition-all font-medium text-sm"
                        dir="ltr"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                      سيصلك رابط في الإيميل — اضغط عليه وادخل مباشرة
                    </p>
                  </div>

                  {msg && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 border rounded-xl text-sm font-bold text-center ${
                        isError
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      }`}
                    >
                      {msg}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-600/10 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-500 hover:shadow-cyan-600/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        تسجيل جديد
                      </>
                    )}
                  </button>
                </form>

                {/* Real direct-login action for users who already have an account */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white/80 text-slate-400 font-bold">
                      أو
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDirectLogin}
                  disabled={isLoading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-cyan-300 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  لدي حساب بالفعل — تسجيل الدخول
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
