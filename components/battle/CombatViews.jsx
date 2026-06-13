'use client';

import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle,
  Crown,
  LogOut,
  Radar,
  Shield,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { TACTICAL_TOOL_DETAILS } from '../../lib/game-data';

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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Object.entries(categories).map(([categoryId, category]) => (
        <section key={categoryId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-4 text-center text-white">
            <h3 className="font-black">{category.name}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4">
            {category.questions
              .sort((a, b) => a.position - b.position)
              .map((question) => {
                const isActive = activeQuestionId === question.id;
                const isDisabled = disabled || question.is_used || Boolean(activeQuestionId);
                return (
                  <button
                    key={question.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelect(question)}
                    className={`rounded-xl border px-3 py-3 text-center transition-all ${
                      question.is_used
                        ? 'border-slate-200 bg-slate-100 text-slate-400 line-through'
                        : isActive
                        ? 'border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-cyan-400 hover:bg-cyan-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    <span className="block text-base font-black">{question.points}</span>
                    <span className="block text-[9px] font-bold">
                      {DIFFICULTY_LABELS[question.difficulty]} · {question.strikes} ضربة
                    </span>
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

function EventFeed({ events }) {
  const visibleEvents = events.slice(0, 8);

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
                الفريق {event.actor_team_index} ضرب المربع {event.cell_index + 1}: {' '}
                <strong>{RESULT_LABELS[event.result] || event.result}</strong>
              </span>
            ) : event.event_type === 'question_resolved' ? (
              <span>
                {event.actor_team_index
                  ? `الفريق ${event.actor_team_index} حصل على ${event.metadata?.strikes || 0} ضربة`
                  : 'لم يحصل أي فريق على السؤال'}
              </span>
            ) : event.event_type === 'tool_used' ? (
              <span>الفريق {event.actor_team_index} استخدم أداة {event.result}</span>
            ) : (
              <span>{event.event_type}</span>
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
          <div className="rounded-3xl bg-emerald-950 p-8 text-center text-white">
            <Trophy className="h-12 w-12 mx-auto text-amber-400" />
            <h2 className="mt-3 text-xl font-black">
              {room.winner_team_index
                ? `الفائز: ${teams.find((team) => team.team_index === room.winner_team_index)?.name}`
                : 'انتهت المعركة بالتعادل'}
            </h2>
          </div>
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
  isBusy,
  onSelectQuestion,
  onStrike,
  onUseTool,
  onToggleRadar,
  onExit,
}) {
  const activeQuestion = questions.find((question) => question.id === room.active_question_id);
  const usedTools = activeTeam.used_tools || [];
  const strikeEvents = events.filter(
    (event) => event.event_type === 'strike' && event.target_team_index === opponentTeam.team_index
  );
  const cellResults = new Map(strikeEvents.map((event) => [event.cell_index, event.result]));
  const radarMap = new Map((radarCells || []).map((cell) => [cell.cell_index, cell.occupied]));
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

      <main className="max-w-7xl mx-auto px-4 mt-7 grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-7">
          {room.status === 'finished' && (
            <div className="rounded-3xl bg-emerald-950 p-8 text-center text-white">
              <Trophy className="h-12 w-12 mx-auto text-amber-400" />
              <h2 className="mt-3 text-xl font-black">
                {room.winner_team_index === activeTeam.team_index
                  ? 'فريقك فاز بالمعركة'
                  : room.winner_team_index
                  ? `الفائز هو ${opponentTeam.name}`
                  : 'انتهت المعركة بالتعادل'}
              </h2>
            </div>
          )}

          {activeQuestion && (
            <div className="rounded-3xl border border-cyan-200 bg-white p-6 shadow-sm">
              <span className="text-xs font-black text-cyan-600">{activeQuestion.category_name}</span>
              <h2 className="mt-2 text-xl font-black text-slate-950">{activeQuestion.question_text}</h2>
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
                    onClick={() => (radarMode ? onUseTool('radar_scan', cellIndex) : onStrike(cellIndex))}
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
              {(activeTeam.tools || []).map((toolId) => {
                const tool = TACTICAL_TOOL_DETAILS[toolId];
                const isUsed = usedTools.includes(toolId);
                const isRadar = toolId === 'radar_scan';
                return (
                  <button
                    key={toolId}
                    type="button"
                    disabled={isBusy || isUsed || room.status !== 'playing'}
                    onClick={() => (isRadar ? onToggleRadar() : onUseTool(toolId, null))}
                    className={`w-full rounded-2xl border p-4 text-right transition-all ${
                      isUsed
                        ? 'border-slate-200 bg-slate-100 text-slate-400'
                        : radarMode && isRadar
                        ? 'border-amber-400 bg-amber-100 text-amber-900'
                        : 'border-cyan-200 bg-cyan-50 text-cyan-900 hover:border-cyan-500'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-black">
                      {isRadar ? <Radar className="h-4 w-4" /> : toolId === 'shield' ? <Shield className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      {tool?.name || toolId}
                    </span>
                    <span className="mt-1 block text-[10px] leading-relaxed">{tool?.description}</span>
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
