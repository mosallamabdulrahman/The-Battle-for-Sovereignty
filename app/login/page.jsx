'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { getSafeRedirect, normalizeEmail } from '../../lib/auth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const finishConfirmedLogin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setMsg('تم تأكيد البريد وتسجيل الدخول بنجاح. جاري تحويلك...');
        window.setTimeout(() => window.location.assign(getSafeRedirect('/')), 500);
      }
    };

    finishConfirmedLogin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg('');
    setIsError(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });

      if (error) {
        setIsError(true);
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setMsg('يجب تأكيد البريد أولًا. افتح رسالة Supabase واضغط رابط التأكيد.');
        } else if (error.status === 400 || error.message?.includes('Invalid login')) {
          setMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        } else {
          setMsg(`تعذر تسجيل الدخول: ${error.message || 'حاول مرة أخرى.'}`);
        }
        return;
      }

      setMsg('تم تسجيل الدخول بنجاح. جاري تحويلك...');
      setTimeout(() => {
        window.location.assign(getSafeRedirect('/'));
      }, 700);
    } catch (err) {
      setIsError(true);
      setMsg('حدث خطأ غير متوقع أثناء الاتصال. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setIsError(true);
      setMsg('اكتب بريدك الإلكتروني أولًا لإرسال رابط استعادة كلمة المرور.');
      return;
    }

    setIsLoading(true);
    setIsError(false);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);

    if (error) {
      setIsError(true);
      setMsg(`تعذر إرسال رابط الاستعادة: ${error.message}`);
      return;
    }

    setMsg('تم إرسال رابط استعادة كلمة المرور إلى بريدك.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden dir-rtl">
      {/* Visual background details */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Back button to Home */}
      <div className="absolute top-6 right-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="bg-gradient-to-tr from-cyan-400 to-sky-500 text-white p-3.5 rounded-2xl shadow-md">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900">
          تسجيل الدخول للقائد العسكري
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          البوابة الآمنة لدخول غمار معركة سيادة الثقافية
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white py-8 px-4 shadow-xl shadow-slate-100 rounded-3xl border border-slate-200/80 sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Target Email input */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                البريد الإلكتروني (قناة الاتصال)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="القائد@معركة.إلكتروني"
                  className="block w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/80 transition-all font-medium text-right text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Target Password input */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                كلمة المرور (رمز النفاذ الآمن)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pr-11 pl-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/80 transition-all font-medium text-right text-sm"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-cyan-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot box */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4.5 w-4.5 text-cyan-500 focus:ring-cyan-500/30 border-slate-300 rounded-lg"
                />
                <label htmlFor="remember-me" className="mr-2 block text-sm font-bold text-slate-600 cursor-pointer">
                  تذكر جهازي العسكري
                </label>
              </div>

              <div className="text-sm">
                <button type="button" onClick={handleForgotPassword} className="font-bold text-cyan-600 hover:text-cyan-500 transition-colors">
                  نسيت رمز النفاذ؟
                </button>
              </div>
            </div>

            {/* Notification Messages */}
            {msg && (
              <div className={`p-3.5 border rounded-xl text-sm font-bold text-center ${
                isError 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {msg}
              </div>
            )}

            {/* Submit tactical button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-cyan-600/10 text-md font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-500 hover:shadow-cyan-600/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? 'جاري التحقق من التفويض والمصادقة...' : 'تسجيل الدخول للجبهة'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500 font-medium">
              هل أنت قائد جديد هنا؟{' '}
              <Link href="/register" className="font-extrabold text-cyan-600 hover:text-cyan-500 transition-colors">
                طلب رتبة جديدة وإنشاء حساب
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
