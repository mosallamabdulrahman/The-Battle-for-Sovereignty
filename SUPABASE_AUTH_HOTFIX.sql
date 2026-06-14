-- Run this once in Supabase Dashboard > SQL Editor.
-- Use the default postgres role in SQL Editor.
-- This version never grants the web application access to auth.users.
-- A missing profile is created from the signed-in user's JWT when they join.

reset role;

create or replace function public.claim_team_slot(
  p_room_id uuid,
  p_team_index integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', '');
  v_metadata jsonb := coalesce(auth.jwt() -> 'user_metadata', '{}'::jsonb);
  v_display_name text;
begin
  if auth.uid() is null or p_team_index not in (1, 2) then
    raise exception 'Invalid team claim';
  end if;

  v_display_name := case
    when char_length(trim(coalesce(v_metadata ->> 'display_name', ''))) between 2 and 40
      then trim(v_metadata ->> 'display_name')
    when char_length(split_part(v_email, '@', 1)) between 2 and 40
      then split_part(v_email, '@', 1)
    else 'مستخدم'
  end;

  insert into public.profiles (id, email, display_name)
  values (auth.uid(), v_email, v_display_name)
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      updated_at = now();

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

grant usage on schema public to authenticated;
revoke execute on function public.claim_team_slot(uuid, integer) from public, anon;
grant execute on function public.claim_team_slot(uuid, integer) to authenticated;
