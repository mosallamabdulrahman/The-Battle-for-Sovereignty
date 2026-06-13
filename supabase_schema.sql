-- Run this file in Supabase Dashboard > SQL Editor.
-- It creates the base schema and safely upgrades an existing installation.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(display_name) between 2 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references public.profiles(id) on delete cascade,
  team_1_name text not null default 'الفريق الأول',
  team_2_name text not null default 'الفريق الثاني',
  selected_categories text[] not null default '{}',
  team_1_tools text[] not null default '{radar_scan,shield,extra_strike}',
  team_2_tools text[] not null default '{radar_scan,shield,extra_strike}',
  status text not null default 'setup',
  current_turn integer not null default 1,
  abandoned_by text,
  winner_team_index integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  team_index integer not null check (team_index in (1, 2)),
  name text not null,
  points integer not null default 1000 check (points >= 0),
  score integer not null default 1000 check (score >= 0),
  available_strikes integer not null default 0 check (available_strikes >= 0),
  is_ready boolean not null default false,
  joined boolean not null default false,
  member_id uuid references public.profiles(id) on delete set null,
  board jsonb not null default '[]'::jsonb,
  tools text[] not null default '{radar_scan,shield,extra_strike}',
  used_tools text[] not null default '{}',
  shield_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, team_index)
);

alter table public.game_rooms
  add column if not exists current_turn integer not null default 1,
  add column if not exists abandoned_by text,
  add column if not exists winner_team_index integer;

alter table public.teams
  add column if not exists score integer not null default 1000,
  add column if not exists available_strikes integer not null default 0,
  add column if not exists tools text[] not null default '{radar_scan,shield,extra_strike}',
  add column if not exists used_tools text[] not null default '{}',
  add column if not exists shield_active boolean not null default false;

alter table public.game_rooms
  drop constraint if exists game_rooms_status_check;

update public.game_rooms
set status = 'playing'
where status = 'battle_ready';

update public.game_rooms
set team_1_tools = array['radar_scan', 'shield', 'extra_strike'],
    team_2_tools = array['radar_scan', 'shield', 'extra_strike'];

update public.teams
set tools = array['radar_scan', 'shield', 'extra_strike']
where cardinality(tools) = 0;

alter table public.game_rooms
  drop constraint if exists game_rooms_current_turn_check,
  drop constraint if exists game_rooms_winner_team_index_check;

alter table public.game_rooms
  add constraint game_rooms_status_check
    check (status in ('setup', 'playing', 'abandoned', 'finished')),
  add constraint game_rooms_current_turn_check
    check (current_turn in (1, 2)),
  add constraint game_rooms_winner_team_index_check
    check (winner_team_index is null or winner_team_index in (1, 2));

create table if not exists public.room_questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  category_id text not null,
  category_name text not null,
  question_text text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  strikes integer not null check (strikes in (1, 2, 3)),
  points integer not null check (points in (200, 400, 600)),
  position integer not null check (position between 1 and 6),
  is_used boolean not null default false,
  awarded_team_index integer check (awarded_team_index is null or awarded_team_index in (1, 2)),
  selected_by_team integer check (selected_by_team is null or selected_by_team in (1, 2)),
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, category_id, position)
);

create table if not exists public.room_question_answers (
  question_id uuid primary key references public.room_questions(id) on delete cascade,
  answer_text text not null
);

create table if not exists public.combat_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  event_type text not null,
  actor_team_index integer check (actor_team_index is null or actor_team_index in (1, 2)),
  target_team_index integer check (target_team_index is null or target_team_index in (1, 2)),
  cell_index integer check (cell_index is null or cell_index between 0 and 35),
  result text,
  unit_type text,
  points_delta integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.game_rooms
  add column if not exists active_question_id uuid references public.room_questions(id) on delete set null;

create index if not exists room_questions_room_id_idx
  on public.room_questions(room_id);

