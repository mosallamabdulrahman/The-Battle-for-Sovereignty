"use client";

import { Shield, Swords, Mail, Globe, Award } from "lucide-react";
import Link from "next/link";

import GameLogo from "./GameLogo";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-100/90 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-slate-800">
          {/* Main info */}
          <div className="md:col-span-5 flex flex-col items-start text-right">
            <Link href="/" className="flex items-center gap-3 group mb-5">
              <GameLogo className="w-10 h-10" />
              <span className="font-sans font-bold text-2xl tracking-tight text-white">
                حيلهم بينهم
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
              أول لعبة تحدي وتفكير تجمع بين الذكاء والمعلومات السنعة عشان توزع فريقك وتهجم بذكاء وتفوز على ربعك.
            </p>
            <div className="flex items-center gap-4 text-slate-400 text-xs font-bold">
              <span className="flex items-center gap-1">
                <Swords className="w-4 h-4 text-cyan-500" /> اللعب شغال الحين
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-orange-500" /> تحدي ثقافي سنع
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3 text-right">
            <h4 className="text-white font-bold text-md tracking-wider uppercase mb-5">
              روابط اللعبة
            </h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <a
                  href="#hero"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  الرئيسية
                </a>
              </li>
              <li>
                <a
                  href="#how-to-play"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  شلون تلعب
                </a>
              </li>
              <li>
                <a
                  href="#categories"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  فئات حيلهم بينهم
                </a>
              </li>
              <li>
                <a
                  href="#stats"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  لوحة المتصدرين
                </a>
              </li>
            </ul>
          </div>

          {/* Support and contact info */}
          <div className="md:col-span-4 text-right">
            <h4 className="text-white font-bold text-md tracking-wider uppercase mb-5">
              تواصل معانا
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              عندك مشكلة باللعبة أو مو عارف شلون تلعب؟ كلمنا هني مباشرة.
            </p>
            <div className="space-y-3 font-semibold text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>الإيميل: info@mosalam.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Bottom */}
        <div className="pt-8 flex justify-center gap-4 text-xs font-bold text-slate-500 text-center">
          <p>© ٢٠٢٦ حيلهم بينهم. جميع الحقوق محفوظة حق فريق اللعبة.</p>
        </div>
      </div>
    </footer>
  );
}
