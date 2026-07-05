"use client";

import { motion } from "motion/react";
import {
  UserPlus,
  ShieldAlert,
  Award,
  Crosshair,
  HelpCircle,
  Phone,
  Compass,
  RotateCcw,
  Zap,
  Shield,
  Radar,
  Lock,
} from "lucide-react";

export default function HowToPlaySection() {
  const steps = [
    {
      step: "01",
      title: "البداية والتجهيز",
      desc: "الحكم يسجل الفريقين ويختار 6 فئات حق الأسئلة. كل فريق يبدأ بـ 1000 نقطة كصيد أساسي.",
      icon: UserPlus,
      color: "bg-cyan-500",
      shadow: "shadow-cyan-100",
    },
    {
      step: "02",
      title: "بناء الفريق وتوزيع الجنود",
      desc: "كل فريق يشتري جنوده وآلياته بالنقاط: (مشاة: 10ن، دبابات: 50ن، طيارات: 100ن، غواصات: 200ن). وتوزعونها بالخش والدس على خريطة (6×6) ما يشوفها الخصم.",
      icon: ShieldAlert,
      color: "bg-emerald-500",
      shadow: "shadow-emerald-100",
    },
    {
      step: "03",
      title: "بدء التحدي وتجميع الطقات",
      desc: "الفريق يختار فئة السؤال وصعوبته. الإجابة الصح تعطيك نقاط وطقات قوية في خريطة الخصم (سهل: طقة وحدة، متوسط: طقتين، صعب: 3 طقات).",
      icon: HelpCircle,
      color: "bg-orange-500",
      shadow: "shadow-orange-100",
    },
    {
      step: "04",
      title: "تدمير معسكر الخصم والفوز باللعبة",
      desc: "اختار مربع في خريطة الخصم المظلمة وطقه! إذا صبت هدفه راح تدمر نقاطه، وإذا صبت لغم راح تضر نقاطك أنت. الفريق اللي عنده أعلى نقاط يفوز باللعبة والصدارة!",
      icon: Crosshair,
      color: "bg-rose-500",
      shadow: "shadow-rose-100",
    },
  ];

  const aids = [
    // {
    //   name: "اتصال بصديق (The Lifeline)",
    //   desc: "يمنحك 60 ثانية إضافية للتفكير في حل الأسئلة الصعبة للغاية.",
    //   icon: Phone,
    //   color: "text-cyan-600 bg-cyan-50",
    // },
    // {
    //   name: "جوابين (Double Chance)",
    //   desc: "فرصة ذهبية لاختيار بديلين في الأسئلة التي تشك في إجابتها اليقينية.",
    //   icon: RotateCcw,
    //   color: "text-emerald-600 bg-emerald-50",
    // },
    // {
    //   name: "الحفرة (The Hole)",
    //   desc: "أخطر خيار هجومي! استخدمها قبل رؤية السؤال؛ الإجابة الصحيحة تمنح ضربة إضافية، والخطأ يبدد الوسيلة.",
    //   icon: Award,
    //   color: "text-orange-600 bg-orange-50",
    // },
    {
      name: "الكاشف (The Detector)",
      desc: "يكشف لك المربع اللي اخترته والمربعات اللي يمه عشان تصيد أهداف الخصم أسرع.",
      icon: Compass,
      color: "text-purple-600 bg-purple-50",
    },
    {
      name: "الطقة الزيادة (Extra Strike)",
      desc: "تعطيك طقة إضافية برصيدك، وتستخدمها بس وقت الطق عقب ما تجاوب صح.",
      icon: Zap,
      color: "text-amber-600 bg-amber-50",
    },
    {
      name: "الدرع (The Shield)",
      desc: "يحمي جنودك ويصد تلقائياً أول هجوم صح يوجهه الخصم حق معسكرك.",
      icon: Shield,
      color: "text-blue-600 bg-blue-50",
    },
    {
      name: "الرادار (Radar Scan)",
      desc: "يمسح المربع والمربعات اللي يمه بشكل مباشر عشان يبين لك وين مخشوش الخصم.",
      icon: Radar,
      color: "text-teal-600 bg-teal-50",
    },
  ];

  return (
    <section
      id="how-to-play"
      className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-orange-600 font-extrabold text-sm uppercase tracking-wider bg-orange-100 px-4 py-1.5 rounded-full inline-block">
            دليل التكتيك واللعب التكتيكي
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-4 mb-4">
            شرح اللعبة: شلون ترتب جنودك وتفوز في حيلهم بينهم؟
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            اجمع بين الذكاء والتخطيط السنع. اعرف الخطوات عشان توزع فريقك وتهجم بقوة التفكير والأسئلة.
          </p>
        </div>

        {/* Steps Horizontal/Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative mb-20">
          {/* Connecting Line (Only visible on large desktop screens) */}
          <div className="hidden lg:block absolute top-[68px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-rose-400 -z-10" />

          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:shadow-xl hover:border-cyan-200 transition-all duration-300"
              >
                {/* Step badge */}
                <div className="absolute top-4 left-4 text-slate-100 font-bold text-5xl font-mono leading-none select-none group-hover:text-cyan-50 transition-colors">
                  {item.step}
                </div>

                {/* Step Icon */}
                <div
                  className={`p-4 rounded-2xl text-white inline-block ${item.color} shadow-lg ${item.shadow} mb-6 relative z-10`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Step Description */}
                <h3 className="font-sans font-bold text-[19px] text-slate-900 mb-3 relative z-10">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed relative z-10">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Tactical Aids Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-md">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
              الفزعات ووسائل المساعدة
            </h3>
            <p className="text-slate-500 mt-2 text-md">
              الفزعات اللي تنقذك بأصعب الأسئلة. استخدمها بذكاء عشان تقلب اللعبة لصالحك.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aids.map((aid) => {
              const Icon = aid.icon;
              return (
                <div
                  key={aid.name}
                  className="p-5 rounded-2xl border border-slate-100 hover:border-cyan-300/60 hover:shadow-sm transition-all duration-300 bg-slate-50/50 flex flex-col items-center text-center gap-3"
                >
                  <div className={`p-3 rounded-full ${aid.color} shadow-inner`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-[16px] text-slate-900">
                    {aid.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {aid.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
