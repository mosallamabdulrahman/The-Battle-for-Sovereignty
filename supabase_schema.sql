-- Run this file once in Supabase Dashboard > SQL Editor.
-- It is safe to run again after future changes.

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
  team_1_tools text[] not null default '{}',
  team_2_tools text[] not null default '{}',
  status text not null default 'setup' check (status in ('setup', 'battle_ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  team_index integer not null check (team_index in (1, 2)),
  name text not null,
  points integer not null default 1000 check (points >= 0),
  is_ready boolean not null default false,
  joined boolean not null default false,
  member_id uuid references public.profiles(id) on delete set null,
  board jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, team_index)
);

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

-- Add users who registered before this migration was installed.
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

alter table public.profiles enable row level security;
alter table public.game_rooms enable row level security;
alter table public.teams enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "rooms_select_authenticated" on public.game_rooms;
create policy "rooms_select_authenticated"
on public.game_rooms for select
to authenticated
using (true);

drop policy if exists "rooms_insert_judge" on public.game_rooms;
create policy "rooms_insert_judge"
on public.game_rooms for insert
to authenticated
with check (auth.uid() = judge_id);

drop policy if exists "rooms_update_judge" on public.game_rooms;
create policy "rooms_update_judge"
on public.game_rooms for update
to authenticated
using (auth.uid() = judge_id)
with check (auth.uid() = judge_id);

drop policy if exists "rooms_delete_judge" on public.game_rooms;
create policy "rooms_delete_judge"
on public.game_rooms for delete
to authenticated
using (auth.uid() = judge_id);

drop policy if exists "teams_select_authenticated" on public.teams;
create policy "teams_select_authenticated"
on public.teams for select
to authenticated
using (true);

drop policy if exists "teams_insert_room_judge" on public.teams;
create policy "teams_insert_room_judge"
on public.teams for insert
to authenticated
with check (
  exists (
    select 1
    from public.game_rooms room
    where room.id = room_id and room.judge_id = auth.uid()
  )
);

drop policy if exists "teams_update_room_judge" on public.teams;
create policy "teams_update_room_judge"
on public.teams for update
to authenticated
using (
  exists (
    select 1
    from public.game_rooms room
    where room.id = room_id and room.judge_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.game_rooms room
    where room.id = room_id and room.judge_id = auth.uid()
  )
);

drop policy if exists "teams_claim_or_update_member" on public.teams;
create policy "teams_claim_or_update_member"
on public.teams for update
to authenticated
using (member_id is null or member_id = auth.uid())
with check (member_id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_rooms'
  ) then
    alter publication supabase_realtime add table public.game_rooms;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;
end
$$;
