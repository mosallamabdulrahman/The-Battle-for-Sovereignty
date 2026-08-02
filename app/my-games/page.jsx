"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Crown,
  History,
  Play,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";

const STATUS_META = {
  setup: { label: "قيد التجهيز", className: "bg-amber-100 text-amber-700" },
  playing: {
    label: "جارية الآن",
    className: "bg-emerald-100 text-emerald-700",
  },
  finished: { label: "انتهت", className: "bg-slate-100 text-slate-600" },
  abandoned: {
    label: "متروكة (لسا ما خلصت)",
    className: "bg-rose-100 text-rose-600",
  },
};

const FALLBACK_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=80";

export default function MyGamesPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyRoomId, setBusyRoomId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
        supabase.from("question_categories").select("id,name,image_url,emoji"),
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

  const filteredRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((room) =>
      (room.game_name || "").toLowerCase().includes(q),
    );
  }, [rooms, searchQuery]);

  const handleRestart = async (room) => {
    setBusyRoomId(room.id);
    setAlertMsg(null);
    try {
      const { data, error } = await supabase.rpc("restart_game_room", {
        p_source_room_id: room.id,
      });
      if (error) throw error;

      window.location.assign(`/battle?room_id=${data.room_id}&role=judge`);
    } catch (err) {
      setAlertMsg(err.message || "ما قدرنا نبدأ اللعبة من جديد.");
      setBusyRoomId(null);
    }
  };

  const handleResume = async (room) => {
    setBusyRoomId(room.id);
    setAlertMsg(null);
    try {
      const { error } = await supabase.rpc("resume_game_room", {
        p_room_id: room.id,
      });
      if (error) throw error;

      window.location.assign(`/battle?room_id=${room.id}&role=judge`);
    } catch (err) {
      setAlertMsg(err.message || "ما قدرنا نرجع للعبة.");
      setBusyRoomId(null);
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

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 pt-32 pb-20">
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
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              {rooms.length === 0
                ? "لسا ما سويت أي غرفة لعب. سوي غرفة جديدة من الصفحة الرئيسية."
                : "ماكو ألعاب بهالاسم."}
            </p>
            {rooms.length === 0 && (
              <Link
                href="/#game-setup"
                className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-sky-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md"
              >
                سوي غرفة جديدة
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredRooms.map((room) => {
              const status = STATUS_META[room.status] || STATUS_META.finished;
              const isAbandoned = room.status === "abandoned";
              const isActive =
                room.status === "setup" || room.status === "playing";
              const isBusy = busyRoomId === room.id;
              const roomCategories = (room.selected_categories || []).map(
                (catId) => categoryMap[catId],
              );

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-l from-cyan-700 via-cyan-600 to-sky-500 p-5 text-white text-center">
                    <span
                      className={`inline-block mb-2 px-2.5 py-1 rounded-lg text-[10px] font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                    <h3 className="font-bold text-lg truncate">
                      {room.game_name ||
                        `${room.team_1_name} × ${room.team_2_name}`}
                    </h3>
                    <p className="text-[11px] text-white/70 mt-0.5">
                      {room.team_1_name} × {room.team_2_name} ·{" "}
                      {new Date(room.created_at).toLocaleDateString("ar-EG")}
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                      {isActive && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleResume(room)}
                          className="inline-flex items-center gap-1.5 bg-white text-cyan-700 text-xs font-bold px-5 py-2 rounded-xl shadow-md disabled:opacity-60"
                        >
                          <Play className="w-3.5 h-3.5" />
                          تكملة اللعبة
                        </button>
                      )}
                      {isAbandoned && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleResume(room)}
                          className="inline-flex items-center gap-1.5 bg-cyan-950/80 hover:bg-cyan-950 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                        >
                          <Play className="w-3.5 h-3.5" />
                          الاستمرار
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRestart(room)}
                        className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-colors disabled:opacity-60"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isBusy ? "animate-spin" : ""}`}
                        />
                        ابدأ من جديد
                      </button>
                    </div>
                  </div>

                  {/* Categories preview grid */}
                  <div className="grid grid-cols-3 gap-1.5 p-3">
                    {roomCategories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square"
                      >
                        <img
                          src={cat?.image_url || FALLBACK_CATEGORY_IMAGE}
                          alt={cat?.name || "تصنيف"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-1 py-1 text-center">
                          <span className="text-[9px] font-bold text-white truncate block">
                            {cat?.name || "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
