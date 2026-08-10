"use client";

import { motion } from "motion/react";
import { Search } from "lucide-react";

export default function CategoriesTab({
  categories,
  filteredCategories,
  questions,
  categoryUsage,
  busy,
  searchQuery,
  setSearchQuery,
  setCatModal,
  deleteCategory,
}) {
  return (
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
              <th className="p-3 text-right">الاسم</th>
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
                <td colSpan="7" className="p-8 text-center text-slate-400">
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
                        🎮{" "}
                        {categoryUsage[cat.id] || categoryUsage[cat.name] || 0}{" "}
                        {(categoryUsage[cat.id] ||
                          categoryUsage[cat.name] ||
                          0) === 1
                          ? "مرة"
                          : "مرات"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block font-semibold text-[11px] ${
                          cat.is_active ? "text-emerald-600" : "text-slate-400"
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
  );
}
