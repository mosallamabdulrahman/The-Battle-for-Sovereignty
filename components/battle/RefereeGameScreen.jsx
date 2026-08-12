"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Flag,
  LayoutGrid,
  LogOut,
  Pause,
  PhoneCall,
  Play,
  Radar,
  RotateCcw,
  Shield,
  Star,
  ToggleRight,
  Users,
  X,
} from "lucide-react";
import { FinishedCelebration, MediaPlayer, QuestionGrid } from "./CombatShared";
import { TACTICAL_TOOL_DETAILS } from "../../lib/game-data";
import GameLogo from "../GameLogo";

const UNIT_EMOJI = {
  infantry: "👥",
  armored: "🛡️",
  tank: "🚜",
  aircraft: "✈️",
  submarine: "⛵",
  mine: "💥",
};

const UNIT_NAMES = {
  infantry: "جندي",
  armored: "مدرعة",
  tank: "دبابة",
  aircraft: "طائرة",
  submarine: "غواصة",
  mine: "لغم",
};

function TimerPill({ seconds, isPaused, onPause, onResume, onReset }) {
  const mm = String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, seconds) % 60).padStart(2, "0");
  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-full bg-slate-950 px-3.5 py-1.5 sm:px-6 sm:py-2.5 text-white shadow-2xl">
      <button
        type="button"
        onClick={onReset}
        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition active:scale-95 shrink-0"
        title="إعادة ضبط"
      >
        <RotateCcw className="w-5 h-5 sm:w-9 sm:h-9 text-slate-300" />
      </button>

      <span className="text-xl sm:text-2xl md:text-3xl tabular-nums drop-shadow-md min-w-[3.8rem] sm:min-w-[5rem] text-center tracking-wider">
        {mm}:{ss}
      </span>
      <button
        type="button"
        onClick={isPaused ? onResume : onPause}
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition active:scale-95 shrink-0"
        title={isPaused ? "تشغيل" : "إيقاف مؤقت"}
      >
        {isPaused ? (
          <Play className="w-5 h-5 sm:w-9 sm:h-9 ml-0.5 fill-white" />
        ) : (
          <Pause className="w-5 h-5 sm:w-9 sm:h-9 fill-white" />
        )}
      </button>
    </div>
  );
}

function Stepper({ value, label, onChange, disabled, tone = "slate" }) {
  const toneText = tone === "rose" ? "text-rose-600" : "text-slate-900";
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(-1)}
        className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600  text-xs flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"
      >
        −
      </button>
      <span className={`w-8 text-center text-xs  ${toneText}`}>{value}</span>
      <span className="text-[9px] font-bold text-slate-400 pl-0.5">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(1)}
        className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600  text-xs flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function TeamPillBar({ team, isBusy, onGrantPoints, onOpenStrike }) {
  const hasStrikes = team.available_strikes > 0;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Top Red Team Pill Badge */}
      <div className="w-full bg-[#a30000] text-white font-bold text-sm sm:text-base text-center p-4 sm:px-8 rounded-full shadow-sm flex items-center justify-center gap-2">
        <span className="truncate max-w-[120px]">
          {team.name || (team.team_index === 1 ? "فريق 1" : "فريق 2")}
        </span>
        {hasStrikes && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onOpenStrike(team.team_index)}
            className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse hover:bg-amber-300"
          >
            🎯 ({team.available_strikes})
          </button>
        )}
      </div>

      {/* Bottom Score Stepper Container (Matching reference screenshot) */}
      <div className="flex items-center justify-between gap-2 bg-white border-2 border-[#a30000] rounded-full p-1 shadow-sm w-full">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onGrantPoints(team.team_index, -50)}
          className="w-6 h-6 rounded-full bg-[#a30000] hover:bg-[#800000] text-white font-bold text-sm flex items-center justify-center transition disabled:opacity-40 shrink-0"
        >
          −
        </button>
        <span className="font-bold text-base sm:text-lg text-[#a30000] tabular-nums px-2">
          {team.score}
        </span>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onGrantPoints(team.team_index, 50)}
          className="w-6 h-6 rounded-full bg-[#a30000] hover:bg-[#800000] text-white font-bold text-sm flex items-center justify-center transition disabled:opacity-40 shrink-0"
        >
          +
        </button>
      </div>
    </div>
  );
}

