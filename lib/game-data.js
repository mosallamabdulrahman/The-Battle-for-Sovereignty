export const FIXED_TACTICAL_TOOLS = ["radar_scan", "shield", "extra_strike"];
export const LIFELINE_TOOLS = [];

export const UNIT_IMAGES = {
  infantry: "/images/gear/infantry.png",
  armored: "/images/gear/armored.png",
  tank: "/images/gear/tank.png",
  aircraft: "/images/gear/aircraft.png",
  submarine: "/images/gear/submarine.png",
  mine: "/images/gear/mine.png",
};

export const UNIT_NAMES = {
  infantry: "جندي",
  armored: "مدرعة",
  tank: "دبابة",
  aircraft: "طائرة",
  submarine: "غواصة",
  mine: "لغم",
};

export const TACTICAL_TOOL_DETAILS = {
  radar_scan: {
    name: "الرادار",
    description: "يبين لك المربع اللي اخترته وكل المربعات اللي يمه (3x3). طق على مربع بخريطة الخصم.",
  },
  shield: {
    name: "الدرع",
    description: "يصد أول طقة تصيب جنودك. لازم تشغله قبل لا تبطل السؤال.",
  },
  extra_strike: {
    name: "طقّة زيادة",
    description: "يزيد رصيدك طقة وحدة. لازم تشغله قبل لا تبطل السؤال.",
  },
  lifeline_call: {
    name: "اتصال بصديق",
    description: "يعطيك 60 ثانية زيادة للتفكير — راح يبين عندك العداد.",
  },
  double_chance: {
    name: "فرصتين",
    description: "تقدر تجاوب مرتين على نفس السؤال.",
  },
  the_hole: {
    name: "الحفرة",
    description:
      "شغلها قبل لا تبطل السؤال — إذا جاوبت صح تاخذ طقة زيادة، وإذا غلط تروح عليك الفزعة.",
  },
  the_detector: {
    name: "الكاشف",
    description:
      "يكشف المربع اللي اخترته والمربعات اللي يمه — يطلع عقب نص الأسئلة.",
  },
};

export const FALLBACK_CATEGORIES = [];

// Content hierarchy: group (التصنيف) ➜ question category (فئة الأسئلة) ➜
// question. Splits the flat category list into collapsible sections without
// touching the incoming order (Supabase already sorts by sort_order), so the
// cards keep showing up exactly where the admin panel puts them and the
// sections themselves follow the order their first card appears in.
//
// Section titles always come from the `category_groups` rows — there is no
// hardcoded fallback title. A category that isn't attached to a group yet
// (or points at a deleted one) is handed back separately in `ungrouped` so
// the caller can still render it instead of silently dropping the card.
export const groupCategories = (categories = [], groups = []) => {
  const nameByGroupId = new Map(
    (groups || []).map((group) => [String(group.id), group.name]),
  );

  const grouped = [];
  const indexByGroupId = new Map();
  const ungrouped = [];

  (categories || []).forEach((category) => {
    const groupId = category.group_id ? String(category.group_id) : "";
    const title = nameByGroupId.get(groupId);

    if (!title) {
      ungrouped.push(category);
      return;
    }

    if (!indexByGroupId.has(groupId)) {
      indexByGroupId.set(groupId, grouped.length);
      grouped.push({ id: groupId, title, items: [] });
    }

    grouped[indexByGroupId.get(groupId)].items.push(category);
  });

  return { groups: grouped, ungrouped };
};

// Difficulty tiers, in the order they should appear top-to-bottom on the
// question board (easy row, then medium row, then hard row).
export const DIFFICULTY_TIERS = ["easy", "medium", "hard"];

const normalizeQuestionRow = (question, category) => ({
  question_bank_id:   question.id,
  category_id:        category.id,
  category_name:      category.name,
  category_image_url: category.image_url || "",
  question_text:      question.question_text,
  answer_text:        question.answer_text,
  position:           question.position,
  difficulty:         question.difficulty,
  strikes:            question.strikes,
  media_url:          question.media_url  || null,
  media_type:         question.media_type || null,
  // Playback rules travel with the room snapshot the same way media_url does,
  // so editing the bank later can't change how an in-progress room behaves.
  image_duration:     question.image_duration   || null,
  media_play_count:   question.media_play_count || null,
  show_question_first: Boolean(question.show_question_first),
  answer_image_url:   question.answer_image_url || null,
});

