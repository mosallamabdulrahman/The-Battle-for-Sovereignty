"use client";

import { motion } from "motion/react";
import { Music, Search, Video } from "lucide-react";
import { DIFFICULTY_AR } from "@/lib/admin-constants";

export default function QuestionsTab({
  categories,
  categoryMap,
  questions,
  filteredQuestions,
  questionStats,
  filterCategory,
  setFilterCategory,
  searchQuery,
  setSearchQuery,
  busy,
  setQModal,
  deleteQuestion,
  difficultyEditFor,
  setDifficultyEditFor,
  onInlineDifficultyChange,
}) {
  return (
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
                {c.name}
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
              <th className="p-3 text-right">الأداء</th>
              <th className="p-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">
                  لا توجد أسئلة تطابق البحث أو التصنيف المختار.
                </td>
              </tr>
            ) : (
              filteredQuestions.map((q) => {
                const cat =
                  (q.category_id
                    ? categoryMap[String(q.category_id)]
                    : null) || categories[0];
                const stat = questionStats[q.id];
                const suggestedDifficulty =
                  stat && stat.used > 0
                    ? stat.correct / stat.used >= 0.66
                      ? "easy"
                      : stat.correct / stat.used >= 0.33
                        ? "medium"
                        : "hard"
                    : null;
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
                        <span className="inline-flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
                          {cat.image_url && (
                            <img
                              src={cat.image_url}
                              alt=""
                              className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                            />
                          )}
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">غير معروف</span>
                      )}
                    </td>
                    <td className="p-3 relative">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setDifficultyEditFor((cur) =>
                            cur === q.id ? null : q.id,
                          )
                        }
                        className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          q.difficulty === "easy"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : q.difficulty === "medium"
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                        }`}
                      >
                        {DIFFICULTY_AR[q.difficulty]} ({q.strikes}⚡)
                      </button>

                      {difficultyEditFor === q.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setDifficultyEditFor(null)}
                          />
                          <div className="absolute right-0 top-full z-40 mt-1 w-28 rounded-lg border border-[#ccd0d4] bg-white shadow-lg overflow-hidden">
                            {["easy", "medium", "hard"].map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() =>
                                  onInlineDifficultyChange(q, level)
                                }
                                className={`block w-full text-right px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-50 ${
                                  q.difficulty === level
                                    ? "text-cyan-700 bg-cyan-50"
                                    : "text-slate-700"
                                }`}
                              >
                                {DIFFICULTY_AR[level]}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
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
                              {q.image_duration ? (
                                <span className="text-[11px] font-bold text-slate-500">
                                  {q.image_duration} ث
                                </span>
                              ) : null}
                            </>
                          ) : q.media_type === "video" ? (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              <span>
                                فيديو
                                {q.media_play_count
                                  ? ` × ${q.media_play_count}`
                                  : ""}
                              </span>
                            </>
                          ) : (
                            <>
                              <Music className="w-3.5 h-3.5" />
                              <span>
                                صوت
                                {q.media_play_count
                                  ? ` × ${q.media_play_count}`
                                  : ""}
                              </span>
                            </>
                          )}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {stat && stat.used > 0 ? (
                        <div className="space-y-1 min-w-[150px]">
                          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-600">
                            <span>عدد مرات الاختيار</span>
                            <span className="font-bold text-slate-900">
                              {stat.used}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-emerald-700">
                            <span>تمت الإجابة صح</span>
                            <span className="font-bold">{stat.correct}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-rose-600">
                            <span>لم تتم الإجابة صح</span>
                            <span className="font-bold">
                              {stat.incorrect}
                            </span>
                          </div>
                          <span
                            className={`inline-block w-full text-center font-semibold px-2 py-0.5 rounded text-[10px] mt-1.5 ${
                              suggestedDifficulty === "easy"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : suggestedDifficulty === "medium"
                                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                                  : "bg-rose-50 text-rose-600 border border-rose-200"
                            }`}
                          >
                            مستوى مقترح: {DIFFICULTY_AR[suggestedDifficulty]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[11px]">
                          لا بيانات بعد
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block font-semibold text-[11px] ${
                          q.is_active ? "text-emerald-600" : "text-slate-400"
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
  );
}
