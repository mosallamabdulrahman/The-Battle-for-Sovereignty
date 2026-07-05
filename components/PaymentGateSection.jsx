"use client";

import { motion } from "motion/react";
import {
  Coins,
  Shield,
  CreditCard,
  CheckCircle2,
  Lock,
  Zap,
  Sparkles,
} from "lucide-react";

export default function PaymentGateSection() {
  const packages = [
    {
      name: "حزمة الفرسان",
      points: "١,٥٠٠",
      price: "٥ د.ك",
      description: "بداية ممتازة حق الربع والتحديات الخفيفة",
      color: "from-cyan-500/10 to-sky-500/10 hover:from-cyan-500/15 hover:to-sky-500/15",
      borderColor: "border-cyan-200/80 hover:border-cyan-400",
      iconColor: "text-cyan-600 bg-cyan-50",
      features: ["١,٥٠٠ نقطة شحن فورية", "تشتغل بكل الغرف والتحديات", "صلاحية مفتوحة ما تنتهي"],
      tag: null,
    },
    {
      name: "حزمة الكوماندوز",
      points: "٤,٠٠٠",
      price: "١٢ د.ك",
      description: "حق الطق السنع والتحديات القوية بين الفرق",
      color: "from-orange-500/10 to-amber-500/10 hover:from-orange-500/15 hover:to-amber-500/15",
      borderColor: "border-orange-200/80 hover:border-orange-400",
      iconColor: "text-orange-600 bg-orange-50",
      features: [
        "٤,٠٠٠ نقطة شحن فورية",
        "فزعة درع مجانية بكل غرفة",
        "تفتح لك فئات أسئلة مخصصة",
        "دعم فني سريع ٢٤ ساعة",
      ],
      tag: "الأكثر طلباً 🔥",
    },
    {
      name: "حزمة الشيوخ",
      points: "١٠,٠٠٠",
      price: "٢٥ د.ك",
      description: "حق التحديات الكبيرة والدواوين والنخبة",
      color: "from-purple-500/10 to-indigo-500/10 hover:from-purple-500/15 hover:to-indigo-500/15",
      borderColor: "border-purple-200/80 hover:border-purple-400",
      iconColor: "text-purple-600 bg-purple-50",
      features: [
        "١٠,٠٠٠ نقطة شحن فورية",
        "فزعات ومساعدات مفتوحة مجاناً",
        "شاشة حكم مميزة وخلفيات خاصة",
        "لوحة إحصائيات متكاملة حق فريقك",
      ],
      tag: "عرض كشخة ✨",
    },
  ];

  return (
    <section id="payment-gate" className="py-20 bg-slate-50 relative overflow-hidden">
      {/* Visual Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-600 font-extrabold text-sm uppercase tracking-wider bg-cyan-100 px-4 py-1.5 rounded-full inline-block mb-4">
            شحن النقاط والتسليح 💳
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            طرق الشحن وباقات النقاط السريعة
          </h2>
          <p className="text-slate-600 mt-4 text-base md:text-lg">
            اشحن نقاطك وسلّح فريقك سيدة وبكل أمان! اختر الباقة اللي تناسب ديوانيتكم وابدأ اللعب والطق فوراً.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -8 }}
              className={`bg-white rounded-3xl border ${pkg.borderColor} p-8 shadow-sm flex flex-col relative transition-all duration-300`}
            >
              {pkg.tag && (
                <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-md">
                  {pkg.tag}
                </span>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl ${pkg.iconColor}`}>
                  <Coins className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold">{pkg.description}</p>
                </div>
              </div>

              {/* Price & Coins */}
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 mb-6 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  تحصل على
                </span>
                <span className="text-3xl font-black text-slate-800 flex items-center justify-center gap-1.5 mt-1">
                  {pkg.points}
                  <span className="text-xs font-bold text-slate-500">نقطة شحن</span>
                </span>
                <div className="h-px bg-slate-200/60 my-3" />
                <span className="text-xl font-bold text-cyan-600 block">{pkg.price}</span>
              </div>

              {/* Features List */}
              <ul className="space-y-3.5 flex-1 mb-8">
                {pkg.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-600 text-right">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-semibold">{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Fake Checkout button */}
              <button
                type="button"
                className="w-full bg-slate-900 hover:bg-cyan-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <Zap className="w-4 h-4 fill-white group-hover:animate-pulse" />
                اشحن الحين
              </button>
            </motion.div>
          ))}
        </div>

        {/* Payment Gateways Display */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-right max-w-md">
              <h4 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-600" />
                بوابات دفع مشفرة وآمنة ١٠٠٪
              </h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                ندعم أفضل بوابات الدفع المحلية والعالمية عشان تشحن نقاطك سيدة وبأمان كامل. عمليات الدفع مشفرة بالكامل ولا يتم تخزين بيانات بطاقتك.
              </p>
            </div>

            {/* Payment Method Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 shrink-0">
              {/* KNET Badge (Kuwait's National Gateway) */}
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm select-none border border-blue-500 flex items-center gap-1.5">
                <span className="tracking-wide">KNET</span>
                <span className="text-[10px] bg-white/20 px-1 py-0.5 rounded">كي نت</span>
              </div>

              {/* Apple Pay */}
              <div className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm select-none border border-slate-800 flex items-center gap-1.5">
                <span className="text-sm font-sans tracking-tight"> Pay</span>
              </div>

              {/* Google Pay */}
              <div className="bg-slate-100 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-sm select-none border border-slate-200 flex items-center gap-1.5 font-sans">
                <span className="text-blue-500 font-extrabold">G</span>
                <span className="text-slate-600 font-bold">Pay</span>
              </div>

              {/* Visa / MasterCard */}
              <div className="bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm select-none border border-slate-200 flex items-center gap-1.5 font-sans">
                <span className="text-blue-700 italic font-black">VISA</span>
                <span className="text-slate-300">|</span>
                <span className="text-red-500 font-black">mastercard</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-6" />

          {/* Secure disclaimer */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>حماية أمان المعاملات المالية مشفرة عبر SSL من ديوانية الألعاب المشتركة</span>
          </div>
        </div>
      </div>
    </section>
  );
}
