"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import {
  Edit2,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { generatePassword } from "../../lib/auth";

const callAdminUsersApi = async (path, method, body) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("لازم تسجل دخول الأول.");
  }

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "صار خطأ غير متوقع.");
  }
  return json;
};

function UserModal({ user, onSave, onClose, busy }) {
  const [form, setForm] = useState({
    username: user?.display_name || "",
    email: user?.email || "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isEdit = Boolean(user);
  const canSave =
    form.username.trim().length >= 2 &&
    form.username.trim().length <= 40 &&
    (isEdit || form.email.trim().length > 0) &&
    (isEdit ? true : form.password.trim().length >= 6) &&
    (form.password.trim().length === 0 || form.password.trim().length >= 6);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">
            {isEdit ? "تعديل مستخدم" : "مستخدم جديد"}
          </h2>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500">
            اسم المستخدم *
          </label>
          <input
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="اسم المستخدم"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500">
            الإيميل *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            disabled={isEdit}
            className="text-right mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
            dir="ltr"
            placeholder="admin@example.com"
          />
          {isEdit && (
            <p className="mt-1 text-[10px] text-slate-400">
              ما تقدر تغيّر الإيميل بعد الإنشاء.
            </p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500">
            {isEdit ? "باسورد جديد" : "الباسورد *"}
          </label>
          {isEdit && (
            <p className="mt-0.5 text-[10px] text-slate-400">
              مفيش نظام يقدر يعرض الباسورد القديم (مشفّر ومحفوظ باتجاه واحد) —
              سيب الخانة فاضية لو مش عايز تغيّره، أو اكتب باسورد جديد.
            </p>
          )}
          <div className="mt-1 flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="text-right w-full rounded-xl border border-slate-200 px-3 py-2 pl-9 text-sm"
                dir="ltr"
                placeholder={isEdit ? "اتركه فارغًا لعدم التغيير" : "باسورد قوي"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPassword(true);
                set("password", generatePassword());
              }}
              title="ولّد باسورد قوي"
              className="rounded-xl border border-slate-200 px-3 text-slate-500 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">6 أحرف على الأقل.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={busy || !canSave}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 text-sm font-bold text-white disabled:opacity-60 hover:bg-cyan-700"
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
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersManager({ notify }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // null | {} | user row
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id || null);
    });
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      notify(error.message, "error");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSave = async (form) => {
    setBusy(true);
    try {
      if (modal?.user_id) {
        await callAdminUsersApi(`/api/admin/users/${modal.user_id}`, "PATCH", {
          username: form.username.trim(),
          password: form.password.trim() || undefined,
        });
        notify("تم تحديث المستخدم.");
      } else {
        await callAdminUsersApi("/api/admin/users", "POST", {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
        });
        notify("تم إنشاء المستخدم.");
      }
      setModal(null);
      await loadUsers();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (user) => {
    if (user.user_id === currentUserId) {
      notify("ما تقدر تحذف حسابك الحالي.", "error");
      return;
    }
    if (!window.confirm(`تحذف "${user.display_name}"؟ ما يرجع بعدها.`)) return;

    setBusy(true);
    try {
      await callAdminUsersApi(`/api/admin/users/${user.user_id}`, "DELETE");
      notify("تم حذف المستخدم.");
      await loadUsers();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {modal !== null && (
        <UserModal
          user={modal.user_id ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
          busy={busy}
        />
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setModal({})}
          className="bg-[#f6f7f7] border border-[#2271b1] hover:bg-[#f0f0f1] text-[#2271b1] text-xs font-semibold px-2.5 py-1 rounded transition shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          أضف مستخدم جديد
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#f6f7f7] border-b border-slate-200">
            <tr>
              <th className="p-3 text-right font-semibold text-slate-600">
                اسم المستخدم
              </th>
              <th className="p-3 text-right font-semibold text-slate-600">
                الإيميل
              </th>
              <th className="p-3 text-right font-semibold text-slate-600">
                تاريخ الإضافة
              </th>
              <th className="p-3 text-right font-semibold text-slate-600">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  لا يوجد مستخدمين.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-b border-slate-100 hover:bg-[#f6f7f7]"
                >
                  <td className="p-3 font-semibold text-slate-800">
                    <span className="inline-flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-cyan-500" />
                      {u.display_name}
                      {u.user_id === currentUserId && (
                        <span className="text-[10px] font-normal text-slate-400">
                          (أنت)
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600" dir="ltr">
                    {u.email}
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(u.created_at).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setModal(u)}
                        className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:underline"
                      >
                        <Edit2 className="w-3 h-3" /> تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={busy}
                        className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" /> حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
