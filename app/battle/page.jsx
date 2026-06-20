"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  RefreshCw,
  Gamepad2,
  Lock,
  Check,
  AlertTriangle,
  Crown,
  CheckCircle,
  Share2,
  LockKeyhole,
  LogOut,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import {
  AbandonedGameView,
  CombatEventModal,
  JudgeCombatDashboard,
  TeamCombatDashboard,
} from "../../components/battle/CombatViews";

const TEAM_PUBLIC_COLUMNS = [
  "id",
  "room_id",
  "team_index",
  "name",
  "points",
  "score",
  "available_strikes",
  "is_ready",
  "joined",
  "member_id",
  "tools",
  "used_tools",
  "shield_active",
  "created_at",
  "updated_at",
].join(",");

function BattleAlert({ alert }) {
  if (!alert) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[120] rounded-2xl border px-5 py-3 text-sm font-bold text-white shadow-2xl ${
        alert.type === "error"
          ? "border-rose-700 bg-rose-900"
          : "border-emerald-700 bg-emerald-900"
      }`}
    >
      {alert.message}
    </div>
  );
}

export default function BattlePage() {
  const [mounted, setMounted] = useState(false);

  // Routing / Query States
  const [roomId, setRoomId] = useState(null);
  const [teamIndex, setTeamIndex] = useState(null); // 1 or 2
  const [role, setRole] = useState(null); // 'judge' or null

  // Session user storage
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const userId = user?.id || null;

  // Supabase Database States
  const [room, setRoom] = useState(null);
  const [teams, setTeams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [combatEvents, setCombatEvents] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [teamAccessIssue, setTeamAccessIssue] = useState(null);
  const [activeAnswer, setActiveAnswer] = useState("");
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [latestCombatEvent, setLatestCombatEvent] = useState(null);
  const [radarCells, setRadarCells] = useState([]);
  const [radarMode, setRadarMode] = useState(false);
  const [activeRadarTool, setActiveRadarTool] = useState("radar_scan");
  const [lifelineActive, setLifelineActive] = useState(false);
  const [lifelineSeconds, setLifelineSeconds] = useState(60);
  const [questionSeconds, setQuestionSeconds] = useState(60);
  const [doubleChanceActive, setDoubleChanceActive] = useState(false);
  const [holeActive, setHoleActive] = useState(false);
  const [holeConfirmPending, setHoleConfirmPending] = useState(false);
  const [lastPlacedCell, setLastPlacedCell] = useState(null);
  const lastActiveQuestionIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const lastSoundEventIdRef = useRef(null);

  // Selected Unit to Deploy (for active players)
  const [selectedUnit, setSelectedUnit] = useState("infantry"); // 'infantry', 'tank', 'aircraft', 'submarine', 'mine'

  // Toast / Status banner
  const [alertMsg, setAlertMsg] = useState(null);

  // Equipment pricing & icons list
  const unitSpecs = {
    infantry: { name: "جندي مشاة", cost: 10, emoji: "👥" },
    tank: { name: "مدرعة دبابة", cost: 50, emoji: "🚜" },
    aircraft: { name: "طائرة قتالية", cost: 100, emoji: "✈️" },
    submarine: { name: "غواصة بحرية", cost: 200, emoji: "⛵" },
    mine: { name: "لغم مغناطيسي", cost: 100, emoji: "💥" },
  };

  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency, duration = 0.12, type = "sine", gainValue = 0.05) => {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(gainValue, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }, [getAudioContext]);

  const playNoise = useCallback((duration = 0.35, gainValue = 0.12) => {
    const context = getAudioContext();
    if (!context) return;
    const bufferSize = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < bufferSize; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize);
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(gainValue, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  }, [getAudioContext]);

  const playGameSound = useCallback((type) => {
    if (type === "tick") {
      playTone(880, 0.07, "square", 0.025);
    } else if (type === "timeout") {
      playTone(220, 0.25, "sawtooth", 0.06);
      window.setTimeout(() => playTone(165, 0.25, "sawtooth", 0.05), 150);
    } else if (type === "hit") {
      playTone(180, 0.12, "sawtooth", 0.08);
      window.setTimeout(() => playTone(90, 0.25, "sawtooth", 0.07), 80);
      playNoise(0.2, 0.06);
    } else if (type === "mine") {
      playNoise(0.55, 0.16);
      playTone(70, 0.45, "sawtooth", 0.08);
    } else if (type === "blocked") {
      playTone(520, 0.1, "triangle", 0.05);
      window.setTimeout(() => playTone(700, 0.1, "triangle", 0.04), 110);
    } else if (type === "miss") {
      playTone(320, 0.08, "sine", 0.035);
      window.setTimeout(() => playTone(260, 0.08, "sine", 0.03), 90);
    }
  }, [playNoise, playTone]);

  useEffect(() => {
    if (!lifelineActive) return undefined;
    if (lifelineSeconds <= 0) {
      const timeout = window.setTimeout(() => {
        setLifelineActive(false);
        setLifelineSeconds(60);
      }, 450);
      return () => window.clearTimeout(timeout);
    }

    const interval = window.setInterval(() => {
      setLifelineSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [lifelineActive, lifelineSeconds]);

  useEffect(() => {
    const currentQuestionId = room?.active_question_id || null;
    const previousQuestionId = lastActiveQuestionIdRef.current;

    if (currentQuestionId && currentQuestionId !== previousQuestionId) {
      setQuestionSeconds(60);
    }

    if (previousQuestionId && !currentQuestionId) {
      setDoubleChanceActive(false);
      setHoleConfirmPending(false);
      setQuestionSeconds(60);
      if (holeActive) setHoleActive(false);
    }

    lastActiveQuestionIdRef.current = currentQuestionId;
  }, [room?.active_question_id, holeActive]);

  useEffect(() => {
    if (!room?.active_question_id || room.status !== "playing") return undefined;
    if (questionSeconds <= 0) {
      playGameSound("timeout");
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setQuestionSeconds((seconds) => Math.max(0, seconds - 1));
      if (questionSeconds <= 10) {
        playGameSound("tick");
      }
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [playGameSound, questionSeconds, room?.active_question_id, room?.status]);

  useEffect(() => {
    if (!latestCombatEvent || latestCombatEvent.event_type !== "strike") return;
    if (lastSoundEventIdRef.current === latestCombatEvent.id) return;
    lastSoundEventIdRef.current = latestCombatEvent.id;
    playGameSound(latestCombatEvent.result || "miss");
  }, [latestCombatEvent, playGameSound]);

  const getTeamUrl = (rId, tIndex) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/battle?room_id=${rId}&team=${tIndex}`;
    }
    return `/battle?room_id=${rId}&team=${tIndex}`;
  };

  const getCurrentBattlePath = () => {
    if (typeof window === "undefined") return "/battle";
    return `${window.location.pathname}${window.location.search}`;
  };

  // Trigger Local Alerter
  const showAlert = (message, type = "warning") => {
    setAlertMsg({ message, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // 1. Initial State Parsing & Auth checking
  useEffect(() => {
    let isActive = true;
    setMounted(true);
    if (typeof window !== "undefined") {
      let params = new URLSearchParams(window.location.search);
      const savedPath = window.localStorage.getItem(
        "sovereignty_active_battle_path",
      );

      if (!params.get("room_id") && savedPath?.startsWith("/battle?")) {
        window.history.replaceState({}, "", savedPath);
        params = new URLSearchParams(window.location.search);
      }

      setRoomId(params.get("room_id"));
      const t = params.get("team");
      if (t) setTeamIndex(Number(t));
      setRole(params.get("role"));

      if (params.get("room_id")) {
        window.localStorage.setItem(
          "sovereignty_active_battle_path",
          `${window.location.pathname}${window.location.search}`,
        );
      }
    }

    const restoreSession = async () => {
      const recentlyLoggedIn = Boolean(
        window.sessionStorage.getItem("sovereignty_login_verified"),
      );
      const maxAttempts = recentlyLoggedIn ? 5 : 2;
      let restoredUser = null;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          restoredUser = session.user;
          break;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 200));
      }

      if (!isActive) return;
      setUser((currentUser) =>
        currentUser?.id === restoredUser?.id ? currentUser : restoredUser,
      );
      setAuthLoading(false);
      window.sessionStorage.removeItem("sovereignty_login_verified");
    };

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) return;

      if (session?.user) {
        setUser((currentUser) =>
          currentUser?.id === session.user.id ? currentUser : session.user,
        );
        setAuthLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAuthLoading(false);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch Room & associated Team records from Supabase
  const loadDatabaseData = useCallback(async () => {
    if (!roomId || !userId) return;
    setDbLoading(true);
    setDbError(null);
    setTeamAccessIssue(null);

    try {
      // Fetch Room
      const { data: rData, error: rError } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (rError) throw rError;
      setRoom(rData);

      // Fetch both Teams
      const { data: tData, error: tError } = await supabase
        .from("teams")
        .select(TEAM_PUBLIC_COLUMNS)
        .eq("room_id", roomId)
        .order("team_index");

      if (tError) throw tError;
      let visibleTeams = (tData || []).map((team) => ({ ...team, board: [] }));
      let canLoadTeamBoard = true;

      // 3. Mark team participants as joined in Database (optimistic write once scanned)
      if (teamIndex && (teamIndex === 1 || teamIndex === 2)) {
        if (rData.judge_id === userId) {
          canLoadTeamBoard = false;
          setTeamAccessIssue({
            type: "referee",
            message:
              "أنت مسجل حاليًا بحساب حكم هذه الغرفة، لذلك لا يمكن حجز مقعد فريق بنفس الحساب.",
          });
        } else {
          const { error: claimError } = await supabase.rpc("claim_team_slot", {
            p_room_id: roomId,
            p_team_index: teamIndex,
          });

          if (claimError) {
            canLoadTeamBoard = false;
            setTeamAccessIssue({
              type: "occupied",
              message: claimError.message?.includes("already assigned")
                ? "هذا الفريق محجوز بالفعل بحساب لاعب آخر."
                : claimError.message || "تعذر الانضمام إلى هذا الفريق.",
            });
          } else {
            const { data: claimedTeams, error: claimedTeamsError } =
              await supabase
                .from("teams")
                .select(TEAM_PUBLIC_COLUMNS)
                .eq("room_id", roomId)
                .order("team_index");

            if (claimedTeamsError) throw claimedTeamsError;
            visibleTeams = claimedTeams.map((team) => ({ ...team, board: [] }));
          }
        }
      }

      const visibleBoardIndexes =
        role === "judge"
          ? [1, 2]
          : teamIndex && canLoadTeamBoard
            ? [teamIndex]
            : [];

      for (const visibleTeamIndex of visibleBoardIndexes) {
        const { data: board, error: boardError } = await supabase.rpc(
          "get_team_board",
          {
            p_room_id: roomId,
            p_team_index: visibleTeamIndex,
          },
        );

        if (boardError) throw boardError;
        visibleTeams = visibleTeams.map((team) =>
          team.team_index === visibleTeamIndex ? { ...team, board } : team,
        );
      }

      setTeams(visibleTeams);

      const { data: questionData, error: questionError } = await supabase
        .from("room_questions")
        .select("*")
        .eq("room_id", roomId)
        .order("category_id")
        .order("position");

      if (questionError) throw questionError;

      let categoryImageMap = new Map();
      const categoryIds = [...new Set((questionData || []).map((question) => question.category_id))];
      if (categoryIds.length > 0) {
        const { data: categoryData } = await supabase
          .from("question_categories")
          .select("id,image_url")
          .in("id", categoryIds);
        categoryImageMap = new Map((categoryData || []).map((category) => [category.id, category.image_url]));
      }

      setQuestions(
        (questionData || []).map((question) => ({
          ...question,
          category_image_url: categoryImageMap.get(question.category_id) || question.category_image_url || "",
        })),
      );

      const { data: eventData, error: eventError } = await supabase
        .from("combat_events")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (eventError) throw eventError;
      setCombatEvents(eventData || []);
    } catch (err) {
      console.error(err);
      setDbError(
        err.message || "فشل تحميل بيانات معركة سيادة من الخادم الريادي القديم.",
      );
    } finally {
      setDbLoading(false);
    }
  }, [roomId, role, teamIndex, userId]);

  // Load database rows when variables lock
  useEffect(() => {
    if (roomId && userId && !authLoading) {
      loadDatabaseData();
    }
  }, [authLoading, roomId, userId, loadDatabaseData]);

  // 4. Set up Supabase Realtime Channel Subscription to automatically receive board adjustments
  useEffect(() => {
    if (!roomId) return;

    const roomChannel = supabase
      .channel(`realtime:room-${roomId}`)
      // Room Updates listener
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoom(payload.new);
        },
      )
      // Teams Updates listener
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedTeam = payload.new;
          setTeams((prev) =>
            prev.map((t) =>
              t.id === updatedTeam.id ? { ...t, ...updatedTeam } : t,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room_questions",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setQuestions((previous) =>
            previous.map((question) =>
              question.id === payload.new.id
                ? {
                    ...payload.new,
                    category_image_url: question.category_image_url || payload.new.category_image_url || "",
                  }
                : question,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "combat_events",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setCombatEvents((previous) =>
            [payload.new, ...previous].slice(0, 50),
          );
          if (payload.new.event_type === "strike") {
            setLatestCombatEvent(payload.new);
            if (teamIndex && payload.new.target_team_index === teamIndex) {
              supabase
                .rpc("get_team_board", {
                  p_room_id: roomId,
                  p_team_index: teamIndex,
                })
                .then(({ data }) => {
                  if (data) {
                    setTeams((previous) =>
                      previous.map((team) =>
                        team.team_index === teamIndex
                          ? { ...team, board: data }
                          : team,
                      ),
                    );
                  }
                });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, teamIndex]);

  useEffect(() => {
    if (role !== "judge" || !room?.active_question_id) {
      setActiveAnswer("");
      return;
    }

    const loadAnswer = async () => {
      const { data, error } = await supabase.rpc("get_question_answer", {
        p_question_id: room.active_question_id,
      });

      if (error) {
        showAlert(`تعذر تحميل الإجابة: ${error.message}`, "error");
        return;
      }

      setActiveAnswer(data);
    };

    loadAnswer();
  }, [role, room?.active_question_id]);

  // 6. Handle unit placement (for active playing teams)
  const handleCellClick = async (cellIndex) => {
    if (!room || teams.length < 2 || !teamIndex) return;

    const activeTeam = teams.find((t) => t.team_index === teamIndex);
    if (!activeTeam) return;

    // Reject deployment mutations if already flagged ready
    if (activeTeam.is_ready) {
      showAlert(
        "تم تشفير وإقفال الترسانة مسبقاً، يرجى انتظار اللواء الآخر.",
        "warning",
      );
      return;
    }

    const currentBoard = Array.isArray(activeTeam.board)
      ? [...activeTeam.board]
      : Array(36).fill(null);
    let currentPoints = activeTeam.points;

    // A. Deletion Refund behavior if already populated
    if (currentBoard[cellIndex]) {
      const refundCost = unitSpecs[currentBoard[cellIndex]]?.cost || 0;
      currentPoints += refundCost;
      currentBoard[cellIndex] = null;
      setLastPlacedCell(null);
    }
    // B. Purchase and placement checks
    else {
      const cost = unitSpecs[selectedUnit].cost;
      if (currentPoints < cost) {
        showAlert("رصيد الفريق غير كافٍ لإضافة هذه الوحدة العسكرية.", "error");
        return;
      }
      currentPoints -= cost;
      currentBoard[cellIndex] = selectedUnit;
      setLastPlacedCell(cellIndex);
    }

    // Apply Optimistic update locally
    setTeams((prev) =>
      prev.map((t) =>
        t.team_index === teamIndex
          ? { ...t, board: currentBoard, points: currentPoints }
          : t,
      ),
    );

    const { error } = await supabase.rpc("update_team_deployment", {
      p_room_id: roomId,
      p_team_index: teamIndex,
      p_board: currentBoard,
      p_points: currentPoints,
    });

    if (error) {
      showAlert(error.message, "error");
      loadDatabaseData();
    }
  };

  // 7. Flag readiness to lock board deployment
  const handleSetTeamReady = async () => {
    if (!teamIndex) return;
    const activeTeam = teams.find((t) => t.team_index === teamIndex);
    if (!activeTeam) return;

    // Minimum check: must place at least 1 unit to start
    const placedCount = (activeTeam.board || []).filter(Boolean).length;
    if (placedCount === 0) {
      showAlert(
        "يرجى نشر وتعبئة وحدة واحدة على الأقل قبل إعلان الجهوزية.",
        "error",
      );
      return;
    }

    // Apply Local state
    setTeams((prev) =>
      prev.map((t) =>
        t.team_index === teamIndex ? { ...t, is_ready: true } : t,
      ),
    );

    const { error } = await supabase.rpc("set_team_ready", {
      p_room_id: roomId,
      p_team_index: teamIndex,
    });

    if (error) {
      showAlert(error.message, "error");
      loadDatabaseData();
    }
  };

  const runAction = async (action) => {
    setIsActionBusy(true);
    try {
      await action();
    } catch (error) {
      showAlert(error.message || "تعذر تنفيذ العملية.", "error");
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleSelectQuestion = (question) =>
    runAction(async () => {
      const { error } = await supabase.rpc("select_room_question", {
        p_room_id: roomId,
        p_question_id: question.id,
        p_team_index: role === "judge" ? null : teamIndex,
      });
      if (error) throw error;
    });

  const finalizeRoomIfComplete = async () => {
    const { error } = await supabase.rpc("finalize_room_if_complete", {
      p_room_id: roomId,
    });

    if (error) {
      const message = error.message || "";
      const canIgnore =
        message.includes("Could not find the function") ||
        message.includes("permission denied for function finalize_room_if_complete") ||
        error.code === "42501";

      if (!canIgnore) throw error;
    }
  };

  const handleResolveQuestion = (questionId, winnerTeamIndex) =>
    runAction(async () => {
      const { error } = await supabase.rpc("resolve_room_question", {
        p_room_id: roomId,
        p_question_id: questionId,
        p_winner_team_index: winnerTeamIndex,
      });
      if (error) throw error;
      await finalizeRoomIfComplete();
      setActiveAnswer("");
    });

  const handleStrike = (cellIndex) =>
    runAction(async () => {
      const { error } = await supabase.rpc("execute_strike", {
        p_room_id: roomId,
        p_attacker_team_index: teamIndex,
        p_cell_index: cellIndex,
      });
      if (error) throw error;
      await finalizeRoomIfComplete();
    });

  const handleUseTool = (toolId, cellIndex) =>
    runAction(async () => {
      const { data, error } = await supabase.rpc("use_team_tool", {
        p_room_id: roomId,
        p_team_index: teamIndex,
        p_tool: toolId,
        p_cell_index: cellIndex,
      });
      if (error) throw error;

      if (toolId === "radar_scan") {
        setRadarCells(data?.cells || []);
        setRadarMode(false);
        setActiveRadarTool("radar_scan");
      } else if (toolId === "the_detector") {
        setRadarCells(data?.cells || []);
        setRadarMode(false);
        setActiveRadarTool("radar_scan");
      } else if (toolId === "lifeline_call") {
        setLifelineSeconds(60);
        setLifelineActive(true);
      } else if (toolId === "double_chance") {
        setDoubleChanceActive(true);
      } else if (toolId === "the_hole") {
        setHoleConfirmPending(true);
      }
    });

  const handleExitGame = () =>
    runAction(async () => {
      const actorRole =
        role === "judge" || room?.judge_id === user?.id ? "judge" : "team";
      const { error } = await supabase.rpc("abandon_game", {
        p_room_id: roomId,
        p_actor_role: actorRole,
        p_team_index: actorRole === "team" ? teamIndex : null,
      });
      if (error) throw error;

      window.localStorage.removeItem("sovereignty_active_room");
      window.localStorage.removeItem("sovereignty_active_battle_path");
    });

  const handleSwitchToTeamAccount = async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem("sovereignty_active_battle_path");
    window.location.reload();
  };

  // 8. Gateways & Loading Overlays
  if (!mounted || authLoading) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl"
        suppressHydrationWarning
      >
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-cyan-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 mt-4">
            جاري فحص تصاريح المرور والمصادقة...
          </h3>
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
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">
            بوابة المصادقة المطلوبة
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
            عذراً، يجب إنشاء حساب عسكري أو تسجيل الدخول أولاً قبل تولي تمركز
            الجيش أو إدارة الغرفة الحربية المشتركة.
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
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors mt-2 block"
            >
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
          <p className="text-xs font-bold text-slate-700 mt-4">
            جاري تفريغ بروتوكولات الميدان واستدعاء الحلفاء لربط الجبهات...
          </p>
        </div>
      </div>
    );
  }

  if (roomId && dbError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl">
        <div className="bg-white p-8 rounded-2xl border border-rose-100 shadow-lg text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-slate-900 mt-4">
            خلل في الاتصال بالشبكة
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {dbError}
          </p>
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

  if (roomId && room && teamIndex && teamAccessIssue) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl">
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-slate-950">
            {teamAccessIssue.type === "referee"
              ? "حساب الحكم لا يمكنه حجز فريق"
              : "تعذر الانضمام إلى الفريق"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {teamAccessIssue.message}
          </p>

          <div className="mt-7 space-y-3">
            {teamAccessIssue.type === "referee" && (
              <Link
                href={`/battle?room_id=${roomId}&role=judge`}
                className="block w-full rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 px-5 py-3 font-bold text-white"
              >
                العودة إلى شاشة الحكم
              </Link>
            )}
            <button
              type="button"
              onClick={handleSwitchToTeamAccount}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 font-bold text-slate-800"
            >
              تسجيل الخروج والدخول بحساب الفريق
            </button>
            <p className="text-[11px] leading-relaxed text-slate-400">
              يمكنك أيضًا فتح رابط الفريق في نافذة خاصة Incognito أو على جهاز
              آخر ثم تسجيل حساب مختلف.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (roomId && room?.status === "abandoned") {
    return (
      <AbandonedGameView
        room={room}
        onReturnHome={() => {
          window.localStorage.removeItem("sovereignty_active_room");
          window.localStorage.removeItem("sovereignty_active_battle_path");
          window.location.assign("/");
        }}
      />
    );
  }

  if (
    roomId &&
    room &&
    ["playing", "finished"].includes(room.status) &&
    role === "judge"
  ) {
    if (room.judge_id !== user?.id) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="mt-4 font-bold text-slate-950">
              هذه الشاشة مخصصة لحكم الغرفة فقط
            </h2>
            <Link
              href="/"
              className="mt-5 inline-block text-sm font-bold text-cyan-600"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      );
    }

    return (
      <>
        <BattleAlert alert={alertMsg} />
        <JudgeCombatDashboard
          room={room}
          teams={teams}
          questions={questions}
          events={combatEvents}
          answer={activeAnswer}
          isBusy={isActionBusy}
          questionSeconds={questionSeconds}
          onSelectQuestion={handleSelectQuestion}
          onResolveQuestion={handleResolveQuestion}
          onExit={handleExitGame}
        />
        <CombatEventModal
          event={latestCombatEvent}
          onClose={() => setLatestCombatEvent(null)}
        />
      </>
    );
  }

  if (
    roomId &&
    room &&
    ["playing", "finished"].includes(room.status) &&
    teamIndex
  ) {
    const activeTeam = teams.find((team) => team.team_index === teamIndex);
    const opponentTeam = teams.find((team) => team.team_index !== teamIndex);

    if (activeTeam && opponentTeam) {
      return (
        <>
          <BattleAlert alert={alertMsg} />
          <TeamCombatDashboard
            room={room}
            activeTeam={activeTeam}
            opponentTeam={opponentTeam}
            questions={questions}
            events={combatEvents}
            radarCells={radarCells}
            radarMode={radarMode}
            activeRadarTool={activeRadarTool}
            isBusy={isActionBusy}
            questionSeconds={questionSeconds}
            lifelineActive={lifelineActive}
            lifelineSeconds={lifelineSeconds}
            doubleChanceActive={doubleChanceActive}
            holeActive={holeActive}
            holeConfirmPending={holeConfirmPending}
            onSelectQuestion={handleSelectQuestion}
            onStrike={handleStrike}
            onUseTool={handleUseTool}
            onToggleRadar={(toolId = "radar_scan") => {
              setActiveRadarTool(toolId);
              setRadarMode((value) =>
                activeRadarTool === toolId ? !value : true,
              );
            }}
            onDismissLifeline={() => {
              setLifelineActive(false);
              setLifelineSeconds(60);
            }}
            onConfirmHole={() => {
              setHoleConfirmPending(false);
              setHoleActive(true);
            }}
            onCancelHole={() => {
              setHoleConfirmPending(false);
              showAlert("تم إلغاء الحفرة — الوسيلة استُهلكت", "warning");
            }}
            onExit={handleExitGame}
          />
          <CombatEventModal
            event={latestCombatEvent}
            onClose={() => setLatestCombatEvent(null)}
          />
        </>
      );
    }
  }

  // A. VIEW GATEWAY (when no team/role parameter is active as player or referee)
  if (roomId && room && !teamIndex && !role) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex flex-col justify-center items-center dir-rtl">
        <div className="max-w-xl w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl text-center">
          <div className="bg-gradient-to-tr from-cyan-500 to-sky-400 text-white p-3.5 rounded-2xl inline-block mb-6 shadow-md">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950 leading-tight">
            بوابة العبور العسكرية للمعركة
          </h2>
          <p className="text-xs text-slate-500 mt-1 pb-6 border-b border-slate-100 font-semibold">
            حدد هويتك العسكرية وموقع تمركزك للتموضع وتعبئة الصفوف فوراً
          </p>

          <div className="mt-8 space-y-4">
            <Link
              href={`/battle?room_id=${roomId}&team=1`}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-cyan-100 hover:border-cyan-400 bg-cyan-50/20 hover:bg-cyan-50/70 transition-all text-right group"
            >
              <div>
                <span className="font-extrabold text-sm text-cyan-900 block">
                  الدخول كفريق: {room.team_1_name}
                </span>
                <span className="text-[10px] text-cyan-600 font-medium">
                  التحكم في قلعة الدفاع وبناء ترسانة الأسلحة
                </span>
              </div>
              <Gamepad2 className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
            </Link>

            <Link
              href={`/battle?room_id=${roomId}&team=2`}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-orange-100 hover:border-orange-400 bg-orange-50/20 hover:bg-orange-50/70 transition-all text-right group"
            >
              <div>
                <span className="font-extrabold text-sm text-orange-900 block">
                  الدخول كفريق: {room.team_2_name}
                </span>
                <span className="text-[10px] text-orange-600 font-medium">
                  التحكم في هجوم الجسر وبناء الجيش الداعم
                </span>
              </div>
              <Gamepad2 className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            </Link>

            {room.judge_id === user?.id && (
              <>
                <Link
                  href={`/battle?room_id=${roomId}&role=judge`}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition-all text-right group"
                >
                  <div>
                    <span className="font-extrabold text-sm text-slate-800 block">
                      الدخول كحكم المباراة (شاشة المتابعة)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      إدارة التلغرافات، رصد ضربات الرادار وتتبع المؤشرات
                    </span>
                  </div>
                  <Crown className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />
                </Link>
                <button
                  type="button"
                  onClick={handleExitGame}
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700"
                >
                  خروج من اللعبة وإنهاء الغرفة
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // B. VIEW JUDGE VIEW (Task 14)
  if (roomId && room && role === "judge") {
    const team1Obj = teams.find((t) => t.team_index === 1);
    const team2Obj = teams.find((t) => t.team_index === 2);

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
                alertMsg.type === "success"
                  ? "bg-emerald-900 border-emerald-800"
                  : "bg-slate-900 border-slate-800"
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
                <h1 className="font-sans font-bold text-lg text-slate-950">
                  شاشة الحكم العسكري الحية لتتبع المعركة
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  غرفة المتابعة وتوليد الإشارات رقم: {room.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExitGame}
                className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors text-rose-700 flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                خروج من اللعبة
              </button>
              <Link
                href="/"
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors text-slate-600"
              >
                العودة للرئيسية
              </Link>
              <span
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold ${"bg-amber-100 text-amber-700"}`}
              >
                ● جاري تهيئة التعبئة العسكرية
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
                <h3 className="font-sans font-bold text-md text-cyan-900 mt-1">
                  {room.team_1_name}
                </h3>

                <div className="mt-5 space-y-4 flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      حالة الدخول للغرفة:
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        team1Obj?.joined
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {team1Obj?.joined
                        ? "✓ متصل بالرصيف"
                        : "○ في انتظار قائد الكتيبة"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      تجهيز الجيش والتموضع:
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        team1Obj?.is_ready
                          ? "bg-cyan-500 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {team1Obj?.is_ready
                        ? "✓ تم بناء القوات بنجاح"
                        : "○ جاري نشر الوحدات"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      الوحدات الحاضرة بالقلعة:
                    </span>
                    <span className="font-bold text-slate-700">
                      {(team1Obj?.board || []).filter(Boolean).length} من ٣٦
                    </span>
                  </div>

                  {/* QR Code Team 1 */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <QRCodeSVG value={getTeamUrl(room.id, 1)} size={110} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-2">
                      رابط تعبئة {room.team_1_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(getTeamUrl(room.id, 1));
                        showAlert("تم نسخ رابط الفريق الأول بنجاح!", "success");
                      }}
                      className="mt-2.5 text-[9px] font-bold text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-cyan-100"
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
                <h3 className="font-sans font-bold text-md text-orange-950 mt-1">
                  {room.team_2_name}
                </h3>

                <div className="mt-5 space-y-4 flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      حالة الدخول للغرفة:
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        team2Obj?.joined
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {team2Obj?.joined
                        ? "✓ متصل بالرصيف"
                        : "○ في انتظار قائد الكتيبة"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      تجهيز الجيش والتموضع:
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        team2Obj?.is_ready
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {team2Obj?.is_ready
                        ? "✓ تم بناء القوات بنجاح"
                        : "○ جاري نشر الوحدات"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      الوحدات الحاضرة بالقلعة:
                    </span>
                    <span className="font-bold text-slate-700">
                      {(team2Obj?.board || []).filter(Boolean).length} من ٣٦
                    </span>
                  </div>

                  {/* QR Code Team 2 */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <QRCodeSVG value={getTeamUrl(room.id, 2)} size={110} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-2">
                      رابط تعبئة {room.team_2_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(getTeamUrl(room.id, 2));
                        showAlert(
                          "تم نسخ رابط الفريق الثاني بنجاح!",
                          "success",
                        );
                      }}
                      className="mt-2.5 text-[9px] font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-orange-100"
                    >
                      <Share2 className="w-3 h-3" />
                      نسخ الرابط العسكري من الميدان
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Selected Params Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
              <h4 className="font-sans font-bold text-xs text-slate-500 uppercase tracking-wider mb-4">
                كشف الإعدادات المشتركة المصادق عليها
              </h4>

              {/* Categories listed */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-2">
                    الأقاليم والجبهات المفعلة (6 مناطق):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.selected_categories.map((catId, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200"
                      >
                        🛡️ {catId}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                  الأدوات التكتيكية مخفية حتى تبدأ مرحلة القتال.
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
            <p className="text-xs font-bold text-slate-700 mt-4">
              جاري توليد صفحة تموضع الكتائب...
            </p>
          </div>
        </div>
      );
    }

    // Checking if battle has started and both teams ready
    const isBattleLocked = activeTeam.is_ready;

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
                alertMsg.type === "error"
                  ? "bg-rose-900 border-rose-840"
                  : "bg-slate-900 border-slate-800"
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
                <h1 className="font-sans font-bold text-base text-slate-950">
                  لوحة انتشار لواء: {activeTeam.name}
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  غرفة الحرب الثقافية رقم: {room.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleExitGame}
                className="px-3 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 font-bold rounded-xl text-[10px] transition-colors text-rose-700 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                خروج من اللعبة
              </button>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-bold">
                  باقي نقاط الحرب للتسليح
                </span>
                <span className="text-base font-bold text-cyan-600">
                  {activeTeam.points}ن
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                  activeTeam.is_ready
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {activeTeam.is_ready
                  ? "✓ جاهز تماماً"
                  : "● جاري بناء التعبئة العسكرية"}
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
                  <h3 className="text-sm font-bold text-slate-900">
                    أرض المعركة الخاصة بك (6×6 تموضع)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    انقر على المربعات لتثبيت أو إخلاء الأسلحة
                  </p>
                </div>
                <div className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg">
                  المربعات المشغولة:{" "}
                  {(activeTeam.board || []).filter(Boolean).length} / ٣٦
                </div>
              </div>

              {/* The Interactive Grid */}
              <div className="relative">
                <div className="grid grid-cols-6 gap-2 sm:gap-3 aspect-square max-w-lg mx-auto">
                  {(activeTeam.board || Array(36).fill(null)).map(
                    (cell, idx) => {
                      const cellUnit = cell ? unitSpecs[cell] : null;
                      return (
                        <motion.button
                          key={idx}
                          whileHover={
                            !activeTeam.is_ready ? { scale: 1.05 } : {}
                          }
                          whileTap={!activeTeam.is_ready ? { scale: 0.95 } : {}}
                          disabled={activeTeam.is_ready}
                          onClick={() => handleCellClick(idx)}
                          className={`aspect-square border rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all cursor-pointer relative group ${
                            cell
                              ? "bg-gradient-to-tr from-cyan-50 to-cyan-100 border-cyan-400 text-slate-900 shadow-cyan-100/50 shadow-sm"
                              : "bg-slate-50 hover:bg-slate-100/70 border-slate-150"
                          }`}
                        >
                          {/* Unit Emoji display */}
                          {cellUnit ? (
                            <motion.span
                              key={`${idx}-${cell}`}
                              initial={
                                lastPlacedCell === idx
                                  ? { scale: 0.35, rotate: -12, opacity: 0 }
                                  : false
                              }
                              animate={
                                lastPlacedCell === idx
                                  ? {
                                      scale: [1, 1.18, 1],
                                      rotate: 0,
                                      opacity: 1,
                                    }
                                  : { scale: 1, rotate: 0, opacity: 1 }
                              }
                              transition={{ duration: 0.45, ease: "easeOut" }}
                              className="flex flex-col items-center"
                            >
                              <span className="drop-shadow-sm">
                                {cellUnit.emoji}
                              </span>
                              <span className="text-[8px] absolute bottom-1 text-cyan-700 font-bold tracking-tight scale-90">
                                {cellUnit.cost}ن
                              </span>
                            </motion.span>
                          ) : (
                            <span className="text-slate-300 group-hover:text-cyan-600 text-xs font-bold transition-colors">
                              {idx}
                            </span>
                          )}
                        </motion.button>
                      );
                    },
                  )}
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
                    <h4 className="font-sans font-bold text-lg text-emerald-400">
                      تم إغلاق أرض المعركة حتى تبدأ الجولة
                    </h4>
                    <p className="text-xs text-slate-300 max-w-xs mt-2 leading-relaxed">
                      تم تعمية وتغطية وتأمين انتشار لشكريكتك بنجاح! لا يمكن
                      للعدو أو الحلفاء تسريب المواقع الموزعة سلفاً.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Unit selections and ready button (Task 12) */}
          <div className="space-y-6">
            {/* Deployment Panel */}
            <div
              className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-md ${
                activeTeam.is_ready ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <h3 className="font-sans font-bold text-xs text-slate-500 uppercase tracking-wider mb-4">
                ترسانة الوحدات العسكرية المنتشرة
              </h3>

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
                          ? "border-cyan-500 bg-cyan-50/70 shadow-sm shadow-cyan-100 ring-2 ring-cyan-500/10"
                          : "border-slate-150 hover:bg-slate-50 hover:border-slate-250"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-2xl">{unit.emoji}</span>
                        <span className="block text-right">
                          <span className="font-bold text-xs text-slate-900 block group-hover:text-cyan-600">
                            {unit.name}
                          </span>
                          <span className="text-[10px] text-slate-400 leading-tight block">
                            وحدة عسكرية في الميدان
                          </span>
                        </span>
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">
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
                  <h4 className="font-sans font-bold text-sm text-slate-800">
                    تم بناء وتحصين جيشك بنجاح!
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    مرحى! تم إشهار حالة القتال. في انتظار إعلان جهوزية اللواء
                    الآخر لإنزال الشفرة وبدء المبارزة...
                  </p>
                  {opponentTeam && (
                    <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-bold">
                        حالة فيلق العدو:
                      </span>
                      <span
                        className={`text-[10.5px] font-bold mt-1 block ${
                          opponentTeam.is_ready
                            ? "text-emerald-600"
                            : "text-amber-600 animate-pulse"
                        }`}
                      >
                        {opponentTeam.is_ready
                          ? "● جاهز للاشتباك المباشر"
                          : "● ما زال يجهز صفوفه في الخفاء"}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-right bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold leading-relaxed text-slate-500">
                    بشرتك اللوجيستية تبدأ بـ{" "}
                    <strong className="text-slate-800">1000ن</strong>. كل تفريغ
                    أو إلغاء للوحدة من اللوحة يعيد لك كامل نقاط التأسيس مجاناً.
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSetTeamReady}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-sans font-bold text-sm py-4 rounded-2xl shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
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
        <h2 className="text-xl md:text-2xl font-bold text-slate-950">
          ميدان معركة سيادة
        </h2>
        <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-semibold">
          مرحباً بك أيها القائد العسكري! للبدء وخوض المباراة، يرجى التوجه لتأسيس
          غرفة المعركة وتحديد التصنيفات بالدليل الميداني على الصفحة الرئيسية
          أولاً.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/#game-setup"
            className="w-full bg-gradient-to-br from-cyan-500 to-sky-500 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all block text-center"
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
