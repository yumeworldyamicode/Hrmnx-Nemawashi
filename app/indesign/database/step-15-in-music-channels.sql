-- in. music Stage 6: verified artist channel follower counts.
-- Run after Step 14 (public member profiles and verified artist identities).
-- The function exposes only an aggregate count, never subscriber identities.
create or replace function public.in_music_channel_follower_count(target_user uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.in_music_subscriptions s
  where s.channel_owner_id = target_user;
$$;
revoke all on function public.in_music_channel_follower_count(uuid) from public;
grant execute on function public.in_music_channel_follower_count(uuid) to anon, authenticated;
