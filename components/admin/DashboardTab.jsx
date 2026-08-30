"use client";

import { motion } from "motion/react";

export default function DashboardTab({ questions, categories, setTab }) {
  return (
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
            من هني تقدر تدير بنك الأسئلة والفئات وتعدل الصور والأصوات وتغير
            الصعوبة بكل سهولة وبسرعة.
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
                {questions.filter((q) => q.difficulty === "easy").length}{" "}
                سؤال
              </span>
            </p>
            <p>
              • متوسط:{" "}
              <span className="font-bold text-amber-600">
                {questions.filter((q) => q.difficulty === "medium").length}{" "}
                سؤال
              </span>
            </p>
            <p>
              • صعب:{" "}
              <span className="font-bold text-rose-600">
                {questions.filter((q) => q.difficulty === "hard").length}{" "}
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
                {questions.filter((q) => q.media_type === "image").length}{" "}
                سؤال
              </span>
            </p>
            <p>
              • أسئلة تحتوي على أصوات:{" "}
              <span className="font-bold text-cyan-600">
                {questions.filter((q) => q.media_type === "audio").length}{" "}
                سؤال
              </span>
            </p>
            <p>
              • أسئلة تحتوي على فيديو:{" "}
              <span className="font-bold text-cyan-600">
                {questions.filter((q) => q.media_type === "video").length}{" "}
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
  );
}
