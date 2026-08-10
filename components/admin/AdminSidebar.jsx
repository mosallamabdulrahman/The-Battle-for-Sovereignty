"use client";

import { motion } from "motion/react";
import {
  BarChart3,
  Edit2,
  Globe,
  LayoutDashboard,
  Tag,
  Users,
} from "lucide-react";
import GameLogo from "../GameLogo";

const NAV_ITEMS = [
  { key: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { key: "questions", label: "الأسئلة", icon: Edit2 },
  { key: "categories", label: "تصنيفات الأسئلة", icon: Tag },
  { key: "users", label: "المستخدمين", icon: Users },
  { key: "stats", label: "إحصائيات اللعبة", icon: BarChart3 },
];

export default function AdminSidebar({ tab, setTab }) {
  return (
    <aside className="w-56 bg-[#2c3338] text-[#f0f0f1] select-none shrink-0 flex flex-col justify-between border-l border-[#1d2327] z-30">
      <div>
        {/* Logo/Header */}
        <div className="p-4 border-b border-[#1c2226] bg-[#1d2327]/60 flex items-center gap-2">
          <GameLogo className="w-16 h-16" />
          <span className="font-bold text-sm text-white tracking-wide">
            لوحة التحكم
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-3 space-y-0.5">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-right transition-colors ${
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
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}

          <a
            href="/"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-right text-slate-400 hover:bg-[#3c434a] hover:text-cyan-400 transition-colors border-r-4 border-transparent"
          >
            <Globe className="w-4 h-4" />
            <span>بطل الموقع الرئيسي</span>
          </a>
        </nav>
      </div>

      <div className="p-4 text-[11px] text-slate-500 border-t border-[#1c2226]">
        نسخة حيلهم بينهم 1.0.0
      </div>
    </aside>
  );
}
