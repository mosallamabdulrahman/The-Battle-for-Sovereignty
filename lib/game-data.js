export const FIXED_TACTICAL_TOOLS = ["radar_scan", "shield", "extra_strike"];
export const LIFELINE_TOOLS = [];

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

// Difficulties: strike counts only — no point values
export const DIFFICULTIES = [
  { difficulty: "easy",   strikes: 1 },
  { difficulty: "easy",   strikes: 1 },
  { difficulty: "medium", strikes: 2 },
  { difficulty: "medium", strikes: 2 },
  { difficulty: "hard",   strikes: 3 },
  { difficulty: "hard",   strikes: 3 },
];

const normalizeQuestionRow = (question, category) => ({
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
});

export const buildRoomQuestions = (categories, questionRows = []) =>
  categories.flatMap((category) => {
    const databaseSource = questionRows
      .filter((question) => question.category_id === category.id)
      .sort((a, b) => a.position - b.position);

    if (databaseSource.length >= 6) {
      return databaseSource.slice(0, 6).map((question, index) =>
        normalizeQuestionRow(
          {
            ...DIFFICULTIES[index],
            ...question,
            position: question.position || index + 1,
          },
          category,
        ),
      );
    }
    return [];
  });

export const loadQuestionSetupData = async (supabase) => {
  const [categoriesResult, questionsResult] = await Promise.all([
    supabase
      .from("question_categories")
      .select("id,name,description,emoji,image_url,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("question_bank")
      .select(
        "id,category_id,question_text,answer_text,difficulty,strikes,position,is_active,media_url,media_type",
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
    id:    category.id,
    name:  category.name,
    desc:  category.description,
    emoji: category.emoji || "📌",
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
