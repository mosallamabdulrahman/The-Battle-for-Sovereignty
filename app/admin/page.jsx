"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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
      const allowed = ["jpg", "jpeg", "png", "gif", "webp", "mp3", "ogg", "wav", "m4a"];
      if (!allowed.includes(ext)) throw new Error("نوع الملف غير مدعوم.");

      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error: upErr } = await supabase.storage
        .from("question-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("question-media").getPublicUrl(data.path);

      const mediaType = ["mp3", "ogg", "wav", "m4a"].includes(ext) ? "audio" : "image";
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
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
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
        <img src={value} alt="preview" className="h-28 rounded-xl object-cover border border-slate-200" />
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

// ─── Category Modal ─────────────────────────────────────────────
function CategoryModal({ category, onSave, onClose, busy }) {
  const [form, setForm] = useState(
    category || { name: "", description: "", emoji: "📌", image_url: "", sort_order: 0, is_active: true },
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{category ? "تعديل تصنيف" : "تصنيف جديد"}</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500">إيموجي</label>
            <input
              value={form.emoji}
              onChange={(e) => set("emoji", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-center text-2xl"
            />
          </div>
          <div className="col-span-3">
            <label className="text-[11px] font-bold text-slate-500">الاسم *</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="اسم التصنيف"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500">وصف (اختياري)</label>
          <input
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="وصف مختصر"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500">صورة الغلاف (URL)</label>
            <input
              value={form.image_url || ""}
              onChange={(e) => set("image_url", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-mono"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500">الترتيب</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-bold text-slate-700">مفعّل (يظهر في الإعداد)</span>
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={busy || !form.name.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 text-sm font-bold text-white disabled:opacity-60 hover:bg-cyan-700"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ
          </button>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Question Modal ─────────────────────────────────────────────
function QuestionModal({ question, categories, onSave, onClose, busy }) {
  const [form, setForm] = useState(
    question || {
      category_id: categories[0]?.id || "",
      question_text: "",
      answer_text: "",
      difficulty: "easy",
      position: 1,
      is_active: true,
      media_url: "",
      media_type: null,
    },
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{question ? "تعديل سؤال" : "سؤال جديد"}</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500">التصنيف *</label>
          <select
            value={form.category_id}
            onChange={(e) => set("category_id", e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500">نص السؤال *</label>
          <textarea
            value={form.question_text}
            onChange={(e) => set("question_text", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none"
            placeholder="اكتب السؤال هنا..."
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500">الإجابة الصحيحة *</label>
          <input
            value={form.answer_text}
            onChange={(e) => set("answer_text", e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="الإجابة"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500">الصعوبة</label>
            <select
              value={form.difficulty}
              onChange={(e) => {
                const d = e.target.value;
                set("difficulty", d);
                set("strikes", DIFFICULTY_STRIKES[d]);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
            >
              <option value="easy">سهل (1 ضربة)</option>
              <option value="medium">متوسط (2 ضربة)</option>
              <option value="hard">صعب (3 ضربات)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500">الموضع (1-6)</label>
            <input
              type="number"
              min={1}
              max={6}
              value={form.position}
              onChange={(e) => set("position", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
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
              onChange={(url, type) => { set("media_url", url); set("media_type", type); }}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-bold text-slate-700">مفعّل</span>
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={busy || !form.question_text.trim() || !form.answer_text.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 text-sm font-bold text-white disabled:opacity-60 hover:bg-cyan-700"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ
          </button>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState("categories"); // "categories" | "questions"
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [catModal, setCatModal] = useState(null); // null | {} | category object
  const [qModal, setQModal] = useState(null);

  const notify = (msg, type = "success") => setToast({ msg, type });
  const closeToast = useCallback(() => setToast({ msg: "", type: "success" }), []);

  // ── Data loaders
  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("question_categories")
      .select("*")
      .order("sort_order");
    if (error) { notify(error.message, "error"); return; }
    setCategories(data || []);
  }, []);

  const loadQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from("question_bank")
      .select("*")
      .order("category_id")
      .order("position");
    if (error) { notify(error.message, "error"); return; }
    setQuestions(data || []);
  }, []);

  useEffect(() => {
    Promise.all([loadCategories(), loadQuestions()]).finally(() =>
      setLoading(false),
    );
  }, [loadCategories, loadQuestions]);

  // ── Categories CRUD
  const saveCategory = async (form) => {
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        emoji: form.emoji || "📌",
        image_url: form.image_url?.trim() || null,
        sort_order: form.sort_order || 0,
        is_active: form.is_active,
      };
      if (form.id) {
        const { error } = await supabase.from("question_categories").update(payload).eq("id", form.id);
        if (error) throw error;
        notify("تم تحديث التصنيف.");
      } else {
        const { error } = await supabase.from("question_categories").insert(payload);
        if (error) throw error;
        notify("تم إضافة التصنيف.");
      }
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
      await supabase.from("question_bank").delete().eq("category_id", id);
      const { error } = await supabase.from("question_categories").delete().eq("id", id);
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
    setBusy(true);
    try {
      const payload = {
        category_id:   form.category_id,
        question_text: form.question_text.trim(),
        answer_text:   form.answer_text.trim(),
        difficulty:    form.difficulty,
        strikes:       DIFFICULTY_STRIKES[form.difficulty],
        position:      form.position || 1,
        is_active:     form.is_active,
        media_url:     form.media_url?.trim() || null,
        media_type:    form.media_url?.trim() ? (form.media_type || "image") : null,
      };
      if (form.id) {
        const { error } = await supabase.from("question_bank").update(payload).eq("id", form.id);
        if (error) throw error;
        notify("تم تحديث السؤال.");
      } else {
        const { error } = await supabase.from("question_bank").insert(payload);
        if (error) throw error;
        notify("تم إضافة السؤال.");
      }
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
      const { error } = await supabase.from("question_bank").delete().eq("id", id);
      if (error) throw error;
      notify("تم حذف السؤال.");
      await loadQuestions();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const filteredQuestions = filterCategory
    ? questions.filter((q) => q.category_id === filterCategory)
    : questions;

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} onClose={closeToast} />
      {catModal !== null && (
        <CategoryModal
          category={catModal.id ? catModal : null}
          onSave={saveCategory}
          onClose={() => setCatModal(null)}
          busy={busy}
        />
      )}
      {qModal !== null && (
        <QuestionModal
          question={qModal.id ? qModal : null}
          categories={categories}
          onSave={saveQuestion}
          onClose={() => setQModal(null)}
          busy={busy}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "categories", label: "التصنيفات", icon: Tag },
            { key: "questions",  label: "الأسئلة",   icon: Edit2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
                tab === key
                  ? "bg-cyan-600 text-white shadow"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Categories Tab ── */}
        {tab === "categories" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">التصنيفات ({categories.length})</h2>
              <button
                type="button"
                onClick={() => setCatModal({})}
                className="flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4" />
                تصنيف جديد
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {categories.length === 0 && (
                <p className="px-6 py-8 text-center text-slate-400 text-sm">لا توجد تصنيفات بعد.</p>
              )}
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="text-2xl">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                    {cat.description && (
                      <p className="text-[11px] text-slate-500 truncate">{cat.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                          cat.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {cat.is_active ? "مفعّل" : "معطّل"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {questions.filter((q) => q.category_id === cat.id).length} سؤال
                      </span>
                    </div>
                  </div>
                  {cat.image_url && (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="h-10 w-16 rounded-xl object-cover border border-slate-200"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCatModal(cat)}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2 hover:bg-cyan-50 hover:border-cyan-300"
                    >
                      <Edit2 className="h-4 w-4 text-slate-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      disabled={busy}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2 hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Questions Tab ── */}
        {tab === "questions" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-slate-900">الأسئلة ({filteredQuestions.length})</h2>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white"
                >
                  <option value="">كل التصنيفات</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setQModal({})}
                disabled={categories.length === 0}
                className="flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                سؤال جديد
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredQuestions.length === 0 && (
                <p className="px-6 py-8 text-center text-slate-400 text-sm">
                  لا توجد أسئلة. أضف أسئلة أو اختر تصنيفًا آخر.
                </p>
              )}
              {filteredQuestions.map((q) => {
                const cat = categoryMap[q.category_id];
                return (
                  <div key={q.id} className="flex items-start gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {cat && (
                          <span className="text-[10px] font-bold rounded-full bg-cyan-100 text-cyan-700 px-2 py-0.5">
                            {cat.emoji} {cat.name}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                            q.difficulty === "easy"
                              ? "bg-emerald-100 text-emerald-700"
                              : q.difficulty === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {DIFFICULTY_AR[q.difficulty]} · {q.strikes}⚡
                        </span>
                        <span className="text-[10px] text-slate-400">#{q.position}</span>
                        {q.media_type === "image" && (
                          <ImageIcon className="h-3 w-3 text-slate-400" />
                        )}
                        {q.media_type === "audio" && (
                          <Music className="h-3 w-3 text-slate-400" />
                        )}
                        {!q.is_active && (
                          <span className="text-[10px] font-bold rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">
                            معطّل
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {q.question_text}
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        ✓ {q.answer_text}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQModal(q)}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2 hover:bg-cyan-50 hover:border-cyan-300"
                      >
                        <Edit2 className="h-4 w-4 text-slate-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.id)}
                        disabled={busy}
                        className="rounded-xl border border-rose-200 bg-rose-50 p-2 hover:bg-rose-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
