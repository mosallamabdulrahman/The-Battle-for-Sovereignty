export const FIXED_TACTICAL_TOOLS = ["radar_scan", "shield", "extra_strike"];
export const LIFELINE_TOOLS = [
  // "lifeline_call",
  // "double_chance",
  // "the_hole",
  "the_detector",
];

export const TACTICAL_TOOL_DETAILS = {
  radar_scan: {
    name: "مسح الرادار",
    description: "يكشف حالة المربع المحدد والمربعات الملاصقة له مرة واحدة.",
  },
  shield: {
    name: "الدرع",
    description: "يصد أول ضربة ناجحة على وحدة من وحداتك.",
  },
  extra_strike: {
    name: "ضربة إضافية",
    description: "يضيف ضربة واحدة إلى رصيد ضربات الفريق.",
  },
  lifeline_call: {
    name: "اتصال بصديق",
    description: "يمنحك 60 ثانية إضافية للتفكير — يظهر عداد تنازلي.",
  },
  double_chance: {
    name: "جوابين",
    description: "فرصة للإجابة مرتين على نفس السؤال.",
  },
  the_hole: {
    name: "الحفرة",
    description:
      "فعّلها قبل السؤال — الصواب يمنحك ضربة إضافية، والخطأ يُضيعها.",
  },
  the_detector: {
    name: "الكاشف",
    description:
      "يكشف المربع المختار والمربعات الملاصقة له — يظهر بعد نصف الأسئلة.",
  },
};

export const FALLBACK_CATEGORIES = [];

export const DIFFICULTIES = [
  { difficulty: "easy", strikes: 1, points: 200 },
  { difficulty: "easy", strikes: 1, points: 200 },
  { difficulty: "medium", strikes: 2, points: 400 },
  { difficulty: "medium", strikes: 2, points: 400 },
  { difficulty: "hard", strikes: 3, points: 600 },
  { difficulty: "hard", strikes: 3, points: 600 },
];

const normalizeQuestionRow = (question, category) => ({
  category_id: category.id,
  category_name: category.name,
  category_image_url: category.image_url || "",
  question_text: question.question_text,
  answer_text: question.answer_text,
  position: question.position,
  difficulty: question.difficulty,
  strikes: question.strikes,
  points: question.points,
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
        "id,category_id,question_text,answer_text,difficulty,strikes,points,position,is_active",
      )
      .eq("is_active", true)
      .order("category_id", { ascending: true })
      .order("position", { ascending: true }),
  ]);

  if (categoriesResult.error || questionsResult.error) {
    return {
      categories: FALLBACK_CATEGORIES,
      questions: [],
      fromSupabase: false,
      error: categoriesResult.error || questionsResult.error,
    };
  }

  const categories = (categoriesResult.data || []).map((category) => ({
    id: category.id,
    name: category.name,
    desc: category.description,
    emoji: category.emoji || "📌",
  }));

  if (!categories.length) {
    return {
      categories: FALLBACK_CATEGORIES,
      questions: [],
      fromSupabase: false,
      error: null,
    };
  }

  return {
    categories,
    questions: questionsResult.data || [],
    fromSupabase: true,
    error: null,
  };
};
