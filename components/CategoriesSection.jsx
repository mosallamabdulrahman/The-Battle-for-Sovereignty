'use client';

import { motion } from 'motion/react';
import { Brain, Globe, Landmark, Code, Trophy, Atom, ArrowUpRight, Flame } from 'lucide-react';

export default function CategoriesSection() {
  const categories = [
    {
      name: 'أسئلة معارف عامة',
      description: 'اختبار الذكاء الشامل والمعلومات الموسوعية الأساسية المتفرقة.',
      icon: Brain,
      color: 'from-cyan-400 to-sky-500',
      iconColor: 'bg-cyan-50 text-cyan-600',
      tag: 'شعبية كبيرة',
    },
    {
      name: 'الجغرافيا والبلدان',
      description: 'حقائق الدول، التضاريس والأنهار، العواصم ورايات الأمم المختلفة.',
      icon: Globe,
      color: 'from-emerald-400 to-teal-500',
      iconColor: 'bg-emerald-50 text-emerald-600',
      tag: 'تكتيكية وسهلة البدء',
    },
    {
      name: 'التاريخ والحضارات',
      description: 'رؤساء وقادتنا التاريخيين، المعارك الكبرى، والجوائز العالمية التاريخية.',
      icon: Landmark,
      color: 'from-amber-400 to-orange-500',
      iconColor: 'bg-amber-50 text-amber-600',
      tag: 'تحالفات عريقة',
    },
    {
      name: 'التكنولوجيا والعلوم',
      description: 'عالم التقنيات والبرمجة الحديثة وعصر الذكاء الاصطناعي الحالي.',
      icon: Code,
      color: 'from-purple-400 to-indigo-500',
      iconColor: 'bg-purple-50 text-purple-600',
      tag: 'قوة الغد',
    },
    {
      name: 'الرياضة وكرة القدم',
      description: 'أساطير المستطيل الأخضر، البطولات القارية، والكؤوس الكبرى.',
      icon: Trophy,
      color: 'from-rose-400 to-pink-500',
      iconColor: 'bg-rose-50 text-rose-600',
      tag: 'حماس جماهيري',
    },
    {
      name: 'الفيزياء والطبيعة',
      description: 'علوم الفلك والكواكب، القوانين الطبيعية واكتشافات نيوتن والعلماء.',
      icon: Atom,
      color: 'from-teal-400 to-cyan-500',
      iconColor: 'bg-teal-50 text-teal-600',
      tag: 'حقائق علمية',
    },
  ];

  return (
    <section id="categories" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="text-right max-w-2xl">
            <span className="text-cyan-600 font-extrabold text-sm uppercase tracking-wider bg-cyan-100 px-4 py-1.5 rounded-full inline-block mb-4">
              فئات الأسئلة العسكرية
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              اختر جبهتك وتخصص أسئلتك المفضلة
            </h2>
            <p className="text-slate-600 mt-3 text-lg">
              اختر الفئات التي تشعر بقوتك فيها. كل فئة تحتوي على 6 أسئلة متدرجة الصعوبة (سهل، متوسط، صعب).
            </p>
          </div>

          {/* Quick Stats Banner inside Categories */}
          <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-5 rounded-2xl text-white shadow-lg flex items-center gap-4 flex-shrink-0">
            <Flame className="w-8 h-8 fill-amber-300 animate-bounce" />
            <div className="text-right">
              <p className="text-xs opacity-90 font-medium">نظام نقاط الأسئلة والضربات:</p>
              <p className="text-sm font-bold mt-1">سهل: +200ن (ضربة) | متوسط: +400ن (ضربتين) | صعب: +600ن (3 ضربات)</p>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Category Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 rounded-2xl ${cat.iconColor} shadow-inner`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                      {cat.tag}
                    </span>
                  </div>

                  {/* Category Card Title */}
                  <h3 className="font-sans font-black text-xl text-slate-900 mb-2">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                {/* Card footer details */}
                <div className="border-t border-slate-100 mt-6 pt-4 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>6 أسئلة متوفرة</span>
                  <div className="flex items-center gap-1 text-cyan-600">
                    <span>انطلق للمعركة</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
}
