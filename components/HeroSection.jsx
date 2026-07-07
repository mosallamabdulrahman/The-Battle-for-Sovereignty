"use client";

import { motion } from "motion/react";
import { Swords, Info, Compass, ShieldAlert, Zap } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  // Let's create a model representation of a 6x6 coordinate grid for illustration
  const gridCells = Array.from({ length: 36 }, (_, i) => {
    const row = Math.floor(i / 6);
    const col = i % 6;
    // Put some mock items at specific coordinates
    let unitType = null;
    let unitColor = "";
    if (row === 1 && col === 2) {
      unitType = "✈️";
      unitColor = "bg-sky-100 border-sky-400 text-sky-600 animate-pulse";
    }
    if (row === 3 && col === 4) {
      unitType = "⛵";
      unitColor = "bg-emerald-100 border-emerald-400 text-emerald-600";
    }
    if (row === 4 && col === 1) {
      unitType = "🚜";
      unitColor = "bg-amber-100 border-amber-400 text-amber-600 shadow-sm";
    }
    if (row === 2 && col === 5) {
      unitType = "👤";
      unitColor = "bg-rose-100 border-rose-400 text-rose-600";
    }

    return { id: i, row, col, unitType, unitColor };
  });

  return (
    <section
      id="hero"
      className="relative pt-0 pb-16 md:pb-24 overflow-hidden bg-gradient-to-b from-cyan-50 via-sky-50/30 to-white"
    >
      {/* Absolute Decorative Blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 left-10 w-80 h-80 bg-orange-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Adjusted content to offset header height gracefully while maintaining requested pt-0 */}
        <div className="pt-28 md:pt-36 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero text */}
          <div className="lg:col-span-7 flex flex-col items-start text-right">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-800 font-bold px-4 py-1.5 rounded-full text-sm mb-6"
            >
              <Zap className="w-4 h-4 fill-cyan-700" />
              <span>الموسم الأول حق لعبة حيلهم بينهم نزل الحين!</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-6"
            >
              القمة تبي قوة المعرفة... <br />
              <span className="bg-gradient-to-r from-cyan-600 to-sky-500 bg-clip-text text-transparent">
                مستعد حق التحدي؟
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mb-8"
            >
              حول معلوماتك العامة وذكائك حق عتاد صجي! ابنِ معسكرك، ووزع جنودك
              بذكاء وسرية تامة على الخريطة، وعقبها طق خصمك طقات قوية على خريطة
              الخصم لما تجاوب على الأسئلة الثقافية الصعبة، واستخدم الفزعات
              التكتيكية عشان تسيطر وتفوز باللعبة.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 w-full sm:w-auto"
            >
              <Link
                href="/battle"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-cyan-600 to-sky-500 text-white font-extrabold px-4  sm:px-8 py-2 sm:py-4 rounded-2xl shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/35 hover:-translate-y-0.5 transition-all duration-300 text-base sm:text-xl"
              >
                <Swords className="w-5 h-5" />
                بلش التحدي الحين
              </Link>
              <a
                href="#how-to-play"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white text-slate-700 font-bold border-2 border-slate-200/80 hover:border-cyan-400 hover:text-cyan-600 px-4  sm:px-8 py-2 sm:py-4 rounded-2xl shadow-sm transition-all duration-300 text-base sm:text-xl"
              >
                <Info className="w-5 h-5" />
                شلون تلعب؟
              </a>
            </motion.div>
          </div>

          {/* Hero interactive grid preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative w-full flex justify-center"
          >
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 w-full max-w-sm sm:max-w-md relative">
              <div className="absolute top-[-10px] right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>شاشة توزيع الجنود (6×6)</span>
              </div>

              {/* Grid board */}
              <div className="grid grid-cols-6 gap-2 mt-4 aspect-square">
                {gridCells.map((cell) => (
                  <div
                    key={cell.id}
                    className={`aspect-square border border-slate-100 rounded-xl flex items-center justify-center text-lg sm:text-xl relative transition-all duration-300 cursor-default ${
                      cell.unitType
                        ? cell.unitColor + " border-2 font-bold shadow"
                        : "bg-slate-50/50 hover:bg-cyan-50 hover:border-cyan-200"
                    }`}
                  >
                    {!cell.unitType && (
                      <span className="text-[10px] text-slate-300 font-mono tracking-tighter">
                        {cell.row},{cell.col}
                      </span>
                    )}
                    {cell.unitType && (
                      <span className="drop-shadow-sm select-none">
                        {cell.unitType}
                      </span>
                    )}

                    {/* Show a cool radar scope effect on one square */}
                    {cell.row === 1 && cell.col === 2 && (
                      <div className="absolute inset-x-0 inset-y-0 rounded-xl border-2 border-sky-500/45 animate-ping opacity-75 pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom stats indicators */}
              <div className="mt-6 flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex flex-col text-right">
                  <span className="text-xs text-slate-400">
                    النقاط المتوفرة
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    1000 نقطة حرب
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold border border-slate-200">
                    👥 مشاة (10ن)
                  </span>
                  <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold border border-slate-200">
                    🚜 دبابة (50ن)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
