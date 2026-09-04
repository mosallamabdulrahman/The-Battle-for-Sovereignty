"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export default function CategoriesTab({
  categories,
  filteredCategories,
  groups = [],
  questions,
  categoryUsage,
  busy,
  searchQuery,
  setSearchQuery,
  setCatModal,
  deleteCategory,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());

  const groupsMap = useMemo(
    () => new Map((groups || []).map((g) => [String(g.id), g.name])),
    [groups],
  );

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-start items-stretch sm:items-center gap-3">
        {/* Search Box */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن فئة أسئلة..."
            className="border border-[#ccd0d4] bg-white rounded px-3 py-1.5 pl-8 text-sm outline-none focus:border-[#2271b1] w-full sm:w-64 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-[#ccd0d4] shadow-sm overflow-hidden rounded-sm">
        {/* Desktop Table (Visible on md and larger screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse text-[13px]">
            <thead>
              <tr className="bg-white border-b border-[#ccd0d4] select-none text-[#2c3338] font-bold text-[14px]">
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">التصنيف</th>
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
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    لا توجد فئات أسئلة تطابق البحث.
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
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
                          {groupsMap.get(String(cat.group_id)) || "—"}
                        </span>
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
                      <td className="p-3 text-slate-500 ">#{cat.sort_order}</td>
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
                              onError={(e) => {
                                e.currentTarget.src = "/images/logo.png";
                                e.currentTarget.className =
                                  "w-full h-full object-contain p-1 bg-slate-50";
                              }}
                            />
                          </a>
                        ) : (
                          <div className="w-16 h-10 rounded border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50">
                            <img
                              src="/images/logo.png"
                              alt="شعار"
                              className="w-full h-full object-contain p-1 opacity-70"
                            />
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {catQuestionsCount} أسئلة
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          🎮{" "}
                          {categoryUsage[cat.id] ||
                            categoryUsage[cat.name] ||
                            0}{" "}
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
        </div>

        {/* Mobile View (Cards with Accordion / Collapse) */}
        <div className="block md:hidden divide-y divide-[#ccd0d4] bg-white">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              لا توجد تصنيفات تطابق البحث.
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const catQuestionsCount = questions.filter(
                (q) => q.category_id === cat.id,
              ).length;
              const isExpanded = expandedIds.has(cat.id);
              const usageCount =
                categoryUsage[cat.id] || categoryUsage[cat.name] || 0;

              return (
                <div key={cat.id} className="p-3.5 space-y-2">
                  {/* Header Row: Category Name + Image Thumbnail + Status Badge + Expand Button */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = "/images/logo.png";
                            e.currentTarget.className =
                              "w-10 h-10 object-contain p-1 bg-slate-50 rounded-lg border border-slate-200 shrink-0";
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center bg-slate-50 shrink-0">
                          <img
                            src="/images/logo.png"
                            alt="شعار"
                            className="w-6 h-6 object-contain opacity-70"
                          />
                        </div>
                      )}
                      <div className="font-bold text-[14px] text-[#1d2327] truncate">
                        {cat.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-block font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                          cat.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {cat.is_active ? "مفعّل" : "معطّل"}
                      </span>

                      {/* Circular Collapse / Expand Button */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(cat.id)}
                        className="w-7 h-7 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition shrink-0 cursor-pointer"
                        aria-label={isExpanded ? "طي التفاصيل" : "عرض التفاصيل"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#2271b1]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Links - Always visible on mobile! */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setCatModal(cat)}
                      className="text-[#2271b1] hover:underline"
                    >
                      تحرير
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      disabled={busy}
                      className="text-rose-600 hover:underline disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>

                  {/* Collapsible Key-Value Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pt-2 border-t border-slate-100 space-y-2 text-[12px]"
                    >
                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="font-bold text-slate-500">
                          التصنيف الرئيسي:
                        </span>
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
                          {groupsMap.get(String(cat.group_id)) || "—"}
                        </span>
                      </div>

                      <div className="py-1 border-b border-slate-50">
                        <span className="font-bold text-slate-500 block mb-0.5">
                          الوصف:
                        </span>
                        <p className="text-slate-600">
                          {cat.description || (
                            <span className="text-slate-400 italic">
                              لا يوجد وصف
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="font-bold text-slate-500">
                          الترتيب:
                        </span>
                        <span className=" text-slate-700 font-bold">
                          #{cat.sort_order}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="font-bold text-slate-500">
                          عدد الأسئلة:
                        </span>
                        <span className="font-bold text-slate-800">
                          {catQuestionsCount} أسئلة
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="font-bold text-slate-500">
                          مرات الاختيار باللعب:
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          🎮 {usageCount} {usageCount === 1 ? "مرة" : "مرات"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <span className="font-bold text-slate-500">
                          الحالة:
                        </span>
                        <span
                          className={`inline-block font-semibold text-[11px] ${
                            cat.is_active
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {cat.is_active ? "مفعّل" : "معطّل"}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#f6f7f7] border-t border-[#ccd0d4] p-3 text-[12px] text-slate-500 text-left">
          إجمالي فئات الأسئلة المفلترة: {filteredCategories.length} من أصل{" "}
          {categories.length}
        </div>
      </div>
    </motion.div>
  );
}
