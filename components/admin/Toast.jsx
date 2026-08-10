"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function Toast({ msg, type, onClose }) {
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
