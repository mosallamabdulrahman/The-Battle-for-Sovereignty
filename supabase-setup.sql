-- =============================================================
-- معركة سيادة — Database Setup & Migration
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- PART 1: ALTER TABLES
-- ─────────────────────────────────────────────────────────────

-- Media support on question_bank
ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS media_url  TEXT,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(10)
    CHECK (media_type IS NULL OR media_type IN ('image', 'audio'));

-- Media support on room_questions (mirrors question_bank at room creation)
ALTER TABLE room_questions
  ADD COLUMN IF NOT EXISTS media_url  TEXT,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(10)
    CHECK (media_type IS NULL OR media_type IN ('image', 'audio'));

-- Score starts at 4000 for every new team
ALTER TABLE teams ALTER COLUMN score SET DEFAULT 4000;

-- ─────────────────────────────────────────────────────────────
-- PART 2: execute_strike (−150 for unit hit, −300 for mine)
-- ─────────────────────────────────────────────────────────────

-- Drop first to allow return-type change
DROP FUNCTION IF EXISTS execute_strike(uuid, integer, integer);

CREATE OR REPLACE FUNCTION execute_strike(
  p_room_id            UUID,
  p_attacker_team_index INT,
  p_cell_index         INT
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_attacker teams%ROWTYPE;
  v_target   teams%ROWTYPE;
  v_cell     TEXT;
  v_result   TEXT;
BEGIN
  SELECT * INTO v_attacker FROM teams
    WHERE room_id = p_room_id AND team_index = p_attacker_team_index FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'الفريق المهاجم غير موجود.'; END IF;
  IF v_attacker.available_strikes <= 0 THEN RAISE EXCEPTION 'لا توجد ضربات متاحة.'; END IF;

  SELECT * INTO v_target FROM teams
    WHERE room_id = p_room_id AND team_index != p_attacker_team_index FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'الفريق المستهدف غير موجود.'; END IF;

  v_cell := v_target.board ->> p_cell_index;

  IF v_cell IS NULL OR v_cell = 'null' THEN
    v_result := 'miss';

  ELSIF v_cell = '"mine"' OR v_cell = 'mine' THEN
    IF v_attacker.shield_active THEN
      v_result := 'blocked';
      UPDATE teams SET shield_active = false WHERE id = v_attacker.id;
    ELSE
      v_result := 'mine';
      -- Attacker takes −300 for hitting own mine
      UPDATE teams SET score = score - 300 WHERE id = v_attacker.id;
      -- Clear the mine cell on target board
      UPDATE teams
        SET board = jsonb_set(board, ARRAY[p_cell_index::TEXT], 'null'::jsonb)
        WHERE id = v_target.id;
    END IF;

  ELSE
    IF v_target.shield_active THEN
      v_result := 'blocked';
      UPDATE teams SET shield_active = false WHERE id = v_target.id;
    ELSE
      v_result := 'hit';
      -- Target loses −150 per unit hit
      UPDATE teams SET score = score - 150 WHERE id = v_target.id;
      -- Destroy the unit
      UPDATE teams
        SET board = jsonb_set(board, ARRAY[p_cell_index::TEXT], 'null'::jsonb)
        WHERE id = v_target.id;
    END IF;
  END IF;

  -- Consume one strike from attacker
  UPDATE teams SET available_strikes = available_strikes - 1 WHERE id = v_attacker.id;

  -- Record event
  INSERT INTO combat_events
    (room_id, event_type, actor_team_index, target_team_index, cell_index, result, metadata)
  VALUES
    (p_room_id, 'strike', p_attacker_team_index, v_target.team_index,
     p_cell_index, v_result, '{}'::jsonb);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- PART 3: resolve_room_question (p_winner_team_index: 0=draw, 1/2=winner, NULL=nobody)
-- ─────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS resolve_room_question(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION resolve_room_question(
  p_room_id            UUID,
  p_question_id        UUID,
  p_winner_team_index  INT  -- 1 or 2 = one team wins | 0 = both win | NULL = nobody wins
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_q room_questions%ROWTYPE;
BEGIN
  SELECT * INTO v_q FROM room_questions
    WHERE id = p_question_id AND room_id = p_room_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'السؤال غير موجود.'; END IF;

  UPDATE room_questions SET is_used = true     WHERE id = p_question_id;
  UPDATE game_rooms      SET active_question_id = NULL WHERE id = p_room_id;

  IF p_winner_team_index = 0 THEN
    -- Both teams correct → both get strikes
    UPDATE teams SET available_strikes = available_strikes + v_q.strikes
      WHERE room_id = p_room_id;
    INSERT INTO combat_events
      (room_id, event_type, actor_team_index, result, metadata)
    VALUES
      (p_room_id, 'question_resolved', NULL, NULL,
       jsonb_build_object('strikes', v_q.strikes, 'draw', true));

  ELSIF p_winner_team_index IN (1, 2) THEN
    -- One team correct → that team gets strikes
    UPDATE teams SET available_strikes = available_strikes + v_q.strikes
      WHERE room_id = p_room_id AND team_index = p_winner_team_index;
    INSERT INTO combat_events
      (room_id, event_type, actor_team_index, result, metadata)
    VALUES
      (p_room_id, 'question_resolved', p_winner_team_index, NULL,
       jsonb_build_object('strikes', v_q.strikes));

  ELSE
    -- Both wrong → nobody gets strikes
    INSERT INTO combat_events
      (room_id, event_type, actor_team_index, result, metadata)
    VALUES
      (p_room_id, 'question_resolved', NULL, NULL,
       jsonb_build_object('strikes', 0));
  END IF;

  -- Advance turn
  UPDATE game_rooms
    SET current_turn = CASE WHEN current_turn = 1 THEN 2 ELSE 1 END
    WHERE id = p_room_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- PART 4: finalize_room_if_complete
--   Win condition A: a team loses ALL 33 units → instant loss
--   Win condition B: all 36 questions used → highest score wins
-- ─────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS finalize_room_if_complete(uuid);

CREATE OR REPLACE FUNCTION finalize_room_if_complete(
  p_room_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_room     game_rooms%ROWTYPE;
  v_t1       teams%ROWTYPE;
  v_t2       teams%ROWTYPE;
  v_t1_alive BIGINT;
  v_t2_alive BIGINT;
  v_q_left   BIGINT;
  v_winner   INT := NULL;
BEGIN
  SELECT * INTO v_room FROM game_rooms WHERE id = p_room_id;
  IF NOT FOUND OR v_room.status != 'playing' THEN RETURN; END IF;

  SELECT * INTO v_t1 FROM teams WHERE room_id = p_room_id AND team_index = 1;
  SELECT * INTO v_t2 FROM teams WHERE room_id = p_room_id AND team_index = 2;

  -- Count alive (non-null JSON) units for each team
  SELECT COUNT(*) INTO v_t1_alive
    FROM jsonb_array_elements(v_t1.board) e
    WHERE e::TEXT NOT IN ('null', '"null"') AND e IS DISTINCT FROM 'null'::jsonb;

  SELECT COUNT(*) INTO v_t2_alive
    FROM jsonb_array_elements(v_t2.board) e
    WHERE e::TEXT NOT IN ('null', '"null"') AND e IS DISTINCT FROM 'null'::jsonb;

  -- Count unused questions
  SELECT COUNT(*) INTO v_q_left
    FROM room_questions WHERE room_id = p_room_id AND is_used = false;

  -- Instant loss: all units destroyed
  IF v_t1_alive = 0 AND v_t2_alive = 0 THEN
    v_winner := NULL;  -- mutual destruction → draw
  ELSIF v_t1_alive = 0 THEN
    v_winner := 2;
  ELSIF v_t2_alive = 0 THEN
    v_winner := 1;
  -- All 36 questions exhausted
  ELSIF v_q_left = 0 THEN
    IF    v_t1.score > v_t2.score THEN v_winner := 1;
    ELSIF v_t2.score > v_t1.score THEN v_winner := 2;
    ELSE  v_winner := NULL; END IF;
  ELSE
    RETURN;  -- game continues
  END IF;

  UPDATE game_rooms
    SET status = 'finished', winner_team_index = v_winner
    WHERE id = p_room_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- PART 5: (Optional) Backfill room_questions with media
--   If you have a setup_room or create_game_room RPC that copies
--   rows from question_bank → room_questions, add media_url and
--   media_type to its INSERT SELECT:
--
--     INSERT INTO room_questions (..., media_url, media_type)
--     SELECT ..., qb.media_url, qb.media_type FROM question_bank qb ...;
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- PART 6: SEED — dummy media for testing
--   Unsplash images (free to use) + public-domain audio stubs.
--   Replace with real question IDs from your question_bank, or
--   run these as-is and let the UPDATE match by position/category.
-- ─────────────────────────────────────────────────────────────

-- Image seeds — pick first 3 questions of the first active category
WITH targets AS (
  SELECT qb.id, ROW_NUMBER() OVER (ORDER BY qb.position) AS rn
  FROM question_bank qb
  JOIN question_categories qc ON qb.category_id = qc.id
  WHERE qb.is_active = true AND qc.is_active = true
  LIMIT 3
)
UPDATE question_bank qb SET
  media_url  = CASE t.rn
    WHEN 1 THEN 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80'
    WHEN 2 THEN 'https://images.unsplash.com/photo-1532094349884-543559059814?w=800&q=80'
    WHEN 3 THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
  END,
  media_type = 'image'
FROM targets t WHERE qb.id = t.id;

-- Audio seed — pick 4th question (public-domain NASA countdown)
WITH target AS (
  SELECT qb.id FROM question_bank qb
  JOIN question_categories qc ON qb.category_id = qc.id
  WHERE qb.is_active = true AND qc.is_active = true
  ORDER BY qb.position LIMIT 1 OFFSET 3
)
UPDATE question_bank SET
  media_url  = 'https://www.nasa.gov/wp-content/uploads/2015/01/590325main_ringtone_countdown.mp3',
  media_type = 'audio'
FROM target WHERE question_bank.id = target.id;

-- Verify results
SELECT id, question_text, media_type, LEFT(media_url, 60) AS media_url_preview
FROM question_bank WHERE media_url IS NOT NULL;
