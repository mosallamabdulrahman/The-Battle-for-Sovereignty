"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, Save, X } from "lucide-react";

export default function GroupModal({
  group,
  onSave,
  onClose,
  busy,
}) {
  const [name, setName] = useState(group?.name || "");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const canSave = Boolean(name.trim()) && !busy;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!canSave) return;
    onSave({
      id: group?.id || null,
      name: name.trim(),
    });
  };

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
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">
            {group?.id ? "تعديل التصنيف" : "تصنيف جديد"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-right">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              اسم التصنيف *
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
              placeholder="مثال: كرة القدم، ثقافة عامة، تاريخ..."
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              سيظهر هذا الاسم كعنوان رئيسي يجمع فئات الأسئلة في الصفحة الرئيسية.
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-2 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
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
              disabled={busy}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
