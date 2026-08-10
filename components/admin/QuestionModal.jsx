"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ImageIcon, Loader2, Save, X } from "lucide-react";
import { DIFFICULTY_STRIKES } from "../../lib/admin-constants";
import { AnswerImageUpload, MediaUpload } from "./MediaUploaders";

// A category can hold any number of questions — the game randomly picks 6
// of them per room. "position" is just a display/ordering value, so a new
// question is appended after the current highest position in its category.
const nextPosition = (questions, categoryId, excludeId) => {
  const used = (questions || [])
    .filter((q) => q.category_id === categoryId && q.id !== excludeId)
    .map((q) => q.position);
  return used.length ? Math.max(...used) + 1 : 1;
};

export default function QuestionModal({
  question,
  categories,
  questions,
  onSave,
  onClose,
  busy,
}) {
  const [form, setForm] = useState(() => {
    if (question) {
      const hasValidCategory = categories.some(
        (c) => String(c.id) === String(question.category_id),
      );
      return {
        ...question,
        category_id: hasValidCategory
          ? question.category_id
          : categories[0]?.id || "",
      };
    }
    const initialCategoryId = categories[0]?.id || "";
    return {
      category_id: initialCategoryId,
      question_text: "",
      answer_text: "",
      difficulty: "easy",
      position: nextPosition(questions, initialCategoryId),
      is_active: true,
      media_url: "",
      media_type: null,
      answer_image_url: "",
    };
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const usedPositions = new Set(
    (questions || [])
      .filter((q) => q.category_id === form.category_id && q.id !== form.id)
      .map((q) => q.position),
  );
  const positionTaken = usedPositions.has(form.position);

  const isDuplicateQuestion = (questions || []).some((q) => {
    if (q.category_id !== form.category_id) return false;
    if (question && q.id === question.id) return false;
    if (form.id && q.id === form.id) return false;
    const sameText =
      q.question_text?.trim().toLowerCase() ===
      form.question_text?.trim().toLowerCase();
    const sameAnswer =
      (q.answer_text?.trim().toLowerCase() || "") ===
      (form.answer_text?.trim().toLowerCase() || "");
    const sameAnswerImage =
      (q.answer_image_url?.trim() || "") ===
      (form.answer_image_url?.trim() || "");
    return sameText && sameAnswer && sameAnswerImage;
  });

  // New question, category changed: jump the position past that category's
  // current highest slot instead of leaving it on whatever the previous
  // category last had (avoids colliding with an already-used position).
  const handleCategoryChange = (categoryId) => {
    const targetCategoryId = categoryId || categories[0]?.id || "";
    if (question) {
      set("category_id", targetCategoryId);
      return;
    }
    setForm((f) => ({
      ...f,
      category_id: targetCategoryId,
      position: nextPosition(questions, targetCategoryId),
    }));
  };

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
        className="w-full max-w-lg max-h-[85vh] rounded-3xl bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">
            {question ? "تعديل سؤال" : "سؤال جديد"}
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
              التصنيف *
            </label>
            <select
              value={form.category_id}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-cyan-500 outline-none transition-colors"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500">
              نص السؤال *
            </label>
            <textarea
              value={form.question_text}
              onChange={(e) => set("question_text", e.target.value)}
              rows={3}
              className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none transition-colors ${
                isDuplicateQuestion
                  ? "border-rose-400 focus:border-rose-500 bg-rose-50/50 text-rose-900"
                  : "border-slate-200 focus:border-cyan-500"
              }`}
              placeholder="اكتب السؤال هنا..."
            />
            {isDuplicateQuestion && (
              <p className="mt-1.5 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 inline shrink-0" />
                هالسؤال موجود من قبل بنفس التصنيف، ما تقدر تضيفه مرة ثانية!
              </p>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500">
              الإجابة الصحيحة *
            </label>
            <input
              value={form.answer_text}
              onChange={(e) => set("answer_text", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 outline-none transition-colors"
              placeholder="الإجابة"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500">
                الصعوبة
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => {
                  const d = e.target.value;
                  setForm((f) => ({
                    ...f,
                    difficulty: d,
                    strikes: DIFFICULTY_STRIKES[d],
                  }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-cyan-500 outline-none transition-colors"
              >
                <option value="easy">سهل (1 ضربة)</option>
                <option value="medium">متوسط (2 ضربة)</option>
                <option value="hard">صعب (3 ضربات)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500">
                ترتيب العرض
              </label>
              <input
                type="number"
                min={1}
                value={form.position}
                onChange={(e) => set("position", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 outline-none transition-colors"
              />
              {positionTaken && (
                <p className="mt-1 text-[10px] font-bold text-rose-600">
                  الموضع ده متاخد بسؤال ثاني في نفس التصنيف — اختار موضع فاضي.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> وسائط (صورة أو صوت — اختياري)
            </label>
            <div className="mt-1">
              <MediaUpload
                value={form.media_url || ""}
                type={form.media_type}
                onChange={(url, type) => {
                  setForm((f) => ({ ...f, media_url: url, media_type: type }));
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> صورة الإجابة (اختياري)
            </label>
            <div className="mt-1">
              <AnswerImageUpload
                value={form.answer_image_url || ""}
                onChange={(url) => set("answer_image_url", url)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4 border-slate-300"
            />
            <span className="text-sm font-bold text-slate-700">مفعّل</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={
              busy ||
              !form.category_id ||
              !form.question_text.trim() ||
              !form.answer_text.trim() ||
              positionTaken ||
              isDuplicateQuestion
            }
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