function TeamStrikeStepper({ team, isBusy, onGrantExtraStrike }) {
  const [pending, setPending] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const commit = () => {
    if (pending === 0) return;
    onGrantExtraStrike(team.team_index, pending);
    setPending(0);
    setPopoverOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Compact trigger — a different color from the red points controls
          above it so the two are easy to tell apart at a glance. */}
      <button
        type="button"
        onClick={() => setPopoverOpen((open) => !open)}
        className="w-full rounded-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs sm:text-sm py-1.5 px-4 shadow-sm transition"
      >
        اضف طاقات زياده{pending > 0 ? ` (${pending})` : ""}
      </button>

      {popoverOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setPopoverOpen(false)}
          />
          {/* Opaque card so the grid behind it never shows through */}
          <div className="absolute bottom-full left-1/2 z-40 mb-2 w-[170px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl flex flex-col items-center gap-2">
            <div className="w-full bg-[#a30000] text-white font-bold text-xs text-center py-1 px-3 rounded-full shadow-sm">
              اضافة طقات زيادة
            </div>

            {/* One-unit +/- stepper — stages the amount locally, not sent yet */}
            <div className="flex items-center justify-between gap-2 bg-white border-2 border-[#a30000] rounded-full px-1.5 py-0.5 shadow-sm w-full">
              <button
                type="button"
                disabled={isBusy || pending <= 0}
                onClick={() => setPending((p) => Math.max(0, p - 1))}
                className="w-6 h-6 rounded-full bg-[#a30000] hover:bg-[#800000] text-white font-bold text-sm flex items-center justify-center transition disabled:opacity-40 shrink-0"
              >
                −
              </button>
              <span className="font-bold text-base text-[#a30000] tabular-nums px-2">
                {pending}
              </span>
              <button
                type="button"
                disabled={isBusy || pending >= 10}
                onClick={() => setPending((p) => Math.min(10, p + 1))}
                className="w-6 h-6 rounded-full bg-[#a30000] hover:bg-[#800000] text-white font-bold text-sm flex items-center justify-center transition disabled:opacity-40 shrink-0"
              >
                +
              </button>
            </div>

            {/* Commit button — grants the strikes and closes the popover;
                the referee screen auto-opens the strike board once
                available_strikes > 0, so no extra step is needed here. */}
            <button
              type="button"
              disabled={isBusy || pending === 0}
              onClick={commit}
              className="w-full rounded-full bg-[#a30000] hover:bg-[#800000] text-white font-bold text-xs py-1.5 shadow-sm transition disabled:opacity-40"
            >
              إضافة
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function HelperToolsSection({ team, isBusy, onOpenRadar, onUseTool }) {
  const usedTools = team.used_tools || [];
  const tools =
    team.tools && team.tools.length > 0
      ? team.tools
      : ["phone_friend", "ask_audience", "swap_question"];

  return (
    <div className="flex flex-col items-center">
      <span className="text-[11px] font-bold text-slate-700 mb-1">
        وسائل المساعدة
      </span>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {tools.map((toolId) => {
          const tool = TACTICAL_TOOL_DETAILS[toolId];
          const isUsed = usedTools.includes(toolId);
          const isRadar = toolId === "radar_scan";
          return (
            <button
              key={toolId}
              type="button"
              disabled={isBusy || isUsed}
              title={tool?.name || toolId}
              onClick={() =>
                isRadar
                  ? onOpenRadar(team.team_index)
                  : onUseTool(team.team_index, toolId, null)
              }
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-300 flex items-center justify-center transition-all shadow-sm ${
                isUsed
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-white text-slate-800 hover:border-cyan-500 hover:bg-cyan-50 hover:scale-105"
              }`}
            >
              {toolId === "phone_friend" || toolId === "phone" ? (
                <PhoneCall className="w-4 h-4 text-slate-700" />
              ) : toolId === "ask_audience" || toolId === "peace" ? (
                <Users className="w-4 h-4 text-slate-700" />
              ) : toolId === "swap_question" || toolId === "swap" ? (
                <RotateCcw className="w-4 h-4 text-slate-700" />
              ) : toolId === "shield" ? (
                <Shield className="w-4 h-4 text-slate-700" />
              ) : isRadar ? (
                <Radar className="w-4 h-4 text-slate-700" />
              ) : (
                <Star className="w-4 h-4 text-slate-700" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GameBottomFooter({
  team1,
  team2,
  isBusy,
  onOpenRadar,
  onOpenStrike,
  onUseTool,
  onGrantPoints,
  onGrantExtraStrike,
}) {
  return (
    <div className="w-full mt-4 sm:mt-8 bg-[#e2e8f0] p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Team 1 Section (Right side in RTL) */}
      <div className="flex items-center gap-3 sm:gap-4 flex-row-reverse flex-wrap justify-center md:justify-start">
        <div className="flex flex-col items-center gap-2 w-[130px] sm:w-[150px]">
          <TeamPillBar
            team={team1}
            isBusy={isBusy}
            onGrantPoints={onGrantPoints}
            onOpenStrike={onOpenStrike}
          />
        </div>
        <div className="flex flex-col gap-2">
          <HelperToolsSection
            team={team1}
            isBusy={isBusy}
            onOpenRadar={onOpenRadar}
            onUseTool={onUseTool}
          />
          <TeamStrikeStepper
            team={team1}
            isBusy={isBusy}
            onGrantExtraStrike={onGrantExtraStrike}
          />
        </div>
      </div>

      {/* Center Logo Section */}
      <div className="flex flex-col items-center justify-center shrink-0 px-2 hidden sm:block">
        <GameLogo className="w-22 h-22 " />
      </div>

      {/* Team 2 Section (Left side in RTL) */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center md:justify-end">
        <div className="flex flex-col gap-2">
          <HelperToolsSection
            team={team2}
            isBusy={isBusy}
            onOpenRadar={onOpenRadar}
            onUseTool={onUseTool}
          />
          <TeamStrikeStepper
            team={team2}
            isBusy={isBusy}
            onGrantExtraStrike={onGrantExtraStrike}
          />
        </div>
        <div className="flex flex-col items-center gap-2 w-[130px] sm:w-[150px]">
          <TeamPillBar
            team={team2}
            isBusy={isBusy}
            onGrantPoints={onGrantPoints}
            onOpenStrike={onOpenStrike}
          />
        </div>
      </div>
    </div>
  );
}

function TeamToolsCard({ team, isBusy, onOpenRadar, onOpenStrike, onUseTool }) {
  const usedTools = team.used_tools || [];
  const hasStrikes = team.available_strikes > 0;
  const tools =
    team.tools && team.tools.length > 0
      ? team.tools
      : ["phone_friend", "ask_audience", "swap_question"];

  return (
    <div className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-3xl border border-slate-200 shadow-sm w-full text h-fit-center">
      {/* Team Red Pill Badge */}
      <div className="w-full bg-[#a30000] text-white font-bold text-sm sm:text-base py-1.5 px-4 rounded-full shadow-sm text-center truncate">
        {team.name ||
          (team.team_index === 1 ? "الفريق الأول" : "الفريق الثاني")}
      </div>

      {/* Current Score */}
      <span className="font-bold text-2xl text-[#a30000] tabular-nums">
        {team.score}
      </span>

      {/* Helper Tools Title */}
      <span className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
        وسائل المساعدة
      </span>

      {/* Helper Tools Icons */}
      <div className="flex items-center gap-2">
        {tools.map((toolId) => {
          const tool = TACTICAL_TOOL_DETAILS[toolId];
          const isUsed = usedTools.includes(toolId);
          const isRadar = toolId === "radar_scan";
          return (
            <button
              key={toolId}
              type="button"
              disabled={isBusy || isUsed}
              title={tool?.name || toolId}
              onClick={() =>
                isRadar
                  ? onOpenRadar(team.team_index)
                  : onUseTool(team.team_index, toolId, null)
              }
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-400 flex items-center justify-center transition-all shadow-sm ${
                isUsed
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300"
                  : "bg-white text-slate-800 hover:border-cyan-500 hover:bg-cyan-50 hover:scale-105"
              }`}
            >
              {toolId === "phone_friend" || toolId === "phone" ? (
                <PhoneCall className="w-4 h-4 text-slate-700" />
              ) : toolId === "ask_audience" || toolId === "peace" ? (
                <Users className="w-4 h-4 text-slate-700" />
              ) : toolId === "swap_question" || toolId === "swap" ? (
                <RotateCcw className="w-4 h-4 text-slate-700" />
              ) : toolId === "shield" ? (
                <Shield className="w-4 h-4 text-slate-700" />
              ) : isRadar ? (
                <Radar className="w-4 h-4 text-slate-700" />
              ) : (
                <Star className="w-4 h-4 text-slate-700" />
              )}
            </button>
          );
        })}
      </div>

      {/* Strike Action Button */}
      {hasStrikes && (
        <motion.button
          type="button"
          disabled={isBusy}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.1 }}
          onClick={() => onOpenStrike(team.team_index)}
          className="mt-1 rounded-full bg-amber-400 text-slate-950 px-4 py-1 text-xs font-bold shadow hover:bg-amber-300 transition"
        >
          🎯 اضرب الآن ({team.available_strikes})
        </motion.button>
      )}
    </div>
  );
}

