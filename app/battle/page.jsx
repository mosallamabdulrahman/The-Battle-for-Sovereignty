'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Swords, 
  Users, 
  RefreshCw, 
  Trophy, 
  Gamepad2,
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Bomb, 
  Flame, 
  Target,
  Clock, 
  AlertTriangle, 
  QrCode, 
  Crown, 
  CheckCircle, 
  Share2,
  LockKeyhole
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

export default function BattlePage() {
  const [mounted, setMounted] = useState(false);

  // Routing / Query States
  const [roomId, setRoomId] = useState(null);
  const [teamIndex, setTeamIndex] = useState(null); // 1 or 2
  const [role, setRole] = useState(null); // 'judge' or null

  // Session user storage
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Supabase Database States
  const [room, setRoom] = useState(null);
  const [teams, setTeams] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState(null);

  // Selected Unit to Deploy (for active players)
  const [selectedUnit, setSelectedUnit] = useState('infantry'); // 'infantry', 'tank', 'aircraft', 'submarine', 'mine'

  // Toast / Status banner
  const [alertMsg, setAlertMsg] = useState(null);

  // Equipment pricing & icons list
  const unitSpecs = {
    infantry: { name: 'جندي مشاة', cost: 10, emoji: '👥' },
    tank: { name: 'مدرعة دبابة', cost: 50, emoji: '🚜' },
    aircraft: { name: 'طائرة قتالية', cost: 100, emoji: '✈️' },
    submarine: { name: 'غواصة بحرية', cost: 200, emoji: '⛵' },
    mine: { name: 'لغم مغناطيسي', cost: 100, emoji: '💥' }
  };

  const getTeamUrl = (rId, tIndex) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/battle?room_id=${rId}&team=${tIndex}`;
    }
    return `/battle?room_id=${rId}&team=${tIndex}`;
  };

  const getCurrentBattlePath = () => {
    if (typeof window === 'undefined') return '/battle';
    return `${window.location.pathname}${window.location.search}`;
  };

  // Trigger Local Alerter
  const showAlert = (message, type = 'warning') => {
    setAlertMsg({ message, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // 1. Initial State Parsing & Auth checking
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRoomId(params.get('room_id'));
      const t = params.get('team');
      if (t) setTeamIndex(Number(t));
      setRole(params.get('role'));
    }

    // Auth Listeners
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Room & associated Team records from Supabase
  const loadDatabaseData = useCallback(async () => {
    if (!roomId) return;
    setDbLoading(true);
    setDbError(null);

    try {
      // Fetch Room
      const { data: rData, error: rError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (rError) throw rError;
      setRoom(rData);

      // Fetch both Teams
      const { data: tData, error: tError } = await supabase
        .from('teams')
        .select('*')
        .eq('room_id', roomId)
        .order('team_index');

      if (tError) throw tError;
      setTeams(tData);

      // 3. Mark team participants as joined in Database (optimistic write once scanned)
      if (teamIndex && (teamIndex === 1 || teamIndex === 2)) {
        const teamObj = tData.find(t => t.team_index === teamIndex);
        if (teamObj && !teamObj.joined) {
          await supabase
            .from('teams')
            .update({ joined: true, member_id: user?.id ?? null })
            .eq('id', teamObj.id);
        }
      }
    } catch (err) {
      console.error(err);
      setDbError(err.message || 'فشل تحميل بيانات معركة سيادة من الخادم الريادي القديم.');
    } finally {
      setDbLoading(false);
    }
  }, [roomId, teamIndex, user]);

  // Load database rows when variables lock
  useEffect(() => {
    if (roomId) {
      loadDatabaseData();
    }
  }, [roomId, loadDatabaseData]);

  // 4. Set up Supabase Realtime Channel Subscription to automatically receive board adjustments
  useEffect(() => {
    if (!roomId) return;

    const roomChannel = supabase
      .channel(`realtime:room-${roomId}`)
      // Room Updates listener
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          setRoom(payload.new);
        }
      )
      // Teams Updates listener
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const updatedTeam = payload.new;
          setTeams((prev) => 
            prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId]);

  // 5. Evaluate if all armaments are set to automatically advance the whole layout to ready_to_start
  useEffect(() => {
    if (!room || teams.length !== 2 || room.status === 'battle_ready') return;

    const team1Ready = teams[0]?.is_ready;
    const team2Ready = teams[1]?.is_ready;

    if (team1Ready && team2Ready) {
      // Both teams ready: trigger state lock in the cloud
      const advanceRoomStatus = async () => {
        await supabase
          .from('game_rooms')
          .update({ status: 'battle_ready' })
          .eq('id', roomId);
      };
      advanceRoomStatus();
    }
  }, [room, teams, roomId]);

  // 6. Handle unit placement (for active playing teams)
  const handleCellClick = async (cellIndex) => {
    if (!room || teams.length < 2 || !teamIndex) return;

    const activeTeam = teams.find((t) => t.team_index === teamIndex);
    if (!activeTeam) return;

    // Reject deployment mutations if already flagged ready
    if (activeTeam.is_ready) {
      showAlert('تم تشفير وإقفال الترسانة مسبقاً، يرجى انتظار اللواء الآخر.', 'warning');
      return;
    }

    const currentBoard = Array.isArray(activeTeam.board) ? [...activeTeam.board] : Array(36).fill(null);
    let currentPoints = activeTeam.points;

    // A. Deletion Refund behavior if already populated
    if (currentBoard[cellIndex]) {
      const refundCost = unitSpecs[currentBoard[cellIndex]]?.cost || 0;
      currentPoints += refundCost;
      currentBoard[cellIndex] = null;
    } 
    // B. Purchase and placement checks
    else {
      const cost = unitSpecs[selectedUnit].cost;
      if (currentPoints < cost) {
        showAlert('رصيد الفريق غير كافٍ لإضافة هذه الوحدة العسكرية.', 'error');
        return;
      }
      currentPoints -= cost;
      currentBoard[cellIndex] = selectedUnit;
    }

    // Apply Optimistic update locally
    setTeams((prev) =>
      prev.map((t) =>
        t.team_index === teamIndex ? { ...t, board: currentBoard, points: currentPoints } : t
      )
    );

    // Write directly in database
    await supabase
      .from('teams')
      .update({ board: currentBoard, points: currentPoints })
      .eq('id', activeTeam.id);
  };

  // 7. Flag readiness to lock board deployment
  const handleSetTeamReady = async () => {
    if (!teamIndex) return;
    const activeTeam = teams.find((t) => t.team_index === teamIndex);
    if (!activeTeam) return;

    // Minimum check: must place at least 1 unit to start
    const placedCount = (activeTeam.board || []).filter(Boolean).length;
    if (placedCount === 0) {
      showAlert('يرجى نشر وتعبئة وحدة واحدة على الأقل قبل إعلان الجهوزية.', 'error');
      return;
    }

    // Apply Local state
    setTeams((prev) =>
      prev.map((t) => (t.team_index === teamIndex ? { ...t, is_ready: true } : t))
    );

    // Save Team Readiness in Cloud
    await supabase
      .from('teams')
      .update({ is_ready: true })
      .eq('id', activeTeam.id);
  };

  // 8. Gateways & Loading Overlays
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl" suppressHydrationWarning>
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-cyan-600 mx-auto" />
          <h3 className="text-sm font-black text-slate-800 mt-4">جاري فحص تصاريح المرور والمصادقة...</h3>
        </div>
      </div>
    );
  }

  // Mandatory Authentication Check for rooms
  if (roomId && !user) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex flex-col justify-center items-center dir-rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center"
        >
          <div className="bg-orange-50 text-orange-500 p-4 rounded-2xl inline-block mb-6 shadow-inner">
            <LockKeyhole className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">بوابة المصادقة المطلوبة</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
            عذراً، يجب إنشاء حساب عسكري أو تسجيل الدخول أولاً قبل تولي تمركز الجيش أو إدارة الغرفة الحربية المشتركة.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link 
              href={`/login?redirect=${encodeURIComponent(getCurrentBattlePath())}`}
              className="w-full bg-gradient-to-r from-cyan-600 to-sky-500 hover:shadow-md py-3 rounded-xl font-bold text-white text-sm transition-all"
            >
              تسجيل الدخول للقادة والمحكّمين
            </Link>
            <Link 
              href={`/register?redirect=${encodeURIComponent(getCurrentBattlePath())}`}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              طلب رتبة جديدة مجاناً
            </Link>
            <Link href="/" className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors mt-2 block">
              ← العودة للواجهة الرئيسية للدليل
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (roomId && dbLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
          <p className="text-xs font-black text-slate-700 mt-4">جاري تفريغ بروتوكولات الميدان واستدعاء الحلفاء لربط الجبهات...</p>
        </div>
      </div>
    );
  }

  if (roomId && dbError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl">
        <div className="bg-white p-8 rounded-2xl border border-rose-100 shadow-lg text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-black text-slate-900 mt-4">خلل في الاتصال بالشبكة</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{dbError}</p>
          <button 
            type="button" 
            onClick={() => window.location.reload()}
            className="mt-6 font-bold bg-cyan-600 text-white px-5 py-2 rounded-xl text-xs"
          >
            تحديث الاتصال
          </button>
        </div>
      </div>
    );
  }

  // A. VIEW GATEWAY (when no team/role parameter is active as player or referee)
  if (roomId && room && !teamIndex && !role) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex flex-col justify-center items-center dir-rtl">
        <div className="max-w-xl w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl text-center">
          <div className="bg-gradient-to-tr from-cyan-500 to-sky-400 text-white p-3.5 rounded-2xl inline-block mb-6 shadow-md">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-950 leading-tight">بوابة العبور العسكرية للمعركة</h2>
          <p className="text-xs text-slate-500 mt-1 pb-6 border-b border-slate-100 font-semibold">
            حدد هويتك العسكرية وموقع تمركزك للتموضع وتعبئة الصفوف فوراً
          </p>

          <div className="mt-8 space-y-4">
            <Link
              href={`/battle?room_id=${roomId}&team=1`}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-cyan-100 hover:border-cyan-400 bg-cyan-50/20 hover:bg-cyan-50/70 transition-all text-right group"
            >
              <div>
                <span className="font-extrabold text-sm text-cyan-900 block">الدخول كفريق: {room.team_1_name}</span>
                <span className="text-[10px] text-cyan-600 font-medium">التحكم في قلعة الدفاع وبناء ترسانة الأسلحة</span>
              </div>
              <Gamepad2 className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
            </Link>

            <Link
              href={`/battle?room_id=${roomId}&team=2`}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-orange-100 hover:border-orange-400 bg-orange-50/20 hover:bg-orange-50/70 transition-all text-right group"
            >
              <div>
                <span className="font-extrabold text-sm text-orange-900 block">الدخول كفريق: {room.team_2_name}</span>
                <span className="text-[10px] text-orange-600 font-medium">التحكم في هجوم الجسر وبناء الجيش الداعم</span>
              </div>
              <Gamepad2 className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            </Link>

            {room.judge_id === user?.id && (
              <Link
                href={`/battle?room_id=${roomId}&role=judge`}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition-all text-right group"
              >
                <div>
                  <span className="font-extrabold text-sm text-slate-800 block">الدخول كحكم المباراة (شاشة المتابعة)</span>
                  <span className="text-[10px] text-slate-500 font-medium">إدارة التلغرافات، رصد ضربات الرادار وتتبع المؤشرات</span>
                </div>
                <Crown className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // B. VIEW JUDGE VIEW (Task 14)
  if (roomId && room && role === 'judge') {
    const team1Obj = teams.find(t => t.team_index === 1);
    const team2Obj = teams.find(t => t.team_index === 2);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col dir-rtl pb-16">
        
        {/* Floating Alerter */}
        <AnimatePresence>
          {alertMsg && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
                alertMsg.type === 'success' ? 'bg-emerald-900 border-emerald-800' : 'bg-slate-900 border-slate-800'
              } text-white text-xs font-bold`}
            >
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              {alertMsg.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Judge Header */}
        <header className="bg-white border-b border-slate-200 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-cyan-500 to-sky-400 text-white p-2.5 rounded-xl shadow-md">
                <Crown className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-right">
                <h1 className="font-sans font-black text-lg text-slate-950">شاشة الحكم العسكري الحية لتتبع المعركة</h1>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">غرفة المتابعة وتوليد الإشارات رقم: {room.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="px-4 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors text-slate-600">
                العودة للرئيسية
              </Link>
              <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black ${
                room.status === 'battle_ready' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-amber-100 text-amber-700'
              }`}>
                {room.status === 'battle_ready' ? '● الجيش جاهز للاشتباك' : '● جاري تهيئة التعبئة العسكرية'}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 mt-8 flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Team cards & Deploy status */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Team 1 Status panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-cyan-500" />
                <h3 className="font-sans font-black text-md text-cyan-900 mt-1">{room.team_1_name}</h3>
                
                <div className="mt-5 space-y-4 flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">حالة الدخول للغرفة:</span>
                    <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${
                      team1Obj?.joined ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {team1Obj?.joined ? '✓ متصل بالرصيف' : '○ في انتظار قائد الكتيبة'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">تجهيز الجيش والتموضع:</span>
                    <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${
                      team1Obj?.is_ready ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {team1Obj?.is_ready ? '✓ تم بناء القوات بنجاح' : '○ جاري نشر الوحدات'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">الوحدات الحاضرة بالقلعة:</span>
                    <span className="font-black text-slate-700">{ (team1Obj?.board || []).filter(Boolean).length } من ٣٦</span>
                  </div>

                  {/* QR Code Team 1 */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <QRCodeSVG value={getTeamUrl(room.id, 1)} size={110} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-black mt-2">رابط تعبئة {room.team_1_name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(getTeamUrl(room.id, 1));
                        showAlert('تم نسخ رابط الفريق الأول بنجاح!', 'success');
                      }}
                      className="mt-2.5 text-[9px] font-black text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-cyan-100"
                    >
                      <Share2 className="w-3 h-3" />
                      نسخ الرابط العسكري من الميدان
                    </button>
                  </div>
                </div>
              </div>

              {/* Team 2 Status panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-orange-500" />
                <h3 className="font-sans font-black text-md text-orange-950 mt-1">{room.team_2_name}</h3>
                
                <div className="mt-5 space-y-4 flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">حالة الدخول للغرفة:</span>
                    <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${
                      team2Obj?.joined ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {team2Obj?.joined ? '✓ متصل بالرصيف' : '○ في انتظار قائد الكتيبة'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">تجهيز الجيش والتموضع:</span>
                    <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${
                      team2Obj?.is_ready ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {team2Obj?.is_ready ? '✓ تم بناء القوات بنجاح' : '○ جاري نشر الوحدات'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">الوحدات الحاضرة بالقلعة:</span>
                    <span className="font-black text-slate-700">{ (team2Obj?.board || []).filter(Boolean).length } من ٣٦</span>
                  </div>

                  {/* QR Code Team 2 */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <QRCodeSVG value={getTeamUrl(room.id, 2)} size={110} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-black mt-2">رابط تعبئة {room.team_2_name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(getTeamUrl(room.id, 2));
                        showAlert('تم نسخ رابط الفريق الثاني بنجاح!', 'success');
                      }}
                      className="mt-2.5 text-[9px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-orange-100"
                    >
                      <Share2 className="w-3 h-3" />
                      نسخ الرابط العسكري من الميدان
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Battle Readiness feedback overlay once both teams are ready */}
            {room.status === 'battle_ready' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-950 text-white p-8 rounded-3xl border border-emerald-900 shadow-2xl text-center relative overflow-hidden"
              >
                <div className="absolute -right-10 -bottom-10 opacity-10 font-sans text-9xl">🛡️</div>
                <Trophy className="w-14 h-14 text-amber-400 mx-auto animate-bounce mb-4" />
                <h3 className="font-sans font-black text-xl">تعبئة الجيوش اكتملت بنجاح!</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                  تم حجب وتعمية أرض المعركتين لكلا الجبهتين! القلاع مخلّقة بالتعتيم التكتيكي الذكي ومغلقة تماماً لمنع التسرب العسكري.
                </p>
                <div className="bg-black/20 p-4 border border-white/5 rounded-2xl max-w-xs mx-auto mt-6 text-xs font-bold font-mono">
                  تم إنزال كلمة سر سيادة المشتركة 🛡️
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Panel: Selected Params Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
              <h4 className="font-sans font-black text-xs text-slate-500 uppercase tracking-wider mb-4">كشف الإعدادات المشتركة المصادق عليها</h4>
              
              {/* Categories listed */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-2">الأقاليم والجبهات المفعلة (6 مناطق):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.selected_categories.map((catId, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200">
                        🛡️ {catId}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-2">رسوم المساعدة المعتمدة لـ {room.team_1_name}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.team_1_tools.map((toolId, idx) => (
                      <span key={idx} className="bg-cyan-50 border border-cyan-100 text-cyan-700 font-bold text-[10px] px-2.5 py-1 rounded-lg">
                        ⚡ {toolId}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-2">رسوم المساعدة المعتمدة لـ {room.team_2_name}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.team_2_tools.map((toolId, idx) => (
                      <span key={idx} className="bg-orange-50 border border-orange-100 text-orange-705 font-bold text-[10px] px-2.5 py-1 rounded-lg">
                        🛡️ {toolId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    );
  }

  // C. VIEW TEAM PARTICIPANT BOARD DEPLOYMENT (Tasks 10, 11, 12, 13)
  if (roomId && room && teamIndex) {
    const activeTeam = teams.find((t) => t.team_index === teamIndex);
    const opponentTeam = teams.find((t) => t.team_index !== teamIndex);

    if (!activeTeam) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
            <p className="text-xs font-black text-slate-700 mt-4">جاري توليد صفحة تموضع الكتائب...</p>
          </div>
        </div>
      );
    }

    // Checking if battle has started and both teams ready
    const isBattleLocked = room.status === 'battle_ready';

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col dir-rtl pb-16">
        
        {/* Floating alerts */}
        <AnimatePresence>
          {alertMsg && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
                alertMsg.type === 'error' ? 'bg-rose-900 border-rose-840' : 'bg-slate-900 border-slate-800'
              } text-white text-xs font-bold`}
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
              {alertMsg.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Header */}
        <header className="bg-white border-b border-slate-200 py-4 shadow-sm relative z-20">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-cyan-500 to-sky-400 text-white p-2.5 rounded-xl shadow-md">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-right">
                <h1 className="font-sans font-black text-base text-slate-950">
                  لوحة انتشار لواء: {activeTeam.name}
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">غرفة الحرب الثقافية رقم: {room.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-bold">باقي نقاط الحرب للتسليح</span>
                <span className="text-base font-black text-cyan-600">{activeTeam.points}ن</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                activeTeam.is_ready ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'
              }`}>
                {activeTeam.is_ready ? '✓ جاهز تماماً' : '● جاري بناء التعبئة العسكرية'}
              </span>
            </div>
          </div>
        </header>

        {/* Main board deploy area */}
        <main className="max-w-7xl mx-auto px-4 mt-8 flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* 6x6 Army Board Panel (Task 11) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900">أرض المعركة الخاصة بك (6×6 تموضع)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">انقر على المربعات لتثبيت أو إخلاء الأسلحة</p>
                </div>
                <div className="text-xs bg-slate-100 text-slate-600 font-black px-3 py-1.5 rounded-lg">
                  المربعات المشغولة: { (activeTeam.board || []).filter(Boolean).length } / ٣٦
                </div>
              </div>

              {/* The Interactive Grid */}
              <div className="relative">
                <div className="grid grid-cols-6 gap-2 sm:gap-3 aspect-square max-w-lg mx-auto">
                  {(activeTeam.board || Array(36).fill(null)).map((cell, idx) => {
                    const cellUnit = cell ? unitSpecs[cell] : null;
                    return (
                      <motion.button
                        key={idx}
                        whileHover={!activeTeam.is_ready ? { scale: 1.05 } : {}}
                        whileTap={!activeTeam.is_ready ? { scale: 0.95 } : {}}
                        disabled={activeTeam.is_ready}
                        onClick={() => handleCellClick(idx)}
                        className={`aspect-square border rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all cursor-pointer relative group ${
                          cell
                            ? 'bg-gradient-to-tr from-cyan-50 to-cyan-100 border-cyan-400 text-slate-900 shadow-cyan-100/50 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100/70 border-slate-150'
                        }`}
                      >
                        {/* Unit Emoji display */}
                        {cellUnit ? (
                          <span className="flex flex-col items-center">
                            <span>{cellUnit.emoji}</span>
                            <span className="text-[8px] absolute bottom-1 text-cyan-700 font-black tracking-tight scale-90">
                              {cellUnit.cost}ن
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-300 group-hover:text-cyan-600 text-xs font-black transition-colors">
                            {idx}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Secure Battle Lock Cover Shield (Task 13: Blur and covered overlay if both teams ready) */}
                {isBattleLocked && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col justify-center items-center text-center p-6 text-white z-30"
                  >
                    <div className="bg-emerald-500 text-slate-950 p-4 rounded-full mb-4 animate-pulse">
                      <Lock className="w-10 h-10 fill-slate-950" />
                    </div>
                    <h4 className="font-sans font-black text-lg text-emerald-400">تم إغلاق أرض المعركة حتى تبدأ الجولة</h4>
                    <p className="text-xs text-slate-300 max-w-xs mt-2 leading-relaxed">
                      تم تعمية وتغطية وتأمين انتشار لشكريكتك بنجاح! لا يمكن للعدو أو الحلفاء تسريب المواقع الموزعة سلفاً.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Unit selections and ready button (Task 12) */}
          <div className="space-y-6">
            
            {/* Deployment Panel */}
            <div className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-md ${
              activeTeam.is_ready ? 'opacity-50 pointer-events-none' : ''
            }`}>
              <h3 className="font-sans font-black text-xs text-slate-500 uppercase tracking-wider mb-4">ترسانة الوحدات العسكرية المنتشرة</h3>
              
              <div className="grid grid-cols-1 gap-3.5">
                {Object.keys(unitSpecs).map((key) => {
                  const unit = unitSpecs[key];
                  const isSelected = selectedUnit === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedUnit(key)}
                      disabled={activeTeam.is_ready}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected 
                          ? 'border-cyan-500 bg-cyan-50/70 shadow-sm shadow-cyan-100 ring-2 ring-cyan-500/10' 
                          : 'border-slate-150 hover:bg-slate-50 hover:border-slate-250'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-2xl">{unit.emoji}</span>
                        <span className="block text-right">
                          <span className="font-black text-xs text-slate-900 block group-hover:text-cyan-600">{unit.name}</span>
                          <span className="text-[10px] text-slate-400 leading-tight block">وحدة عسكرية في الميدان</span>
                        </span>
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-1 rounded-lg">
                        {unit.cost}ن
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* "تم بناء الجيش" Readiness Action button (Task 12) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md text-center">
              {activeTeam.is_ready ? (
                <div className="space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                  <h4 className="font-sans font-black text-sm text-slate-800">تم بناء وتحصين جيشك بنجاح!</h4>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    مرحى! تم إشهار حالة القتال. في انتظار إعلان جهوزية اللواء الآخر لإنزال الشفرة وبدء المبارزة...
                  </p>
                  {opponentTeam && (
                    <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-black">حالة فيلق العدو:</span>
                      <span className={`text-[10.5px] font-black mt-1 block ${
                        opponentTeam.is_ready ? 'text-emerald-600' : 'text-amber-600 animate-pulse'
                      }`}>
                        {opponentTeam.is_ready ? '● جاهز للاشتباك المباشر' : '● ما زال يجهز صفوفه في الخفاء'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-right bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold leading-relaxed text-slate-500">
                    بشرتك اللوجيستية تبدأ بـ <strong className="text-slate-800">1000ن</strong>. 
                    كل تفريغ أو إلغاء للوحدة من اللوحة يعيد لك كامل نقاط التأسيس مجاناً.
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSetTeamReady}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-sans font-black text-sm py-4 rounded-2xl shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
                  >
                    تم ترحيل وتحصين بناء الجيش 🛡️
                  </motion.button>
                </div>
              )}
            </div>

          </div>

        </main>
      </div>
    );
  }

  // D. DEFAULT SANDBOX GAME OR FALLBACK (Play offline Sandbox)
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 flex flex-col justify-center items-center dir-rtl">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl text-center">
        <div className="bg-gradient-to-tr from-cyan-600 to-sky-500 text-white p-4 rounded-2xl inline-block mb-6 shadow-md animate-bounce">
          <Gamepad2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-950">ميدان معركة سيادة</h2>
        <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-semibold">
          مرحباً بك أيها القائد العسكري! للبدء وخوض المباراة، يرجى التوجه لتأسيس غرفة المعركة وتحديد التصنيفات بالدليل الميداني على الصفحة الرئيسية أولاً.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/#game-setup"
            className="w-full bg-gradient-to-br from-cyan-500 to-sky-500 text-white font-black text-sm py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all block text-center"
          >
            ← تأسيس وتصميم معركة جديدة
          </Link>
          <Link
            href="/"
            className="w-full bg-slate-100 hover:bg-slate-150 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all block text-center border border-slate-200"
          >
            دليل طريقة اللعب والقواعد
          </Link>
        </div>
      </div>
    </div>
  );
}
