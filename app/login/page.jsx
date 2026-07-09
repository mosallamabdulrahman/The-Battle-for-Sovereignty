"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  ArrowRight,
  Loader2,
  MailCheck,
  LogIn,
  UserPlus,
  UserCircle2,
} from "lucide-react";
import Link from "next/link";
import GameLogo from "../../components/GameLogo";
import { supabase } from "../../lib/supabase";
import { getSafeRedirect, normalizeEmail } from "../../lib/auth";

const WAS_HERE_KEY = "sovereignty_was_here";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function QuickLoginPage() {
  // 'login' | 'register'
  const [tab, setTab] = useState("register");

  // Register tab fields
  const [username, setUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  // Login tab field — accepts email or username
  const [identifier, setIdentifier] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [successMode, setSuccessMode] = useState("register"); // 'register' | 'login'
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  // When a login attempt finds no account, offer a one-click hop to Register
  const [notFoundHint, setNotFoundHint] = useState(false);

  useEffect(() => {
    // Default to the Login tab for people who've been here before.
    if (localStorage.getItem(WAS_HERE_KEY)) {
      setTab("login");
    }

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

  const resetMessages = () => {
    setMsg("");
    setIsError(false);
    setNotFoundHint(false);
  };

  const switchTab = (nextTab) => {
    setTab(nextTab);
    resetMessages();
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    resetMessages();

    const cleanUsername = username.trim();
    const cleanEmail = normalizeEmail(registerEmail);

    if (cleanUsername.length < 2 || cleanUsername.length > 40) {
      setIsError(true);
      setMsg("اسم المستخدم لازم يكون بين 2 و40 حرف.");
      return;
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setIsError(true);
      setMsg("اكتب إيميل صح لو سمحت.");
      return;
    }

    setIsLoading(true);
    try {
      const { data: emailMatch, error: emailLookupError } = await supabase.rpc(
        "lookup_account",
        { p_identifier: cleanEmail },
      );
      if (emailLookupError) throw emailLookupError;

      if (emailMatch?.length) {
        setIsError(true);
        setMsg(
          "هذا الإيميل مسجل عندنا بالفعل — سجل دخولك من تبويب 'تسجيل الدخول'.",
        );
        return;
      }

      const { data: usernameMatch, error: usernameLookupError } =
        await supabase.rpc("lookup_account", { p_identifier: cleanUsername });
      if (usernameLookupError) throw usernameLookupError;

      if (usernameMatch?.length) {
        setIsError(true);
        setMsg("اسم المستخدم ده متاخد — جرب اسم ثاني.");
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: { display_name: cleanUsername },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setIsError(true);
        setMsg(`ما قدرنا نطرش: ${error.message}`);
        return;
      }

      setSentEmail(cleanEmail);
      setSuccessMode("register");
      setSent(true);
    } catch (err) {
      setIsError(true);
      setMsg(err.message || "صار خطأ مو متوقع. جرب مرة ثانية.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    resetMessages();

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setIsError(true);
      setMsg("اكتب إيميلك أو اسم المستخدم بتاعك.");
      return;
    }

    setIsLoading(true);
    try {
      const { data: match, error: lookupError } = await supabase.rpc(
        "lookup_account",
        { p_identifier: normalizeEmail(cleanIdentifier) },
      );
      if (lookupError) throw lookupError;

      if (!match?.length) {
        setIsError(true);
        setNotFoundHint(true);
        setMsg("ما لقيناك عندنا. لو أول مرة تدخل، سجل حساب جديد.");
        return;
      }

      const resolvedEmail = match[0].matched_email;
      const { error } = await supabase.auth.signInWithOtp({
        email: resolvedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setIsError(true);
        setMsg(`ما قدرنا ندش: ${error.message}`);
        return;
      }

      setSentEmail(resolvedEmail);
      setSuccessMode("login");
      setSent(true);
    } catch (err) {
      setIsError(true);
      setMsg(err.message || "حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const jumpToRegisterFromLogin = () => {
    const cleanIdentifier = identifier.trim();
    if (EMAIL_PATTERN.test(cleanIdentifier)) {
      setRegisterEmail(cleanIdentifier);
    } else {
      setUsername(cleanIdentifier);
    }
    switchTab("register");
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
          ارجع للرئيسية
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200"
          >
            <GameLogo className="w-14 h-14" />
          </motion.div>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight"
        >
          {tab === "login" ? "يا هلا فيك" : "دش اللعبة"}
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
                    {successMode === "login"
                      ? "شيك على إيميلك!"
                      : "خطوة وحدة باقية!"}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {successMode === "login"
                      ? "طرشنا رابط تسجيل الدخول حق"
                      : "طرشنا رابط تأكيد الحساب حق"}
                  </p>
                  <p
                    className="text-sm font-bold text-cyan-700 mt-1 break-all"
                    dir="ltr"
                  >
                    {sentEmail}
                  </p>
                  <p className="text-xs text-slate-400 mt-3 font-medium leading-relaxed">
                    بطل إيميلك واضغط على الرابط — راح تدش اللعبة سيدة بدون أي
                    لوية
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    resetMessages();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                >
                  رجوع
                </button>
              </motion.div>
            ) : (
              /* ── TABBED FORM ── */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => switchTab("login")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      tab === "login"
                        ? "bg-white text-cyan-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("register")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      tab === "register"
                        ? "bg-white text-cyan-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    حساب جديد
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {tab === "login" ? (
                    <motion.form
                      key="login-form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleLogin}
                      className="space-y-4"
                    >
                      <div>
                        <label
                          htmlFor="identifier"
                          className="block text-sm font-bold text-slate-700 mb-2"
                        >
                          الإيميل أو اسم المستخدم
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                            <UserCircle2 className="w-5 h-5" />
                          </div>
                          <input
                            id="identifier"
                            name="identifier"
                            type="text"
                            autoFocus
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="your@email.com أو اسم المستخدم"
                            className="block w-full pr-11 pl-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/70 transition-all font-medium text-sm"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {msg && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3.5 border rounded-xl text-sm font-bold text-center space-y-2 ${
                            isError
                              ? "bg-rose-50 border-rose-200 text-rose-700"
                              : "bg-emerald-50 border-emerald-200 text-emerald-700"
                          }`}
                        >
                          <p>{msg}</p>
                          {notFoundHint && (
                            <button
                              type="button"
                              onClick={jumpToRegisterFromLogin}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 underline underline-offset-2 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              سجل حساب جديد من هنا
                            </button>
                          )}
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
                            قاعدين نشيك...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-5 h-5" />
                            تسجيل الدخول
                          </>
                        )}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register-form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleRegister}
                      className="space-y-4"
                    >
                      <div>
                        <label
                          htmlFor="username"
                          className="block text-sm font-bold text-slate-700 mb-2"
                        >
                          اسم المستخدم
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                            <UserCircle2 className="w-5 h-5" />
                          </div>
                          <input
                            id="username"
                            name="username"
                            type="text"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="اسمك بين اللاعبين"
                            maxLength={40}
                            className="block w-full pr-11 pl-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/70 transition-all font-medium text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="register-email"
                          className="block text-sm font-bold text-slate-700 mb-2"
                        >
                          الإيميل
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-5 h-5" />
                          </div>
                          <input
                            id="register-email"
                            name="register-email"
                            type="email"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="block w-full pr-11 pl-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/70 transition-all font-medium text-sm"
                            dir="ltr"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                          راح يوصلك رابط تأكيد على إيميلك — اضغط عليه وتدش سيدة
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
                            قاعدين نشيك...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            تسجيل
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
