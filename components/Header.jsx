"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Menu,
  X,
  ArrowLeft,
  Gamepad2,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { getUserDisplayName } from "../lib/auth";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    // Fetch user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navLinks = [
    { name: "الرئيسية", href: "#hero" },
    { name: "طريقة اللعب", href: "#how-to-play" },
    { name: "التصنيفات", href: "#categories" },
  ];

  return (
    <header
      suppressHydrationWarning
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-md border-b border-slate-200/80 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-sky-400 to-cyan-500 text-white p-2 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300">
              <Shield className="w-6 h-6" />
            </div>
            <span className="font-sans font-bold text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
              معركة سيادة
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isDirectLink = link.href.startsWith("/");
              return isDirectLink ? (
                <Link
                  key={link.name}
                  href={link.href}
                  className="font-medium text-slate-600 hover:text-cyan-600 transition-colors duration-200 relative group text-md"
                >
                  {link.name}
                  <span className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="font-medium text-slate-600 hover:text-cyan-600 transition-colors duration-200 relative group text-md"
                >
                  {link.name}
                  <span className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                </a>
              );
            })}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-700 font-bold text-sm bg-cyan-50 border border-cyan-100 px-3.5 py-1.5 rounded-xl">
                  <User className="w-4 h-4 text-cyan-500" />
                  {getUserDisplayName(user)}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 border border-rose-100 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-cyan-600 font-semibold transition-colors duration-200 text-md px-4 py-2"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-md"
                >
                  طلب رتبة (سجل مجاناً)
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="القائمة الجانبية"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              {navLinks.map((link) => {
                const isDirectLink = link.href.startsWith("/");
                return isDirectLink ? (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/50 py-2.5 px-3 rounded-lg transition-colors"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/50 py-2.5 px-3 rounded-lg transition-colors"
                  >
                    {link.name}
                  </a>
                );
              })}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <span className="text-center font-bold text-slate-700 text-sm bg-cyan-50 p-2.5 rounded-xl border border-cyan-100">
                      {getUserDisplayName(user)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-center py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-colors border border-rose-200 flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 font-bold text-slate-700 hover:text-cyan-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold rounded-xl shadow-md"
                    >
                      طلب رتبة جديدة
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
