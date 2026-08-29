import "server-only";

// PostgREST caps a single response at 1000 rows — the question bank is
// already near that, so every admin read pages through the whole table
// instead of silently truncating once it grows past the cap.
const PAGE_SIZE = 1000;

const fetchAllRows = async (buildQuery) => {
  const rows = [];

  for (let page = 0; ; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);

    if (error) return { rows: null, error };

    rows.push(...(data || []));
    if ((data || []).length < PAGE_SIZE) break;
  }

  return { rows, error: null };
};

// The admin panel must see EVERY category/question, including the ones with
// is_active = false — those are hidden from the public game only, and the
// panel is exactly where they get edited back on. The browser client can't
// read them (RLS on these tables only exposes active rows), so admin reads
// go through the service-role client behind an is_admin() check instead.
export const loadAllCategories = (supabaseAdmin) =>
  fetchAllRows(() =>
    supabaseAdmin
      .from("question_categories")
      .select("*")
      .order("sort_order", { ascending: true }),
  );

export const loadAllQuestions = (supabaseAdmin) =>
  fetchAllRows(() =>
    supabaseAdmin
      .from("question_bank")
      .select("*")
      .order("category_id", { ascending: true })
      .order("position", { ascending: true }),
  );
