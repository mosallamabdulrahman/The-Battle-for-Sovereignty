-- Run this once in Supabase Dashboard > SQL Editor.
-- It repairs missing profiles and makes team claiming work for users
-- created manually from Authentication > Users.

insert into public.profiles (id, email, display_name)
select
  id,
  coalesce(email, ''),
  case
    when char_length(trim(coalesce(raw_user_meta_data ->> 'display_name', ''))) between 2 and 40
      then trim(raw_user_meta_data ->> 'display_name')
    when char_length(split_part(coalesce(email, ''), '@', 1)) between 2 and 40
      then split_part(email, '@', 1)
    else 'مستخدم'
  end
from auth.users
on conflict (id) do update
set email = excluded.email,
    display_name = excluded.display_name,
    updated_at = now();

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

  insert into public.profiles (id, email, display_name)
  select
    auth_user.id,
    coalesce(auth_user.email, ''),
    case
      when char_length(trim(coalesce(auth_user.raw_user_meta_data ->> 'display_name', ''))) between 2 and 40
        then trim(auth_user.raw_user_meta_data ->> 'display_name')
      when char_length(split_part(coalesce(auth_user.email, ''), '@', 1)) between 2 and 40
        then split_part(auth_user.email, '@', 1)
      else 'مستخدم'
    end
  from auth.users auth_user
  where auth_user.id = auth.uid()
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

revoke execute on function public.claim_team_slot(uuid, integer) from public, anon;
grant execute on function public.claim_team_slot(uuid, integer) to authenticated;
