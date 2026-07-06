"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle, Crown, LogOut, Star, XCircle } from "lucide-react";
import {
  DIFFICULTY_STRIKE_LABEL,
  EventFeed,
  FinishedCelebration,
  MediaPlayer,
  QuestionGrid,
  ScoreCards,
  CircularTimer,
} from "./CombatShared";
import GameLogo from "../GameLogo";

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
  onGrantExtraStrike,
  onExit,
}) {
  const [grantInput, setGrantInput] = useState(null); // { teamIndex, count }

  const activeQuestion = questions.find(
    (question) => question.id === room.active_question_id,
  );
  const currentTeam = teams.find(
    (team) => team.team_index === room.current_turn,
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-16 dir-rtl">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[85rem] mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl">
              <GameLogo className="w-16 h-16" />
            </div>
            <div>
              <h1 className="font-bold text-slate-950">لوحة الحكم</h1>
              <p className="text-[10px] text-slate-500">
                الدور الحين عند: {currentTeam?.name || "قاعدين نحدد"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            اطلع من اللعبة
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
            key={activeQuestion.id}
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
                {DIFFICULTY_STRIKE_LABEL[activeQuestion.difficulty] ||
                  activeQuestion.difficulty}
              </span>
            </div>

            {/* Media — shows right under the question text, above the timer */}
            <MediaPlayer
              mediaUrl={activeQuestion.media_url}
              mediaType={activeQuestion.media_type}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 items-stretch">
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-5 flex flex-col justify-center items-center text-center shadow-lg">
                <span className="text-lg font-bold text-emerald-700">
                  الإجابة الصحيحة
                </span>
                <p className="mt-2 text-xl font-bold text-emerald-950">
                  {answer || "قاعدين نحمل الإجابة..."}
                </p>
              </div>

              <CircularTimer
                seconds={questionSeconds}
                label="مؤقت السؤال"
                className="h-full flex flex-col justify-center"
              />

              {/* Grant Extra Strike — inside the grid */}
              <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5 flex flex-col justify-center items-center text-center shadow-lg">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center justify-center gap-2 w-full">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  عطهم طقات زيادة يدوياً
                </h3>
                {grantInput ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <p className="text-sm font-bold text-amber-800">
                      عط طقات حق{" "}
                      <span
                        className={
                          grantInput.teamIndex === 1
                            ? "text-cyan-700"
                            : "text-orange-700"
                        }
                      >
                        {
                          teams.find(
                            (t) => t.team_index === grantInput.teamIndex,
                          )?.name
                        }
                      </span>
                    </p>
                    <div className="flex items-center gap-2 flex-wrap justify-center w-full">
                      <div className="flex items-center gap-1.5 bg-white rounded-xl border border-amber-300 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setGrantInput((g) => ({
                              ...g,
                              count: Math.max(
                                1,
                                (parseInt(g.count, 10) || 1) - 1,
                              ),
                            }))
                          }
                          className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-black text-[14px] flex items-center justify-center hover:bg-amber-200"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={grantInput.count}
                          onChange={(e) => {
                            let val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              if (val > 10) val = 10;
                              if (val < 1) val = 1;
                            }
                            setGrantInput((g) => ({
                              ...g,
                              count: isNaN(val) ? "" : val,
                            }));
                          }}
                          onBlur={(e) => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val) || val < 1) {
                              setGrantInput((g) => ({ ...g, count: 1 }));
                            } else if (val > 10) {
                              setGrantInput((g) => ({ ...g, count: 10 }));
                            }
                          }}
                          className="w-12 text-center font-bold text-[14px] text-slate-900 bg-amber-50 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 py-0.5 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="1"
                          max="10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setGrantInput((g) => ({
                              ...g,
                              count: Math.min(
                                10,
                                (parseInt(g.count, 10) || 0) + 1,
                              ),
                            }))
                          }
                          className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-black text-[14px] flex items-center justify-center hover:bg-amber-200"
                        >
                          +
                        </button>
                        <span className="text-[14px] text-amber-700 font-bold pr-1">
                          {!grantInput.count
                            ? "طقات"
                            : grantInput.count === 1
                              ? "طقة"
                              : grantInput.count === 2
                                ? "طقتين"
                                : `${grantInput.count} طقات`}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            const finalCount =
                              parseInt(grantInput.count, 10) || 1;
                            onGrantExtraStrike(
                              grantInput.teamIndex,
                              finalCount,
                            );
                            setGrantInput(null);
                          }}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-sm font-bold text-white transition-opacity disabled:opacity-60"
                        >
                          ✓ تطبيق
                        </button>
                        <button
                          type="button"
                          onClick={() => setGrantInput(null)}
                          className="rounded-xl bg-slate-200 hover:bg-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          setGrantInput({
                            teamIndex: team.team_index,
                            count: 1,
                          })
                        }
                        className={`flex-1 rounded-xl px-2.5 py-2.5 text-[14px] font-bold text-white flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60 ${
                          team.team_index === 1
                            ? "bg-cyan-600 hover:bg-cyan-700"
                            : "bg-orange-600 hover:bg-orange-700"
                        }`}
                      >
                        ⚡ {team.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 justify-center">
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
                  {team.name} جاوب صح
                </button>
              ))}

              <button
                type="button"
                disabled={isBusy}
                onClick={() => onResolveQuestion(activeQuestion.id, null)}
                className="rounded-xl bg-slate-700 px-3 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-slate-600 transition-opacity disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                اثنينهم أخطأوا
              </button>
            </div>
          </motion.section>
        )}

        {/* Grant Extra Strike — manual override by referee, fallback when no question is active */}
        {!activeQuestion && room.status === "playing" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-bold text-amber-900 text-sm mb-3 flex items-center gap-2">
              <Star className="h-4 w-4" />
              عطهم طقات زيادة يدوياً
            </h3>
            {grantInput ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-amber-800">
                  عط طقات حق{" "}
                  <span
                    className={
                      grantInput.teamIndex === 1
                        ? "text-cyan-700"
                        : "text-orange-700"
                    }
                  >
                    {
                      teams.find((t) => t.team_index === grantInput.teamIndex)
                        ?.name
                    }
                  </span>
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-amber-300 px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setGrantInput((g) => ({
                          ...g,
                          count: Math.max(1, (parseInt(g.count, 10) || 1) - 1),
                        }))
                      }
                      className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center hover:bg-amber-200"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={grantInput.count}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          if (val > 10) val = 10;
                          if (val < 1) val = 1;
                        }
                        setGrantInput((g) => ({
                          ...g,
                          count: isNaN(val) ? "" : val,
                        }));
                      }}
                      onBlur={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val) || val < 1) {
                          setGrantInput((g) => ({ ...g, count: 1 }));
                        } else if (val > 10) {
                          setGrantInput((g) => ({ ...g, count: 10 }));
                        }
                      }}
                      className="w-12 text-center font-bold text-lg text-slate-900 bg-amber-50 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 py-0.5 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="1"
                      max="10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setGrantInput((g) => ({
                          ...g,
                          count: Math.min(10, (parseInt(g.count, 10) || 0) + 1),
                        }))
                      }
                      className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center hover:bg-amber-200"
                    >
                      +
                    </button>
                    <span className="text-sm text-amber-700 font-bold pr-1">
                      {!grantInput.count
                        ? "طقات"
                        : grantInput.count === 1
                          ? "طقة"
                          : grantInput.count === 2
                            ? "طقتين"
                            : `${grantInput.count} طقات`}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      const finalCount = parseInt(grantInput.count, 10) || 1;
                      onGrantExtraStrike(grantInput.teamIndex, finalCount);
                      setGrantInput(null);
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
                  >
                    ✓ تطبيق
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrantInput(null)}
                    className="rounded-xl bg-slate-200 hover:bg-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      setGrantInput({ teamIndex: team.team_index, count: 1 })
                    }
                    className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 ${
                      team.team_index === 1
                        ? "bg-cyan-600 hover:bg-cyan-700"
                        : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    ⚡ {team.name}
                  </button>
                ))}
              </div>
            )}
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
