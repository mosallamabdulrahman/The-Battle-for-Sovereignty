"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Lock,
  LogOut,
  Radar,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { LIFELINE_TOOLS, TACTICAL_TOOL_DETAILS } from "../../lib/game-data";
import {
  CircularTimer,
  DIFFICULTY_STRIKE_LABEL,
  FinishedCelebration,
  MediaPlayer,
} from "./CombatShared";
import GameLogo from "../GameLogo";

export function TeamCombatDashboard({
  room,
  activeTeam,
  opponentTeam,
  questions,
  events,
  radarCells,
  radarMode,
  activeRadarTool,
  isBusy,
  questionSeconds,
  lifelineActive,
  lifelineSeconds,
  doubleChanceActive,
  holeActive,
  holeConfirmPending,
  onSelectQuestion,
  onStrike,
  onUseTool,
  onToggleRadar,
  onDismissLifeline,
  onConfirmHole,
  onCancelHole,
  onExit,
  onSoftExit,
}) {
  const [handledWinEventId, setHandledWinEventId] = useState(null);
  const [handledGrantEventId, setHandledGrantEventId] = useState(null);
  // Disconnect modal: dismiss collapses to a small banner
  const [disconnectDismissed, setDisconnectDismissed] = useState(false);
  // Exit confirmation dialog
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const activeQuestion = questions.find(
    (question) => question.id === room.active_question_id,
  );

  // Detect latest win event for this team
  const latestWinEvent = events.find(
    (e) =>
      e.event_type === "question_resolved" &&
      e.actor_team_index === activeTeam.team_index,
  );
  const showWinModal =
    latestWinEvent &&
    latestWinEvent.id !== handledWinEventId &&
    !room.active_question_id &&
    room.status === "playing" &&
    activeTeam.available_strikes > 0;

  // Detect referee-granted strikes for this team
  const latestGrantEvent = events.find(
    (e) =>
      e.event_type === "strikes_granted" &&
      e.actor_team_index === activeTeam.team_index,
  );
  const showGrantModal =
    latestGrantEvent &&
    latestGrantEvent.id !== handledGrantEventId &&
    room.status === "playing";

  // Opponent disconnect detection
  const opponentDisconnected =
    opponentTeam.joined === false && room.status === "playing";

  const usedTools = activeTeam.used_tools || [];
  const strikeEvents = events.filter(
    (event) =>
      event.event_type === "strike" &&
      event.target_team_index === opponentTeam.team_index,
  );
  const cellResults = new Map(
    strikeEvents.map((event) => [event.cell_index, event.result]),
  );
  const radarMap = new Map(
    (radarCells || []).map((cell) => [cell.cell_index, cell.occupied]),
  );
  const usedQuestionsCount = questions.filter(
    (question) => question.is_used,
  ).length;
  const totalQuestions = questions.length;
  const availableTools = Array.from(
    new Set([...(activeTeam.tools || []), ...LIFELINE_TOOLS]),
  );
  const canChooseQuestion =
    room.status === "playing" &&
    room.current_turn === activeTeam.team_index &&
    !room.active_question_id &&
    activeTeam.available_strikes === 0 &&
    opponentTeam.available_strikes === 0;

  return (
    <div className="min-h-screen bg-slate-100 pb-16 dir-rtl">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[85rem] mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="">
              <GameLogo className="w-16 h-16" />
            </div>
            <div>
              <h1 className="font-bold text-slate-950">{activeTeam.name}</h1>
              <p className="text-[10px] text-slate-500">
                النتيجة {activeTeam.score} · الطقات المتاحة{" "}
                {activeTeam.available_strikes}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            اطلع من اللعبة
          </button>
        </div>
      </header>

      {/* ── Exit Confirmation ── */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            key="exit-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-7 text-center text-white shadow-2xl"
            >
              <LogOut className="w-10 h-10 mx-auto text-rose-400 mb-3" />
              <h2 className="text-lg font-bold">تبي تطلع من اللعبة؟</h2>
              <p className="mt-2 text-sm text-slate-400">
                راح نبلغ الفريق الثاني والحكم إنك طلعت. تقدر ترجع بأي وقت.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    onSoftExit?.();
                  }}
                  className="rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-500 transition"
                >
                  أطلع
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="rounded-2xl bg-slate-700 py-3 text-sm font-bold text-white hover:bg-slate-600 transition"
                >
                  أقعد
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Win Modal: Use strikes on enemy map ── */}
      <AnimatePresence>
        {showWinModal && (
          <motion.div
            key="win-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900 border border-amber-500/40 p-7 text-center text-white shadow-2xl"
            >
              <div className="text-4xl mb-3">⚔️</div>
              <h2 className="text-xl font-bold text-amber-300">جاوبت صح!</h2>
              <p className="mt-2 text-sm text-slate-300">
                عندك{" "}
                <strong className="text-amber-300">
                  {activeTeam.available_strikes}
                </strong>{" "}
                {activeTeam.available_strikes === 1 ? "طقة" : "طقات"} — طق مربع
                بخريطة الخصم تحت.
              </p>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setHandledWinEventId(latestWinEvent?.id)}
                className="mt-6 w-full rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-500 transition disabled:opacity-60"
              >
                يلا — هجوم!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Referee Granted Strikes Modal ── */}
      <AnimatePresence>
        {showGrantModal && (
          <motion.div
            key="grant-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 border border-emerald-500/40 p-7 text-center text-white shadow-2xl"
            >
              <div className="text-5xl mb-3">⚡</div>
              <h2 className="text-xl font-bold text-emerald-300">
                الحكم عطاك طقات زيادة!
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                الحكم زادك{" "}
                <strong className="text-emerald-300 text-lg">
                  {latestGrantEvent?.metadata?.count === 1
                    ? "طقة وحدة"
                    : latestGrantEvent?.metadata?.count === 2
                      ? "طقتين"
                      : `${latestGrantEvent?.metadata?.count} طقات`}
                </strong>{" "}
                — طق الخصم الحين!
              </p>
              <p className="mt-2 text-xs text-slate-400">
                رصيدك الحالي:{" "}
                <strong className="text-white">
                  {activeTeam.available_strikes}
                </strong>{" "}
                {activeTeam.available_strikes === 1 ? "طقة" : "طقات"}
              </p>
              <button
                type="button"
                onClick={() => setHandledGrantEventId(latestGrantEvent?.id)}
                className="mt-6 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition"
              >
                يلا — هجوم! ⚔️
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Opponent Disconnect Modal ── */}
      <AnimatePresence>
        {opponentDisconnected && !disconnectDismissed && (
          <motion.div
            key="disconnect-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/40 p-7 text-center text-white shadow-2xl"
            >
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="text-lg font-bold text-amber-300">
                {opponentTeam.name} طلع من اللعبة
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                تقدر تنطره لين يرجع، أو تسكر اللعبة.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDisconnectDismissed(true)}
                  className="rounded-2xl bg-slate-700 py-3 text-sm font-bold text-white hover:bg-slate-600 transition"
                >
                  انطره يرجع
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-500 transition"
                >
                  أطلع من اللعبة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Small banner when disconnect dismissed but opponent still offline */}
      {opponentDisconnected && disconnectDismissed && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-center text-xs font-bold text-amber-800">
          {opponentTeam.name} مو داش الغرفة الحين —{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setDisconnectDismissed(false)}
          >
            أطلع من اللعبة
          </button>
        </div>
      )}

      {holeConfirmPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-red-500 bg-slate-900 p-8 text-center text-white shadow-2xl"
          >
            <p className="text-4xl mb-3">تحذير</p>
            <h2 className="text-xl font-bold text-amber-300">الحفرة اشتغلت!</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              اختار سؤالك الحين. إذا جاوبت صح تاخذ طقة زيادة. وإذا جاوبت غلط
              تروح عليك الفزعة.
            </p>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onConfirmHole}
                className="rounded-2xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500"
              >
                شغل الحفرة وابدأ
              </button>
              <button
                type="button"
                onClick={onCancelHole}
                className="rounded-2xl bg-slate-700 py-3 text-sm font-bold text-white transition hover:bg-slate-600"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <main className="max-w-[85rem] mx-auto px-4 mt-6 space-y-6">
        {/* ── Layout: Active question/alerts (top) + Two-column maps + Power-ups ── */}

        {room.status === "finished" && (
          <FinishedCelebration
            room={room}
            teams={[activeTeam, opponentTeam]}
            activeTeam={activeTeam}
            opponentTeam={opponentTeam}
            onExit={onExit}
          />
        )}

        {holeActive && (
          <div className="rounded-2xl border border-red-400 bg-red-900 px-5 py-3 text-center text-sm font-bold text-white animate-pulse">
            تحذير: الحفرة شغال الحين — اختار سؤالك
          </div>
        )}

        {lifelineActive && (
          <CircularTimer
            seconds={lifelineSeconds}
            label="قاعدين نتصل بصديق الحين"
            onDismiss={onDismissLifeline}
          />
        )}

        {/* Active question */}
        <AnimatePresence mode="wait">
          {activeQuestion && (
            <motion.div
              key={activeQuestion.id}
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="rounded-3xl border-2 border-cyan-300 bg-white p-6 shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
                  {activeQuestion.category_name}
                </span>
                <span className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                  {DIFFICULTY_STRIKE_LABEL[activeQuestion.difficulty] ||
                    activeQuestion.difficulty}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-950 leading-relaxed">
                {activeQuestion.question_text}
              </h2>
              <MediaPlayer
                mediaUrl={activeQuestion.media_url}
                mediaType={activeQuestion.media_type}
              />
              <div className="mt-4">
                <CircularTimer seconds={questionSeconds} label="مؤقت السؤال" />
              </div>
              {doubleChanceActive && (
                <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-amber-400 bg-amber-50 px-5 py-3">
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-y-0 w-24 bg-white/50 blur-md"
                    initial={{ right: "-35%" }}
                    animate={{ right: ["-35%", "115%"] }}
                    transition={{
                      duration: 1.7,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="relative z-10 text-sm font-bold text-amber-800">
                    عندك فرصتين عشان تجاوب — قول حق الحكم
                  </span>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-400">
                قول حق الحكم إجابتك — الإجابة الصح ما تطلع هني
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTeam.available_strikes > 0 && room.status === "playing" && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3 flex items-center gap-3">
            <Target className="h-5 w-5 text-rose-600 shrink-0" />
            <p className="font-bold text-rose-900 text-sm">
              عندك {activeTeam.available_strikes} طقة — اختار مربع بخريطة{" "}
              {opponentTeam.name} أدناه
            </p>
          </div>
        )}

        {/* Maps row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Opponent map */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-950">
                  خريطة {opponentTeam.name}
                </h2>
                <p className="text-[10px] text-slate-500">
                  {radarMode
                    ? "اختار وين تبي تمسح بالرادار"
                    : "طق على المربع عشان تطق"}
                </p>
              </div>
              <Target className="h-5 w-5 text-rose-500" />
            </div>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 36 }, (_, cellIndex) => {
                const result = cellResults.get(cellIndex);
                const radarOccupied = radarMap.get(cellIndex);
                return (
                  <button
                    key={cellIndex}
                    type="button"
                    disabled={
                      isBusy ||
                      room.status !== "playing" ||
                      (!radarMode && activeTeam.available_strikes <= 0) ||
                      Boolean(result && result !== "blocked")
                    }
                    onClick={() =>
                      radarMode
                        ? onUseTool(activeRadarTool || "radar_scan", cellIndex)
                        : onStrike(cellIndex)
                    }
                    className={`aspect-square rounded-lg border text-[10px] font-bold transition-all ${
                      result === "hit"
                        ? "border-rose-500 bg-rose-500 text-white"
                        : result === "miss"
                          ? "border-slate-400 bg-slate-300 text-slate-700"
                          : result === "mine"
                            ? "border-amber-500 bg-amber-400 text-slate-950"
                            : result === "blocked"
                              ? "border-cyan-500 bg-cyan-500 text-white"
                              : radarOccupied === true
                                ? "border-amber-400 bg-amber-100 text-amber-800"
                                : radarOccupied === false
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : activeTeam.available_strikes > 0
                                    ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-rose-800 hover:border-rose-500 cursor-pointer"
                                    : "border-slate-300 bg-slate-800 text-slate-500"
                    }`}
                  >
                    {result === "hit"
                      ? "✕"
                      : result === "miss"
                        ? "○"
                        : result === "mine"
                          ? "💥"
                          : result === "blocked"
                            ? "🛡"
                            : radarOccupied === true
                              ? "●"
                              : radarOccupied === false
                                ? "○"
                                : cellIndex + 1}
                  </button>
                );
              })}
            </div>
            {opponentTeam.shield_active && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-cyan-700">
                <Shield className="h-3.5 w-3.5" />
                الخصم مشغل الدرع
              </p>
            )}
          </section>

          {/* Tactical tools */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-950">الفزعات المتاحة</h2>
            <p className="text-[10px] text-slate-500 mt-1">
              كل فزعة تقدر تستخدمها مرة وحدة باللعبة.
            </p>
            <div className="mt-4 space-y-2.5">
              {availableTools.map((toolId) => {
                const tool = TACTICAL_TOOL_DETAILS[toolId];
                const isUsed = usedTools.includes(toolId);
                const isRadarLike =
                  toolId === "radar_scan" || toolId === "the_detector";
                const isDetector = toolId === "the_detector";
                const detectorLocked =
                  isDetector && usedQuestionsCount < totalQuestions / 2;
                const isOwnTurn = room.current_turn === activeTeam.team_index;
                const needsActiveQuestion =
                  toolId === "lifeline_call" || toolId === "double_chance";
                const needsNoActiveQuestion = toolId === "the_hole";
                const isExtraStrike = toolId === "extra_strike";
                const disabledByTiming =
                  !isOwnTurn ||
                  (needsActiveQuestion && !room.active_question_id) ||
                  (needsNoActiveQuestion && Boolean(room.active_question_id)) ||
                  (isExtraStrike && activeTeam.available_strikes <= 0);
                const isDisabled =
                  isBusy ||
                  isUsed ||
                  room.status !== "playing" ||
                  detectorLocked ||
                  disabledByTiming ||
                  (lifelineActive && toolId === "lifeline_call");
                const isActiveRadar = radarMode && activeRadarTool === toolId;
                return (
                  <button
                    key={toolId}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isRadarLike) return onToggleRadar(toolId);
                      return onUseTool(toolId, null);
                    }}
                    className={`w-full rounded-2xl border p-3.5 text-right transition-all ${
                      isUsed
                        ? "border-slate-200 bg-slate-100 text-slate-400"
                        : detectorLocked
                          ? "border-slate-200 bg-slate-50 text-slate-400"
                          : isActiveRadar
                            ? "border-amber-400 bg-amber-100 text-amber-900"
                            : "border-cyan-200 bg-cyan-50 text-cyan-900 hover:border-cyan-500"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-bold text-sm">
                      {detectorLocked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : isRadarLike ? (
                        <Radar className="h-3.5 w-3.5" />
                      ) : toolId === "shield" ? (
                        <Shield className="h-3.5 w-3.5" />
                      ) : lifelineActive && toolId === "lifeline_call" ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {lifelineActive && toolId === "lifeline_call"
                        ? "قاعدين نتصل..."
                        : tool?.name || toolId}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed opacity-70">
                      {detectorLocked
                        ? "تطلع بعد نص الأسئلة"
                        : tool?.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          {/* Own army map */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-950 mb-1">خريطتك</h2>
            <p className="text-[10px] text-slate-500 mb-3">جنودك اللي صاحين</p>
            <div className="grid grid-cols-6 gap-1">
              {(activeTeam.board || Array(36).fill(null)).map((cell, index) => {
                const UNIT_EMOJI = {
                  infantry: "👥",
                  tank: "🚜",
                  aircraft: "✈️",
                  submarine: "⛵",
                  mine: "💥",
                };
                return (
                  <div
                    key={index}
                    className={`aspect-square rounded-md border flex items-center justify-center text-[11px] ${
                      cell
                        ? "border-cyan-400 bg-cyan-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                    title={cell || "خالي أو تفجر"}
                  >
                    {cell ? UNIT_EMOJI[cell] || "•" : ""}
                  </div>
                );
              })}
            </div>
            {activeTeam.shield_active && (
              <p className="mt-3 flex items-center gap-2 text-xs font-bold text-cyan-700">
                <Shield className="h-4 w-4" />
                الدرع شغال حق الطقة الياية
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
