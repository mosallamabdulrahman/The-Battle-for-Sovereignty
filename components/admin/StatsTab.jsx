"use client";

import { motion } from "motion/react";

export default function StatsTab({ categories, questions, categoryUsage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Category Usage Statistics */}
      <div className="bg-white border border-[#ccd0d4] p-4 sm:p-8 shadow-sm">
        <h3 className="font-semibold text-slate-900 border-b pb-3 mb-5 text-base flex flex-col sm:flex-row gap-1 items-center justify-between">
          <span>
            🎮 إحصائيات اختيار التصنيفات في ألعاب اللعبة (كم مرة انلعب كل تصنيف)
          </span>
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
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt=""
                      className="w-14 h-14 mx-auto mb-2 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-slate-200" />
                  )}
                  <div
                    className="font-bold text-sm text-slate-800 truncate"
                    title={cat.name}
                  >
                    {cat.name}
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold text-purple-700 bg-purple-100/70 border border-purple-200 rounded-xl py-1.5 px-2">
                  {usageCount} {usageCount === 1 ? "مرة" : "مرات"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Summary & Difficulty Breakdown */}
      <div className="bg-white border border-[#ccd0d4] p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 border-b pb-3 mb-4 text-sm flex items-center justify-between">
          <span>ملخص التصنيفات وتوزيع الصعوبة</span>
          <span className="text-[12px] text-slate-400 font-normal">
            إجمالي التصنيفات: {categories.length}
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const catQuestions = questions.filter(
              (q) => q.category_id === cat.id,
            );
            const easy = catQuestions.filter(
              (q) => q.difficulty === "easy",
            ).length;
            const medium = catQuestions.filter(
              (q) => q.difficulty === "medium",
            ).length;
            const hard = catQuestions.filter(
              (q) => q.difficulty === "hard",
            ).length;
            return (
              <div
                key={cat.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-slate-800 truncate">
                    {cat.name}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">
                    {catQuestions.length} سؤال
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                    سهل {easy}
                  </span>
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                    متوسط {medium}
                  </span>
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 rounded-full px-2 py-0.5">
                    صعب {hard}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