create index if not exists combat_events_room_created_idx
  on public.combat_events(room_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists game_rooms_set_updated_at on public.game_rooms;
create trigger game_rooms_set_updated_at
before update on public.game_rooms
for each row execute function public.set_updated_at();

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'مستخدم'
    ), 40)
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, display_name)
select
  id,
  coalesce(email, ''),
  left(coalesce(
    nullif(trim(raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(email, '@', 1), ''),
    'مستخدم'
  ), 40)
from auth.users
on conflict (id) do update
set email = excluded.email,
    display_name = excluded.display_name,
    updated_at = now();

create or replace function public.create_game_room(
  p_team_1_name text,
  p_team_2_name text,
  p_selected_categories text[],
  p_questions jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_question_id uuid;
  v_question record;
  v_fixed_tools text[] := array['radar_scan', 'shield', 'extra_strike'];
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(p_team_1_name)) < 2 or char_length(trim(p_team_2_name)) < 2 then
    raise exception 'Both team names are required';
  end if;

  if cardinality(p_selected_categories) <> 6 then
    raise exception 'Exactly six categories are required';
  end if;

  if jsonb_array_length(p_questions) <> 36 then
    raise exception 'Exactly 36 questions are required';
  end if;

  insert into public.game_rooms (
    judge_id,
    team_1_name,
    team_2_name,
    selected_categories,
    team_1_tools,
    team_2_tools,
    status
  )
  values (
    auth.uid(),
    trim(p_team_1_name),
    trim(p_team_2_name),
    p_selected_categories,
    v_fixed_tools,
    v_fixed_tools,
    'setup'
  )
  returning id into v_room_id;

  insert into public.teams (
    room_id,
    team_index,
    name,
    points,
    score,
    board,
    tools
  )
  values
    (v_room_id, 1, trim(p_team_1_name), 1000, 1000, jsonb_build_array(), v_fixed_tools),
    (v_room_id, 2, trim(p_team_2_name), 1000, 1000, jsonb_build_array(), v_fixed_tools);

  update public.teams
  set board = (
    select jsonb_agg(null::jsonb)
    from generate_series(1, 36)
  )
  where room_id = v_room_id;

  for v_question in
    select *
    from jsonb_to_recordset(p_questions) as q(
      category_id text,
      category_name text,
      question_text text,
      answer_text text,
      difficulty text,
      strikes integer,
      points integer,
      position integer
    )
  loop
    insert into public.room_questions (
      room_id,
      category_id,
      category_name,
      question_text,
      difficulty,
      strikes,
      points,
      position
    )
    values (
      v_room_id,
      v_question.category_id,
      v_question.category_name,
      v_question.question_text,
      v_question.difficulty,
      v_question.strikes,
      v_question.points,
      v_question.position
    )
    returning id into v_question_id;

    insert into public.room_question_answers (question_id, answer_text)
    values (v_question_id, v_question.answer_text);
  end loop;

  return v_room_id;
end;
$$;

create or replace function public.claim_team_slot(
  p_room_id uuid,
  p_team_index integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_team_index not in (1, 2) then
    raise exception 'Invalid team claim';
  end if;

  if exists (
    select 1 from public.game_rooms
    where id = p_room_id and judge_id = auth.uid()
  ) then
    raise exception 'The referee cannot claim a team slot';
  end if;

  if exists (
    select 1 from public.teams
    where room_id = p_room_id
      and team_index <> p_team_index
      and member_id = auth.uid()
  ) then
    raise exception 'One account cannot control both teams';
  end if;

  update public.teams
  set member_id = auth.uid(),
      joined = true
  where room_id = p_room_id
    and team_index = p_team_index
    and (member_id is null or member_id = auth.uid());

  if not found then
    raise exception 'This team is already assigned to another account';
  end if;
end;
$$;

create or replace function public.get_team_board(
  p_room_id uuid,
  p_team_index integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board jsonb;
begin
  select team.board into v_board
  from public.teams team
  join public.game_rooms room on room.id = team.room_id
  where team.room_id = p_room_id
    and team.team_index = p_team_index
    and (
      team.member_id = auth.uid()
      or room.judge_id = auth.uid()
    );

  if v_board is null then
    raise exception 'You cannot view this board';
  end if;

  return v_board;
end;
$$;

create or replace function public.update_team_deployment(
  p_room_id uuid,
  p_team_index integer,
  p_board jsonb,
  p_points integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost integer;
begin
  if jsonb_typeof(p_board) <> 'array' or jsonb_array_length(p_board) <> 36 then
    raise exception 'The board must contain 36 cells';
  end if;

  select coalesce(sum(
    case unit_type
      when 'infantry' then 10
      when 'tank' then 50
      when 'aircraft' then 100
      when 'submarine' then 200
      when 'mine' then 100
      else 0
    end
  ), 0)
  into v_cost
  from jsonb_array_elements_text(p_board) as units(unit_type);

  if p_points <> 1000 - v_cost or p_points < 0 then
    raise exception 'Invalid deployment points';
  end if;

  update public.teams team
  set board = p_board,
      points = p_points
  from public.game_rooms room
  where team.room_id = p_room_id
    and team.team_index = p_team_index
    and team.member_id = auth.uid()
    and team.is_ready = false
    and room.id = team.room_id
    and room.status = 'setup';

  if not found then
    raise exception 'Deployment cannot be updated';
  end if;
end;
$$;

create or replace function public.set_team_ready(
  p_room_id uuid,
  p_team_index integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.teams team
  set is_ready = true
  from public.game_rooms room
  where team.room_id = p_room_id
    and team.team_index = p_team_index
    and team.member_id = auth.uid()
    and jsonb_array_length(team.board) = 36
    and exists (
      select 1
      from jsonb_array_elements(team.board) as cell(value)
      where value <> 'null'::jsonb
    )
    and room.id = team.room_id
    and room.status = 'setup';

  if not found then
    raise exception 'The team cannot be marked ready';
  end if;
end;
$$;

create or replace function public.advance_room_when_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  if new.is_ready = true and (
    select count(*)
    from public.teams
    where room_id = new.room_id and is_ready = true
  ) = 2 then
    update public.game_rooms
    set status = 'playing'
    where id = new.room_id and status = 'setup'
    returning id into v_room_id;

    if v_room_id is not null then
      insert into public.combat_events (room_id, event_type, result)
      values (v_room_id, 'game_started', 'playing');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists teams_advance_room_when_ready on public.teams;
create trigger teams_advance_room_when_ready
after insert or update of is_ready on public.teams
for each row execute function public.advance_room_when_ready();

create or replace function public.select_room_question(
  p_room_id uuid,
  p_question_id uuid,
  p_team_index integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.game_rooms%rowtype;
  v_is_judge boolean;
begin
  select * into v_room
  from public.game_rooms
  where id = p_room_id
  for update;

  v_is_judge := v_room.judge_id = auth.uid();

  if v_room.status <> 'playing' or v_room.active_question_id is not null then
    raise exception 'A question cannot be selected now';
  end if;

  if exists (
    select 1 from public.teams
    where room_id = p_room_id and available_strikes > 0
  ) then
    raise exception 'Pending strikes must be executed before selecting another question';
  end if;

  if not v_is_judge then
    if p_team_index not in (1, 2) or p_team_index <> v_room.current_turn then
      raise exception 'It is not this team turn';
    end if;

    if not exists (
      select 1 from public.teams
      where room_id = p_room_id
        and team_index = p_team_index
        and member_id = auth.uid()
    ) then
      raise exception 'Team membership required';
    end if;
  end if;

  if not exists (
    select 1 from public.room_questions
    where id = p_question_id
      and room_id = p_room_id
      and is_used = false
  ) then
    raise exception 'Question is unavailable';
  end if;

  update public.room_questions
  set selected_by_team = coalesce(p_team_index, v_room.current_turn)
  where id = p_question_id;

  update public.game_rooms
  set active_question_id = p_question_id
  where id = p_room_id;

  insert into public.combat_events (
    room_id,
    event_type,
    actor_team_index,
    metadata
  )
  values (
    p_room_id,
    'question_selected',
    coalesce(p_team_index, v_room.current_turn),
    jsonb_build_object('question_id', p_question_id)
  );
end;
$$;

create or replace function public.finalize_room_if_complete(
  p_room_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unused_questions integer;
  v_pending_strikes integer;
  v_team_1_score integer;
  v_team_2_score integer;
  v_winner integer;
begin
  select count(*) into v_unused_questions
  from public.room_questions
  where room_id = p_room_id and is_used = false;

  select coalesce(sum(available_strikes), 0) into v_pending_strikes
  from public.teams
  where room_id = p_room_id;

  if v_unused_questions = 0 and v_pending_strikes = 0 then
    select score into v_team_1_score
    from public.teams
    where room_id = p_room_id and team_index = 1;

    select score into v_team_2_score
    from public.teams
    where room_id = p_room_id and team_index = 2;

    v_winner := case
      when v_team_1_score > v_team_2_score then 1
      when v_team_2_score > v_team_1_score then 2
      else null
    end;

    update public.game_rooms
    set status = 'finished',
        winner_team_index = v_winner,
        active_question_id = null
    where id = p_room_id and status = 'playing';

    if found then
      insert into public.combat_events (
        room_id,
        event_type,
        result,
        metadata
      )
      values (
        p_room_id,
        'game_finished',
        case when v_winner is null then 'draw' else 'winner' end,
        jsonb_build_object('winner_team_index', v_winner)
      );
    end if;
  end if;
end;
$$;

create or replace function public.get_question_answer(
  p_question_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_answer text;
begin
  select answer.answer_text
  into v_answer
  from public.room_question_answers answer
  join public.room_questions question on question.id = answer.question_id
  join public.game_rooms room on room.id = question.room_id
  where answer.question_id = p_question_id
    and room.judge_id = auth.uid();

  if v_answer is null then
    raise exception 'Only the referee can view the answer';
  end if;

  return v_answer;
end;
$$;

create or replace function public.resolve_room_question(
  p_room_id uuid,
  p_question_id uuid,
  p_winner_team_index integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.game_rooms%rowtype;
  v_question public.room_questions%rowtype;
begin
  if p_winner_team_index is not null and p_winner_team_index not in (1, 2) then
    raise exception 'Invalid winning team';
  end if;

  select * into v_room
  from public.game_rooms
  where id = p_room_id
  for update;

  if v_room.judge_id <> auth.uid() or v_room.status <> 'playing' then
    raise exception 'Only the referee can resolve an active question';
  end if;

  if v_room.active_question_id is distinct from p_question_id then
    raise exception 'This is not the active question';
  end if;

  select * into v_question
  from public.room_questions
  where id = p_question_id
    and room_id = p_room_id
    and is_used = false
  for update;

  if v_question.id is null then
    raise exception 'Question is unavailable';
  end if;

  update public.room_questions
  set is_used = true,
      awarded_team_index = p_winner_team_index,
      answered_at = now()
  where id = p_question_id;

  if p_winner_team_index is not null then
    update public.teams
    set available_strikes = available_strikes + v_question.strikes,
        score = score + v_question.points
    where room_id = p_room_id
      and team_index = p_winner_team_index;
  end if;

  update public.game_rooms
  set active_question_id = null,
      current_turn = case current_turn when 1 then 2 else 1 end
  where id = p_room_id;

  insert into public.combat_events (
    room_id,
    event_type,
    actor_team_index,
    result,
    points_delta,
    metadata
  )
  values (
    p_room_id,
    'question_resolved',
    p_winner_team_index,
    case when p_winner_team_index is null then 'no_correct_answer' else 'correct' end,
    case when p_winner_team_index is null then 0 else v_question.points end,
    jsonb_build_object(
      'question_id', p_question_id,
      'strikes', v_question.strikes,
      'difficulty', v_question.difficulty
    )
  );

  perform public.finalize_room_if_complete(p_room_id);

  return jsonb_build_object(
    'awarded_team_index', p_winner_team_index,
    'strikes', case when p_winner_team_index is null then 0 else v_question.strikes end,
    'points', case when p_winner_team_index is null then 0 else v_question.points end
  );
end;
$$;

create or replace function public.use_team_tool(
  p_room_id uuid,
  p_team_index integer,
  p_tool text,
  p_cell_index integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams%rowtype;
  v_enemy public.teams%rowtype;
  v_cells jsonb := '[]'::jsonb;
  v_row integer;
  v_col integer;
  v_scan_row integer;
  v_scan_col integer;
  v_index integer;
  v_unit text;
begin
  select team.* into v_team
  from public.teams team
  join public.game_rooms room on room.id = team.room_id
  where team.room_id = p_room_id
    and team.team_index = p_team_index
    and team.member_id = auth.uid()
    and room.status = 'playing'
  for update of team;

  if v_team.id is null
    or not (p_tool = any(v_team.tools))
    or p_tool = any(v_team.used_tools) then
    raise exception 'Tool is unavailable';
  end if;

  if p_tool = 'extra_strike' then
    update public.teams
    set available_strikes = available_strikes + 1,
        used_tools = array_append(used_tools, p_tool)
    where id = v_team.id;

    v_cells := jsonb_build_object('tool', p_tool, 'strikes_added', 1);
  elsif p_tool = 'shield' then
    update public.teams
    set shield_active = true,
        used_tools = array_append(used_tools, p_tool)
    where id = v_team.id;

    v_cells := jsonb_build_object('tool', p_tool, 'shield_active', true);
  elsif p_tool = 'radar_scan' then
    if p_cell_index is null or p_cell_index not between 0 and 35 then
      raise exception 'Choose a valid radar cell';
    end if;

    select * into v_enemy
    from public.teams
    where room_id = p_room_id
      and team_index <> p_team_index;

    v_row := p_cell_index / 6;
    v_col := p_cell_index % 6;

    for v_scan_row in greatest(v_row - 1, 0)..least(v_row + 1, 5) loop
      for v_scan_col in greatest(v_col - 1, 0)..least(v_col + 1, 5) loop
        v_index := v_scan_row * 6 + v_scan_col;
        v_unit := v_enemy.board ->> v_index;
        v_cells := v_cells || jsonb_build_array(
          jsonb_build_object(
            'cell_index', v_index,
            'occupied', v_unit is not null
          )
        );
      end loop;
    end loop;

    update public.teams
    set used_tools = array_append(used_tools, p_tool)
    where id = v_team.id;

    v_cells := jsonb_build_object('tool', p_tool, 'cells', v_cells);
  else
    raise exception 'Unknown tool';
  end if;

  insert into public.combat_events (
    room_id,
    event_type,
    actor_team_index,
    result,
    metadata
  )
  values (
    p_room_id,
    'tool_used',
    p_team_index,
    p_tool,
    jsonb_build_object('tool', p_tool)
  );

  return v_cells;
end;
$$;

create or replace function public.execute_strike(
  p_room_id uuid,
  p_attacker_team_index integer,
  p_cell_index integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attacker public.teams%rowtype;
  v_target public.teams%rowtype;
  v_unit text;
  v_cost integer := 0;
  v_result text;
begin
  if p_cell_index not between 0 and 35 then
    raise exception 'Invalid cell';
  end if;

  select team.* into v_attacker
  from public.teams team
  join public.game_rooms room on room.id = team.room_id
  where team.room_id = p_room_id
    and team.team_index = p_attacker_team_index
    and team.member_id = auth.uid()
    and team.available_strikes > 0
    and room.status = 'playing'
  for update of team;

  if v_attacker.id is null then
    raise exception 'No strike is available';
  end if;

  select * into v_target
  from public.teams
  where room_id = p_room_id
    and team_index <> p_attacker_team_index
  for update;

  if exists (
    select 1
    from public.combat_events
    where room_id = p_room_id
      and target_team_index = v_target.team_index
      and cell_index = p_cell_index
      and event_type = 'strike'
      and result in ('hit', 'miss', 'mine')
  ) then
    raise exception 'This cell was already attacked';
  end if;

  update public.teams
  set available_strikes = available_strikes - 1
  where id = v_attacker.id;

  v_unit := v_target.board ->> p_cell_index;

  if v_unit is null then
    v_result := 'miss';
  elsif v_unit = 'mine' then
    v_result := 'mine';
    v_cost := 100;

    update public.teams
    set score = greatest(score - v_cost, 0)
    where id = v_attacker.id;

    update public.teams
    set board = jsonb_set(board, array[p_cell_index::text], 'null'::jsonb, false)
    where id = v_target.id;
  elsif v_target.shield_active then
    v_result := 'blocked';

    update public.teams
    set shield_active = false
    where id = v_target.id;
  else
    v_result := 'hit';
    v_cost := case v_unit
      when 'infantry' then 10
      when 'tank' then 50
      when 'aircraft' then 100
      when 'submarine' then 200
      else 0
    end;

    update public.teams
    set board = jsonb_set(board, array[p_cell_index::text], 'null'::jsonb, false),
        score = greatest(score - v_cost, 0)
    where id = v_target.id;
  end if;

  insert into public.combat_events (
    room_id,
    event_type,
    actor_team_index,
    target_team_index,
    cell_index,
    result,
    unit_type,
    points_delta
  )
  values (
    p_room_id,
    'strike',
    p_attacker_team_index,
    v_target.team_index,
    p_cell_index,
    v_result,
    v_unit,
    case
      when v_result = 'hit' then -v_cost
      when v_result = 'mine' then -v_cost
      else 0
    end
  );

  perform public.finalize_room_if_complete(p_room_id);

  return jsonb_build_object(
    'result', v_result,
    'cell_index', p_cell_index,
    'unit_type', v_unit,
    'points_delta', case when v_result in ('hit', 'mine') then -v_cost else 0 end
  );
end;
$$;

create or replace function public.abandon_game(
  p_room_id uuid,
  p_actor_role text,
  p_team_index integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean := false;
begin
  if p_actor_role = 'judge' then
    select exists (
      select 1 from public.game_rooms
      where id = p_room_id and judge_id = auth.uid()
    ) into v_allowed;
  elsif p_actor_role = 'team' and p_team_index in (1, 2) then
    select exists (
      select 1 from public.teams
      where room_id = p_room_id
        and team_index = p_team_index
        and member_id = auth.uid()
    ) into v_allowed;
  end if;

  if not v_allowed then
    raise exception 'You cannot abandon this game';
  end if;

  update public.game_rooms
  set status = 'abandoned',
      abandoned_by = case
        when p_actor_role = 'judge' then 'referee'
        else 'team_' || p_team_index
      end,
      active_question_id = null
  where id = p_room_id
    and status in ('setup', 'playing');

  if found then
    insert into public.combat_events (
      room_id,
      event_type,
      actor_team_index,
      result,
      metadata
    )
    values (
      p_room_id,
      'game_abandoned',
      p_team_index,
      p_actor_role,
      jsonb_build_object('actor_role', p_actor_role)
    );
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.game_rooms enable row level security;
alter table public.teams enable row level security;
alter table public.room_questions enable row level security;
alter table public.room_question_answers enable row level security;
alter table public.combat_events enable row level security;

drop policy if exists "Allow public read for participant names" on public.profiles;
drop policy if exists "Allow individual insert of profiles" on public.profiles;
drop policy if exists "Allow individual update of profiles" on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;

drop policy if exists "Allow any authenticated user to select rooms" on public.game_rooms;
drop policy if exists "Allow any authenticated user to create rooms" on public.game_rooms;
drop policy if exists "Allow room judge to update rooms" on public.game_rooms;
drop policy if exists "Allow room judge to delete rooms" on public.game_rooms;
drop policy if exists "rooms_select_authenticated" on public.game_rooms;
drop policy if exists "rooms_insert_judge" on public.game_rooms;
drop policy if exists "rooms_update_judge" on public.game_rooms;
drop policy if exists "rooms_delete_judge" on public.game_rooms;

create policy "rooms_select_authenticated"
on public.game_rooms for select
to authenticated
using (true);

create policy "rooms_update_judge"
on public.game_rooms for update
to authenticated
using (auth.uid() = judge_id)
with check (auth.uid() = judge_id);

create policy "rooms_delete_judge"
on public.game_rooms for delete
to authenticated
using (auth.uid() = judge_id);

grant select, update, delete on public.game_rooms to authenticated;

drop policy if exists "Allow any authenticated user to select teams" on public.teams;
drop policy if exists "Allow room judge to insert teams" on public.teams;
drop policy if exists "Allow matching room judge to update/manage teams" on public.teams;
drop policy if exists "Allow empty team join or team member update" on public.teams;
drop policy if exists "teams_select_authenticated" on public.teams;
drop policy if exists "teams_insert_room_judge" on public.teams;
drop policy if exists "teams_update_room_judge" on public.teams;
drop policy if exists "teams_claim_or_update_member" on public.teams;

create policy "teams_select_authenticated"
on public.teams for select
to authenticated
using (true);

revoke select on public.teams from authenticated;
grant select (
  id,
  room_id,
  team_index,
  name,
  points,
  score,
  available_strikes,
  is_ready,
  joined,
  member_id,
  tools,
  used_tools,
  shield_active,
  created_at,
  updated_at
) on public.teams to authenticated;

drop policy if exists "room_questions_select_authenticated" on public.room_questions;
create policy "room_questions_select_authenticated"
on public.room_questions for select
to authenticated
using (true);

grant select on public.room_questions to authenticated;

drop policy if exists "combat_events_select_authenticated" on public.combat_events;
create policy "combat_events_select_authenticated"
on public.combat_events for select
to authenticated
using (true);

grant select on public.combat_events to authenticated;

revoke all on public.room_question_answers from anon, authenticated;
revoke execute on function public.create_game_room(text, text, text[], jsonb) from public, anon;
revoke execute on function public.claim_team_slot(uuid, integer) from public, anon;
revoke execute on function public.get_team_board(uuid, integer) from public, anon;
revoke execute on function public.update_team_deployment(uuid, integer, jsonb, integer) from public, anon;
revoke execute on function public.set_team_ready(uuid, integer) from public, anon;
revoke execute on function public.select_room_question(uuid, uuid, integer) from public, anon;
revoke execute on function public.get_question_answer(uuid) from public, anon;
revoke execute on function public.finalize_room_if_complete(uuid) from public, anon, authenticated;
revoke execute on function public.resolve_room_question(uuid, uuid, integer) from public, anon;
revoke execute on function public.use_team_tool(uuid, integer, text, integer) from public, anon;
revoke execute on function public.execute_strike(uuid, integer, integer) from public, anon;
revoke execute on function public.abandon_game(uuid, text, integer) from public, anon;

grant execute on function public.create_game_room(text, text, text[], jsonb) to authenticated;
grant execute on function public.claim_team_slot(uuid, integer) to authenticated;
grant execute on function public.get_team_board(uuid, integer) to authenticated;
grant execute on function public.update_team_deployment(uuid, integer, jsonb, integer) to authenticated;
grant execute on function public.set_team_ready(uuid, integer) to authenticated;
grant execute on function public.select_room_question(uuid, uuid, integer) to authenticated;
grant execute on function public.get_question_answer(uuid) to authenticated;
grant execute on function public.resolve_room_question(uuid, uuid, integer) to authenticated;
grant execute on function public.use_team_tool(uuid, integer, text, integer) to authenticated;
grant execute on function public.execute_strike(uuid, integer, integer) to authenticated;
grant execute on function public.abandon_game(uuid, text, integer) to authenticated;

do $$
declare
  v_table text;
begin
  foreach v_table in array array['game_rooms', 'teams', 'room_questions', 'combat_events']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end
$$;
