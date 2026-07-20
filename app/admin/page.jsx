"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  CheckCircle,
  Edit2,
  ImageIcon,
  Loader2,
  Music,
  Plus,
  Save,
  Tag,
  Trash2,
  Upload,
  X,
  Search,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Users,
  BarChart3,
} from "lucide-react";
import { supabasePanel as supabase } from "../../lib/supabase-panel";
import GameLogo from "../../components/GameLogo";
import UsersManager from "../../components/admin/UsersManager";

// ─── helpers ───────────────────────────────────────────────────
const DIFFICULTY_AR = { easy: "سهل", medium: "متوسط", hard: "صعب" };
const DIFFICULTY_STRIKES = { easy: 1, medium: 2, hard: 3 };

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-bold shadow-2xl ${
        type === "error"
          ? "border-rose-700 bg-rose-900 text-white"
          : "border-emerald-700 bg-emerald-900 text-white"
      }`}
    >
      {type === "error" ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      {msg}
    </div>
  );
}

// ─── Media Upload ───────────────────────────────────────────────
function MediaUpload({ value, type, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    setError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const allowed = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "mp3",
        "ogg",
        "wav",
        "m4a",
      ];
      if (!allowed.includes(ext)) throw new Error("نوع الملف غير مدعوم.");

      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error: upErr } = await supabase.storage
        .from("question-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("question-media").getPublicUrl(data.path);

      const mediaType = ["mp3", "ogg", "wav", "m4a"].includes(ext)
        ? "audio"
        : "image";
      onChange(publicUrl, mediaType);
    } catch (err) {
      setError(err.message || "فشل الرفع.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "جارٍ الرفع..." : "رفع ملف"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("", null)}
            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            <X className="h-3 w-3" />
            إزالة
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,audio/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
      {value && type === "image" && (
        <img
          src={value}
          alt="preview"
          className="h-28 rounded-xl object-cover border border-slate-200"
        />
      )}
      {value && type === "audio" && (
        <audio controls src={value} className="w-full h-8" />
      )}
      {value && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value, type)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-mono text-slate-500 bg-slate-50"
          placeholder="أو أدخل رابط URL مباشرة"
        />
      )}
      {!value && (
        <input
          value=""
          onChange={(e) => {
            const url = e.target.value.trim();
            if (!url) return;
            const isAudio = /\.(mp3|ogg|wav|m4a)$/i.test(url);
            onChange(url, isAudio ? "audio" : "image");
          }}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-mono text-slate-500 bg-slate-50"
          placeholder="أو أدخل رابط URL مباشرة"
        />
      )}
    </div>
  );
}

// Cover-image upload for categories — separate storage bucket and state
// from the question MediaUpload above, so the two never interfere.
function CategoryImageUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    setError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const allowed = ["jpg", "jpeg", "png", "gif", "webp"];
      if (!allowed.includes(ext)) throw new Error("نوع الملف غير مدعوم.");

      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error: upErr } = await supabase.storage
        .from("category-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("category-images").getPublicUrl(data.path);

      onChange(publicUrl);
    } catch (err) {
      setError(err.message || "فشل الرفع.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "جارٍ الرفع..." : "رفع صورة"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            <X className="h-3 w-3" />
            إزالة
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-28 rounded-xl object-cover border border-slate-200"
        />
      )}
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-mono text-slate-500 bg-slate-50"
        placeholder="أو أدخل رابط URL مباشرة"
      />
    </div>
  );
}

// Image upload for a question's answer — stored separately from the
// question's own media (media_url/media_type above) so the two never mix,
// even though both live in the same "question-media" storage bucket.
function AnswerImageUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    setError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const allowed = ["jpg", "jpeg", "png", "gif", "webp"];
      if (!allowed.includes(ext)) throw new Error("نوع الملف غير مدعوم.");

      const path = `answer_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error: upErr } = await supabase.storage
        .from("question-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("question-media").getPublicUrl(data.path);

      onChange(publicUrl);
    } catch (err) {
      setError(err.message || "فشل الرفع.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "جارٍ الرفع..." : "رفع صورة"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            <X className="h-3 w-3" />
            إزالة
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-28 rounded-xl object-cover border border-slate-200"
        />
      )}
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-mono text-slate-500 bg-slate-50"
        placeholder="أو أدخل رابط URL مباشرة"
      />
    </div>
  );
}

