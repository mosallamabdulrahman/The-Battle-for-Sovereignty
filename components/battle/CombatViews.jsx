'use client';

import { motion } from 'motion/react';
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
} from 'lucide-react';
import { LIFELINE_TOOLS, TACTICAL_TOOL_DETAILS } from '../../lib/game-data';

const DIFFICULTY_LABELS = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
};

const RESULT_LABELS = {
  hit: 'إصابة مباشرة',
  miss: 'ضربة فارغة',
  mine: 'انفجار لغم',
  blocked: 'تم صد الضربة',
};

const CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=360&q=80',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=360&q=80',
  'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?auto=format&fit=crop&w=360&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=360&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=360&q=80',
  'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=360&q=80',
];

const getCategoryImage = (categoryId, index) => {
  const codeSum = String(categoryId)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return CATEGORY_IMAGES[(codeSum + index) % CATEGORY_IMAGES.length];
};

function FinishedCelebration({ room, teams, activeTeam, opponentTeam, onExit }) {
  const winner = teams.find((team) => team.team_index === room.winner_team_index);
  const didWin = activeTeam && room.winner_team_index === activeTeam.team_index;
  const title = activeTeam
    ? didWin
      ? 'فريقك انتصر في معركة السيادة'
      : room.winner_team_index
      ? `الفائز هو ${opponentTeam?.name || winner?.name || 'الفريق المنافس'}`
      : 'انتهت المعركة بالتعادل'
    : room.winner_team_index
    ? `الفائز: ${winner?.name || `الفريق ${room.winner_team_index}`}`
    : 'انتهت المعركة بالتعادل';

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
            style={{ top: `${(index * 31) % 90}%`, right: `${(index * 47) % 95}%` }}
            animate={{ y: [0, 18, 0], opacity: [0.35, 1, 0.35], scale: [1, 1.8, 1] }}
            transition={{ duration: 1.8 + (index % 4) * 0.25, repeat: Infinity }}
          />
        ))}
      </div>
      <Trophy className="relative z-10 h-16 w-16 mx-auto text-amber-300 drop-shadow" />
      <h2 className="relative z-10 mt-4 text-2xl font-black">{title}</h2>
      <p className="relative z-10 mt-2 text-sm text-cyan-100">
        انتهت المباراة. يمكن للحكم والفريقين الخروج والعودة للواجهة الرئيسية.
      </p>
      <button
        type="button"
        onClick={onExit}
        className="relative z-10 mt-6 rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-amber-100"
      >
        خروج من اللعبة
      </button>
    </motion.div>
  );
}

