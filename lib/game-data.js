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

export const loadQuestionSetupData = async (supabase) => {
  const [categoriesResult, questionsResult] = await Promise.all([
    supabase
      .from("question_categories")
      .select("id,name,description,image_url,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("question_bank")
      .select(
        "id,category_id,question_text,answer_text,difficulty,strikes,position,is_active,media_url,media_type,image_duration,media_play_count,answer_image_url",
      )
      .eq("is_active", true)
      .order("category_id", { ascending: true })
      .order("position",    { ascending: true }),
  ]);

  if (categoriesResult.error || questionsResult.error) {
    return {
      categories:   FALLBACK_CATEGORIES,
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
  }));

  if (!categories.length) {
    return {
      categories:   FALLBACK_CATEGORIES,
      questions:    [],
      fromSupabase: false,
      error:        null,
    };
  }

  return {
    categories,
    questions:    questionsResult.data || [],
    fromSupabase: true,
    error:        null,
  };
};
