"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, Save, X } from "lucide-react";
import { CategoryImageUpload } from "./MediaUploaders";

export default function CategoryModal({
  category,
  categories,
  onSave,
  onClose,
  busy,
}) {
  const [form, setForm] = useState(() => {
    if (category) return category;
    const usedOrders = new Set((categories || []).map((c) => c.sort_order));
    let nextOrder = 1;
    while (usedOrders.has(nextOrder)) nextOrder += 1;
    return {
      name: "",
      description: "",
      emoji: "📌",
      image_url: "",
      sort_order: nextOrder,
      is_active: true,
    };
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const orderTaken = (categories || []).some(
    (c) => c.sort_order === form.sort_order && c.id !== form.id,
  );
  const orderTooLow = form.sort_order < 1;

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
        className="w-full max-w-md max-h-[85vh] rounded-3xl bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">
            {category ? "تعديل تصنيف" : "تصنيف جديد"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-right">
          <div>
            <label className="text-[11px] font-bold text-slate-500">
              الاسم *
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 outline-none transition-colors"
              placeholder="اسم التصنيف"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500">
              الوصف
            </label>
            <input
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 outline-none transition-colors"
              placeholder="وصف مختصر"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500">
              صورة الغلاف
            </label>
            <div className="mt-1">
              <CategoryImageUpload
                value={form.image_url || ""}
                onChange={(url) => set("image_url", url)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <label className="text-[11px] font-bold text-slate-500">
                الترتيب
              </label>
              <input
                type="number"
                value={form.sort_order}
                min={1}
                onChange={(e) => set("sort_order", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 outline-none transition-colors"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                ترتيب الظهور (الأصغر أولاً).
              </p>
              {orderTooLow && (
                <p className="mt-1 text-[10px] font-bold text-rose-600">
                  الترتيب لازم يكون 1 أو أكبر.
                </p>
              )}
              {!orderTooLow && orderTaken && (
                <p className="mt-1 text-[10px] font-bold text-rose-600">
                  الترتيب ده متاخد بتصنيف تاني.
                </p>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500">
                الحالة
              </label>
              <div className="mt-1 flex items-center h-[38px]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => set("is_active", e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    مفعّل (يظهر في الإعداد)
                  </span>
                </label>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                إظهار أو إخفاء في الإعداد.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={busy || !form.name.trim() || orderTaken || orderTooLow}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 text-sm font-bold text-white disabled:opacity-60 hover:bg-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all duration-200 active:scale-[0.98]"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