function ScoreCards({ teams }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {teams.map((team) => (
        <div
          key={team.id}
          className={`rounded-2xl border bg-white p-5 shadow-sm ${
            team.team_index === 1 ? 'border-cyan-200' : 'border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-black text-slate-900">{team.name}</p>
              <p className="text-xs text-slate-500 mt-1">النتيجة: {team.score}</p>
            </div>
            <div className="text-center rounded-xl bg-slate-950 text-white px-4 py-2">
              <span className="block text-xl font-black">{team.available_strikes}</span>
              <span className="text-[9px] text-slate-300">ضربات متاحة</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LifelineTimer({ seconds, onDismiss }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(60, seconds)) / 60;
  const strokeDashoffset = circumference * (1 - progress);
  const colorClass = seconds >= 30 ? 'text-emerald-500' : seconds >= 10 ? 'text-amber-500' : 'text-rose-500';
  const ringColor = seconds >= 30 ? '#10b981' : seconds >= 10 ? '#f59e0b' : '#f43f5e';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50 p-5 text-center shadow-lg"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
        <div className={`relative ${seconds < 10 ? 'animate-pulse' : ''}`}>
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 140 140" aria-hidden="true">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="11" />
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
              style={{ transition: 'stroke-dashoffset 1000ms linear, stroke 300ms ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black ${colorClass}`}>{seconds}</span>
            <span className="text-[10px] font-black text-slate-400">ثانية</span>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <h3 className="text-lg font-black text-slate-950">اتصال بصديق جارٍ الآن</h3>
          <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
            لديك دقيقة واحدة للتشاور. عندما تنتهي، أخبر الحكم بالإجابة النهائية.
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-4 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white transition hover:bg-cyan-700"
          >
            انتهيت من الاتصال
          </button>
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
        questions: [],
      };
    }
    groups[question.category_id].questions.push(question);
    return groups;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Object.entries(categories).map(([categoryId, category], categoryIndex) => {
        const sortedQuestions = [...category.questions].sort((a, b) => a.position - b.position);
        const rightColumn = sortedQuestions.filter((_, index) => index % 2 === 0);
        const leftColumn = sortedQuestions.filter((_, index) => index % 2 === 1);

        return (
          <section key={categoryId} className="grid grid-cols-[1fr_90px_1fr] items-stretch gap-0">
            <div className="flex flex-col justify-between gap-2 py-1">
              {rightColumn.map((question) => {
                const isActive = activeQuestionId === question.id;
                const isDisabled = disabled || question.is_used || Boolean(activeQuestionId);
                return (
                  <button
                    key={question.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelect(question)}
                    className={`h-14 rounded-r-full rounded-l-2xl border text-center text-xl font-black transition-all ${
                      question.is_used
                        ? 'border-slate-200 bg-slate-200 text-slate-400 line-through'
                        : isActive
                        ? 'border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300'
                        : 'border-slate-200 bg-slate-200 text-rose-800 hover:border-cyan-400 hover:bg-cyan-50 disabled:cursor-not-allowed'
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
                src={getCategoryImage(categoryId, categoryIndex)}
                alt={category.name}
                className="h-44 w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-2 text-center">
                <h3 className="truncate text-[11px] font-black text-white">{category.name}</h3>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2 py-1">
              {leftColumn.map((question) => {
                const isActive = activeQuestionId === question.id;
                const isDisabled = disabled || question.is_used || Boolean(activeQuestionId);
                return (
                  <button
                    key={question.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelect(question)}
                    className={`h-14 rounded-l-full rounded-r-2xl border text-center text-xl font-black transition-all ${
                      question.is_used
                        ? 'border-slate-200 bg-slate-200 text-slate-400 line-through'
                        : isActive
                        ? 'border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300'
                        : 'border-slate-200 bg-slate-200 text-rose-800 hover:border-cyan-400 hover:bg-cyan-50 disabled:cursor-not-allowed'
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
  const teamLabel = (teamIndex) => (teamIndex ? `الفريق ${teamIndex}` : 'الفريق غير المحدد');

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-black text-slate-900">آخر أحداث المعركة</h3>
      <div className="mt-4 space-y-2">
        {visibleEvents.length === 0 && (
          <p className="text-xs text-slate-400">لم تبدأ الأحداث القتالية بعد.</p>
        )}
        {visibleEvents.map((event) => (
          <div key={event.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {event.event_type === 'strike' ? (
              <span>
                {teamLabel(event.actor_team_index)} نفذ ضربة على مربع {event.cell_index + 1} في أرض {teamLabel(event.target_team_index)}: {' '}
                <strong>{RESULT_LABELS[event.result] || 'نتيجة غير معروفة'}</strong>
              </span>
            ) : event.event_type === 'question_resolved' ? (
              <span>
                {event.actor_team_index
                  ? `${teamLabel(event.actor_team_index)} أجاب بشكل صحيح وحصل على ${event.metadata?.strikes || 0} ضربة`
                  : 'لم يحصل أي فريق على السؤال'}
              </span>
            ) : event.event_type === 'tool_used' ? (
              <span>{teamLabel(event.actor_team_index)} استخدم وسيلة {TACTICAL_TOOL_DETAILS[event.result]?.name || 'تكتيكية'}</span>
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
  onSelectQuestion,
  onResolveQuestion,
  onExit,
}) {
  const activeQuestion = questions.find((question) => question.id === room.active_question_id);
  const currentTeam = teams.find((team) => team.team_index === room.current_turn);

  return (
    <div className="min-h-screen bg-slate-100 pb-16 dir-rtl">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-500 p-2.5 text-white">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-black text-slate-950">لوحة حكم معركة السيادة</h1>
              <p className="text-[10px] text-slate-500">الدور الحالي: {currentTeam?.name || 'جارٍ التحديد'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            خروج من اللعبة
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-7 space-y-7">
        <ScoreCards teams={teams} />

        {room.status === 'finished' && (
          <FinishedCelebration room={room} teams={teams} onExit={onExit} />
        )}

        {activeQuestion && room.status === 'playing' && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-cyan-200 bg-white p-6 shadow-lg"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-black text-cyan-600">{activeQuestion.category_name}</span>
                <h2 className="mt-2 text-xl font-black text-slate-950">{activeQuestion.question_text}</h2>
              </div>
              <span className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
                {activeQuestion.points} نقطة · {activeQuestion.strikes} ضربة
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <span className="text-xs font-bold text-emerald-700">الإجابة الصحيحة</span>
              <p className="mt-1 font-black text-emerald-950">{answer || 'جاري تحميل الإجابة...'}</p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => onResolveQuestion(activeQuestion.id, team.team_index)}
                  className={`rounded-xl px-4 py-3 font-black text-white ${
                    team.team_index === 1 ? 'bg-cyan-600' : 'bg-orange-600'
                  }`}
                >
                  إجابة {team.name} صحيحة
                </button>
              ))}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onResolveQuestion(activeQuestion.id, null)}
                className="rounded-xl bg-slate-700 px-4 py-3 font-black text-white"
              >
                كلاهما أخطأ
              </button>
            </div>
          </motion.section>
        )}

        {!activeQuestion && room.status === 'playing' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold text-amber-900">
            ينتظر النظام اختيار {currentTeam?.name} للسؤال. يستطيع الحكم اختيار السؤال نيابة عنه.
          </div>
        )}

        <QuestionGrid
          questions={questions}
          activeQuestionId={room.active_question_id}
          disabled={room.status !== 'playing' || teams.some((team) => team.available_strikes > 0)}
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
}) {
  const activeQuestion = questions.find((question) => question.id === room.active_question_id);
  const usedTools = activeTeam.used_tools || [];
  const strikeEvents = events.filter(
    (event) => event.event_type === 'strike' && event.target_team_index === opponentTeam.team_index
  );
  const cellResults = new Map(strikeEvents.map((event) => [event.cell_index, event.result]));
  const radarMap = new Map((radarCells || []).map((cell) => [cell.cell_index, cell.occupied]));
  const usedQuestionsCount = questions.filter((question) => question.is_used).length;
  const totalQuestions = questions.length;
  const availableTools = Array.from(new Set([...(activeTeam.tools || []), ...LIFELINE_TOOLS]));
  const canChooseQuestion =
    room.status === 'playing' &&
    room.current_turn === activeTeam.team_index &&
    !room.active_question_id &&
    activeTeam.available_strikes === 0 &&
    opponentTeam.available_strikes === 0;

  return (
    <div className="min-h-screen bg-slate-100 pb-16 dir-rtl">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-500 p-2.5 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-black text-slate-950">{activeTeam.name}</h1>
              <p className="text-[10px] text-slate-500">
                النتيجة {activeTeam.score} · الضربات المتاحة {activeTeam.available_strikes}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            خروج من اللعبة
          </button>
        </div>
      </header>

      {holeConfirmPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-red-500 bg-slate-900 p-8 text-center text-white shadow-2xl"
          >
            <p className="text-4xl mb-3">تحذير</p>
            <h2 className="text-xl font-black text-amber-300">الحفرة نشطة!</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              اختر سؤالك الآن. إذا أجبت صحيحًا تحصل على ضربة إضافية. إذا أجبت خطأً، الوسيلة تضيع.
            </p>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onConfirmHole}
                className="rounded-2xl bg-red-600 py-3 text-sm font-black text-white transition hover:bg-red-500"
              >
                تفعيل الحفرة والمتابعة
              </button>
              <button
                type="button"
                onClick={onCancelHole}
                className="rounded-2xl bg-slate-700 py-3 text-sm font-black text-white transition hover:bg-slate-600"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 mt-7 grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-7">
          {room.status === 'finished' && (
            <FinishedCelebration
              room={room}
              teams={[activeTeam, opponentTeam]}
              activeTeam={activeTeam}
              opponentTeam={opponentTeam}
              onExit={onExit}
            />
          )}

          {holeActive && (
            <div className="rounded-2xl border border-red-400 bg-red-900 px-5 py-3 text-center text-sm font-black text-white animate-pulse">
              تحذير: الحفرة نشطة — اختر سؤالك الآن
            </div>
          )}

          {lifelineActive && (
            <LifelineTimer seconds={lifelineSeconds} onDismiss={onDismissLifeline} />
          )}

          {activeQuestion && (
            <div className="rounded-3xl border border-cyan-200 bg-white p-6 shadow-sm">
              <span className="text-xs font-black text-cyan-600">{activeQuestion.category_name}</span>
              <h2 className="mt-2 text-xl font-black text-slate-950">{activeQuestion.question_text}</h2>
              {doubleChanceActive && (
                <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-amber-400 bg-amber-50 px-5 py-3">
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-y-0 w-24 bg-white/50 blur-md"
                    initial={{ right: '-35%' }}
                    animate={{ right: ['-35%', '115%'] }}
                    transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="relative z-10 text-sm font-black text-amber-800">
                    لديك فرصتان للإجابة — أخبر الحكم
                  </span>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-500">
                أبلغ الحكم بإجابتك. الإجابة الصحيحة لا تظهر على شاشة الفريق.
              </p>
            </div>
          )}

          {activeTeam.available_strikes > 0 && room.status === 'playing' && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center font-black text-rose-900">
              لديك {activeTeam.available_strikes} ضربة. اختر مربعًا من خريطة {opponentTeam.name}.
            </div>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-black text-slate-950">خريطة الخصم المشفرة</h2>
                <p className="text-[10px] text-slate-500">
                  {radarMode ? 'اختر مركز مسح الرادار' : 'المربعات لا تكشف محتواها إلا بعد الضرب'}
                </p>
              </div>
              <Target className="h-6 w-6 text-rose-500" />
            </div>

            <div className="grid grid-cols-6 gap-2 max-w-xl mx-auto">
              {Array.from({ length: 36 }, (_, cellIndex) => {
                const result = cellResults.get(cellIndex);
                const radarOccupied = radarMap.get(cellIndex);
                return (
                  <button
                    key={cellIndex}
                    type="button"
                    disabled={
                      isBusy ||
                      room.status !== 'playing' ||
                      (!radarMode && activeTeam.available_strikes <= 0) ||
                      Boolean(result && result !== 'blocked')
                    }
                    onClick={() => (radarMode ? onUseTool(activeRadarTool || 'radar_scan', cellIndex) : onStrike(cellIndex))}
                    className={`aspect-square rounded-xl border text-xs font-black transition-all ${
                      result === 'hit'
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : result === 'miss'
                        ? 'border-slate-400 bg-slate-300 text-slate-700'
                        : result === 'mine'
                        ? 'border-amber-500 bg-amber-400 text-slate-950'
                        : result === 'blocked'
                        ? 'border-cyan-500 bg-cyan-500 text-white'
                        : radarOccupied === true
                        ? 'border-amber-400 bg-amber-100 text-amber-800'
                        : radarOccupied === false
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {result === 'hit'
                      ? 'إصابة'
                      : result === 'miss'
                      ? 'فارغ'
                      : result === 'mine'
                      ? 'لغم'
                      : result === 'blocked'
                      ? 'درع'
                      : radarOccupied === true
                      ? 'هدف'
                      : radarOccupied === false
                      ? 'خالي'
                      : cellIndex + 1}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black text-slate-950">لوحة الأسئلة</h2>
              <span className="text-xs font-bold text-slate-500">
                {canChooseQuestion ? 'دورك في اختيار السؤال' : 'انتظر دورك أو نفّذ ضرباتك'}
              </span>
            </div>
            <QuestionGrid
              questions={questions}
              activeQuestionId={room.active_question_id}
              disabled={!canChooseQuestion}
              onSelect={onSelectQuestion}
            />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-950">الأدوات التكتيكية</h2>
            <p className="text-[10px] text-slate-500 mt-1">كل أداة تستخدم مرة واحدة أثناء القتال.</p>
            <div className="mt-4 space-y-3">
              {availableTools.map((toolId) => {
                const tool = TACTICAL_TOOL_DETAILS[toolId];
                const isUsed = usedTools.includes(toolId);
                const isRadarLike = toolId === 'radar_scan' || toolId === 'the_detector';
                const isDetector = toolId === 'the_detector';
                const detectorLocked = isDetector && usedQuestionsCount < totalQuestions / 2;
                const isOwnTurn = room.current_turn === activeTeam.team_index;
                const needsActiveQuestion = toolId === 'lifeline_call' || toolId === 'double_chance';
                const needsNoActiveQuestion = toolId === 'the_hole';
                const disabledByTiming =
                  !isOwnTurn ||
                  (needsActiveQuestion && !room.active_question_id) ||
                  (needsNoActiveQuestion && Boolean(room.active_question_id));
                const isDisabled =
                  isBusy ||
                  isUsed ||
                  room.status !== 'playing' ||
                  detectorLocked ||
                  disabledByTiming ||
                  (lifelineActive && toolId === 'lifeline_call');
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
                    className={`w-full rounded-2xl border p-4 text-right transition-all ${
                      isUsed
                        ? 'border-slate-200 bg-slate-100 text-slate-400'
                        : detectorLocked
                        ? 'border-slate-200 bg-slate-50 text-slate-400'
                        : isActiveRadar
                        ? 'border-amber-400 bg-amber-100 text-amber-900'
                        : 'border-cyan-200 bg-cyan-50 text-cyan-900 hover:border-cyan-500'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-black">
                      {detectorLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : isRadarLike ? (
                        <Radar className="h-4 w-4" />
                      ) : toolId === 'shield' ? (
                        <Shield className="h-4 w-4" />
                      ) : lifelineActive && toolId === 'lifeline_call' ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {lifelineActive && toolId === 'lifeline_call' ? 'جارٍ الاتصال...' : tool?.name || toolId}
                    </span>
                    <span className="mt-1 block text-[10px] leading-relaxed">
                      {detectorLocked
                        ? 'تظهر بعد نصف الأسئلة'
                        : tool?.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-950">حالة جيشك</h2>
            <div className="mt-4 grid grid-cols-6 gap-1.5">
              {(activeTeam.board || Array(36).fill(null)).map((cell, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-md border ${
                    cell ? 'border-cyan-400 bg-cyan-100' : 'border-slate-200 bg-slate-50'
                  }`}
                  title={cell || 'فارغ'}
                />
              ))}
            </div>
            {activeTeam.shield_active && (
              <p className="mt-3 flex items-center gap-2 text-xs font-black text-cyan-700">
                <Shield className="h-4 w-4" />
                الدرع مفعل للضربة القادمة
              </p>
            )}
          </section>

          <EventFeed events={events} />
        </aside>
      </main>
    </div>
  );
}

export function AbandonedGameView({ room, onReturnHome }) {
  const actor = room.abandoned_by === 'referee'
    ? 'الحكم'
    : room.abandoned_by === 'team_1'
    ? 'الفريق الأول'
    : room.abandoned_by === 'team_2'
    ? 'الفريق الثاني'
    : 'أحد أطراف اللعبة';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 dir-rtl">
      <div className="w-full max-w-md rounded-3xl border border-rose-900 bg-slate-900 p-8 text-center text-white shadow-2xl">
        <AlertTriangle className="h-14 w-14 mx-auto text-rose-400" />
        <h1 className="mt-4 text-2xl font-black">تم إنهاء اللعبة</h1>
        <p className="mt-3 text-sm text-slate-300">{actor} خرج من اللعبة.</p>
        <button
          type="button"
          onClick={onReturnHome}
          className="mt-7 rounded-xl bg-white px-6 py-3 font-black text-slate-950"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}

export function CombatEventModal({ event, onClose }) {
  if (!event || event.event_type !== 'strike') return null;

  const isHit = event.result === 'hit';
  const isMine = event.result === 'mine';
  const isBlocked = event.result === 'blocked';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 dir-rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl"
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
        <h2 className="mt-4 text-2xl font-black text-slate-950">
          {RESULT_LABELS[event.result] || event.result}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          الضربة على المربع {event.cell_index + 1}
          {event.points_delta ? ` · تأثير النقاط ${event.points_delta}` : ''}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-black text-white"
        >
          متابعة المعركة
        </button>
      </motion.div>
    </div>
  );
}
