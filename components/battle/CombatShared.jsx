"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle,
  Shield,
  Star,
  Trophy,
  Volume2,
  XCircle,
} from "lucide-react";

export const DIFFICULTY_LABELS = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

export const RESULT_LABELS = {
  hit: "طقيت المربع صح",
  miss: "طقة بالهوا",
  mine: "لغم انفجر فيك",
  blocked: "الدرع صده",
};

export const FALLBACK_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=360&q=80";

export const DIFFICULTY_STRIKE_LABEL = {
  easy: "طقة وحدة",
  medium: "طقتين",
  hard: "ثلاث طقات",
};

// ── Media Player ───────────────────────────────────────────────
// Renders directly under the question text, above the timer. Keyed by the
// parent question so switching questions always remounts (no stale audio/image).
export function MediaPlayer({ mediaUrl, mediaType }) {
  if (!mediaUrl || !mediaType) return null;

  if (mediaType === "image") {
    return (
      <div className="mt-4">
        <img
          src={mediaUrl}
          alt="وسائط السؤال"
          className="w-full max-h-72 object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  if (mediaType === "audio") {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
        <Volume2 className="h-5 w-5 shrink-0 text-cyan-600" />
        <audio controls src={mediaUrl} className="w-full h-8" />
      </div>
    );
  }

  return null;
}

