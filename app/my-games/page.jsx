"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Crown,
  History,
  Play,
  RefreshCw,
  Search,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";

const FALLBACK_CATEGORY_IMAGE = "/images/logo.png";

function ContinueOrRestartModal({ gameName, onContinue, onRestart, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 p-4 dir-rtl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-950">المتابعة من حيث توقفت</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-bold text-slate-700 mb-5">
            لديك لعبة نشطة، هل تريد متابعة اللعب أو الاعادة؟
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onRestart}
              className="rounded-xl bg-rose-800 hover:bg-rose-900 py-2.5 text-sm font-bold text-white transition"
            >
              البدء من جديد
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="rounded-xl border-2 border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              الاستمرار
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RestartTeamsModal({ gameName, busy, error, onSubmit, onClose }) {
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [touched, setTouched] = useState(false);

  const sameNames =
    team1Name.trim().length > 0 &&
    team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase();
  const team1Error = touched && team1Name.trim().length < 2;
  const team2Error = touched && team2Name.trim().length < 2;

  const handleSubmit = () => {
    setTouched(true);
    if (team1Name.trim().length < 2 || team2Name.trim().length < 2) return;
    if (sameNames) return;
    onSubmit(team1Name.trim(), team2Name.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 p-4 dir-rtl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-950">حدد معلومات الفرق</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] font-bold text-slate-400 mb-4">
          اسم اللعبة: <span className="text-slate-600">{gameName}</span>
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500">
              الفريق الأول
            </label>
            <input
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              placeholder="اسم الفريق"
              className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                team1Error ? "border-rose-400" : "border-slate-200"
              }`}
            />
            {team1Error && (
              <p className="mt-1 text-[10px] font-bold text-rose-500">
                الرجاء إدخال اسم الفريق الأول
              </p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500">
              الفريق الثاني
            </label>
            <input
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              placeholder="اسم الفريق"
              className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                team2Error ? "border-rose-400" : "border-slate-200"
              }`}
            />
            {team2Error && (
              <p className="mt-1 text-[10px] font-bold text-rose-500">
                الرجاء إدخال اسم الفريق الثاني
              </p>
            )}
          </div>
        </div>

        {touched && sameNames && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 text-center">
            لازم اسم الفريق الأول يختلف عن اسم الفريق الثاني.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 text-center">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={busy || (touched && sameNames)}
          onClick={handleSubmit}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md disabled:opacity-60 transition flex items-center justify-center gap-2"
        >
          {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : "ابدأ اللعب"}
        </button>
      </motion.div>
    </div>
  );
}

export default function MyGamesPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [choiceGroup, setChoiceGroup] = useState(null); // group being decided on
  const [restartGroup, setRestartGroup] = useState(null); // group entering team names
  const [busy, setBusy] = useState(false);
  const [restartError, setRestartError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      const [roomsResult, categoriesResult] = await Promise.all([
        supabase
          .from("game_rooms")
          .select("*")
          .eq("judge_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("question_categories").select("id,name,image_url"),
      ]);

      if (!roomsResult.error) setRooms(roomsResult.data || []);
      if (!categoriesResult.error) {
        const map = {};
        (categoriesResult.data || []).forEach((cat) => {
          map[cat.id] = cat;
        });
        setCategoryMap(map);
      }
      setLoading(false);
    };

    loadData();
  }, [user]);

  // Every restart shares the same game_name, so grouping by it turns each
  // "game" into one card — the play count is just how many rooms exist
  // under that name, and the latest room is what "العب" acts on.
  const groups = useMemo(() => {
    const byName = new Map();
    rooms.forEach((room) => {
      const key = room.game_name || `${room.team_1_name}-${room.team_2_name}`;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(room);
    });
    return Array.from(byName.values()).map((groupRooms) => ({
      gameName: groupRooms[0].game_name || groupRooms[0].team_1_name,
      rooms: groupRooms,
      latest: groupRooms[0], // already sorted desc by created_at
    }));
  }, [rooms]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.gameName.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  // Truly finished games (all questions answered, or a team fully wiped
  // out / hit zero points) have nothing left to continue — only restarting
  // makes sense there, so skip straight past the continue-or-restart choice.
  // A room only truly can't be resumed once it hit a REAL end condition
  // (all questions answered, a board fully destroyed, or a score of zero —
  // finished_reason "completed"). Ending it early via the "إنهاء اللعبة"
  // button ("manual") still leaves the actual match unfinished, so it stays
  // resumable — same as an abandoned room.
  const isResumable = (room) =>
    room.status === "abandoned" ||
    (room.status === "finished" && room.finished_reason === "manual");

  const handlePlayClick = (group) => {
    if (group.latest.status === "finished" && !isResumable(group.latest)) {
      setRestartGroup(group);
      setRestartError(null);
    } else {
      setChoiceGroup(group);
    }
  };

  const handleContinue = async (room) => {
    setBusy(true);
    setAlertMsg(null);
    try {
      if (isResumable(room)) {
        const { error } = await supabase.rpc("resume_game_room", {
          p_room_id: room.id,
        });
        if (error) throw error;
      }
      window.location.assign(`/battle?room_id=${room.id}&role=judge`);
    } catch (err) {
      setAlertMsg(err.message || "ما قدرنا نرجع للعبة.");
      setBusy(false);
    }
  };

  const handleRestartSubmit = async (team1Name, team2Name) => {
    if (!restartGroup) return;
    setBusy(true);
    setRestartError(null);
    try {
      const { data, error } = await supabase.rpc("restart_game_room", {
        p_source_room_id: restartGroup.latest.id,
        p_team_1_name: team1Name,
        p_team_2_name: team2Name,
      });
      if (error) throw error;
      window.location.assign(`/battle?room_id=${data.room_id}&role=judge`);
    } catch (err) {
      setRestartError(err.message || "ما قدرنا نبدأ اللعبة من جديد.");
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl"
        suppressHydrationWarning
      >
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col dir-rtl">
        <Header />
        <div className="flex-grow flex items-center justify-center py-16 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center"
          >
            <div className="bg-orange-50 text-orange-500 p-4 rounded-2xl inline-block mb-6 shadow-inner">
              <History className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
              لازم تسجل دخولك أول
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
              عشان تشوف الألعاب اللي سويتها كحكم، لازم تسجل دخولك أول.
            </p>
            <Link
              href="/login?redirect=/my-games"
              className="mt-8 w-full bg-gradient-to-r from-cyan-600 to-sky-500 hover:shadow-md py-3 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              دخول سريع
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col dir-rtl">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-32 pb-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-100 text-cyan-800 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
            <Crown className="w-4 h-4 text-cyan-600" />
            غرف اللعب اللي سويتها كحكم
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-950 tracking-tight">
            ألعابي
          </h1>
        </div>

        <div className="relative max-w-sm mx-auto mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم اللعبة"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 text-right"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {alertMsg && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-sm font-bold text-rose-800">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {alertMsg}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              {groups.length === 0
                ? "لسا ما سويت أي غرفة لعب. سوي غرفة جديدة من الصفحة الرئيسية."
                : "ماكو ألعاب بهالاسم."}
            </p>
            {groups.length === 0 && (
              <Link
                href="/#game-setup"
                className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-sky-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md"
              >
                سوي غرفة جديدة
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {filteredGroups.map((group) => {
              const roomCategories = (
                group.latest.selected_categories || []
              ).map((catId) => categoryMap[catId]);

              return (
                <div key={group.gameName} className="relative flex flex-col">
                  {/* Top Badge: Play Count */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-full bg-emerald-700 px-5 py-1 text-xs sm:text-sm font-black text-white shadow-md border border-emerald-600">
                    عدد مرات اللعب: {group.rooms.length}
                  </div>

                  <div className="rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    {/* Top Header Card Section */}
                    <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 pt-7 pb-6 px-4 text-white text-center flex flex-col items-center justify-between min-h-[170px] relative">
                      <h3 className="font-extrabold text-xl sm:text-2xl text-white tracking-wide truncate max-w-full mt-2 mb-4 drop-shadow-sm">
                        {group.gameName}
                      </h3>

                      <button
                        type="button"
                        onClick={() => handlePlayClick(group)}
                        className="rounded-full bg-white text-red-700 hover:bg-slate-50 font-extrabold text-base sm:text-lg px-8 py-2.5 shadow-lg hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
                      >
                        العب
                      </button>
                    </div>

                    {/* Categories Preview Grid (3 columns, 2 rows) */}
                    <div className="grid grid-cols-3 gap-px bg-slate-200 border-t border-slate-200">
                      {roomCategories.map((cat, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col bg-white overflow-hidden"
                        >
                          <div className="aspect-square bg-slate-50 overflow-hidden relative flex items-center justify-center">
                            <img
                              src={cat?.image_url || FALLBACK_CATEGORY_IMAGE}
                              alt={cat?.name || "تصنيف"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="bg-orange-500 p-2 text-center">
                            <span className="text-sm sm:text-[13px] font-bold text-white truncate block">
                              {cat?.name || "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {choiceGroup && (
          <ContinueOrRestartModal
            gameName={choiceGroup.gameName}
            onClose={() => setChoiceGroup(null)}
            onContinue={() => {
              const group = choiceGroup;
              setChoiceGroup(null);
              handleContinue(group.latest);
            }}
            onRestart={() => {
              setRestartGroup(choiceGroup);
              setChoiceGroup(null);
              setRestartError(null);
            }}
          />
        )}

        {restartGroup && (
          <RestartTeamsModal
            gameName={restartGroup.gameName}
            busy={busy}
            error={restartError}
            onClose={() => setRestartGroup(null)}
            onSubmit={handleRestartSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
