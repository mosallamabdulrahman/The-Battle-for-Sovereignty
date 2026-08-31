"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HelpCircle, Loader2 } from "lucide-react";
import { supabasePanel as supabase } from "@/lib/supabase-panel";
import { callAdminApi } from "@/lib/admin-api";
import { DIFFICULTY_STRIKES } from "@/lib/admin-constants";
import UsersManager from "@/components/admin/UsersManager";
import Toast from "@/components/admin/Toast";
import CategoryModal from "@/components/admin/CategoryModal";
import QuestionModal from "@/components/admin/QuestionModal";
import HelpModal from "@/components/admin/HelpModal";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardTab from "@/components/admin/DashboardTab";
import QuestionsTab from "@/components/admin/QuestionsTab";
import CategoriesTab from "@/components/admin/CategoriesTab";
import StatsTab from "@/components/admin/StatsTab";

const VALID_TABS = ["dashboard", "questions", "categories", "users", "stats"];

// ─── Main Admin Page ────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTabState] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (urlTab && VALID_TABS.includes(urlTab)) {
        return urlTab;
      }
      const savedTab = window.localStorage.getItem("admin_active_tab");
      if (savedTab && VALID_TABS.includes(savedTab)) {
        return savedTab;
      }
    }
    return "questions";
  });

  const [searchQuery, setSearchQuery] = useState("");

  const setTab = useCallback((newTab) => {
    setTabState(newTab);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("admin_active_tab", newTab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (urlTab && VALID_TABS.includes(urlTab)) {
        setTabState(urlTab);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionStats, setQuestionStats] = useState({});
  const [categoryUsage, setCategoryUsage] = useState({});
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [catModal, setCatModal] = useState(null); // null | {} | category object
  const [qModal, setQModal] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [difficultyEditFor, setDifficultyEditFor] = useState(null); // question id with the inline dropdown open

  const notify = useCallback(
    (msg, type = "success") => setToast({ msg, type }),
    [],
  );
  const closeToast = useCallback(
    () => setToast({ msg: "", type: "success" }),
    [],
  );

  // ── Data loaders
  // Categories/questions are read through /api/admin/* (service-role behind
  // an is_admin() check) instead of the browser client, because the public
  // RLS policies on these tables only expose is_active = true rows. The
  // panel has to list disabled rows too — "معطّل" means hidden from the
  // game, not hidden from the admin, otherwise a disabled category becomes
  // unreachable and can never be edited or re-enabled.
  const loadCategories = useCallback(async () => {
    try {
      const { categories: rows } = await callAdminApi("/api/admin/categories");
      setCategories(rows || []);
    } catch (err) {
      notify(err.message, "error");
    }
  }, [notify]);

  const loadQuestions = useCallback(async () => {
    try {
      const { questions: rows } = await callAdminApi("/api/admin/questions");
      setQuestions(rows || []);
    } catch (err) {
      notify(err.message, "error");
    }
  }, [notify]);

  // Per-question performance: how many times each bank question has been
  // played, and of those, how many were actually answered correctly —
  // computed client-side from room_questions since it's already broadly
  // readable to any authenticated session (same as loadCategoryUsage below).
  const loadQuestionStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("room_questions")
        .select("question_bank_id, is_used, answered_correctly")
        .not("question_bank_id", "is", null);
      if (error) {
        console.error("Error loading question statistics:", error);
        return;
      }
      const stats = {};
      (data || []).forEach((row) => {
        if (!row.is_used) return;
        const key = row.question_bank_id;
        const s = stats[key] || { used: 0, correct: 0, incorrect: 0 };
        s.used += 1;
        if (row.answered_correctly === true) s.correct += 1;
        else if (row.answered_correctly === false) s.incorrect += 1;
        stats[key] = s;
      });
      setQuestionStats(stats);
    } catch (err) {
      console.error("Error loading question statistics:", err);
    }
  }, []);

  const loadCategoryUsage = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("game_rooms")
        .select("selected_categories");
      if (!error && data) {
        const counts = {};
        data.forEach((room) => {
          if (Array.isArray(room.selected_categories)) {
            room.selected_categories.forEach((catIdentifier) => {
              counts[catIdentifier] = (counts[catIdentifier] || 0) + 1;
            });
          }
        });
        setCategoryUsage(counts);
      }
    } catch (err) {
      console.error("Error loading category usage statistics:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadCategories(),
      loadQuestions(),
      loadCategoryUsage(),
      loadQuestionStats(),
    ]).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadCategories, loadQuestions, loadCategoryUsage, loadQuestionStats]);

  // ── Categories CRUD
  const saveCategory = async (form) => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_save_category", {
        p_id: form.id || null,
        p_name: form.name.trim(),
        p_description: form.description?.trim() || null,
        p_image_url: form.image_url?.trim() || null,
        p_sort_order: form.sort_order || 0,
        p_is_active: form.is_active,
      });
      if (error) throw error;
      notify(form.id ? "تم تحديث التصنيف." : "تم إضافة التصنيف.");
      await loadCategories();
      setCatModal(null);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("حذف هذا التصنيف وكل أسئلته؟")) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_delete_category", {
        p_id: id,
      });
      if (error) throw error;
      notify("تم الحذف.");
      await Promise.all([loadCategories(), loadQuestions()]);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  // ── Questions CRUD
  // Both extra media settings are optional and mutually exclusive: duration
  // only applies to images, play count only to audio/video. Normalizing here
  // (instead of trusting the form) keeps stale values out of the DB even if
  // the modal state was left dirty. The max clamps mirror the DB CHECK
  // constraints (image_duration 1–600, media_play_count 1–20) so a typed-in
  // out-of-range number gets corrected instead of failing the insert.
  const normalizePositiveInt = (value, max) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return null;
    return Math.min(Math.floor(number), max);
  };

  const saveQuestion = async (form) => {
    const isDup = questions.some(
      (q) =>
        q.category_id === form.category_id &&
        q.id !== form.id &&
        q.question_text?.trim().toLowerCase() ===
          form.question_text?.trim().toLowerCase() &&
        (q.answer_text?.trim().toLowerCase() || "") ===
          (form.answer_text?.trim().toLowerCase() || "") &&
        (q.answer_image_url?.trim() || "") ===
          (form.answer_image_url?.trim() || ""),
    );
    if (isDup) {
      notify(
        "هالسؤال موجود من قبل بنفس التصنيف، ما تقدر تضيفه مرة ثانية!",
        "error",
      );
      return;
    }
    setBusy(true);
    try {
      const mediaUrl = form.media_url?.trim() || null;
      const mediaType = mediaUrl ? form.media_type || "image" : null;

      const { error } = await supabase.rpc("admin_save_question", {
        p_id: form.id || null,
        p_category_id: form.category_id,
        p_question_text: form.question_text.trim(),
        p_answer_text: form.answer_text.trim(),
        p_difficulty: form.difficulty,
        p_strikes: DIFFICULTY_STRIKES[form.difficulty],
        p_position: form.position || 1,
        p_is_active: form.is_active,
        p_media_url: mediaUrl,
        p_media_type: mediaType,
        p_image_duration:
          mediaType === "image"
            ? normalizePositiveInt(form.image_duration, 600)
            : null,
        p_media_play_count:
          mediaType === "audio" || mediaType === "video"
            ? normalizePositiveInt(form.media_play_count, 20)
            : null,
        p_answer_image_url: form.answer_image_url?.trim() || null,
      });
      if (error) throw error;
      notify(form.id ? "تم تحديث السؤال." : "تم إضافة السؤال.");
      await loadQuestions();
      setQModal(null);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  // Quick inline difficulty change from the table row's dropdown — reuses
  // saveQuestion with the row's existing fields so nothing else changes.
  const handleInlineDifficultyChange = async (question, newDifficulty) => {
    setDifficultyEditFor(null);
    if (newDifficulty === question.difficulty) return;
    await saveQuestion({ ...question, difficulty: newDifficulty });
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm("حذف هذا السؤال؟")) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_delete_question", {
        p_id: id,
      });
      if (error) throw error;
      notify("تم حذف السؤال.");
      await loadQuestions();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesCategory = filterCategory
      ? q.category_id === filterCategory
      : true;
    const matchesSearch = searchQuery
      ? q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer_text?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const filteredCategories = categories.filter((c) => {
    return searchQuery
      ? c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
  });

  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[String(c.id)] = c;
    if (c.name) {
      categoryMap[c.name.trim()] = c;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-1">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} onClose={closeToast} />
      <AnimatePresence>
        {catModal !== null && (
          <CategoryModal
            category={catModal.id ? catModal : null}
            categories={categories}
            onSave={saveCategory}
            onClose={() => setCatModal(null)}
            busy={busy}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {qModal !== null && (
          <QuestionModal
            question={qModal.id ? qModal : null}
            categories={categories}
            questions={questions}
            onSave={saveQuestion}
            onClose={() => setQModal(null)}
            busy={busy}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      </AnimatePresence>

      <div className="flex flex-1 min-h-[calc(100vh-32px)]">
        <AdminSidebar tab={tab} setTab={setTab} />

        {/* Main Content Area */}
        <main className="flex-1 bg-[#f0f0f1] p-3 sm:p-6 text-[#2c3338] overflow-auto">
          {/* WordPress Page Header Tools */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-normal text-[#1d2327]">
                {tab === "dashboard" && "لوحة التحكم الرئيسة"}
                {tab === "questions" && "الأسئلة"}
                {tab === "categories" && "تصنيفات الأسئلة"}
                {tab === "users" && "المستخدمين"}
                {tab === "stats" && "إحصائيات اللعبة"}
              </h1>

              {tab === "questions" && (
                <button
                  onClick={() => setQModal({})}
                  disabled={categories.length === 0}
                  className="bg-[#f6f7f7] border border-[#2271b1] hover:bg-[#f0f0f1] text-[#2271b1] text-xs font-semibold px-2.5 py-1 rounded transition shadow-sm"
                >
                  أضف جديداً
                </button>
              )}
              {tab === "categories" && (
                <button
                  onClick={() => setCatModal({})}
                  className="bg-[#f6f7f7] border border-[#2271b1] hover:bg-[#f0f0f1] text-[#2271b1] text-xs font-semibold px-2.5 py-1 rounded transition shadow-sm"
                >
                  أضف جديداً
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-[12px] bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-600 shadow-sm hover:bg-slate-50 cursor-pointer flex items-center gap-1 select-none outline-none focus:ring-2 focus:ring-cyan-500/20"
              >
                <HelpCircle className="w-3.5 h-3.5" /> المساعدة
              </button>
            </div>
          </div>

          {tab === "dashboard" && (
            <DashboardTab
              questions={questions}
              categories={categories}
              setTab={setTab}
            />
          )}

          {tab === "questions" && (
            <QuestionsTab
              categories={categories}
              categoryMap={categoryMap}
              questions={questions}
              filteredQuestions={filteredQuestions}
              questionStats={questionStats}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              busy={busy}
              setQModal={setQModal}
              deleteQuestion={deleteQuestion}
              difficultyEditFor={difficultyEditFor}
              setDifficultyEditFor={setDifficultyEditFor}
              onInlineDifficultyChange={handleInlineDifficultyChange}
            />
          )}

          {tab === "categories" && (
            <CategoriesTab
              categories={categories}
              filteredCategories={filteredCategories}
              questions={questions}
              categoryUsage={categoryUsage}
              busy={busy}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setCatModal={setCatModal}
              deleteCategory={deleteCategory}
            />
          )}

          {tab === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <UsersManager notify={notify} />
            </motion.div>
          )}

          {tab === "stats" && (
            <StatsTab
              categories={categories}
              questions={questions}
              categoryUsage={categoryUsage}
            />
          )}
        </main>
      </div>
    </>
  );
}
