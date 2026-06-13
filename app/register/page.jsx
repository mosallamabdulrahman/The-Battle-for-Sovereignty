'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { getSafeRedirect, normalizeEmail, validateRegistration } from '../../lib/auth';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationMessage = validateRegistration({ name, email, password, confirmPassword });
    if (validationMessage) {
      setMsg(validationMessage);
      setIsSuccess(false);
      return;
    }
    
    setIsLoading(true);
    setMsg('');
    setIsSuccess(false);

    try {
      const cleanEmail = normalizeEmail(email);
      const cleanName = name.trim();
      const redirect = getSafeRedirect('/');
      const emailRedirectTo = `${window.location.origin}/login?confirmed=1&redirect=${encodeURIComponent(redirect)}`;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            display_name: cleanName,
          }
        }
      });

      if (error) {
        setIsSuccess(false);
        if (error.message?.toLowerCase().includes('already registered')) {
          setMsg('هذا البريد مسجل بالفعل. سجل الدخول بدلًا من إنشاء حساب جديد.');
        } else {
          setMsg(`تعذر إنشاء الحساب: ${error.message || 'يرجى مراجعة البيانات والمحاولة مجددًا.'}`);
        }
        return;
      }

      setIsSuccess(true);
      if (data.session) {
        setMsg('تم إنشاء الحساب وتسجيل الدخول بنجاح. جاري تحويلك...');
        window.setTimeout(() => window.location.assign(redirect), 700);
      } else {
        setMsg('تم إنشاء الحساب. افتح رسالة Supabase في بريدك واضغط تأكيد البريد، ثم سيتم تسجيل دخولك.');
      }
    } catch (err) {
      setIsSuccess(false);
      setMsg('حدث خطأ غير متوقع أثناء إنشاء الحساب. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden dir-rtl">
      {/* Absolute Decorative backdrops */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Home Button */}
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
          <div className="bg-gradient-to-tr from-emerald-400 to-cyan-500 text-white p-3.5 rounded-2xl shadow-md">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900">
          تسجيل رتبة قائد جديد
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          سجل للانضمام للفرق العسكرية والبدء في تعبئة الجيوش والسيطرة
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
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                الاسم المستعار للقائد (معرّف الميدان)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: العقيد ممدوح عسيري"
                  className="block w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/80 transition-all font-medium text-right text-sm"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                البريد الإلكتروني للقيادة
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
                  placeholder="example@sovereignty.com"
                  className="block w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/80 transition-all font-medium text-right text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                رمز النفاذ السري (كلمة المرور)
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

            {/* Confirm Password input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">
                تأكيد الرمز السري لشحذ العضوية
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-800 placeholder-slate-400/80 transition-all font-medium text-right text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Checkbox agreement */}
            <div className="flex items-center">
              <input
                id="agree-rules"
                name="agree-rules"
                type="checkbox"
                required
                className="h-4.5 w-4.5 text-emerald-500 focus:ring-emerald-500/30 border-slate-300 rounded-lg"
              />
              <label htmlFor="agree-rules" className="mr-2 block text-sm font-bold text-slate-600 cursor-pointer">
                أوافق على بنود ومواثيق ومرشد معركة سيادة
              </label>
            </div>

            {/* Notification messages */}
            {msg && (
              <div className={`p-3.5 border rounded-xl text-sm font-bold text-center ${
                isSuccess
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {msg}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/10 text-md font-bold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-emerald-600/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? 'جاري تسجيل التصاريح والمقرات...' : 'إنشاء العضوية وبدء المعركة'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500 font-medium">
              مسجل مسبقاً ولديك تصريح بالفعل؟{' '}
              <Link href="/login" className="font-extrabold text-cyan-600 hover:text-cyan-500 transition-colors">
                تسجيل الدخول للقادة المعتمدين
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
