"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import {
  BarChart3,
  Edit2,
  FolderTree,
  Globe,
  LayoutDashboard,
  Tag,
  Users,
  X,
} from "lucide-react";
import GameLogo from "@/components/common/GameLogo";
import { useAdminNav } from "@/components/admin/AdminNavContext";

const NAV_ITEMS = [
  { key: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { key: "groups", label: "التصنيفات", icon: FolderTree },
  { key: "categories", label: "فئات الأسئلة", icon: Tag },
  { key: "questions", label: "الأسئلة", icon: Edit2 },
  { key: "users", label: "المستخدمين", icon: Users },
  { key: "stats", label: "إحصائيات اللعبة", icon: BarChart3 },
];

export default function AdminSidebar({ tab, setTab }) {
  const { mobileOpen, setMobileOpen } = useAdminNav();

  const handleSelectTab = (key) => {
    setTab(key);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Logo/Header */}
        <div className="p-4 border-b border-[#1c2226] bg-[#1d2327]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GameLogo className="w-12 h-12 md:w-16 md:h-16" />
            <span className="font-bold text-sm text-white tracking-wide">
              لوحة التحكم
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-3 space-y-0.5">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectTab(key)}
                className={`relative w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-right transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#2271b1] text-white font-bold"
                    : "text-[#f0f0f1] hover:bg-[#3c434a] hover:text-cyan-400"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeSidebarBorder"
                    className="absolute top-0 right-0 bottom-0 w-1 bg-cyan-400"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-right text-slate-400 hover:bg-[#3c434a] hover:text-cyan-400 transition-colors border-r-4 border-transparent"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>بطل الموقع الرئيسي</span>
          </Link>
        </nav>
      </div>

      <div className="p-4 text-[11px] text-slate-500 border-t border-[#1c2226]">
        نسخة حيلهم بينهم 1.0.0
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on small screens, shown on md and up) */}
      <aside className="hidden md:flex flex-col w-56 bg-[#2c3338] text-[#f0f0f1] select-none shrink-0 border-l border-[#1d2327] z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer (animated slide-in from right with backdrop) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs md:hidden"
            />

            {/* Slide-in Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-[210] w-64 bg-[#2c3338] text-[#f0f0f1] shadow-2xl select-none md:hidden flex flex-col"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
