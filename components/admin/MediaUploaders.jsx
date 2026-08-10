"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { supabasePanel as supabase } from "../../lib/supabase-panel";

// ─── Media Upload (question image/audio) ───────────────────────
export function MediaUpload({ value, type, onChange }) {
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
export function CategoryImageUpload({ value, onChange }) {
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
export function AnswerImageUpload({ value, onChange }) {
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
