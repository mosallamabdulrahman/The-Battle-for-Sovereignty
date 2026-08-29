"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AbandonedGameView,
  CombatEventModal,
} from "@/components/battle/CombatShared";
import { RefereeGameScreen } from "@/components/battle/RefereeGameScreen";
import { UNIT_IMAGES, UNIT_NAMES } from "@/lib/game-data";
import GameLogo from "@/components/GameLogo";
import Image from "next/image";

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

function BattlePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Routing / Query States
  const [roomId, setRoomId] = useState(null);
  const [teamIndex, setTeamIndex] = useState(null); // 1 or 2
  const [role, setRole] = useState(null); // 'judge' or null
  const [teamToken, setTeamToken] = useState(null); // access token for no-account team links
  const [teamLinkTokens, setTeamLinkTokens] = useState(null); // judge-only: {team_1_token, team_2_token}

  // Session user storage
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const userId = user?.id || null;

  // Supabase Database States
  const [room, setRoom] = useState(null);
  const [teams, setTeams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [categoryInfoMap, setCategoryInfoMap] = useState(new Map());
  const [combatEvents, setCombatEvents] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [activeAnswer, setActiveAnswer] = useState({
    text: "",
    imageUrl: "",
  });
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [latestCombatEvent, setLatestCombatEvent] = useState(null);
  // Radar reveals, keyed by the TARGET team whose board was scanned (mirrors
  // how strike events are keyed by target_team_index) — accumulated and kept
  // for the whole game so a revealed cell stays visible later at strike
  // time too, instead of being thrown away when the radar modal closes.
  const [radarRevealsByTeam, setRadarRevealsByTeam] = useState({});
  const [questionSeconds, setQuestionSeconds] = useState(60);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerOverrideStart, setTimerOverrideStart] = useState(null);
  const [lastPlacedCell, setLastPlacedCell] = useState(null);
  const lastActiveQuestionIdRef = useRef(null);
  const questionStartedAtRef = useRef(null);
  const audioContextRef = useRef(null);
  const lastSoundEventIdRef = useRef(null);
  const deploymentTimerRef = useRef(null);
  const pendingBoardRef = useRef(null);

  // Selected Unit to Deploy (for active players)
  const [selectedUnit, setSelectedUnit] = useState("infantry"); // 'infantry', 'tank', 'aircraft', 'submarine', 'mine'

  // Toast / Status banner
  const [alertMsg, setAlertMsg] = useState(null);

  // Equipment pricing & icons list (mines are free — hidden danger)
  const unitSpecs = {
    infantry: {
      name: "جندي",
      cost: 20,
      image: UNIT_IMAGES.infantry,
      description: "وحدة مشاة أساسية",
    },
    armored: {
      name: "مدرعة",
      cost: 100,
      image: UNIT_IMAGES.armored,
      description: "مركبة مدرعة خفيفة",
    },
    tank: {
      name: "دبابة",
      cost: 200,
      image: UNIT_IMAGES.tank,
      description: "دبابة ثقيلة",
    },
    aircraft: {
      name: "طائرة",
      cost: 400,
      image: UNIT_IMAGES.aircraft,
      description: "طائرة قتالية جوية",
    },
    submarine: {
      name: "غواصة",
      cost: 500,
      image: UNIT_IMAGES.submarine,
      description: "غواصة بحرية ثقيلة",
    },
    mine: {
      name: "لغم",
      cost: 0,
      image: UNIT_IMAGES.mine,
      description: "لغم أرضي (يخصم 250 نقطة)",
    },
  };

  // Limits per type — totals to exactly 33 (board must have 33 occupied, 3 empty)
  const unitLimits = {
    infantry: 15,
    armored: 7,
    tank: 4,
    aircraft: 3,
    submarine: 2,
    mine: 2,
  };

  const STARTING_POINTS = 4000;

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

  const playTone = useCallback(
    (frequency, duration = 0.12, type = "sine", gainValue = 0.05) => {
      const context = getAudioContext();
      if (!context) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gain.gain.setValueAtTime(gainValue, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    },
    [getAudioContext],
  );

  const playNoise = useCallback(
    (duration = 0.35, gainValue = 0.12) => {
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
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration,
      );
      source.connect(gain);
      gain.connect(context.destination);
      source.start();
    },
    [getAudioContext],
  );

  const playGameSound = useCallback(
    (type) => {
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
    },
    [playNoise, playTone],
  );

  useEffect(() => {
    const currentQuestionId = room?.active_question_id || null;
    const previousQuestionId = lastActiveQuestionIdRef.current;

    if (currentQuestionId && currentQuestionId !== previousQuestionId) {
      setQuestionSeconds(60); // fallback — will be overridden by question_started_at sync below
      setTimerPaused(false);
      setTimerOverrideStart(null);
    }

    if (previousQuestionId && !currentQuestionId) {
      setQuestionSeconds(60);
      setTimerPaused(false);
      setTimerOverrideStart(null);
      questionStartedAtRef.current = null;
    }

    lastActiveQuestionIdRef.current = currentQuestionId;
  }, [room?.active_question_id]);

  // Radar reveals belong to a specific room — clear them out if this same
  // mounted page instance ever navigates into a different room.
  useEffect(() => {
    setRadarRevealsByTeam({});
  }, [roomId]);

  // Synced countdown: recomputes the remaining time from the shared server
  // timestamp on each tick instead of decrementing a local counter — this
  // makes it self-correcting so screens never drift apart (background-tab
  // throttling, timer jitter, clock skew, etc. all reset themselves on the
  // very next tick). The referee can locally pause the tick or shift the
  // effective start time (reset) without touching the server value.
  useEffect(() => {
    if (
      !room?.active_question_id ||
      !room?.question_started_at ||
      room.status !== "playing" ||
      timerPaused
    ) {
      return undefined;
    }

    const startedAt =
      timerOverrideStart ?? new Date(room.question_started_at).getTime();
    let lastPlayedSecond = null;

    const tick = () => {
      const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, Math.ceil(60 - elapsed));

      setQuestionSeconds(remaining);

      if (remaining === 0 && lastPlayedSecond !== 0) {
        playGameSound("timeout");
      } else if (
        remaining > 0 &&
        remaining <= 10 &&
        remaining !== lastPlayedSecond
      ) {
        playGameSound("tick");
      }
      lastPlayedSecond = remaining;
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [
    playGameSound,
    room?.active_question_id,
    room?.question_started_at,
    room?.status,
    timerPaused,
    timerOverrideStart,
  ]);

  const handlePauseTimer = () => setTimerPaused(true);

  const handleResumeTimer = () => {
    const elapsedAtPause = 60 - questionSeconds;
    setTimerOverrideStart(Date.now() - elapsedAtPause * 1000);
    setTimerPaused(false);
  };

  const handleResetTimer = () => {
    setTimerOverrideStart(Date.now());
    setTimerPaused(false);
    setQuestionSeconds(60);
  };

  useEffect(() => {
    if (!latestCombatEvent || latestCombatEvent.event_type !== "strike") return;
    if (lastSoundEventIdRef.current === latestCombatEvent.id) return;
    lastSoundEventIdRef.current = latestCombatEvent.id;
    playGameSound(latestCombatEvent.result || "miss");
  }, [latestCombatEvent, playGameSound]);

  const getTeamUrl = (rId, tIndex) => {
    const token =
      tIndex === 1
        ? teamLinkTokens?.team_1_token
        : teamLinkTokens?.team_2_token;
    const tokenParam = token ? `&token=${token}` : "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/battle?room_id=${rId}&team=${tIndex}${tokenParam}`;
    }
    return `/battle?room_id=${rId}&team=${tIndex}${tokenParam}`;
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

  // 1a. Parse routing/query state from the URL — reactive to `searchParams`
  // (not mount-only) so a same-route client-side navigation into a different
  // room/team link always resets roomId/teamIndex/role/teamToken instead of
  // leaving the previous room's identifiers stuck in state.
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!searchParams.get("room_id")) {
      const savedPath = window.localStorage.getItem(
        "sovereignty_active_battle_path",
      );
      if (savedPath?.startsWith("/battle?")) {
        router.replace(savedPath);
        return;
      }
    }

    setRoomId(searchParams.get("room_id"));
    const t = searchParams.get("team");
    setTeamIndex(t ? Number(t) : null);
    setRole(searchParams.get("role"));
    setTeamToken(searchParams.get("token"));

    if (searchParams.get("room_id")) {
      window.localStorage.setItem(
        "sovereignty_active_battle_path",
        `${window.location.pathname}?${searchParams.toString()}`,
      );
    }
  }, [searchParams, router]);

  // 1b. Auth checking (mount-only)
  useEffect(() => {
    let isActive = true;
    setMounted(true);

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
    if (!roomId) return;
    if (!userId && !(teamIndex && teamToken)) return;
    setDbLoading(true);
    setDbError(null);

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

      const visibleBoardIndexes =
        role === "judge" ? [1, 2] : teamIndex ? [teamIndex] : [];

      for (const visibleTeamIndex of visibleBoardIndexes) {
        const { data: board, error: boardError } = await supabase.rpc(
          "get_team_board",
          {
            p_room_id: roomId,
            p_team_index: visibleTeamIndex,
            p_token: visibleTeamIndex === teamIndex ? teamToken : null,
          },
        );

        if (boardError) throw boardError;
        visibleTeams = visibleTeams.map((team) =>
          team.team_index === visibleTeamIndex ? { ...team, board } : team,
        );
      }

      setTeams(visibleTeams);

      if (role === "judge" && rData.judge_id === userId) {
        const { data: tokens } = await supabase.rpc("get_team_tokens", {
          p_room_id: roomId,
        });
        if (tokens) setTeamLinkTokens(tokens);
      }

      const { data: questionData, error: questionError } = await supabase
        .from("room_questions")
        .select("*")
        .eq("room_id", roomId)
        .order("category_id")
        .order("position");

      if (questionError) throw questionError;

      let categoryImageMap = new Map();
      let newCategoryInfoMap = new Map();
      const categoryIds = [
        ...new Set(
          (questionData || []).map((question) => question.category_id),
        ),
      ];
      if (categoryIds.length > 0) {
        const { data: categoryData } = await supabase
          .from("question_categories")
          .select("id,image_url,name,emoji")
          .in("id", categoryIds);
        categoryImageMap = new Map(
          (categoryData || []).map((category) => [
            category.id,
            category.image_url,
          ]),
        );
        newCategoryInfoMap = new Map(
          (categoryData || []).map((category) => [
            category.id,
            { name: category.name, emoji: category.emoji },
          ]),
        );
      }
      setCategoryInfoMap(newCategoryInfoMap);

      setQuestions(
        (questionData || []).map((question) => ({
          ...question,
          category_image_url:
            categoryImageMap.get(question.category_id) ||
            question.category_image_url ||
            "",
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
      setDbError(err.message || "ما قدرنا نحمل بيانات حيلهم بينهم.");
    } finally {
      setDbLoading(false);
    }
  }, [roomId, role, teamIndex, teamToken, userId]);

  // Load database rows when variables lock
  useEffect(() => {
    if (!roomId || authLoading) return;
    if (userId || (teamIndex && teamToken)) {
      loadDatabaseData();
    }
  }, [authLoading, roomId, userId, teamIndex, teamToken, loadDatabaseData]);

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
                    category_image_url:
                      question.category_image_url ||
                      payload.new.category_image_url ||
                      "",
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
      setActiveAnswer({ text: "", imageUrl: "" });
      return;
    }

    const loadAnswer = async () => {
      const { data, error } = await supabase.rpc("get_question_answer", {
        p_question_id: room.active_question_id,
      });

      if (error) {
        showAlert(`ما قدرنا نحمل الإجابة: ${error.message}`, "error");
        return;
      }

      setActiveAnswer({
        text: data?.answer_text || "",
        imageUrl: data?.answer_image_url || "",
      });
    };

    loadAnswer();
  }, [role, room?.active_question_id]);

  // 6. Handle unit placement (for active playing teams)
  const handleCellClick = (cellIndex) => {
    if (!room || teams.length < 2 || !teamIndex) return;

    const activeTeam = teams.find((t) => t.team_index === teamIndex);
    if (!activeTeam) return;

    if (activeTeam.is_ready) {
      showAlert(
        "قفلنا توزيعك وخشينا جنودك، انطر الفريق الثاني يخلص.",
        "warning",
      );
      return;
    }

    // Read from pendingBoardRef first to avoid stale state on rapid clicks
    const pendingState = pendingBoardRef.current;
    const rawBoard = pendingState ? pendingState.board : activeTeam.board || [];
    // Always ensure board is exactly 36 elements to match the 6×6 grid
    const currentBoard = Array.from(
      { length: 36 },
      (_, i) => rawBoard[i] ?? null,
    );
    // Calculate current remaining points dynamically from STARTING_POINTS (4000)
    const currentSpent = currentBoard.reduce(
      (sum, unit) => sum + (unitSpecs[unit]?.cost || 0),
      0,
    );
    let currentPoints = STARTING_POINTS - currentSpent;

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
        showAlert("ما عندك نقاط كافية عشان تضيف هالجنود.", "error");
        return;
      }

      // Unit count limit check
      const currentUnitCount = currentBoard.filter(
        (cell) => cell === selectedUnit,
      ).length;
      const maxAllowed = unitLimits[selectedUnit];
      if (currentUnitCount >= maxAllowed) {
        showAlert(
          `الحد الأقصى حق "${unitSpecs[selectedUnit].name}" هو ${maxAllowed} بالخريطة.`,
          "error",
        );
        return;
      }

      currentPoints -= cost;
      currentBoard[cellIndex] = selectedUnit;
      setLastPlacedCell(cellIndex);
    }

    // Apply optimistic update immediately (no loading sensation)
    setTeams((prev) =>
      prev.map((t) =>
        t.team_index === teamIndex
          ? { ...t, board: currentBoard, points: currentPoints }
          : t,
      ),
    );

    // Debounce API call so rapid clicks don't queue multiple requests
    const snapshot = { board: currentBoard, points: currentPoints };
    pendingBoardRef.current = snapshot;
    clearTimeout(deploymentTimerRef.current);
    deploymentTimerRef.current = setTimeout(async () => {
      const pending = pendingBoardRef.current;
      if (!pending) return;
      const { error } = await supabase.rpc("update_team_deployment", {
        p_room_id: roomId,
        p_team_index: teamIndex,
        p_board: pending.board,
        p_token: teamToken,
      });
      // Only touch pendingBoardRef/state if no newer click happened during this request
      if (pendingBoardRef.current === pending) {
        if (error) {
          showAlert(error.message, "error");
          // Silently resync team data without the full loading screen.
          // `board` lives in its own protected table now, so re-fetch it
          // via the RPC alongside the public team columns instead of a
          // plain select("*") (which would otherwise wipe the displayed
          // board on any transient error).
          Promise.all([
            supabase
              .from("teams")
              .select(TEAM_PUBLIC_COLUMNS)
              .eq("room_id", roomId),
            supabase.rpc("get_team_board", {
              p_room_id: roomId,
              p_team_index: teamIndex,
              p_token: teamToken,
            }),
          ]).then(([{ data: teamRows }, { data: board }]) => {
            if (!teamRows) return;
            setTeams((prev) =>
              teamRows.map((row) => {
                const existing = prev.find((t) => t.id === row.id);
                return {
                  ...row,
                  board:
                    row.team_index === teamIndex
                      ? (board ?? existing?.board ?? [])
                      : (existing?.board ?? []),
                };
              }),
            );
          });
        }
        pendingBoardRef.current = null;
      }
    }, 350);
  };

  // 6b. Random auto-fill: place all 33 units on random cells instantly
  const handleAutoFill = async () => {
    if (!teamIndex || isAutoFilling) return;
    const activeTeam = teams.find((t) => t.team_index === teamIndex);
    if (!activeTeam || activeTeam.is_ready) return;

    const unitsToPlace = [
      ...Array(15).fill("infantry"),
      ...Array(7).fill("armored"),
      ...Array(4).fill("tank"),
      ...Array(3).fill("aircraft"),
      ...Array(2).fill("submarine"),
      ...Array(2).fill("mine"),
    ];

    // Fisher-Yates shuffle on 36 positions, pick first 33
    const positions = Array.from({ length: 36 }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    const chosen = positions.slice(0, 33);

    const newBoard = Array(36).fill(null);
    chosen.forEach((pos, idx) => {
      newBoard[pos] = unitsToPlace[idx];
    });

    // Random fill always replaces the whole board with this fixed unit
    // distribution, so points must be recomputed from the starting total —
    // reusing the team's current (possibly already-spent) points here caused
    // a board/points mismatch that the server rejected.
    const totalCost = unitsToPlace.reduce(
      (sum, unit) => sum + (unitSpecs[unit]?.cost || 0),
      0,
    );
    const newPoints = STARTING_POINTS - totalCost;

    // Optimistic UI update
    setTeams((prev) =>
      prev.map((t) =>
        t.team_index === teamIndex
          ? { ...t, board: newBoard, points: newPoints }
          : t,
      ),
    );

    // Save to DB — block ready button until confirmed
    setIsAutoFilling(true);
    const { error } = await supabase.rpc("update_team_deployment", {
      p_room_id: roomId,
      p_team_index: teamIndex,
      p_board: newBoard,
      p_token: teamToken,
    });
    setIsAutoFilling(false);

    if (error) {
      showAlert(error.message, "error");
    } else {
      pendingBoardRef.current = null;
    }
  };

  // 7. Flag readiness to lock board deployment
  const handleSetTeamReady = async () => {
    if (!teamIndex) return;
    const activeTeam = teams.find((t) => t.team_index === teamIndex);
    if (!activeTeam) return;

    // Use latest board (pending snapshot or team board)
    const currentBoard = pendingBoardRef.current
      ? pendingBoardRef.current.board
      : activeTeam.board || [];
    const placedCount = (currentBoard || []).filter(Boolean).length;

    if (placedCount !== 33) {
      showAlert(
        `لازم توزع 33 جندي بالضبط قبل لا تقفل (الحين حاط: ${placedCount}/33).`,
        "error",
      );
      return;
    }

    // Ensure any pending board updates are saved to server first — if this
    // flush fails, the server board would still hold the previous (fewer
    // than 33 units) state, so readiness must NOT proceed silently.
    if (pendingBoardRef.current) {
      clearTimeout(deploymentTimerRef.current);
      const snapshot = pendingBoardRef.current;
      pendingBoardRef.current = null;
      const { error: flushError } = await supabase.rpc(
        "update_team_deployment",
        {
          p_room_id: roomId,
          p_team_index: teamIndex,
          p_board: snapshot.board,
          p_token: teamToken,
        },
      );
      if (flushError) {
        showAlert(flushError.message, "error");
        return;
      }
    }

    // Apply Local state
    setTeams((prev) =>
      prev.map((t) =>
        t.team_index === teamIndex
          ? { ...t, board: currentBoard, is_ready: true }
          : t,
      ),
    );

    const { error } = await supabase.rpc("set_team_ready", {
      p_room_id: roomId,
      p_team_index: teamIndex,
      p_token: teamToken,
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
      showAlert(error.message || "ما قدرنا نسوي هالعملية.", "error");
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleSelectQuestion = (question) =>
    runAction(async () => {
      const notReadyTeam = teams.find((t) => !t.is_ready);
      if (notReadyTeam) {
        throw new Error(
          `ما تقدر تختار السؤال — ${notReadyTeam.name} للحين ما وزع جنوده.`,
        );
      }
      const { error } = await supabase.rpc("select_room_question", {
        p_room_id: roomId,
        p_question_id: question.id,
        p_team_index: role === "judge" ? null : teamIndex,
      });
      if (error) throw error;
      // question_started_at is set automatically by DB trigger on game_rooms
    });

  const finalizeRoomIfComplete = async () => {
    const { error } = await supabase.rpc("finalize_room_if_complete", {
      p_room_id: roomId,
    });

    if (error) {
      const message = error.message || "";
      const canIgnore =
        message.includes("Could not find the function") ||
        message.includes(
          "permission denied for function finalize_room_if_complete",
        ) ||
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
      setActiveAnswer({ text: "", imageUrl: "" });
    });

  // Draw: both teams answered correctly → both get strikes (p_winner_team_index=0)
  const handleResolveDraw = (questionId) =>
    runAction(async () => {
      const { error } = await supabase.rpc("resolve_room_question", {
        p_room_id: roomId,
        p_question_id: questionId,
        p_winner_team_index: 0,
      });
      if (error) throw error;
      await finalizeRoomIfComplete();
      setActiveAnswer({ text: "", imageUrl: "" });
    });

  // Referee manually grants extra strikes to a specific team (via SECURITY DEFINER RPC)
  const handleGrantExtraStrike = (grantTeamIndex, count = 1) =>
    runAction(async () => {
      const { error } = await supabase.rpc("grant_extra_strikes", {
        p_room_id: roomId,
        p_team_index: grantTeamIndex,
        p_count: count,
      });
      if (error) throw error;
      const team = teams.find((t) => t.team_index === grantTeamIndex);
      const absCount = Math.abs(count);
      const label =
        absCount === 1
          ? "طقة وحدة"
          : absCount === 2
            ? "طقتين"
            : `${absCount} طقات`;
      showAlert(
        `✓ ${count >= 0 ? "عطينا" : "خصمنا"} ${label} ${count >= 0 ? "حق" : "من"} ${team?.name || "الفريق"}`,
        "success",
      );
    });

  // Referee manually grants (or deducts) points for a specific team
  const handleGrantPoints = (grantTeamIndex, points) =>
    runAction(async () => {
      const { error } = await supabase.rpc("grant_team_points", {
        p_room_id: roomId,
        p_team_index: grantTeamIndex,
        p_points: points,
      });
      if (error) throw error;
      const team = teams.find((t) => t.team_index === grantTeamIndex);
      showAlert(
        `✓ ${points >= 0 ? "عطينا" : "خصمنا"} ${Math.abs(points)} نقطة ${points >= 0 ? "حق" : "من"} ${team?.name || "الفريق"}`,
        "success",
      );
    });

  // Referee flips whose turn it is (informational — the referee already
  // controls question selection regardless of turn)
  const handleSetCurrentTurn = (targetTeamIndex) =>
    runAction(async () => {
      const { error } = await supabase.rpc("set_current_turn", {
        p_room_id: roomId,
        p_team_index: targetTeamIndex,
      });
      if (error) throw error;
    });

  // Referee ends the match immediately — whoever has more points right now wins
  const handleEndGameNow = () =>
    runAction(async () => {
      const { error } = await supabase.rpc("end_room_now", {
        p_room_id: roomId,
      });
      if (error) throw error;
    });

  // Referee backs out of a question before resolving it — clears the
  // selection server-side so it's not left highlighted/locked on the grid
  const handleDeselectQuestion = (questionId) =>
    runAction(async () => {
      const { error } = await supabase.rpc("deselect_room_question", {
        p_room_id: roomId,
        p_question_id: questionId,
      });
      if (error) throw error;
    });

  // Referee executes a strike on behalf of whichever team the room says
  // called it out
  const handleStrike = (attackerTeamIndex, cellIndex) =>
    runAction(async () => {
      const { error } = await supabase.rpc("execute_strike", {
        p_room_id: roomId,
        p_attacker_team_index: attackerTeamIndex,
        p_cell_index: cellIndex,
      });
      if (error) throw error;
      await finalizeRoomIfComplete();
    });

  // Referee activates a team's tool on their behalf
  const handleUseTool = (forTeamIndex, toolId, cellIndex) =>
    runAction(async () => {
      // Shield and Extra Strike must be activated BEFORE question reveal
      if (
        (toolId === "shield" || toolId === "extra_strike") &&
        room?.active_question_id
      ) {
        throw new Error("لازم تشغل هالفزعة قبل لا تبطل السؤال.");
      }

      const { data, error } = await supabase.rpc("use_team_tool", {
        p_room_id: roomId,
        p_team_index: forTeamIndex,
        p_tool: toolId,
        p_cell_index: cellIndex,
      });
      if (error) throw error;

      if (toolId === "radar_scan") {
        // Radar reveals the OPPONENT's board (same attacker→target
        // direction as a strike) — stored keyed by that target team so it
        // stays available later at strike time too.
        const newCells = data?.cells || [];
        const targetTeam = teams.find((t) => t.team_index !== forTeamIndex);
        if (targetTeam) {
          setRadarRevealsByTeam((prev) => {
            const existing = prev[targetTeam.team_index] || [];
            const merged = [...existing];
            newCells.forEach((cell) => {
              if (!merged.some((c) => c.cell_index === cell.cell_index)) {
                merged.push(cell);
              }
            });
            return { ...prev, [targetTeam.team_index]: merged };
          });
        }
      }
    });

  const handleExitGame = () =>
    runAction(async () => {
      // A truly finished game has nothing left to abandon — the server
      // already no-ops this (abandon_game only touches setup/playing rooms),
      // but skipping the call here keeps a finished room's status clean of
      // any "game_abandoned" combat_events noise.
      if (room?.status !== "finished") {
        const { error } = await supabase.rpc("abandon_game", {
          p_room_id: roomId,
          p_actor_role: "judge",
          p_team_index: null,
        });
        if (error) throw error;
      }

      window.localStorage.removeItem("sovereignty_active_room");
      window.localStorage.removeItem("sovereignty_active_battle_path");
      // Notifies the other team + the judge via realtime (room flips to
      // "abandoned"); the actor doesn't need to wait for that round trip.
      window.location.assign("/");
    });

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
            قاعدين نشيك على حسابك وتصاريح الدخول...
          </h3>
        </div>
      </div>
    );
  }

  // Mandatory Authentication Check for rooms (team links with a token skip this — they never have an account)
  if (roomId && !user && !(teamIndex && teamToken)) {
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
            لازم تسجل دخولك أول
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
            عفواً، لازم تسجل دخولك أول شي عشان تقدر توزع فريقك أو تدير الغرفة.
            الدخول وايد سريع بدون باسورد!
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(getCurrentBattlePath())}`}
              className="w-full bg-gradient-to-r from-cyan-600 to-sky-500 hover:shadow-md py-3 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
            >
              ⚡ دخول سريع
            </Link>
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors mt-2 block"
            >
              ← ارجع للرئيسية
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
            قاعدين نربط الجبهات وننطر باجي ربعنا يدشون...
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
            صار خلل بالاتصال بالنت
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {dbError}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 font-bold bg-cyan-600 text-white px-5 py-2 rounded-xl text-xs"
          >
            جرب مرة ثانية
          </button>
        </div>
      </div>
    );
  }

  if (roomId && room && role === "judge" && room.judge_id !== user?.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl">
        <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-lg">
          <Lock className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-slate-950">
            هالشاشة بس حق حكم الغرفة
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            الحساب المسجّل حالياً لا يتطابق مع معرف الحكم الذي أنشأ هذه الغرفة.
          </p>

          <Link
            href="/"
            className="mt-7 block w-full rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 py-3 font-bold text-white text-xs"
          >
            ارجع للرئيسية
          </Link>
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
              هالشاشة بس حق حكم الغرفة
            </h2>
            <Link
              href="/"
              className="mt-5 inline-block text-sm font-bold text-cyan-600"
            >
              ارجع للرئيسية
            </Link>
          </div>
        </div>
      );
    }

    return (
      <>
        <BattleAlert alert={alertMsg} />
        <RefereeGameScreen
          room={room}
          teams={teams}
          questions={questions}
          events={combatEvents}
          answerText={activeAnswer.text}
          answerImageUrl={activeAnswer.imageUrl}
          isBusy={isActionBusy}
          questionSeconds={questionSeconds}
          timerPaused={timerPaused}
          radarRevealsByTeam={radarRevealsByTeam}
          onSelectQuestion={handleSelectQuestion}
          onResolveQuestion={handleResolveQuestion}
          onResolveDraw={handleResolveDraw}
          onSetCurrentTurn={handleSetCurrentTurn}
          onStrike={handleStrike}
          onUseTool={handleUseTool}
          onGrantExtraStrike={handleGrantExtraStrike}
          onGrantPoints={handleGrantPoints}
          onEndGameNow={handleEndGameNow}
          onDeselectQuestion={handleDeselectQuestion}
          onPauseTimer={handlePauseTimer}
          onResumeTimer={handleResumeTimer}
          onResetTimer={handleResetTimer}
          onExit={handleExitGame}
        />
        <CombatEventModal
          event={latestCombatEvent}
          onClose={() => setLatestCombatEvent(null)}
        />
      </>
    );
  }

  // Token-based (no-account) teams never reach a per-team combat screen —
  // once ready, they stay on the "waiting for the judge" card rendered by
  // the deployment view below, since the referee now runs the whole match
  // from one screen.

  // A. VIEW GATEWAY (when no team/role parameter is active as player or referee)
  if (roomId && room && !teamIndex && !role) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex flex-col justify-center items-center dir-rtl">
        <div className="max-w-xl w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl text-center">
          <div className="bg-gradient-to-tr from-cyan-500 to-sky-400 text-white p-3.5 rounded-2xl inline-block mb-6 shadow-md">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950 leading-tight">
            بوابة الدخول للتحدي
          </h2>
          <p className="text-xs text-slate-500 mt-1 pb-6 border-b border-slate-100 font-semibold">
            اختار منو أنت الحين وحدد مكانك عشان تبدأ اللعب سيدة
          </p>

          <div className="mt-8 space-y-4">
            {!(room.judge_id === user?.id) && (
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                لازم تدش برابط فريقك الخاص (فيه رمز الدخول) اللي عطاك ياه الحكم.
              </p>
            )}

            {room.judge_id === user?.id && (
              <>
                <Link
                  href={`/battle?room_id=${roomId}&role=judge`}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition-all text-right group"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-800 block">
                      دش كحكم حق المباراة (شاشة المتابعة)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      تتبع اللعب، شوف طقات الرادار وراقب المؤشرات
                    </span>
                  </div>
                  <Crown className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />
                </Link>
                <button
                  type="button"
                  onClick={handleExitGame}
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700"
                >
                  اطلع من اللعبة وسكر الغرفة
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
          <div className="max-w-[85rem] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GameLogo className="w-14 h-14 sm:w-18 sm:h-18 shrink-0" />
              <div className="text-right">
                <h1 className="font-sans font-bold text-lg text-slate-950">
                  شاشة الحكم الحية لمتابعة اللعب
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  غرفة المتابعة.. كود اللعبة: {room.id}
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
                اطلع من اللعبة
              </button>
              <Link
                href="/"
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors text-slate-600"
              >
                ارجع للرئيسية
              </Link>
              <span
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold ${"bg-amber-100 text-amber-700"}`}
              >
                ● ناطرين تجهيز الجيوش
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-[85rem] mx-auto px-4 mt-8 flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      توزيع الجنود والتموضع:
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        team1Obj?.is_ready
                          ? "bg-cyan-500 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {team1Obj?.is_ready
                        ? "✓ وزع جنوده وخلص"
                        : "○ قاعد يوزع جنوده"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      الجنود اللي بالخريطة:
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
                      رابط دخول {room.team_1_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(getTeamUrl(room.id, 1));
                        showAlert("نسخنا رابط الفريق الأول بنجاح!", "success");
                      }}
                      className="mt-2.5 text-[9px] font-bold text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-cyan-100"
                    >
                      <Share2 className="w-3 h-3" />
                      نسخ رابط الدخول
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
                      توزيع الجنود والتموضع:
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        team2Obj?.is_ready
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {team2Obj?.is_ready
                        ? "✓ وزع جنوده وخلص"
                        : "○ قاعد يوزع جنوده"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      الجنود اللي بالخريطة:
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
                      رابط دخول {room.team_2_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(getTeamUrl(room.id, 2));
                        showAlert("نسخنا رابط الفريق الثاني بنجاح!", "success");
                      }}
                      className="mt-2.5 text-[9px] font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-orange-100"
                    >
                      <Share2 className="w-3 h-3" />
                      نسخ رابط الدخول
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
                كشف إعدادات الغرفة واللعب
              </h4>

              {/* Categories listed */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-2">
                    فئات الأسئلة المفتوحة (6 فئات):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.selected_categories.map((catId, idx) => {
                      const info = categoryInfoMap.get(catId);
                      return (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200"
                        >
                          {info?.emoji || "🛡️"} {info?.name || catId}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                  الفزعات مخشوشة للحين لين يبدأ اللعب والطق.
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
    // The judge must not be able to deploy a team's board from their own
    // logged-in session — a team link is meant for that team's own device,
    // not the judge doubling as both the referee and a team.
    if (user?.id && room.judge_id && user.id === room.judge_id) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl">
          <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-lg">
            <Lock className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              افتح رابط الفريق من جهاز أو متصفح ثاني
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              إنت مسجل دخولك كحكم هذي الغرفة على هذا المتصفح — رابط توزيع الفريق
              لازم يتفتح من جهاز الفريق نفسه، مو من نفس حسابك.
            </p>
            <Link
              href="/"
              className="mt-7 block w-full rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 py-3 font-bold text-white text-xs"
            >
              ارجع للرئيسية
            </Link>
          </div>
        </div>
      );
    }

    const activeTeam = teams.find((t) => t.team_index === teamIndex);

    // Read current board (pending snapshot or team board)
    const currentBoardState = pendingBoardRef.current
      ? pendingBoardRef.current.board
      : activeTeam?.board || [];

    // Compute remaining points dynamically from STARTING_POINTS (4000)
    const totalSpentCost = (currentBoardState || []).reduce(
      (sum, unit) => sum + (unitSpecs[unit]?.cost || 0),
      0,
    );
    const remainingPoints = Math.max(0, STARTING_POINTS - totalSpentCost);

    // Compute current unit counts per type from active board
    const unitCounts = Object.keys(unitSpecs).reduce((acc, key) => {
      acc[key] = (currentBoardState || []).filter(
        (cell) => cell === key,
      ).length;
      return acc;
    }, {});

    if (!activeTeam) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700 mt-4">
              قاعدين نجهز صفحة توزيع الجنود...
            </p>
          </div>
        </div>
      );
    }

    // Once ready, the team's device has nothing left to do — the referee
    // runs the rest of the match from one screen, so we replace the whole
    // page with a static waiting card instead of the deployment UI.
    if (activeTeam.is_ready) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl text-center"
          >
            <div className="bg-gradient-to-tr from-cyan-500 to-sky-400 text-white p-4 rounded-2xl inline-block mb-6 shadow-md">
              <Crown className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-950 leading-tight">
              وزعت جنودك بنجاح، والحين الحكم هو اللي متحكم بكل حاجة
            </h2>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
              تابع اللعب من شاشة الحكم، وقول له شفهيًا أي مربع تبي تضرب أو أي
              فزعة تبي تستخدم — ما فيه أي تفاعل تاني مطلوب منك بهالجهاز.
            </p>
            <Link
              href="/"
              className="mt-7 block w-full rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 py-3 font-bold text-white text-sm"
            >
              رجوع للصفحة الرئيسية
            </Link>
          </motion.div>
        </div>
      );
    }

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
          <div className="max-w-[85rem] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GameLogo className="w-14 h-14 sm:w-18 sm:h-18 shrink-0" />
              <div className="text-right">
                <h1 className="font-sans font-bold text-base text-slate-950">
                  لوحة توزيع فريق: {activeTeam.name}
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  كود الغرفة: {room.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-bold">
                  النقاط الباقية لتسليح جنودك
                </span>
                <span className="text-base font-bold text-cyan-600">
                  {remainingPoints}ن
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
                {activeTeam.is_ready ? "✓ جاهز" : "● قاعد يوزع الجنود"}
              </span>
            </div>
          </div>
        </header>

        {/* Main board deploy area */}
        <main className="max-w-[85rem] mx-auto px-4 mt-8 flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* 6x6 Army Board Panel (Task 11) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    خريطتك وتوزيعك (6×6 مربعات)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    طق على المربع عشان تحط جندي أو تشيله
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg">
                    {(activeTeam.board || []).filter(Boolean).length} / 33
                  </div>
                  {!activeTeam.is_ready && (
                    <motion.button
                      type="button"
                      whileTap={!isAutoFilling ? { scale: 0.93 } : {}}
                      onClick={handleAutoFill}
                      disabled={isAutoFilling}
                      className={`text-xs text-white font-bold px-4 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                        isAutoFilling
                          ? "bg-slate-400 cursor-not-allowed opacity-70"
                          : "bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600"
                      }`}
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${isAutoFilling ? "animate-spin" : ""}`}
                      />
                      {isAutoFilling ? "قاعدين نحفظ..." : "توزيع عشوائي"}
                    </motion.button>
                  )}
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
                          {/* Unit Image display */}
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
                              className="flex flex-col items-center justify-center relative w-full h-full p-1"
                            >
                              <Image
                                src={UNIT_IMAGES[cell] || cellUnit.image}
                                alt={cellUnit.name}
                                width={28}
                                height={28}
                                className="w-7 h-7 sm:w-11 sm:h-11 object-contain drop-shadow-sm"
                              />
                              <span className="text-[8px] absolute bottom-0.5 text-cyan-700 font-bold tracking-tight scale-90">
                                {cellUnit.cost}ن
                              </span>
                            </motion.span>
                          ) : (
                            <span className="text-slate-300 group-hover:text-cyan-600 text-xs font-bold transition-colors">
                              {idx + 1}
                            </span>
                          )}
                        </motion.button>
                      );
                    },
                  )}
                </div>
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
                الجنود المتاحين للتوزيع
              </h3>

              <div className="grid grid-cols-1 gap-3.5">
                {Object.keys(unitSpecs).map((key) => {
                  const unit = unitSpecs[key];
                  const isSelected = selectedUnit === key;
                  const count = unitCounts[key] || 0;
                  const limit = unitLimits[key];
                  const isFull = count >= limit;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedUnit(key)}
                      disabled={activeTeam.is_ready}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-50/70 shadow-sm shadow-cyan-100 ring-2 ring-cyan-500/10"
                          : isFull
                            ? "border-rose-200 bg-rose-50/40 opacity-70"
                            : "border-slate-150 hover:bg-slate-50 hover:border-slate-250"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center shrink-0">
                          <Image
                            src={UNIT_IMAGES[key] || unit.image}
                            alt={unit.name}
                            width={32}
                            height={32}
                            className="w-7 h-7 sm:w-11 sm:h-11 object-contain"
                          />
                        </span>
                        <span className="block text-right">
                          <span className="font-bold text-xs text-slate-900 block group-hover:text-cyan-600">
                            {unit.name}
                          </span>
                          {unit.description && (
                            <span className="text-[10px] text-slate-500 block leading-tight">
                              {unit.description}
                            </span>
                          )}
                          <span
                            className={`text-[10px] leading-tight block font-bold mt-0.5 ${isFull ? "text-rose-500" : "text-slate-400"}`}
                          >
                            {count} / {limit} {isFull ? "· خلصت أعدادهم" : ""}
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
              <div className="space-y-4">
                <div className="text-right bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold leading-relaxed text-slate-500">
                  تبدأ بـ <strong className="text-slate-800">4000 نقطة</strong>{" "}
                  · الحدود: جندي (15) · مدرعة (7) · دبابة (4) · طائرة (3) ·
                  غواصة (2) · لغم (2). إذا شلت جندي ترجع لك نقاطه.
                </div>
                <motion.button
                  whileHover={!isAutoFilling ? { scale: 1.02 } : {}}
                  whileTap={!isAutoFilling ? { scale: 0.98 } : {}}
                  onClick={isAutoFilling ? undefined : handleSetTeamReady}
                  disabled={isAutoFilling}
                  className={`w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-sans font-bold text-sm py-4 rounded-2xl shadow-lg transition-opacity ${
                    isAutoFilling
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-emerald-500/25 cursor-pointer"
                  }`}
                >
                  {isAutoFilling ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      قاعدين نحفظ التوزيع...
                    </span>
                  ) : (
                    "خلصت توزيع جنودي 🛡️"
                  )}
                </motion.button>
              </div>
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
          لعبة حيلهم بينهم
        </h2>
        <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-semibold">
          يا هلا فيك! عشان تبدأ اللعب وتتحدى ربعك، لازم تسوي غرفة جديدة وتختار
          فئات الأسئلة من الصفحة الرئيسية أول شي.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/#game-setup"
            className="w-full bg-gradient-to-br from-cyan-500 to-sky-500 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all block text-center"
          >
            ← سوي غرفة جديدة وابدأ اللعب الحين
          </Link>
          <Link
            href="/"
            className="w-full bg-slate-100 hover:bg-slate-150 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all block text-center border border-slate-200"
          >
            شلون تلعب وقواعد اللعبة
          </Link>
        </div>
      </div>
    </div>
  );
}

function BattlePageLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl">
      <div className="text-center">
        <RefreshCw className="w-10 h-10 animate-spin text-cyan-600 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800 mt-4">
          قاعدين نشيك على حسابك وتصاريح الدخول...
        </h3>
      </div>
    </div>
  );
}

export default function BattlePage() {
  return (
    <Suspense fallback={<BattlePageLoading />}>
      <BattlePageInner />
    </Suspense>
  );
}