// ── End Screen ─────────────────────────────────────────────────
export function FinishedCelebration({
  room,
  teams,
  activeTeam,
  opponentTeam,
  onExit,
}) {
  const winner = teams.find((t) => t.team_index === room.winner_team_index);
  const isDraw = !room.winner_team_index;
  const didWin = activeTeam && room.winner_team_index === activeTeam.team_index;

  const title = activeTeam
    ? didWin
      ? "فريقك فاز! 🏆"
      : isDraw
        ? "انتهت اللعبة تعادل"
        : `الفائز: ${opponentTeam?.name || winner?.name || "الخصم"}`
    : isDraw
      ? "انتهت اللعبة تعادل"
      : `الفائز: ${winner?.name || `الفريق ${room.winner_team_index}`}`;

  const sorted = [...teams].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 p-8 text-center text-white shadow-2xl"
    >
      {/* Confetti dots */}
      <div className="absolute inset-0 opacity-25">
        {Array.from({ length: 18 }, (_, i) => (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-amber-300"
            style={{ top: `${(i * 31) % 90}%`, right: `${(i * 47) % 95}%` }}
            animate={{
              y: [0, 18, 0],
              opacity: [0.35, 1, 0.35],
              scale: [1, 1.8, 1],
            }}
            transition={{ duration: 1.8 + (i % 4) * 0.25, repeat: Infinity }}
          />
        ))}
      </div>

      <Trophy className="relative z-10 h-14 w-14 mx-auto text-amber-300 drop-shadow" />
      <h2 className="relative z-10 mt-4 text-2xl font-bold">{title}</h2>

      {/* Final Scores */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
        {sorted.map((team, i) => {
          const isWinner = team.team_index === room.winner_team_index;
          return (
            <div
              key={team.id}
              className={`rounded-2xl border p-4 text-center ${
                isWinner
                  ? "border-amber-400 bg-amber-500/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {isWinner && (
                <Star className="h-4 w-4 text-amber-300 mx-auto mb-1" />
              )}
              <p className="text-xs font-bold text-white/60">{team.name}</p>
              <p
                className={`text-3xl font-black mt-1 ${isWinner ? "text-amber-300" : "text-white/80"}`}
              >
                {team.score}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">نقاط</p>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onExit}
        className="relative z-10 mt-6 rounded-2xl bg-white px-8 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-100"
      >
        اطلع من اللعبة
      </button>
    </motion.div>
  );
}

export function AnimatedNumber({ value, className }) {
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

export function ScoreCards({ teams }) {
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
            <div className="grid grid-cols-2 gap-2">
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
                  النقاط
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
                  الطقات
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CircularTimer({
  seconds,
  label = "مؤقت السؤال",
  onDismiss,
  className = "",
}) {
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
      className={`rounded-3xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50 p-5 text-center shadow-lg ${className}`}
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
              انتهى الوقت
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Board order top-to-bottom is always easy → medium → hard, regardless of
// how the questions were selected for this room.
const DIFFICULTY_ROW_ORDER = ["easy", "medium", "hard"];

function QuestionSlotButton({
  question,
  difficulty,
  side,
  row,
  activeQuestionId,
  disabled,
  onSelect,
}) {
  const roundedClass =
    side === "right"
      ? "rounded-r-full rounded-l-2xl"
      : "rounded-l-full rounded-r-2xl";
  const baseBg = side === "right" ? "bg-[#CDD2D2]" : "bg-slate-200";
  const label =
    DIFFICULTY_STRIKE_LABEL[difficulty] ||
    DIFFICULTY_LABELS[difficulty] ||
    difficulty;

  // No question configured for this difficulty slot in this category —
  // keep the button in place (so both sides always line up) but lock it.
  const gridColumn = side === "right" ? 1 : 3;

  if (!question) {
    return (
      <button
        type="button"
        disabled
        style={{ gridRow: row + 1, gridColumn }}
        className={`h-14 ${roundedClass} border border-slate-150 bg-slate-100 text-center text-sm font-semibold text-slate-300 cursor-not-allowed opacity-60`}
        title="مفيش سؤال متاح بهذا المستوى لهذا التصنيف"
      >
        {label}
      </button>
    );
  }

  const isActive = activeQuestionId === question.id;
  const isDisabled = disabled || question.is_used || Boolean(activeQuestionId);

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(question)}
      style={{ gridRow: row + 1, gridColumn }}
      className={`h-14 ${roundedClass} border text-center text-sm font-semibold transition-all ${
        question.is_used
          ? "border-slate-200 bg-slate-200 text-slate-400 line-through"
          : isActive
            ? "border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300"
            : `border-slate-200 ${baseBg} text-rose-800 hover:border-cyan-400 hover:bg-cyan-50 disabled:cursor-not-allowed`
      }`}
      title={`${DIFFICULTY_LABELS[question.difficulty]} · ${question.strikes} طقة`}
    >
      {DIFFICULTY_STRIKE_LABEL[question.difficulty] || question.difficulty}
    </button>
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
        // Up to 2 questions per difficulty tier, ordered easy/medium/hard
        // top-to-bottom — missing ones render as locked placeholders so
        // both columns always stay aligned with the category image.
        const rows = DIFFICULTY_ROW_ORDER.map((difficulty) =>
          category.questions
            .filter((q) => q.difficulty === difficulty)
            .sort((a, b) => a.position - b.position)
            .slice(0, 2),
        );

        return (
          <section
            key={categoryId}
            className="grid grid-cols-[1fr_120px_1fr] grid-rows-3 items-stretch gap-2"
          >
            {rows.map(([rightQuestion], row) => (
              <QuestionSlotButton
                key={`right-${row}`}
                question={rightQuestion}
                difficulty={DIFFICULTY_ROW_ORDER[row]}
                side="right"
                row={row}
                activeQuestionId={activeQuestionId}
                disabled={disabled}
                onSelect={onSelect}
              />
            ))}

            <div
              style={{ gridRow: "1 / span 3", gridColumn: 2 }}
              className="relative bg-cyan-50 shadow-sm"
            >
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

            {rows.map(([, leftQuestion], row) => (
              <QuestionSlotButton
                key={`left-${row}`}
                question={leftQuestion}
                difficulty={DIFFICULTY_ROW_ORDER[row]}
                side="left"
                row={row}
                activeQuestionId={activeQuestionId}
                disabled={disabled}
                onSelect={onSelect}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}

export function EventFeed({ events }) {
  const visibleEvents = events.slice(0, 8);
  const teamLabel = (teamIndex) =>
    teamIndex ? `الفريق ${teamIndex}` : "الفريق غير المحدد";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-900">آخر الأحداث والطق</h3>
      <div className="mt-4 space-y-2">
        {visibleEvents.length === 0 && (
          <p className="text-xs text-slate-400">اللعب والطق للحين ما بدأ.</p>
        )}
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600"
          >
            {event.event_type === "strike" ? (
              <span>
                {teamLabel(event.actor_team_index)} طق المربع{" "}
                {event.cell_index + 1} في أرض{" "}
                {teamLabel(event.target_team_index)}:{" "}
                <strong>
                  {RESULT_LABELS[event.result] || "نتيجة غير معروفة"}
                </strong>
              </span>
            ) : event.event_type === "question_resolved" ? (
              <span>
                {event.actor_team_index
                  ? `${teamLabel(event.actor_team_index)} جاوب صح وحصل على ${event.metadata?.strikes || 0} طقة`
                  : "ما حد جاوب صح"}
              </span>
            ) : event.event_type === "tool_used" ? (
              <span>
                {teamLabel(event.actor_team_index)} شغل فزعة{" "}
                {(RESULT_LABELS[event.result] && event.result) || "تكتيكية"}
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
        <h1 className="mt-4 text-2xl font-bold">تسكرت اللعبة</h1>
        <p className="mt-3 text-sm text-slate-300">{actor} طلع من اللعبة.</p>
        <button
          type="button"
          onClick={onReturnHome}
          className="mt-7 rounded-xl bg-white px-6 py-3 font-bold text-slate-950"
        >
          ارجع للرئيسية
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
          الطقة على المربع {event.cell_index + 1}
          {event.points_delta ? ` · النقاط ${event.points_delta}` : ""}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white"
        >
          كمل اللعب
        </button>
      </motion.div>
    </div>
  );
}
