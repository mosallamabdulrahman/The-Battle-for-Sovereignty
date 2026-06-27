"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle,
  Crown,
  Lock,
  LogOut,
  Radar,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { LIFELINE_TOOLS, TACTICAL_TOOL_DETAILS } from "../../lib/game-data";

const DIFFICULTY_LABELS = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

const RESULT_LABELS = {
  hit: "إصابة مباشرة",
  miss: "ضربة فارغة",
  mine: "انفجار لغم",
  blocked: "تم صد الضربة",
};

const FALLBACK_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=360&q=80";

function FinishedCelebration({
  room,
  teams,
  activeTeam,
  opponentTeam,
  onExit,
}) {
  const winner = teams.find(
    (team) => team.team_index === room.winner_team_index,
  );
  const didWin = activeTeam && room.winner_team_index === activeTeam.team_index;
  const title = activeTeam
    ? didWin
      ? "فريقك انتصر في معركة السيادة"
      : room.winner_team_index
        ? `الفائز هو ${opponentTeam?.name || winner?.name || "الفريق المنافس"}`
        : "انتهت المعركة بالتعادل"
    : room.winner_team_index
      ? `الفائز: ${winner?.name || `الفريق ${room.winner_team_index}`}`
      : "انتهت المعركة بالتعادل";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 p-8 text-center text-white shadow-2xl"
    >
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 18 }, (_, index) => (
          <motion.span
            key={index}
            className="absolute h-2 w-2 rounded-full bg-amber-300"
            style={{
              top: `${(index * 31) % 90}%`,
              right: `${(index * 47) % 95}%`,
            }}
            animate={{
              y: [0, 18, 0],
              opacity: [0.35, 1, 0.35],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: 1.8 + (index % 4) * 0.25,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
      <Trophy className="relative z-10 h-16 w-16 mx-auto text-amber-300 drop-shadow" />
      <h2 className="relative z-10 mt-4 text-2xl font-bold">{title}</h2>
      <p className="relative z-10 mt-2 text-sm text-cyan-100">
        انتهت المباراة. يمكن للحكم والفريقين الخروج والعودة للواجهة الرئيسية.
      </p>
      <button
        type="button"
        onClick={onExit}
        className="relative z-10 mt-6 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-100"
      >
        خروج من اللعبة
      </button>
    </motion.div>
  );
}

function AnimatedNumber({ value, className }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ y: -14, opacity: 0, scale: 0.75 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 14, opacity: 0, scale: 0.75 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`block ${className}`}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

function ScoreCards({ teams }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {teams.map((team) => {
        const isTeam1 = team.team_index === 1;
        return (
          <div
            key={team.id}
            className={`relative overflow-hidden rounded-2xl border p-5 shadow-lg ${
              isTeam1
                ? "bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-900 border-cyan-700"
                : "bg-gradient-to-br from-orange-950 via-slate-900 to-slate-900 border-orange-700"
            }`}
          >
            {/* top accent line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
                isTeam1 ? "bg-cyan-400" : "bg-orange-400"
              }`}
            />

            {/* team name */}
            <div className="flex items-center gap-2 mb-4 mt-1">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-2.5 h-2.5 rounded-full ${
                  isTeam1 ? "bg-cyan-400" : "bg-orange-400"
                }`}
              />
              <p
                className={`font-black text-sm tracking-wide ${
                  isTeam1 ? "text-cyan-200" : "text-orange-200"
                }`}
              >
                {team.name}
              </p>
            </div>

            {/* stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/10">
                <div className="h-8 flex items-center justify-center overflow-hidden">
                  <AnimatedNumber
                    value={team.score}
                    className={`text-xl font-black ${
                      isTeam1 ? "text-cyan-300" : "text-orange-300"
                    }`}
                  />
                </div>
                <span className="block text-[10px] text-white/50 font-bold mt-0.5">
                  النتيجة
                </span>
              </div>

              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/10">
                <div className="h-8 flex items-center justify-center overflow-hidden">
                  <AnimatedNumber
                    value={team.available_strikes}
                    className="text-xl font-black text-rose-300"
                  />
                </div>
                <span className="block text-[10px] text-white/50 font-bold mt-0.5">
                  الضربات
                </span>
              </div>

              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/10">
                <div className="h-8 flex items-center justify-center overflow-hidden">
                  <AnimatedNumber
                    value={team.points ?? 0}
                    className="text-xl font-black text-amber-300"
                  />
                </div>
                <span className="block text-[10px] text-white/50 font-bold mt-0.5">
                  الرصيد
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CircularTimer({ seconds, label = "مؤقت السؤال", onDismiss }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(60, seconds)) / 60;
  const strokeDashoffset = circumference * (1 - progress);
  const colorClass =
    seconds >= 30
      ? "text-emerald-500"
      : seconds >= 10
        ? "text-amber-500"
        : "text-rose-500";
  const ringColor =
    seconds >= 30 ? "#10b981" : seconds >= 10 ? "#f59e0b" : "#f43f5e";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50 p-5 text-center shadow-lg"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
        <div className={`relative ${seconds < 10 ? "animate-pulse" : ""}`}>
          <svg
            className="h-36 w-36 -rotate-90"
            viewBox="0 0 140 140"
            aria-hidden="true"
          >
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="11"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeLinecap="round"
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition:
                  "stroke-dashoffset 1000ms linear, stroke 300ms ease",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${colorClass}`}>
              {seconds}
            </span>
            <span className="text-[10px] font-bold text-slate-400">ثانية</span>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <h3 className="text-lg font-bold text-slate-950">{label}</h3>
          <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
            لديك 60 ثانية للإجابة.
          </p>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-4 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-cyan-700"
            >
              انتهيت من الاتصال
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function QuestionGrid({
  questions,
  activeQuestionId,
  disabled = false,
  onSelect,
}) {
  const categories = questions.reduce((groups, question) => {
    if (!groups[question.category_id]) {
      groups[question.category_id] = {
        name: question.category_name,
        imageUrl: question.category_image_url || question.category_image || "",
        questions: [],
      };
    }
    groups[question.category_id].questions.push(question);
    return groups;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Object.entries(categories).map(([categoryId, category]) => {
        const sortedQuestions = [...category.questions].sort(
          (a, b) => a.position - b.position,
        );
        const rightColumn = sortedQuestions.filter(
          (_, index) => index % 2 === 0,
        );
        const leftColumn = sortedQuestions.filter(
          (_, index) => index % 2 === 1,
        );

        return (
          <section
            key={categoryId}
            className="grid grid-cols-[1fr_120px_1fr] items-stretch gap-0"
          >
            <div className="flex flex-col justify-between gap-2">
              {rightColumn.map((question) => {
                const isActive = activeQuestionId === question.id;
                const isDisabled =
                  disabled || question.is_used || Boolean(activeQuestionId);
                return (
                  <button
                    key={question.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelect(question)}
                    className={`h-14 rounded-r-full rounded-l-2xl border text-center text-xl font-semibold transition-all ${
                      question.is_used
                        ? "border-slate-200 bg-slate-200 text-slate-400 line-through"
                        : isActive
                          ? "border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300"
                          : "border-slate-200 bg-[#CDD2D2] text-rose-800 hover:border-cyan-400 hover:bg-cyan-50 disabled:cursor-not-allowed"
                    }`}
                    title={`${DIFFICULTY_LABELS[question.difficulty]} - ${question.strikes} ضربة`}
                  >
                    {question.points}
                  </button>
                );
              })}
            </div>

            <div className="relative overflow-hidden bg-cyan-50 shadow-sm">
              <img
                src={category.imageUrl || FALLBACK_CATEGORY_IMAGE}
                alt={category.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[#E1734B] border-t-2 border-solid border-black px-2 py-2 text-center">
                <h3 className="font-medium text-white">{category.name}</h3>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2">
              {leftColumn.map((question) => {
                const isActive = activeQuestionId === question.id;
                const isDisabled =
                  disabled || question.is_used || Boolean(activeQuestionId);
                return (
                  <button
                    key={question.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelect(question)}
                    className={`h-14 rounded-l-full rounded-r-2xl border text-center text-xl font-semibold transition-all ${
                      question.is_used
                        ? "border-slate-200 bg-slate-200 text-slate-400 line-through"
                        : isActive
                          ? "border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300"
                          : "border-slate-200 bg-slate-200 text-rose-800 hover:border-cyan-400 hover:bg-cyan-50 disabled:cursor-not-allowed"
                    }`}
                    title={`${DIFFICULTY_LABELS[question.difficulty]} - ${question.strikes} ضربة`}
                  >
                    {question.points}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EventFeed({ events }) {
  const visibleEvents = events.slice(0, 8);
  const teamLabel = (teamIndex) =>
    teamIndex ? `الفريق ${teamIndex}` : "الفريق غير المحدد";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-900">آخر أحداث المعركة</h3>
      <div className="mt-4 space-y-2">
        {visibleEvents.length === 0 && (
          <p className="text-xs text-slate-400">
            لم تبدأ الأحداث القتالية بعد.
          </p>
        )}
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600"
          >
            {event.event_type === "strike" ? (
              <span>
                {teamLabel(event.actor_team_index)} نفذ ضربة على مربع{" "}
                {event.cell_index + 1} في أرض{" "}
                {teamLabel(event.target_team_index)}:{" "}
                <strong>
                  {RESULT_LABELS[event.result] || "نتيجة غير معروفة"}
                </strong>
              </span>
            ) : event.event_type === "question_resolved" ? (
              <span>
                {event.actor_team_index
                  ? `${teamLabel(event.actor_team_index)} أجاب بشكل صحيح وحصل على ${event.metadata?.strikes || 0} ضربة`
                  : "لم يحصل أي فريق على السؤال"}
              </span>
            ) : event.event_type === "tool_used" ? (
              <span>
                {teamLabel(event.actor_team_index)} استخدم وسيلة{" "}
                {TACTICAL_TOOL_DETAILS[event.result]?.name || "تكتيكية"}
              </span>
            ) : (
              <span>حدث جديد داخل المباراة</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function JudgeCombatDashboard({
  room,
  teams,
  questions,
  events,
  answer,
  isBusy,
  questionSeconds,
  onSelectQuestion,
  onResolveQuestion,
  onResolveDraw,
  onExit,
}) {
  const activeQuestion = questions.find(
    (question) => question.id === room.active_question_id,
  );
  const currentTeam = teams.find(
    (team) => team.team_index === room.current_turn,
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-16 dir-rtl">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-8xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-500 p-2.5 text-white">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-950">
                لوحة حكم معركة السيادة
              </h1>
              <p className="text-[10px] text-slate-500">
                الدور الحالي: {currentTeam?.name || "جارٍ التحديد"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            خروج من اللعبة
          </button>
        </div>
      </header>

      <main className="max-w-[85rem] mx-auto px-4 mt-7 space-y-7">
        <ScoreCards teams={teams} />

        {room.status === "finished" && (
          <FinishedCelebration room={room} teams={teams} onExit={onExit} />
        )}

        {activeQuestion && room.status === "playing" && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-cyan-200 bg-white p-6 shadow-lg"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-cyan-600">
                  {activeQuestion.category_name}
                </span>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {activeQuestion.question_text}
                </h2>
              </div>
              <span className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
                {activeQuestion.points} نقطة · {activeQuestion.strikes} ضربة
              </span>
            </div>

            <div className="mt-5">
              <CircularTimer seconds={questionSeconds} label="مؤقت السؤال" />
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <span className="text-xs font-bold text-emerald-700">
                الإجابة الصحيحة
              </span>
              <p className="mt-1 font-bold text-emerald-950">
                {answer || "جاري تحميل الإجابة..."}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {/* One button per team: correct answer → gives strikes automatically */}
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    onResolveQuestion(activeQuestion.id, team.team_index)
                  }
                  className={`rounded-xl px-3 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 ${
                    team.team_index === 1
                      ? "bg-cyan-600 hover:bg-cyan-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  إجابة {team.name} صحيحة
                </button>
              ))}

              {/* Draw */}
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  onResolveDraw(activeQuestion.id, activeQuestion.points)
                }
                className="rounded-xl bg-emerald-50 border border-emerald-300 px-3 py-3 text-sm font-bold text-emerald-900 flex items-center justify-center gap-2 hover:bg-emerald-100 transition-opacity disabled:opacity-60"
              >
                <CheckCircle className="h-4 w-4" />
                كلاهما صح (تعادل)
              </button>

              {/* Both wrong */}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onResolveQuestion(activeQuestion.id, null)}
                className="rounded-xl bg-slate-700 px-3 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-slate-600 transition-opacity disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                كلاهما أخطأ
              </button>
            </div>
          </motion.section>
        )}

        {!activeQuestion && room.status === "playing" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold text-amber-900">
            ينتظر النظام اختيار {currentTeam?.name} للسؤال. يستطيع الحكم اختيار
            السؤال نيابة عنه.
          </div>
        )}

        <QuestionGrid
          questions={questions}
          activeQuestionId={room.active_question_id}
          disabled={
            room.status !== "playing" ||
            teams.some((team) => team.available_strikes > 0)
          }
          onSelect={onSelectQuestion}
        />

        <EventFeed events={events} />
      </main>
    </div>
  );
}

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
  onConvertStrikes,
}) {
  // Track which win event has been acknowledged (strikes-or-points modal)
  const [handledWinEventId, setHandledWinEventId] = useState(null);
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
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-500 p-2.5 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-950">{activeTeam.name}</h1>
              <p className="text-[10px] text-slate-500">
                النتيجة {activeTeam.score} · الضربات المتاحة{" "}
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
            خروج من اللعبة
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
              <h2 className="text-lg font-bold">مغادرة اللعبة؟</h2>
              <p className="mt-2 text-sm text-slate-400">
                سيُبلَّغ الفريق الآخر والحكم بمغادرتك. يمكنك العودة لاحقًا.
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
                  مغادرة
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="rounded-2xl bg-slate-700 py-3 text-sm font-bold text-white hover:bg-slate-600 transition"
                >
                  البقاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Win Modal: Choose strikes or points ── */}
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
              <div className="text-4xl mb-3">🏆</div>
              <h2 className="text-xl font-bold text-amber-300">أجبت صحيحًا!</h2>
              <p className="mt-2 text-sm text-slate-300">
                لديك {activeTeam.available_strikes}{" "}
                {activeTeam.available_strikes === 1 ? "ضربة" : "ضربات"}. ماذا
                تريد؟
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setHandledWinEventId(latestWinEvent?.id)}
                  className="rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-500 transition disabled:opacity-60"
                >
                  ⚔️ استخدم الضربات على خريطة الخصم
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={async () => {
                    await onConvertStrikes?.();
                    setHandledWinEventId(latestWinEvent?.id);
                  }}
                  className="rounded-2xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-400 transition disabled:opacity-60"
                >
                  💰 حوّل الضربات إلى نقاط (+
                  {activeTeam.available_strikes * 200})
                </button>
              </div>
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
                {opponentTeam.name} غادر اللعبة
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                يمكنك الانتظار حتى يعود، أو إنهاء اللعبة.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDisconnectDismissed(true)}
                  className="rounded-2xl bg-slate-700 py-3 text-sm font-bold text-white hover:bg-slate-600 transition"
                >
                  انتظار العودة
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-500 transition"
                >
                  إنهاء اللعبة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Small banner when disconnect dismissed but opponent still offline */}
      {opponentDisconnected && disconnectDismissed && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-center text-xs font-bold text-amber-800">
          {opponentTeam.name} غير متصل حاليًا —{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setDisconnectDismissed(false)}
          >
            إنهاء اللعبة
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
            <h2 className="text-xl font-bold text-amber-300">الحفرة نشطة!</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              اختر سؤالك الآن. إذا أجبت صحيحًا تحصل على ضربة إضافية. إذا أجبت
              خطأً، الوسيلة تضيع.
            </p>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onConfirmHole}
                className="rounded-2xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500"
              >
                تفعيل الحفرة والمتابعة
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
        {/* ── ROW 1: Questions board (right) + Sidebar (left) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RIGHT col: score card + active question + questions board */}
          <div className="lg:col-span-2 space-y-5">
            {/* My team score card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-600 p-2 text-white">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-950">
                      {activeTeam.name}
                    </h2>
                    <p className="text-[10px] text-slate-400">نتيجتك</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400">
                    الخصم: {opponentTeam.name}
                  </p>
                  <p className="text-sm font-bold text-slate-600">
                    {opponentTeam.score} نقطة
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-gradient-to-b from-cyan-50 to-white border border-cyan-200 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-950">
                    {activeTeam.score}
                  </p>
                  <p className="text-[10px] text-slate-500">النتيجة</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-950">
                    {activeTeam.available_strikes}
                  </p>
                  <p className="text-[10px] text-slate-500">ضرباتي</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-950">
                    {activeTeam.points}
                  </p>
                  <p className="text-[10px] text-slate-500">الرصيد</p>
                </div>
              </div>
            </div>

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
                تحذير: الحفرة نشطة — اختر سؤالك الآن
              </div>
            )}

            {lifelineActive && (
              <CircularTimer
                seconds={lifelineSeconds}
                label="اتصال بصديق جارٍ الآن"
                onDismiss={onDismissLifeline}
              />
            )}

            {/* Active question slides in above the board */}
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
                    <span className="text-xs font-bold text-slate-400">
                      {activeQuestion.points} نقطة
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-950 leading-relaxed">
                    {activeQuestion.question_text}
                  </h2>
                  <div className="mt-4">
                    <CircularTimer
                      seconds={questionSeconds}
                      label="مؤقت السؤال"
                    />
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
                        لديك فرصتان للإجابة — أخبر الحكم
                      </span>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-slate-400">
                    أبلغ الحكم بإجابتك — الإجابة الصحيحة لا تظهر هنا
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {activeTeam.available_strikes > 0 && room.status === "playing" && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3 flex items-center gap-3">
                <Target className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="font-bold text-rose-900 text-sm">
                  لديك {activeTeam.available_strikes} ضربة — اختر مربعًا في
                  خريطة {opponentTeam.name} أدناه
                </p>
              </div>
            )}

            {/* Questions board */}
            <section className="rounded-3xl  border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-slate-950">لوحة الأسئلة</h2>
                <span className="text-xs font-bold text-slate-400">
                  {canChooseQuestion
                    ? "دورك في اختيار السؤال"
                    : "انتظر دورك أو نفّذ ضرباتك"}
                </span>
              </div>
              <QuestionGrid
                questions={questions}
                activeQuestionId={room.active_question_id}
                disabled={!canChooseQuestion}
                onSelect={onSelectQuestion}
              />
            </section>

            <section className="lg:col-span-1">
              <EventFeed events={events} />
            </section>
          </div>

          {/* LEFT sidebar: opponent map + tactical tools */}
          <aside className="space-y-5">
            {/* Opponent map — fills the sidebar column */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-slate-950">
                    خريطة {opponentTeam.name}
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    {radarMode ? "اختر مركز مسح الرادار" : "اضغط مربعًا للضرب"}
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
                          ? onUseTool(
                              activeRadarTool || "radar_scan",
                              cellIndex,
                            )
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
                  الخصم لديه درع مفعل
                </p>
              )}
            </section>

            {/* Tactical tools */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">الأدوات التكتيكية</h2>
              <p className="text-[10px] text-slate-500 mt-1">
                كل أداة تستخدم مرة واحدة أثناء القتال.
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
                    (needsNoActiveQuestion &&
                      Boolean(room.active_question_id)) ||
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
                          ? "جارٍ الاتصال..."
                          : tool?.name || toolId}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-relaxed opacity-70">
                        {detectorLocked
                          ? "تظهر بعد نصف الأسئلة"
                          : tool?.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
            {/* ── ROW 2: Army state + Events ── */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">حالة جيشك</h2>
              <div className="mt-3 grid grid-cols-6 gap-1">
                {(activeTeam.board || Array(36).fill(null)).map(
                  (cell, index) => (
                    <div
                      key={index}
                      className={`aspect-square rounded-md border ${
                        cell
                          ? "border-cyan-400 bg-cyan-100"
                          : "border-slate-200 bg-slate-50"
                      }`}
                      title={cell || "فارغ"}
                    />
                  ),
                )}
              </div>
              {activeTeam.shield_active && (
                <p className="mt-3 flex items-center gap-2 text-xs font-bold text-cyan-700">
                  <Shield className="h-4 w-4" />
                  الدرع مفعل للضربة القادمة
                </p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export function AbandonedGameView({ room, onReturnHome }) {
  const actor =
    room.abandoned_by === "referee"
      ? "الحكم"
      : room.abandoned_by === "team_1"
        ? "الفريق الأول"
        : room.abandoned_by === "team_2"
          ? "الفريق الثاني"
          : "أحد أطراف اللعبة";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 dir-rtl">
      <div className="w-full max-w-md rounded-3xl border border-rose-900 bg-slate-900 p-8 text-center text-white shadow-2xl">
        <AlertTriangle className="h-14 w-14 mx-auto text-rose-400" />
        <h1 className="mt-4 text-2xl font-bold">تم إنهاء اللعبة</h1>
        <p className="mt-3 text-sm text-slate-300">{actor} خرج من اللعبة.</p>
        <button
          type="button"
          onClick={onReturnHome}
          className="mt-7 rounded-xl bg-white px-6 py-3 font-bold text-slate-950"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}

export function CombatEventModal({ event, onClose, autoCloseMs = 2000 }) {
  useEffect(() => {
    if (!event || event.event_type !== "strike") return undefined;
    const timeout = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timeout);
  }, [autoCloseMs, event, onClose]);

  if (!event || event.event_type !== "strike") return null;

  const isHit = event.result === "hit";
  const isMine = event.result === "mine";
  const isBlocked = event.result === "blocked";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 dir-rtl cursor-pointer"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {isHit ? (
          <CheckCircle className="h-14 w-14 mx-auto text-rose-500" />
        ) : isMine ? (
          <AlertTriangle className="h-14 w-14 mx-auto text-amber-500" />
        ) : isBlocked ? (
          <Shield className="h-14 w-14 mx-auto text-cyan-500" />
        ) : (
          <XCircle className="h-14 w-14 mx-auto text-slate-400" />
        )}
        <h2 className="mt-4 text-2xl font-bold text-slate-950">
          {RESULT_LABELS[event.result] || event.result}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          الضربة على المربع {event.cell_index + 1}
          {event.points_delta ? ` · تأثير النقاط ${event.points_delta}` : ""}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white"
        >
          متابعة المعركة
        </button>
      </motion.div>
    </div>
  );
}