const shuffle = (rows) => {
  const copy = [...rows];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// A category can hold any number of active questions per difficulty tier —
// randomly pick up to 2 per tier (easy/medium/hard) so a room always shows
// the same 2-2-2 layout, and having more than 2 per tier in the bank adds
// variety across games instead of always replaying the same questions.
// If a tier is short on questions the category simply contributes fewer
// than 6 for that room — the board renders the missing slots as disabled.
export const buildRoomQuestions = (categories, questionRows = []) =>
  categories.flatMap((category) => {
    const categoryRows = questionRows.filter(
      (question) => question.category_id === category.id,
    );

    let position = 0;
    return DIFFICULTY_TIERS.flatMap((difficulty) => {
      const tierRows = shuffle(
        categoryRows.filter((question) => question.difficulty === difficulty),
      ).slice(0, 2);

      return tierRows.map((question) => {
        position += 1;
        return normalizeQuestionRow({ ...question, position }, category);
      });
    });
  });

const CATEGORY_COLUMNS = "id,name,description,image_url,sort_order,is_active";

// PostgREST codes for "the migration hasn't been run yet": 42703 is an
// unknown column, PGRST205 an unknown table. Both mean the 3-tier group
// schema isn't in place, and the setup screen has to keep working anyway —
// the cards simply render without any group section until it is.
const isMissingSchema = (error, name) =>
  error?.code === "42703" ||
  error?.code === "PGRST205" ||
  new RegExp(name, "i").test(error?.message || "");

// `group_id` points at the category's row in `category_groups` and drives the
// collapsible sections on the setup screen.
const fetchActiveCategories = async (supabase) => {
  const query = (columns) =>
    supabase
      .from("question_categories")
      .select(columns)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

  const withGroup = await query(`${CATEGORY_COLUMNS},group_id`);
  if (!withGroup.error) return withGroup;
  if (!isMissingSchema(withGroup.error, "group_id")) return withGroup;

  return query(CATEGORY_COLUMNS);
};

// Group titles are always read from the database — nothing is hardcoded, so a
// renamed group instantly renames its section on the home page.
const fetchCategoryGroups = async (supabase) => {
  const result = await supabase
    .from("category_groups")
    .select("id,name")
    .order("created_at", { ascending: true });

  if (result.error && isMissingSchema(result.error, "category_groups")) {
    return { data: [], error: null };
  }

  return result;
};

const QUESTION_BANK_COLUMNS =
  "id,category_id,question_text,answer_text,difficulty,strikes,position,is_active,media_url,media_type,image_duration,media_play_count,answer_image_url";

const fetchActiveQuestions = async (supabase) => {
  const withOption = await supabase
    .from("question_bank")
    .select(`${QUESTION_BANK_COLUMNS},show_question_first`)
    .eq("is_active", true)
    .order("category_id", { ascending: true })
    .order("position", { ascending: true });

  if (!withOption.error) return withOption;
  if (!isMissingSchema(withOption.error, "show_question_first")) return withOption;

  return supabase
    .from("question_bank")
    .select(QUESTION_BANK_COLUMNS)
    .eq("is_active", true)
    .order("category_id", { ascending: true })
    .order("position", { ascending: true });
};

export const loadQuestionSetupData = async (supabase) => {
  const [categoriesResult, groupsResult, questionsResult] = await Promise.all([
    fetchActiveCategories(supabase),
    fetchCategoryGroups(supabase),
    fetchActiveQuestions(supabase),
  ]);

  if (categoriesResult.error || questionsResult.error) {
    return {
      categories:   FALLBACK_CATEGORIES,
      groups:       [],
      questions:    [],
      fromSupabase: false,
      error:        categoriesResult.error || questionsResult.error,
    };
  }

  const categories = (categoriesResult.data || []).map((category) => ({
    id:        category.id,
    name:      category.name,
    desc:      category.description,
    image_url: category.image_url || "",
    group_id:  category.group_id || null,
  }));

  if (!categories.length) {
    return {
      categories:   FALLBACK_CATEGORIES,
      groups:       [],
      questions:    [],
      fromSupabase: false,
      error:        null,
    };
  }

  return {
    categories,
    groups:       groupsResult.data || [],
    questions:    questionsResult.data || [],
    fromSupabase: true,
    error:        null,
  };
};