function BoardModal({
  title,
  subtitle,
  onClose,
  dismissible = true,
  children,
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 p-4 dir-rtl"
      onClick={dismissible ? onClose : undefined}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className=" text-slate-950">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/70 p-4 dir-rtl"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-950">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-bold text-slate-700 mb-5">{message}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border-2 border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              تكملة
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-rose-700 hover:bg-rose-800 py-2.5 text-sm font-bold text-white transition"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function RefereeGameScreen({
  room,
  teams,
  questions,
  events,
  answerText,
  answerImageUrl,
  isBusy,
  questionSeconds,
  timerPaused,
  radarCells,
  radarForTeam,
  onSelectQuestion,
  onResolveQuestion,
  onResolveDraw,
  onSetCurrentTurn,
  onStrike,
  onUseTool,
  onGrantPoints,
  onGrantExtraStrike,
  onClearRadar,
  onEndGameNow,
  onDeselectQuestion,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onExit,
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [teamSelectOpen, setTeamSelectOpen] = useState(false);
  const [forceGridView, setForceGridView] = useState(false);
  const [lastQuestionId, setLastQuestionId] = useState(room.active_question_id);
  const [radarModalTeam, setRadarModalTeam] = useState(null);
  const [strikeModalTeam, setStrikeModalTeam] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // null | "end" | "exit"

  const activeQuestion = questions.find(
    (question) => question.id === room.active_question_id,
  );
  const team1 = teams.find((t) => t.team_index === 1);
  const team2 = teams.find((t) => t.team_index === 2);
  const currentTeam = teams.find((t) => t.team_index === room.current_turn);

  // Reset the answer/team-select flow whenever the active question changes —
  // adjusted during render (not an effect) since it's derived purely from a prop.
  if (room.active_question_id !== lastQuestionId) {
    setLastQuestionId(room.active_question_id);
    setShowAnswer(false);
    setTeamSelectOpen(false);
    setForceGridView(false);
  }

  // A team with pending strikes always takes over the strike modal —
  // referee cannot proceed until it's used up (auto-opens, auto-switches
  // between teams if both have strikes pending, auto-closes when done).
  // Once the game has actually finished, leftover strikes no longer matter —
  // otherwise the modal would keep blocking the finished screen forever.
  const teamsWithStrikes =
    room.status === "playing"
      ? teams.filter((t) => t.available_strikes > 0)
      : [];
  const strikeModalTeamStillPending = teamsWithStrikes.some(
    (t) => t.team_index === strikeModalTeam,
  );
  if (teamsWithStrikes.length > 0 && !strikeModalTeamStillPending) {
    if (strikeModalTeam !== teamsWithStrikes[0].team_index) {
      setStrikeModalTeam(teamsWithStrikes[0].team_index);
    }
  } else if (teamsWithStrikes.length === 0 && strikeModalTeam !== null) {
    setStrikeModalTeam(null);
  }

  const step = teamSelectOpen
    ? "select-winner"
    : showAnswer
      ? "answer"
      : activeQuestion && !forceGridView
        ? "question"
        : "grid";

  const radarRevealMap =
    radarCells && radarCells.length > 0
      ? new Map(radarCells.map((cell) => [cell.cell_index, cell.unit_type]))
      : null;
  const radarResultReady =
    radarModalTeam && radarForTeam === radarModalTeam && radarRevealMap;

  const handleCloseRadar = () => {
    setRadarModalTeam(null);
    onClearRadar?.();
  };

  const handlePickWinner = (choice) => {
    if (choice === "draw") return onResolveDraw(activeQuestion.id);
    if (choice === "none") return onResolveQuestion(activeQuestion.id, null);
    return onResolveQuestion(activeQuestion.id, choice);
  };

  const strikeAttacker = teams.find((t) => t.team_index === strikeModalTeam);
  const strikeTarget = teams.find((t) => t.team_index !== strikeModalTeam);
  const strikeEvents = strikeTarget
    ? events.filter(
        (event) =>
          event.event_type === "strike" &&
          event.target_team_index === strikeTarget.team_index,
      )
    : [];
  const strikeCellResults = new Map(
    strikeEvents.map((event) => [event.cell_index, event.result]),
  );
  const strikeCellUnits = new Map(
    strikeEvents.map((event) => [event.cell_index, event.unit_type]),
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col gap-4 dir-rtl">
      <header className="bg-gradient-to-l from-cyan-800 via-cyan-700 to-cyan-600 shadow-lg">
        <div className="max-w-[98rem] mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <GameLogo className="w-14 h-14 sm:w-18 sm:h-18 shrink-0" />

            <button
              type="button"
              disabled={isBusy || room.status !== "playing"}
              onClick={() =>
                onSetCurrentTurn(currentTeam?.team_index === 1 ? 2 : 1)
              }
              className="rounded-full bg-cyan-950/70 border border-white/20 px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-bold text-white shadow-inner flex items-center gap-1.5 hover:bg-cyan-950/90 transition disabled:opacity-60"
            >
              <span className="whitespace-nowrap">دور فريق :</span>
              <span className="text-amber-300 font-bold truncate max-w-[100px] sm:max-w-[160px]">
                {currentTeam?.name || "—"}
              </span>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center min-w-[120px] order-3 md:order-2 w-full md:w-auto mt-1 md:mt-0">
            <span className="text-lg sm:text-xl font-bold text-white/95 tracking-wide drop-shadow-sm text-center truncate max-w-[240px] sm:max-w-none">
              {room.game_name || "تجربة اللعبه"}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 text-white font-bold text-xs sm:text-sm shrink-0 order-2 md:order-3">
            <button
              type="button"
              onClick={() => setConfirmAction("end")}
              disabled={isBusy || room.status !== "playing"}
              className="inline-flex items-center gap-1.5 hover:text-amber-200 transition disabled:opacity-50"
            >
              <Flag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white shrink-0" />
              <span className="whitespace-nowrap">انتهاء اللعبة</span>
            </button>

            {step !== "grid" && (
              <button
                type="button"
                onClick={() => {
                  setShowAnswer(false);
                  setTeamSelectOpen(false);
                  setForceGridView(true);
                  if (activeQuestion) onDeselectQuestion(activeQuestion.id);
                }}
                className="inline-flex items-center gap-1.5 hover:text-cyan-200 transition"
              >
                <LayoutGrid className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white shrink-0" />
                <span className="whitespace-nowrap">الرجوع للوحة</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setConfirmAction("exit")}
              className="inline-flex items-center gap-1.5 hover:text-rose-200 transition"
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white shrink-0" />
              <span className="whitespace-nowrap">الخروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-4 mt-4">
        {room.status === "finished" ? (
          <FinishedCelebration room={room} teams={teams} onExit={onExit} />
        ) : step === "grid" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <QuestionGrid
                questions={questions}
                activeQuestionId={room.active_question_id}
                disabled={
                  room.status !== "playing" ||
                  teams.some((team) => team.available_strikes > 0)
                }
                onSelect={onSelectQuestion}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 lg:gap-12 mt-6">
            {team1 && team2 && (
              <div className="md:col-span-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                <TeamToolsCard
                  team={team1}
                  isBusy={isBusy}
                  onOpenRadar={setRadarModalTeam}
                  onOpenStrike={setStrikeModalTeam}
                  onUseTool={onUseTool}
                />
                <TeamToolsCard
                  team={team2}
                  isBusy={isBusy}
                  onOpenRadar={setRadarModalTeam}
                  onOpenStrike={setStrikeModalTeam}
                  onUseTool={onUseTool}
                />
              </div>
            )}

            <div className="md:col-span-3 w-full">
              <AnimatePresence mode="wait">
                {step === "question" && activeQuestion && (
                  <motion.div
                    key="question"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    className="relative mx-auto rounded-[2rem] sm:rounded-[2.5rem] border-4 border-cyan-500 bg-white p-4 sm:p-10 md:px-12 text-center shadow-2xl"
                  >
                    {/* Top Center: TimerPill on top border */}
                    <div className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2 z-20 shrink-0">
                      <TimerPill
                        seconds={questionSeconds}
                        isPaused={timerPaused}
                        onPause={onPauseTimer}
                        onResume={onResumeTimer}
                        onReset={onResetTimer}
                      />
                    </div>

                    {/* Top Right: Points badge */}
                    <span className="absolute -top-4 sm:-top-5 right-3 sm:right-6 md:right-8 z-20 rounded-xl bg-slate-950 px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm md:text-base font-bold text-white shadow-lg">
                      {activeQuestion.points} نقطة
                    </span>

                    <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-950 leading-relaxed px-2">
                      {activeQuestion.question_text}
                    </h2>
                    <MediaPlayer
                      mediaUrl={activeQuestion.media_url}
                      mediaType={activeQuestion.media_type}
                    />

                    {/* Bottom Right: Category badge */}
                    <span className="absolute -bottom-4 sm:-bottom-5 right-3 sm:right-6 md:right-8 z-20 rounded-xl bg-rose-500 px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-lg">
                      {activeQuestion.category_name}
                    </span>

                    {/* Bottom Left: Show Answer button */}
                    <button
                      type="button"
                      onClick={() => setShowAnswer(true)}
                      className="absolute -bottom-4 sm:-bottom-5 left-3 sm:left-6 md:left-8 z-20 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 px-4 py-2 sm:px-7 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition"
                    >
                      إظهار الإجابة
                    </button>
                  </motion.div>
                )}

                {step === "answer" && activeQuestion && (
                  <motion.div
                    key="answer"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    className="relative mx-auto rounded-[2rem] sm:rounded-[2.5rem] border-4 border-emerald-500 bg-white p-4 sm:p-10 md:px-12 text-center shadow-2xl"
                  >
                    <div className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
                      {answerText || "قاعدين نحمل الإجابة..."}
                      {answerImageUrl && (
                        <img
                          src={answerImageUrl}
                          alt="صورة الإجابة"
                          className="mt-4 max-h-64 w-full object-contain rounded-xl mx-auto"
                        />
                      )}
                    </div>

                    {/* Bottom Right: Return to Question button (was the category label spot) */}
                    <button
                      type="button"
                      onClick={() => setShowAnswer(false)}
                      className="absolute -bottom-4 sm:-bottom-5 right-3 sm:right-6 md:right-8 z-20 rounded-xl px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl transition active:scale-95 disabled:opacity-60 bg-red-800 hover:bg-red-900"
                    >
                      ارجع للسؤال
                    </button>

                    {/* Bottom Left: Which team? */}
                    <button
                      type="button"
                      onClick={() => setTeamSelectOpen(true)}
                      className="absolute -bottom-4 sm:-bottom-5 left-3 sm:left-6 md:left-8 z-20 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-3.5 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-lg transition active:scale-95"
                    >
                      أي فريق؟
                    </button>
                  </motion.div>
                )}

                {step === "select-winner" && activeQuestion && (
                  <motion.div
                    key="select-winner"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    className="relative mx-auto rounded-[2rem] sm:rounded-[2.5rem] border-4 border-rose-500 bg-white pt-10 sm:pt-14 pb-14 sm:pb-16 px-6 sm:px-12 text-center shadow-2xl"
                  >
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-950 mb-8 sm:mb-10">
                      أي فريق جاوب صح ؟
                    </h2>

                    <div className="max-w-xl mx-auto flex flex-col gap-4 sm:gap-5">
                      <div className="grid grid-cols-2 gap-4 sm:gap-6">
                        {teams.map((team) => (
                          <button
                            key={team.id}
                            type="button"
                            disabled={isBusy}
                            onClick={() => handlePickWinner(team.team_index)}
                            className={`rounded-full py-4 sm:py-5 px-4 text-sm sm:text-lg font-bold text-white shadow-lg hover:shadow-xl transition active:scale-95 disabled:opacity-60 ${
                              team.team_index === 1
                                ? "bg-red-800 hover:bg-red-900"
                                : "bg-red-800 hover:bg-red-900"
                            }`}
                          >
                            {team.name}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handlePickWinner("none")}
                        className="w-full rounded-full bg-slate-500 hover:bg-slate-600 py-4 sm:py-5 text-sm sm:text-lg font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60"
                      >
                        ولا أحد
                      </button>
                    </div>

                    {/* Bottom Left: Back to answer */}
                    <button
                      type="button"
                      onClick={() => setTeamSelectOpen(false)}
                      className="absolute -bottom-4 sm:-bottom-5 left-4 sm:left-8 z-20 rounded-full bg-emerald-900 hover:bg-emerald-950 px-5 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition active:scale-95"
                    >
                      العودة للإجابة
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
      <AnimatePresence>
        {room.status === "playing" && step === "grid" && team1 && team2 && (
          <motion.div
            key="footer"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
          >
            <GameBottomFooter
              team1={team1}
              team2={team2}
              isBusy={isBusy}
              onOpenRadar={setRadarModalTeam}
              onOpenStrike={setStrikeModalTeam}
              onUseTool={onUseTool}
              onGrantPoints={onGrantPoints}
              onGrantExtraStrike={onGrantExtraStrike}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {radarModalTeam && (
        <BoardModal
          title={`رادار ${teams.find((t) => t.team_index === radarModalTeam)?.name}`}
          subtitle={
            radarResultReady
              ? "المربعات اللي اتكشفت"
              : "دوس المربع اللي تبي تمسحه"
          }
          onClose={handleCloseRadar}
        >
          {!radarResultReady ? (
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 36 }, (_, cellIndex) => (
                <button
                  key={cellIndex}
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    onUseTool(radarModalTeam, "radar_scan", cellIndex)
                  }
                  className="aspect-square rounded-lg border border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-500 hover:bg-amber-50 hover:border-amber-400"
                >
                  {cellIndex + 1}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: 36 }, (_, cellIndex) => {
                  const hasReveal = radarRevealMap.has(cellIndex);
                  const unit = radarRevealMap.get(cellIndex);
                  return (
                    <div
                      key={cellIndex}
                      className={`aspect-square rounded-lg border flex items-center justify-center text-sm font-bold ${
                        hasReveal
                          ? unit
                            ? "border-amber-400 bg-amber-100"
                            : "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-slate-100 text-slate-300"
                      }`}
                    >
                      {hasReveal ? (unit ? UNIT_EMOJI[unit] || "●" : "○") : ""}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleCloseRadar}
                className="mt-4 w-full rounded-2xl bg-slate-950 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                إغلاق
              </button>
            </>
          )}
        </BoardModal>
      )}

      {strikeModalTeam && strikeAttacker && strikeTarget && (
        <BoardModal
          title={`ضرب خريطة ${strikeTarget.name}`}
          subtitle={`عند ${strikeAttacker.name} ${strikeAttacker.available_strikes} ${strikeAttacker.available_strikes === 1 ? "طقة" : "طقات"} متاحة`}
          dismissible={strikeAttacker.available_strikes <= 0}
          onClose={() => setStrikeModalTeam(null)}
        >
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 36 }, (_, cellIndex) => {
              const result = strikeCellResults.get(cellIndex);
              const hitUnit = strikeCellUnits.get(cellIndex);
              const canClick =
                !isBusy && !result && strikeAttacker.available_strikes > 0;
              return (
                <button
                  key={cellIndex}
                  type="button"
                  disabled={!canClick}
                  onClick={() => onStrike(strikeModalTeam, cellIndex)}
                  title={
                    result === "hit"
                      ? UNIT_NAMES[hitUnit] || hitUnit || "أصبت"
                      : undefined
                  }
                  className={`relative aspect-square rounded-lg border text-[10px] font-bold transition-all ${
                    result === "hit"
                      ? "border-rose-500 bg-rose-500 text-white"
                      : result === "miss"
                        ? "border-slate-400 bg-slate-300 text-slate-700"
                        : result === "mine"
                          ? "border-amber-500 bg-amber-400 text-slate-950"
                          : result === "blocked"
                            ? "border-cyan-500 bg-cyan-500 text-white"
                            : canClick
                              ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-rose-800 hover:border-rose-500"
                              : "border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  {result === "hit" ? (
                    <>
                      <span className="text-xl sm:text-2xl leading-none opacity-90">
                        {UNIT_EMOJI[hitUnit] || "❓"}
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <X className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3.5] text-slate-950 drop-shadow-sm" />
                      </span>
                    </>
                  ) : result === "miss" ? (
                    "○"
                  ) : result === "mine" ? (
                    "💥"
                  ) : result === "blocked" ? (
                    "🛡"
                  ) : (
                    cellIndex + 1
                  )}
                </button>
              );
            })}
          </div>
          {strikeTarget.shield_active && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-cyan-700">
              <Shield className="h-3.5 w-3.5" />
              {strikeTarget.name} مشغل الدرع
            </p>
          )}
          {strikeAttacker.available_strikes <= 0 && (
            <p className="mt-3 text-center text-[11px] font-bold text-slate-400">
              خلصت الطقات المتاحة
            </p>
          )}
        </BoardModal>
      )}

      {confirmAction === "end" && (
        <ConfirmModal
          title="إنهاء اللعبة"
          message="هل تريد إنهاء اللعبة؟"
          confirmLabel="إنهاء اللعبة"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            setConfirmAction(null);
            onEndGameNow();
          }}
        />
      )}

      {confirmAction === "exit" && (
        <ConfirmModal
          title="خروج"
          message="هل تريد الخروج من اللعبة ؟"
          confirmLabel="خروج"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            setConfirmAction(null);
            onExit();
          }}
        />
      )}
    </div>
  );
}