// ─── Category Modal ─────────────────────────────────────────────
function CategoryModal({ category, categories, onSave, onClose, busy }) {
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
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500">
                إيموجي
              </label>
              <input
                value={form.emoji}
                onChange={(e) => set("emoji", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-center text-2xl focus:border-cyan-500 outline-none transition-colors"
              />
            </div>
            <div className="col-span-3">
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
              ده ترتيب ظهور التصنيف في الصفحة الرئيسية — الرقم الأصغر يظهر
              الأول. أول رقم مسموح هو 1.
            </p>
            {orderTooLow && (
              <p className="mt-1 text-[10px] font-bold text-rose-600">
                الترتيب لازم يكون 1 أو أكبر.
              </p>
            )}
            {!orderTooLow && orderTaken && (
              <p className="mt-1 text-[10px] font-bold text-rose-600">
                الترتيب ده متاخد بتصنيف تاني — اختار رقم مختلف.
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4 border-slate-300"
            />
            <span className="text-sm font-bold text-slate-700">
              مفعّل (يظهر في الإعداد)
            </span>
          </label>
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

// ─── Question Modal ─────────────────────────────────────────────
// A category can hold any number of questions — the game randomly picks 6
// of them per room. "position" is just a display/ordering value, so a new
// question is appended after the current highest position in its category.
const nextPosition = (questions, categoryId, excludeId) => {
  const used = (questions || [])
    .filter((q) => q.category_id === categoryId && q.id !== excludeId)
    .map((q) => q.position);
  return used.length ? Math.max(...used) + 1 : 1;
};

function QuestionModal({
  question,
  categories,
  questions,
  onSave,
  onClose,
  busy,
}) {
  const [form, setForm] = useState(() => {
    if (question) {
      const hasValidCategory = categories.some((c) => String(c.id) === String(question.category_id));
      return {
        ...question,
        category_id: hasValidCategory ? question.category_id : (categories[0]?.id || ""),
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
    return (
      q.question_text?.trim().toLowerCase() ===
      form.question_text?.trim().toLowerCase()
    );
  });

  // New question, category changed: jump the position past that category's
  // current highest slot instead of leaving it on whatever the previous
  // category last had (avoids colliding with an already-used position).
  const handleCategoryChange = (categoryId) => {
    const targetCategoryId = categoryId || (categories[0]?.id || "");
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
                  {c.emoji} {c.name}
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

// ─── Help Modal ─────────────────────────────────────────────────
function HelpModal({ onClose }) {
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
            <h2 className="font-bold text-slate-900 text-base">دليل استخدام لوحة التحكم</h2>
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
            <h3 className="font-bold text-slate-800 text-sm mb-1">🎮 نظرة عامة</h3>
            <p className="text-xs">
              مرحباً بك في لوحة تحكم لعبة **حيلهم بينهم**. يمكنك من هنا إعداد بنك الأسئلة بالكامل وإدارة غرف اللعب والمستخدمين.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-1">📊 لوحة التحكم (الرئيسية)</h4>
              <p className="text-[11px]">
                تعرض إحصائيات سريعة للأسئلة المتاحة ومستويات الصعوبة، بالإضافة إلى إحصائية لعدد مرات اختيار ولعب كل تصنيف في غرف اللعب السابقة.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-1">❓ إدارة الأسئلة</h4>
              <p className="text-[11px]">
                تمكنك من إضافة أسئلة جديدة وتعديلها أو حذفها. كما يمكنك تعيين مستويات الصعوبة (سهل، متوسط، صعب)، وإضافة صور أو ملفات صوتية لكل سؤال. نظام الفحص يمنع إضافة سؤال مكرر بنفس التصنيف تلقائياً لتفادي التشابه.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-1">🏷️ تصنيفات الأسئلة</h4>
              <p className="text-[11px]">
                تعديل رموز التصنيف (Emoji)، الأسماء، الأوصاف، وترتيب ظهورها عند إنشاء غرف اللعب. كما يُعرض أمام كل تصنيف إحصائية إجمالي مرات اختياره في ألعاب اللعبة.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs mb-1">👥 إدارة المستخدمين</h4>
              <p className="text-[11px]">
                تتيح لك إضافة حسابات جديدة للحكّام أو اللاعبين، تعديل كلمات المرور الخاصة بهم، أو تعيين وتعديل الصلاحيات أو حذف المستخدمين كلياً.
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


// ─── Main Admin Page ────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTabState] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      const validTabs = ["dashboard", "questions", "categories", "users", "stats"];
      if (urlTab && validTabs.includes(urlTab)) {
        return urlTab;
      }
      const savedTab = window.localStorage.getItem("admin_active_tab");
      if (savedTab && validTabs.includes(savedTab)) {
        return savedTab;
      }
    }
    return "questions";
  });

  const setTab = useCallback((newTab) => {
    setTabState(newTab);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("admin_active_tab", newTab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      const validTabs = ["dashboard", "questions", "categories", "users", "stats"];
      if (urlTab && validTabs.includes(urlTab)) {
        setTabState(urlTab);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [categoryUsage, setCategoryUsage] = useState({});
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [catModal, setCatModal] = useState(null); // null | {} | category object
  const [qModal, setQModal] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const notify = useCallback(
    (msg, type = "success") => setToast({ msg, type }),
    [],
  );
  const closeToast = useCallback(
    () => setToast({ msg: "", type: "success" }),
    [],
  );

  // ── Data loaders
  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("question_categories")
      .select("*")
      .order("sort_order");
    if (error) {
      notify(error.message, "error");
      return;
    }
    setCategories(data || []);
  }, [notify]);

  const loadQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from("question_bank")
      .select("*")
      .order("category_id")
      .order("position");
    if (error) {
      notify(error.message, "error");
      return;
    }
    setQuestions(data || []);
  }, [notify]);

  const loadCategoryUsage = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("game_rooms")
        .select("selected_categories");
      if (!error && data) {
        const counts = {};
        data.forEach((room) => {
          if (Array.isArray(room.selected_categories)) {
            room.selected_categories.forEach((catIdentifier) => {
              counts[catIdentifier] = (counts[catIdentifier] || 0) + 1;
            });
          }
        });
        setCategoryUsage(counts);
      }
    } catch (err) {
      console.error("Error loading category usage statistics:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadCategories(),
      loadQuestions(),
      loadCategoryUsage(),
    ]).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadCategories, loadQuestions, loadCategoryUsage]);

  // ── Categories CRUD
  const saveCategory = async (form) => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_save_category", {
        p_id: form.id || null,
        p_name: form.name.trim(),
        p_description: form.description?.trim() || null,
        p_emoji: form.emoji || "📌",
        p_image_url: form.image_url?.trim() || null,
        p_sort_order: form.sort_order || 0,
        p_is_active: form.is_active,
      });
      if (error) throw error;
      notify(form.id ? "تم تحديث التصنيف." : "تم إضافة التصنيف.");
      await loadCategories();
      setCatModal(null);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("حذف هذا التصنيف وكل أسئلته؟")) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_delete_category", {
        p_id: id,
      });
      if (error) throw error;
      notify("تم الحذف.");
      await Promise.all([loadCategories(), loadQuestions()]);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  // ── Questions CRUD
  const saveQuestion = async (form) => {
    const isDup = questions.some(
      (q) =>
        q.category_id === form.category_id &&
        q.id !== form.id &&
        q.question_text?.trim().toLowerCase() ===
          form.question_text?.trim().toLowerCase(),
    );
    if (isDup) {
      notify(
        "هالسؤال موجود من قبل بنفس التصنيف، ما تقدر تضيفه مرة ثانية!",
        "error",
      );
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_save_question", {
        p_id: form.id || null,
        p_category_id: form.category_id,
        p_question_text: form.question_text.trim(),
        p_answer_text: form.answer_text.trim(),
        p_difficulty: form.difficulty,
        p_strikes: DIFFICULTY_STRIKES[form.difficulty],
        p_position: form.position || 1,
        p_is_active: form.is_active,
        p_media_url: form.media_url?.trim() || null,
        p_media_type: form.media_url?.trim()
          ? form.media_type || "image"
          : null,
        p_answer_image_url: form.answer_image_url?.trim() || null,
      });
      if (error) throw error;
      notify(form.id ? "تم تحديث السؤال." : "تم إضافة السؤال.");
      await loadQuestions();
      setQModal(null);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm("حذف هذا السؤال؟")) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_delete_question", {
        p_id: id,
      });
      if (error) throw error;
      notify("تم حذف السؤال.");
      await loadQuestions();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesCategory = filterCategory
      ? q.category_id === filterCategory
      : true;
    const matchesSearch = searchQuery
      ? q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer_text?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const filteredCategories = categories.filter((c) => {
    return searchQuery
      ? c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
  });

  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[String(c.id)] = c;
    if (c.name) {
      categoryMap[c.name.trim()] = c;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-1">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} onClose={closeToast} />
      <AnimatePresence>
        {catModal !== null && (
          <CategoryModal
            category={catModal.id ? catModal : null}
            categories={categories}
            onSave={saveCategory}
            onClose={() => setCatModal(null)}
            busy={busy}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {qModal !== null && (
          <QuestionModal
            question={qModal.id ? qModal : null}
            categories={categories}
            questions={questions}
            onSave={saveQuestion}
            onClose={() => setQModal(null)}
            busy={busy}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {helpOpen && (
          <HelpModal onClose={() => setHelpOpen(false)} />
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-[calc(100vh-32px)]">
        {/* Right Sidebar (WordPress-style) */}
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
              {[
                { key: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
                { key: "questions", label: "الأسئلة", icon: Edit2 },
                { key: "categories", label: "تصنيفات الأسئلة", icon: Tag },
                { key: "users", label: "المستخدمين", icon: Users },
                { key: "stats", label: "إحصائيات اللعبة", icon: BarChart3 },
              ].map(({ key, label, icon: Icon }) => {
                const isActive = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setTab(key);
                      setSearchQuery("");
                    }}
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

        {/* Main Content Area */}
        <main className="flex-1 bg-[#f0f0f1] p-6 text-[#2c3338] overflow-auto">
          {/* WordPress Page Header Tools */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-normal text-[#1d2327]">
                {tab === "dashboard" && "لوحة التحكم الرئيسة"}
                {tab === "questions" && "الأسئلة"}
                {tab === "categories" && "تصنيفات الأسئلة"}
                {tab === "users" && "المستخدمين"}
                {tab === "stats" && "إحصائيات اللعبة"}
              </h1>

              {tab === "questions" && (
                <button
                  onClick={() => setQModal({})}
                  disabled={categories.length === 0}
                  className="bg-[#f6f7f7] border border-[#2271b1] hover:bg-[#f0f0f1] text-[#2271b1] text-xs font-semibold px-2.5 py-1 rounded transition shadow-sm"
                >
                  أضف جديداً
                </button>
              )}
              {tab === "categories" && (
                <button
                  onClick={() => setCatModal({})}
                  className="bg-[#f6f7f7] border border-[#2271b1] hover:bg-[#f0f0f1] text-[#2271b1] text-xs font-semibold px-2.5 py-1 rounded transition shadow-sm"
                >
                  أضف جديداً
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-[12px] bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-600 shadow-sm hover:bg-slate-50 cursor-pointer flex items-center gap-1 select-none outline-none focus:ring-2 focus:ring-cyan-500/20"
              >
                <HelpCircle className="w-3.5 h-3.5" /> المساعدة
              </button>
            </div>
          </div>

          {/* ───────────────── TAB: Dashboard ───────────────── */}
          {tab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Welcome Panel */}
              <div className="bg-white border border-[#ccd0d4] p-8 shadow-sm relative overflow-hidden">
                <div className="max-w-2xl">
                  <h2 className="text-3xl font-light text-[#1d2327] mb-2">
                    هلا بيك في لوحة تحكم حيلهم بينهم!
                  </h2>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    من هني تقدر تدير بنك الأسئلة والفئات وتعدل الصور والأصوات
                    وتغير الصعوبة بكل سهولة وبسرعة.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setTab("questions")}
                      className="bg-[#2271b1] hover:bg-[#135e96] text-white text-sm font-semibold px-4 py-2 rounded shadow transition"
                    >
                      إدارة الأسئلة الحالية
                    </button>
                    <button
                      onClick={() => setTab("categories")}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2 rounded transition"
                    >
                      تعديل تصنيفات اللعبة
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Stats Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-[#ccd0d4] p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 border-b pb-3 mb-3 text-sm">
                    لمحة سريعة
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>
                      • إجمالي الأسئلة:{" "}
                      <span className="font-bold text-cyan-600">
                        {questions.length} سؤال
                      </span>
                    </p>
                    <p>
                      • إجمالي التصنيفات:{" "}
                      <span className="font-bold text-cyan-600">
                        {categories.length} تصنيف
                      </span>
                    </p>
                    <p>
                      • الأسئلة المفعّلة:{" "}
                      <span className="font-bold text-emerald-600">
                        {questions.filter((q) => q.is_active).length} سؤال
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#ccd0d4] p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 border-b pb-3 mb-3 text-sm">
                    مستويات الصعوبة
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>
                      • سهل:{" "}
                      <span className="font-bold text-emerald-600">
                        {
                          questions.filter((q) => q.difficulty === "easy")
                            .length
                        }{" "}
                        سؤال
                      </span>
                    </p>
                    <p>
                      • متوسط:{" "}
                      <span className="font-bold text-amber-600">
                        {
                          questions.filter((q) => q.difficulty === "medium")
                            .length
                        }{" "}
                        سؤال
                      </span>
                    </p>
                    <p>
                      • صعب:{" "}
                      <span className="font-bold text-rose-600">
                        {
                          questions.filter((q) => q.difficulty === "hard")
                            .length
                        }{" "}
                        سؤال
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#ccd0d4] p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 border-b pb-3 mb-3 text-sm">
                    الوسائط والميديا
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>
                      • أسئلة تحتوي على صور:{" "}
                      <span className="font-bold text-cyan-600">
                        {
                          questions.filter((q) => q.media_type === "image")
                            .length
                        }{" "}
                        سؤال
                      </span>
                    </p>
                    <p>
                      • أسئلة تحتوي على أصوات:{" "}
                      <span className="font-bold text-cyan-600">
                        {
                          questions.filter((q) => q.media_type === "audio")
                            .length
                        }{" "}
                        سؤال
                      </span>
                    </p>
                    <p>
                      • أسئلة نصية فقط:{" "}
                      <span className="font-bold text-slate-500">
                        {questions.filter((q) => !q.media_url).length} سؤال
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}


          {/* ───────────────── TAB: Questions ───────────────── */}
          {tab === "questions" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Filter and Search Bar */}
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border border-[#ccd0d4] bg-white rounded px-2.5 py-1.5 text-sm text-slate-700 shadow-sm outline-none focus:border-[#2271b1]"
                  >
                    <option value="">كل التصنيفات</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن سؤال أو إجابة..."
                    className="border border-[#ccd0d4] bg-white rounded px-3 py-1.5 pl-8 text-sm outline-none focus:border-[#2271b1] w-64 shadow-sm"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* WordPress-style Table */}
              <div className="bg-white border border-[#ccd0d4] shadow-sm overflow-x-auto">
                <table className="w-full text-right border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-white border-b border-[#ccd0d4] select-none text-[#2c3338] font-bold text-[14px]">
                      <th className="p-3 text-right">السؤال</th>
                      <th className="p-3 text-right">التصنيف</th>
                      <th className="p-3 text-right">الصعوبة</th>
                      <th className="p-3 text-right">الموضع</th>
                      <th className="p-3 text-right">الوسائط</th>
                      <th className="p-3 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f1]">
                    {filteredQuestions.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-8 text-center text-slate-400"
                        >
                          لا توجد أسئلة تطابق البحث أو التصنيف المختار.
                        </td>
                      </tr>
                    ) : (
                      filteredQuestions.map((q) => {
                        const cat = (q.category_id ? categoryMap[String(q.category_id)] : null) || categories[0];
                        return (
                          <tr
                            key={q.id}
                            className="group hover:bg-[#f6f7f7] transition-colors"
                          >
                            <td className="p-3 max-w-sm">
                              <div className="font-semibold text-[#1d2327] mb-1 line-clamp-2">
                                {q.question_text}
                              </div>
                              <div className="text-[11px] text-emerald-700 font-bold mb-1">
                                الإجابة: {q.answer_text}
                              </div>
                              {/* Inline Hover Actions */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[11px] font-semibold mt-1">
                                <button
                                  onClick={() => setQModal(q)}
                                  className="text-[#2271b1] hover:text-[#135e96]"
                                >
                                  تحرير
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  onClick={() => deleteQuestion(q.id)}
                                  disabled={busy}
                                  className="text-rose-600 hover:text-rose-800 disabled:opacity-50"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-slate-600">
                              {cat ? (
                                <span className="inline-flex items-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
                                  {cat.emoji} {cat.name}
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  غير معروف
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                                  q.difficulty === "easy"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : q.difficulty === "medium"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {DIFFICULTY_AR[q.difficulty]} ({q.strikes}⚡)
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-mono">
                              #{q.position}
                            </td>
                            <td className="p-3">
                              {q.media_url ? (
                                <a
                                  href={q.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[#2271b1] hover:underline"
                                >
                                  {q.media_type === "image" ? (
                                    <>
                                      <img
                                        src={q.media_url}
                                        alt={q.media_type}
                                        className="w-14 h-14"
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <Music className="w-3.5 h-3.5" />
                                      <span>صوت</span>
                                    </>
                                  )}
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-block font-semibold text-[11px] ${
                                  q.is_active
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {q.is_active ? "مفعّل" : "معطّل"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <div className="bg-[#f6f7f7] border-t border-[#ccd0d4] p-3 text-[12px] text-slate-500 text-left">
                  إجمالي الأسئلة المفلترة: {filteredQuestions.length} من أصل{" "}
                  {questions.length}
                </div>
              </div>
            </motion.div>
          )}

          {/* ───────────────── TAB: Categories ───────────────── */}
          {tab === "categories" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Filter and Search Bar */}
              <div className="flex justify-end items-center gap-3">
                {/* Search Box */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن تصنيف..."
                    className="border border-[#ccd0d4] bg-white rounded px-3 py-1.5 pl-8 text-sm outline-none focus:border-[#2271b1] w-64 shadow-sm"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* WordPress-style Table */}
              <div className="bg-white border border-[#ccd0d4] shadow-sm overflow-x-auto">
                <table className="w-full text-right border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-white border-b border-[#ccd0d4] select-none text-[#2c3338] font-bold text-[14px]">
                      <th className="p-3 text-right">الرمز والاسم</th>
                      <th className="p-3 text-right">الوصف</th>
                      <th className="p-3 text-right">الترتيب</th>
                      <th className="p-3 text-right">صورة الغلاف</th>
                      <th className="p-3 text-right">عدد الأسئلة</th>
                      <th className="p-3 text-right">مرات الاختيار باللعب</th>
                      <th className="p-3 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f1]">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="p-8 text-center text-slate-400"
                        >
                          لا توجد تصنيفات تطابق البحث.
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat) => {
                        const catQuestionsCount = questions.filter(
                          (q) => q.category_id === cat.id,
                        ).length;
                        return (
                          <tr
                            key={cat.id}
                            className="group hover:bg-[#f6f7f7] transition-colors"
                          >
                            <td className="p-3 max-w-xs">
                              <div className="font-semibold text-[#1d2327] mb-1 flex items-center gap-1.5">
                                <span className="text-xl">{cat.emoji}</span>
                                <span>{cat.name}</span>
                              </div>
                              {/* Inline Hover Actions */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[11px] font-semibold mt-1">
                                <button
                                  onClick={() => setCatModal(cat)}
                                  className="text-[#2271b1] hover:text-[#135e96]"
                                >
                                  تحرير
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  onClick={() => deleteCategory(cat.id)}
                                  disabled={busy}
                                  className="text-rose-600 hover:text-rose-800 disabled:opacity-50"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-slate-600">
                              {cat.description ? (
                                <p className="line-clamp-2 text-slate-500">
                                  {cat.description}
                                </p>
                              ) : (
                                <span className="text-slate-400 italic">
                                  لا يوجد وصف
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-500 font-mono">
                              #{cat.sort_order}
                            </td>
                            <td className="p-3">
                              {cat.image_url ? (
                                <a
                                  href={cat.image_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-16 h-10 rounded border border-slate-200 overflow-hidden hover:opacity-85 transition-opacity"
                                >
                                  <img
                                    src={cat.image_url}
                                    alt={cat.name}
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-slate-700">
                              {catQuestionsCount} أسئلة
                            </td>
                            <td className="p-3 font-semibold text-slate-700">
                              <span className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-full font-bold text-[11px]">
                                🎮 {categoryUsage[cat.id] || categoryUsage[cat.name] || 0}{" "}
                                {(categoryUsage[cat.id] || categoryUsage[cat.name] || 0) === 1
                                  ? "مرة"
                                  : "مرات"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-block font-semibold text-[11px] ${
                                  cat.is_active
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {cat.is_active ? "مفعّل" : "معطّل"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <div className="bg-[#f6f7f7] border-t border-[#ccd0d4] p-3 text-[12px] text-slate-500 text-left">
                  إجمالي التصنيفات المفلترة: {filteredCategories.length} من أصل{" "}
                  {categories.length}
                </div>
              </div>
            </motion.div>
          )}

          {/* ───────────────── TAB: Users ───────────────── */}
          {tab === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <UsersManager notify={notify} />
            </motion.div>
          )}

          {/* ───────────────── TAB: Stats ───────────────── */}
          {tab === "stats" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Category Usage Statistics */}
              <div className="bg-white border border-[#ccd0d4] p-8 shadow-sm">
                <h3 className="font-semibold text-slate-900 border-b pb-3 mb-5 text-base flex items-center justify-between">
                  <span>🎮 إحصائيات اختيار التصنيفات في ألعاب اللعبة (كم مرة انلعب كل تصنيف)</span>
                  <span className="text-[12px] text-slate-400 font-normal">
                    محسوبة تلقائياً من غرف اللعب الحالية والسابقة بقاعدة البيانات
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {categories.map((cat) => {
                    const usageCount =
                      categoryUsage[cat.id] || categoryUsage[cat.name] || 0;
                    return (
                      <div
                        key={cat.id}
                        className="bg-slate-50 border border-slate-200 rounded-3xl p-4 text-center flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all duration-200"
                      >
                        <div>
                          <div className="text-3xl mb-2">{cat.emoji}</div>
                          <div
                            className="font-bold text-sm text-slate-800 truncate"
                            title={cat.name}
                          >
                            {cat.name}
                          </div>
                        </div>
                        <div className="mt-4 text-xs font-extrabold text-purple-700 bg-purple-100/70 border border-purple-200 rounded-xl py-1.5 px-2">
                          {usageCount} {usageCount === 1 ? "مرة" : "مرات"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}
