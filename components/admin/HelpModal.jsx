"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { HelpCircle, X } from "lucide-react";

export default function HelpModal({ onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-lg max-h-[85vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden text-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-cyan-600 animate-pulse" />
            <h2 className="font-bold text-slate-900 text-base">
              دليل استخدام لوحة التحكم
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 leading-relaxed text-slate-600 text-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              🎮 نظرة عامة
            </h3>
            <p className="text-xs">
              مرحباً بك في لوحة تحكم لعبة **حيلهم بينهم**. يمكنك من هنا إعداد
              بنك الأسئلة بالكامل وإدارة غرف اللعب والمستخدمين.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                📊 لوحة التحكم (الرئيسية)
              </h4>
              <p className="text-[11px]">
                تعرض إحصائيات سريعة للأسئلة المتاحة ومستويات الصعوبة، بالإضافة
                إلى إحصائية لعدد مرات اختيار ولعب كل تصنيف في غرف اللعب السابقة.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                ❓ إدارة الأسئلة
              </h4>
              <p className="text-[11px]">
                تمكنك من إضافة أسئلة جديدة وتعديلها أو حذفها. كما يمكنك تعيين
                مستويات الصعوبة (سهل، متوسط، صعب)، وإضافة صور أو ملفات صوتية لكل
                سؤال. نظام الفحص يمنع إضافة سؤال مكرر بنفس التصنيف تلقائياً
                لتفادي التشابه.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                🏷️ تصنيفات الأسئلة
              </h4>
              <p className="text-[11px]">
                تعديل الأسماء، الأوصاف، صور الغلاف، وترتيب ظهورها عند إنشاء غرف
                اللعب. كما يُعرض أمام كل تصنيف إحصائية إجمالي مرات اختياره في
                ألعاب اللعبة.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                👥 إدارة المستخدمين
              </h4>
              <p className="text-[11px]">
                تتيح لك إضافة حسابات جديدة للحكّام أو اللاعبين، تعديل كلمات
                المرور الخاصة بهم، أو تعيين وتعديل الصلاحيات أو حذف المستخدمين
                كلياً.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow"
          >
            إغلاق الدليل
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
