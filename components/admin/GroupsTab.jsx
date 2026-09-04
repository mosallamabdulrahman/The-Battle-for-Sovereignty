"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Edit2, FolderTree, Plus, Search, Trash2 } from "lucide-react";

export default function GroupsTab({
  groups = [],
  categories = [],
  busy,
  setGroupModal,
  deleteGroup,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const categoriesCountByGroupId = useMemo(() => {
    const map = new Map();
    (categories || []).forEach((cat) => {
      if (cat.group_id) {
        const key = String(cat.group_id);
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [categories]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name?.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={() => setGroupModal({})}
          className="bg-[#f6f7f7] border border-[#2271b1] hover:bg-[#2271b1] hover:text-white text-[#2271b1] text-xs font-semibold px-2.5 py-1.5 rounded transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          أضف تصنيفاً جديداً
        </button>

        {/* Search Box */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن تصنيف..."
            className="border border-[#ccd0d4] bg-white rounded px-3 py-1.5 pl-8 text-sm outline-none focus:border-[#2271b1] w-full sm:w-64 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-[#ccd0d4] shadow-sm overflow-hidden rounded-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse text-[13px]">
            <thead>
              <tr className="bg-white border-b border-[#ccd0d4] select-none text-[#2c3338] font-bold text-[14px]">
                <th className="p-3 text-right">اسم التصنيف</th>
                <th className="p-3 text-right">عدد فئات الأسئلة</th>
                <th className="p-3 text-right">تاريخ الإضافة</th>
                <th className="p-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400">
                    لا توجد تصنيفات حالياً. اضغط على &quot;أضف تصنيفاً جديداً&quot; للبدء.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const catCount =
                    categoriesCountByGroupId.get(String(group.id)) || 0;
                  return (
                    <tr
                      key={group.id}
                      className="group hover:bg-[#f6f7f7] transition-colors"
                    >
                      <td className="p-3 font-semibold text-[#1d2327]">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-4 h-4 text-[#2271b1] shrink-0" />
                          <span className="text-[14px]">{group.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-semibold">
                        <span className="inline-flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 px-2.5 py-0.5 rounded-full text-xs">
                          📁 {catCount} {catCount === 1 ? "فئة" : "فئات"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-xs">
                        {group.created_at
                          ? new Date(group.created_at).toLocaleDateString(
                              "ar-EG",
                            )
                          : "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setGroupModal(group)}
                            className="flex items-center gap-1 text-xs font-semibold text-[#2271b1] hover:underline cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGroup(group.id, group.name)}
                            disabled={busy}
                            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="block md:hidden divide-y divide-[#ccd0d4] bg-white">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              لا توجد تصنيفات حالياً. اضغط على &quot;أضف تصنيفاً جديداً&quot; للبدء.
            </div>
          ) : (
            filteredGroups.map((group) => {
              const catCount =
                categoriesCountByGroupId.get(String(group.id)) || 0;
              return (
                <div key={group.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderTree className="w-5 h-5 text-[#2271b1] shrink-0" />
                      <span className="font-bold text-[14px] text-[#1d2327] truncate">
                        {group.name}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-800 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0">
                      📁 {catCount} فئات
                    </span>
                  </div>

                  {/* Action Links */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
                    <span className="text-[11px]">
                      {group.created_at
                        ? new Date(group.created_at).toLocaleDateString("ar-EG")
                        : ""}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGroupModal(group)}
                        className="text-[#2271b1] font-semibold hover:underline cursor-pointer"
                      >
                        تعديل
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => deleteGroup(group.id, group.name)}
                        disabled={busy}
                        className="text-rose-600 font-semibold hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#f6f7f7] border-t border-[#ccd0d4] p-3 text-[12px] text-slate-500 text-left">
          إجمالي التصنيفات: {filteredGroups.length} من أصل {groups.length}
        </div>
      </div>
    </motion.div>
  );
}
