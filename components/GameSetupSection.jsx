'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Check, 
  AlertTriangle, 
  Play, 
  Crown, 
  Zap, 
  Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { FALLBACK_CATEGORIES, buildRoomQuestions, loadQuestionSetupData } from '../lib/game-data';

export default function GameSetupSection() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [categoriesList, setCategoriesList] = useState(FALLBACK_CATEGORIES);
  const [questionRows, setQuestionRows] = useState([]);
  const [questionSourceReady, setQuestionSourceReady] = useState(false);
  const [questionSourceFromSupabase, setQuestionSourceFromSupabase] = useState(false);

  // Core setup states
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [team1Name, setTeam1Name] = useState('كتائب الفرسان');
  const [team2Name, setTeam2Name] = useState('صقور النخبة');

  // Toast Helper
  const triggerToast = (message, type = 'warning') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const restoreActiveRoom = async () => {
      const savedRoomId = window.localStorage.getItem('sovereignty_active_room');
      if (!savedRoomId) return;

      const { data } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', savedRoomId)
        .eq('judge_id', user.id)
        .in('status', ['setup', 'playing'])
        .maybeSingle();

      if (data) {
        setCreatedRoom(data);
        setSelectedCategories(data.selected_categories || []);
        setTeam1Name(data.team_1_name);
        setTeam2Name(data.team_2_name);
      } else {
        window.localStorage.removeItem('sovereignty_active_room');
      }
    };

    restoreActiveRoom();
  }, [user]);

  useEffect(() => {
    if (!createdRoom?.id) return;

    const channel = supabase
      .channel(`setup-room-${createdRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${createdRoom.id}`,
        },
        (payload) => {
          setCreatedRoom(payload.new);
          if (payload.new.status === 'abandoned') {
            window.localStorage.removeItem('sovereignty_active_room');
            setToast({
              message: 'خرج الفريق الآخر أو الحكم من اللعبة، وتم إنهاء الغرفة.',
              type: 'error',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [createdRoom?.id]);

  useEffect(() => {
    let isActive = true;

    const loadSetupData = async () => {
      const result = await loadQuestionSetupData(supabase);
      if (!isActive) return;

      setCategoriesList(result.categories);
      setQuestionRows(result.questions);
      setQuestionSourceFromSupabase(result.fromSupabase);
      setQuestionSourceReady(true);

      if (!result.fromSupabase) {
        triggerToast(
          'لم يتم العثور على بنك الأسئلة في Supabase. شغّل ملف SUPABASE_QUESTION_BANK.sql أولاً.',
          'warning'
        );
      }
    };

    loadSetupData();

    return () => {
      isActive = false;
    };
  }, []);

  // Handle category toggle
  const handleCategoryClick = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(prev => prev.filter(id => id !== catId));
    } else {
      if (selectedCategories.length >= 6) {
        triggerToast('لا يمكنك اختيار أكثر من 6 تصنيفات للبطولة العسكرية.', 'warning');
        return;
      }
      setSelectedCategories(prev => [...prev, catId]);
    }
  };

  // Submit and Create Supabase Room setup
  const handleStartGame = async () => {
    // 1. Auth Validation
    if (!user) {
      triggerToast('يجب إنشاء حساب أو تسجيل الدخول أولاً قبل بدء اللعبة.', 'auth-error');
      return;
    }

    // 2. Setup Step Validations in sequence
    if (selectedCategories.length !== 6) {
      triggerToast('يجب اختيار تصنيفات الأسئلة أولاً قبل إكمال باقي الإعدادات.', 'error');
      return;
    }

    if (!questionSourceReady) {
      triggerToast('جاري تحميل بنك الأسئلة من قاعدة البيانات، حاول مرة أخرى بعد لحظات.', 'warning');
      return;
    }

    if (!team1Name.trim() || !team2Name.trim()) {
      triggerToast('يرجى إدخال اسم الفريق الأول واسم الفريق الثاني.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCategoryRecords = categoriesList.filter((category) =>
        selectedCategories.includes(category.id)
      );
      const questions = buildRoomQuestions(selectedCategoryRecords, questionRows);

      if (questions.length !== 36) {
        throw new Error('كل تصنيف مختار يجب أن يحتوي على 6 أسئلة مفعلة داخل بنك الأسئلة.');
      }

      const { data: roomId, error: createError } = await supabase.rpc('create_game_room', {
        p_team_1_name: team1Name.trim(),
        p_team_2_name: team2Name.trim(),
        p_selected_categories: selectedCategories,
        p_questions: questions,
      });

      if (createError) throw createError;

      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      setCreatedRoom(room);
      window.localStorage.setItem('sovereignty_active_room', room.id);
      triggerToast('تم تجهيز الغرفة العسكرية وتوليد شيفرات الانضمام بنجاح!', 'success');
    } catch (err) {
      console.error(err);
      triggerToast(`حدث خطأ أثناء حجز الغرفة: ${err.message || 'يرجى مراجعة الصلاحيات RLS.'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeamUrl = (room_id, teamIndex) => {
    if (typeof window !== 'undefined') {
      const url = new URL('/battle', window.location.origin);
      url.searchParams.set('room_id', room_id);
      url.searchParams.set('team', String(teamIndex));
      return url.toString();
    }
    return `/battle?room_id=${room_id}&team=${teamIndex}`;
  };

  const masterJudgeUrl = createdRoom ? `/battle?room_id=${createdRoom.id}&role=judge` : '#';

  const handleExitCreatedRoom = async () => {
    if (!createdRoom) return;

    const { error } = await supabase.rpc('abandon_game', {
      p_room_id: createdRoom.id,
      p_actor_role: 'judge',
      p_team_index: null,
    });

    if (error) {
      triggerToast(`تعذر الخروج من الغرفة: ${error.message}`, 'error');
      return;
    }

    window.localStorage.removeItem('sovereignty_active_room');
    setCreatedRoom(null);
    triggerToast('تم إنهاء الغرفة والخروج من اللعبة.', 'success');
  };

  const copyLinkToClip = (url, label) => {
    navigator.clipboard.writeText(url);
    triggerToast(`تم نسخ رابط ${label} إلى حافظة جهازك!`, 'success');
  };

  return (
    <section id="game-setup" className="py-20 bg-slate-50 border-t border-slate-200 relative overflow-hidden dir-rtl">
      {/* Decorative vectors */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-100 text-cyan-800 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
            <Crown className="w-4 h-4 text-cyan-600 animate-pulse" />
            منصة تكتيك وإدارة الحروب الثقافية
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            تهيئة وتحضير المعمعة الحربية
          </h2>
          <p className="text-sm md:text-md text-slate-600 mt-2.5 max-w-xl mx-auto leading-relaxed font-semibold">
            بصفتك حكماً عسكرياً، حدد تصنيفات الأسئلة وقادة الصفوف ووسائل الدعم اللوجيستي، ثم ولّد الروابط الميدانية لمسح الرموز.
          </p>
        </div>

        {/* Global Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl shadow-2xl border max-w-sm w-full flex items-start gap-3.5 ${
                toast.type === 'success' 
                  ? 'bg-emerald-900 border-emerald-800 text-white' 
                  : toast.type === 'auth-error'
                  ? 'bg-orange-900 border-orange-850 text-white'
                  : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <div className="p-1.5 rounded-xl bg-white/10 shrink-0 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 text-right text-xs leading-relaxed font-bold">
                <p className="text-sm text-slate-200">{toast.message}</p>
                {toast.type === 'auth-error' && (
                  <div className="mt-3 flex gap-2">
                    <a href="/login" className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 font-extrabold text-slate-950 text-[11px] rounded transition-colors">
                      تسجيل الدخول
                    </a>
                    <a href="/register" className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white font-extrabold text-[11px] rounded transition-colors">
                      حساب عسكري جديد
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Setup Stage Modules */}
        {!createdRoom || createdRoom.status === 'abandoned' ? (
          <div className="space-y-16">
            {createdRoom?.status === 'abandoned' && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center text-sm font-black text-rose-800">
                خرج أحد أطراف اللعبة وتم إنهاء الغرفة. يمكنك إنشاء غرفة جديدة.
              </div>
            )}
            
            {/* STEP 1: Categories Selection */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-cyan-600 text-white font-black text-sm flex items-center justify-center">١</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">الخطوة الأولى: تحديد جبهات وساحات الأسئلة</h3>
                    <p className="text-xs text-slate-500">يتعين عليك تفعيل بالضبط 6 مناطق ثقافية للمبارزة</p>
                  </div>
                </div>
                <div className="bg-slate-200/80 px-4 py-1.5 rounded-xl text-xs font-black text-slate-700">
                  {questionSourceReady
                    ? questionSourceFromSupabase
                      ? 'بنك Supabase متصل'
                      : 'بانتظار Supabase'
                    : 'جاري تحميل البنك...'}
                  {' · '}
                  تم اختيار {selectedCategories.length} من 6
                </div>
              </div>

              {questionSourceReady && categoriesList.length === 0 && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center text-sm font-black text-amber-900">
                  لا توجد تصنيفات محملة من Supabase. شغّل ملف SUPABASE_QUESTION_BANK.sql من SQL Editor ثم حدّث الصفحة.
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <motion.button
                      key={cat.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`p-5 rounded-2xl border text-right transition-all flex flex-col justify-between h-40 relative overflow-hidden group cursor-pointer ${
                        isSelected 
                          ? 'bg-gradient-to-br from-cyan-50/70 to-cyan-100/50 border-cyan-500 ring-2 ring-cyan-500/20 shadow-md shadow-cyan-100/50' 
                          : 'bg-white border-slate-200 hover:border-slate-350 hover:shadow-lg'
                      }`}
                    >
                      <span className="flex justify-between items-start w-full">
                        <span className="text-2xl">{cat.emoji}</span>
                        {isSelected && (
                          <span className="bg-cyan-500 text-white p-1 rounded-lg block">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </span>
                      <span className="mt-4 block w-full text-right">
                        <span className="font-sans font-black text-xs text-slate-900 leading-tight block group-hover:text-cyan-600 transition-colors">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight block">
                          {cat.desc}
                        </span>
                        {questionSourceFromSupabase && (
                          <span className="text-[9px] text-emerald-600 mt-2 font-black block">
                            من قاعدة البيانات
                          </span>
                        )}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Naming Team inputs */}
            <div className={selectedCategories.length === 6 ? 'opacity-100' : 'opacity-40'}>
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-8">
                <span className="w-8 h-8 rounded-full bg-cyan-600 text-white font-black text-sm flex items-center justify-center">٢</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">الخطوة الثانية: تعميد أسماء الجبهات المتقاتلة</h3>
                  <p className="text-xs text-slate-500">أدخل الأسماء الرمزية للفريق الأول والفريق الثاني</p>
                </div>
              </div>

              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                onClick={() => {
                  if (selectedCategories.length !== 6) {
                    triggerToast('يجب اختيار تصنيفات الأسئلة أولاً قبل إكمال باقي الإعدادات.', 'error');
                  }
                }}
              >
                {/* Team A */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative">
                  <div className="absolute top-4 left-4 bg-cyan-500/10 text-cyan-600 px-3 py-1 rounded-full text-[10px] font-black">
                    الفريق الأزرق المهاجم
                  </div>
                  <label htmlFor="team1" className="block text-sm font-bold text-slate-800 mb-2">اسم الفوج العسكري الأول</label>
                  <input
                    id="team1"
                    type="text"
                    disabled={selectedCategories.length !== 6}
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    placeholder="مثال: كتائب الفرسان"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm font-black text-slate-800 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1 font-semibold">سيتم تمثيله باللون الأزرق الحربي بقلعة الدفاع الأساسية</p>
                </div>

                {/* Team B */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative">
                  <div className="absolute top-4 left-4 bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black">
                    الفريق الأحمر الحربي
                  </div>
                  <label htmlFor="team2" className="block text-sm font-bold text-slate-800 mb-2">اسم الفوج العسكري الثاني</label>
                  <input
                    id="team2"
                    type="text"
                    disabled={selectedCategories.length !== 6}
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    placeholder="مثال: صقور النخبة"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm font-black text-slate-800 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1 font-semibold">سيتم تمثيله باللون الأحمر الناري بجبهات الدخول والموانئ</p>
                </div>
              </div>
            </div>

            {/* STEP 3: Fixed tools preview */}
            <div className={selectedCategories.length === 6 ? 'opacity-100' : 'opacity-40'}>
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-8">
                <span className="w-8 h-8 rounded-full bg-cyan-600 text-white font-black text-sm flex items-center justify-center">٣</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">الخطوة الثالثة: الأدوات التكتيكية الثابتة</h3>
                  <p className="text-xs text-slate-500">
                    يحصل الفريقان تلقائيًا على الأدوات نفسها، ولا تظهر للاستخدام إلا بعد بدء القتال.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 flex items-center gap-3">
                <Zap className="w-5 h-5 text-cyan-600 shrink-0" />
                <p className="text-xs font-bold text-cyan-900 leading-relaxed">
                  سيحصل الفريقان تلقائيًا على ثلاث أدوات متساوية. تبقى الأدوات مخفية ولا يمكن استخدامها قبل انتقال الغرفة إلى مرحلة القتال.
                </p>
              </div>
            </div>

            {/* Launch Action */}
            <div className="text-center pt-8 border-t border-slate-200">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartGame}
                disabled={isSubmitting}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 text-white font-sans font-black text-lg px-12 py-4 rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/35 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                {isSubmitting ? 'جاري تأسيس رصد الغرف الحربية...' : 'تعبئة الجبهة والبدء الآن'}
              </motion.button>
              <p className="text-xs text-slate-400 mt-3 font-semibold">
                ستقوم الغرفة بتوليد QR كود للمسح الفوري وإدخال الأجهزة اللوحية كجيوش حية
              </p>
            </div>

          </div>
        ) : (
          /* ROOM SUCCESSFULLY CREATED - SHOW CONNECTIONS, QR CODES, URLS & JUDGE CONTROLS */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-2xl max-w-4xl mx-auto relative overflow-hidden"
          >
            {/* Success badge */}
            <div className="bg-emerald-50 Border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-4 mb-8">
              <div className="bg-emerald-500 text-white p-2.5 rounded-xl shrink-0">
                <Check className="w-6 h-6" />
              </div>
              <div className="text-right">
                <h3 className="font-sans font-black text-base">تم تأسيس ساحة القتال بنجاح!</h3>
                <p className="text-xs text-emerald-700/85 mt-0.5 font-bold">
                  تتنصت الغرفة وسيرفرات معركة سيادة على تواجد وتعبئة الجيوش العتادية في هذه الأثناء.
                </p>
              </div>
            </div>

            {/* Setup specs summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 text-right">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">رقم تعريف الغرفة</span>
                <span className="text-xs font-black text-slate-700 select-all">{createdRoom.id.slice(0, 8)}...</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">الفريق الأول (الأزرق)</span>
                <span className="text-xs font-black text-slate-700">{createdRoom.team_1_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">الفريق الثاني (الأحمر)</span>
                <span className="text-xs font-black text-slate-700">{createdRoom.team_2_name}</span>
              </div>
            </div>

            {/* QR codes side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              
              {/* QR Team 1 */}
              <div className="bg-gradient-to-tr from-cyan-50/30 to-cyan-100/10 p-6 rounded-2xl border border-cyan-100 flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl shadow-md border border-cyan-50">
                  <QRCodeSVG 
                    value={getTeamUrl(createdRoom.id, 1)} 
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <h4 className="font-sans font-black text-sm text-cyan-800 mt-4">رابط دخول {createdRoom.team_1_name}</h4>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 max-w-[240px]">
                  {getTeamUrl(createdRoom.id, 1)}
                </p>
                <div className="flex gap-2.5 mt-3.5 w-full">
                  <button
                    type="button"
                    onClick={() => copyLinkToClip(getTeamUrl(createdRoom.id, 1), createdRoom.team_1_name)}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-black cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    نسخ الرابط
                  </button>
                  <a
                    href={getTeamUrl(createdRoom.id, 1)}
                    target="_blank"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-705 text-white py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-black transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    فتح كلاعب
                  </a>
                </div>
              </div>

              {/* QR Team 2 */}
              <div className="bg-gradient-to-tr from-orange-50/30 to-orange-100/10 p-6 rounded-2xl border border-orange-100 flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl shadow-md border border-orange-50">
                  <QRCodeSVG 
                    value={getTeamUrl(createdRoom.id, 2)} 
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <h4 className="font-sans font-black text-sm text-orange-850 mt-4">رابط دخول {createdRoom.team_2_name}</h4>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 max-w-[240px]">
                  {getTeamUrl(createdRoom.id, 2)}
                </p>
                <div className="flex gap-2.5 mt-3.5 w-full">
                  <button
                    type="button"
                    onClick={() => copyLinkToClip(getTeamUrl(createdRoom.id, 2), createdRoom.team_2_name)}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-black cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    نسخ الرابط
                  </button>
                  <a
                    href={getTeamUrl(createdRoom.id, 2)}
                    target="_blank"
                    className="flex-1 bg-orange-600 hover:bg-orange-705 text-white py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-black transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    فتح كلاعب
                  </a>
                </div>
              </div>

            </div>

            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-xs font-bold leading-relaxed text-amber-900">
              لا تفتح رابط الفريق بنفس حساب الحكم. انسخ كل رابط وافتحه في نافذة خاصة أو جهاز آخر، ثم سجل الدخول بحساب مختلف لكل فريق.
            </div>

            {/* Launch Referee view */}
            <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-right">
                <h5 className="font-bold text-sm text-slate-850">غرفة المتابعة وشاشة الحكم الحية</h5>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  أنت تمتلك الرمز التعريفي لهذه المعركة. تفضل بمراقبة تمركز الجيوش.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleExitCreatedRoom}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  خروج من اللعبة
                </button>
                <a
                  href={masterJudgeUrl}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-500 hover:scale-[1.02] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Crown className="w-4 h-4 fill-white animate-bounce" />
                  دخول شاشة الحكم والمراقبة
                </a>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </section>
  );
}
