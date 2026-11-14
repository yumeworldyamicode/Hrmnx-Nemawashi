-- in. music Stage 7: structured credits and reposts.
-- Run after Step 14 (public profiles and verified artist identities).
alter table public.indesign_dems add column if not exists contributions jsonb not null default '[]'::jsonb;
create index if not exists indesign_dems_contributions_gin on public.indesign_dems using gin (contributions);
create table if not exists public.in_music_reposts (
 id uuid primary key default gen_random_uuid(),
 dem_slug text not null references public.indesign_dems(slug) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique (dem_slug,user_id)
);
create index if not exists in_music_reposts_user_created_idx on public.in_music_reposts(user_id,created_at desc);
create index if not exists in_music_reposts_dem_idx on public.in_music_reposts(dem_slug);
alter table public.in_music_reposts enable row level security;
drop policy if exists "Public can view reposts of public DEMs" on public.in_music_reposts;
create policy "Public can view reposts of public DEMs" on public.in_music_reposts for select to anon,authenticated using (exists(select 1 from public.indesign_dems d where d.slug=dem_slug and d.visibility='public'));
drop policy if exists "Members can repost public DEMs" on public.in_music_reposts;
create policy "Members can repost public DEMs" on public.in_music_reposts for insert to authenticated with check (auth.uid()=user_id and exists(select 1 from public.indesign_dems d where d.slug=dem_slug and d.visibility='public'));
drop policy if exists "Members can remove their own reposts" on public.in_music_reposts;
create policy "Members can remove their own reposts" on public.in_music_reposts for delete to authenticated using (auth.uid()=user_id);
grant select on public.in_music_reposts to anon,authenticated;
grant insert,delete on public.in_music_reposts to authenticated;
create or replace function public.in_music_artist_contributions(target_user uuid,target_username text)
returns table(slug text,title text,artist text,cover_path text,package_path text,created_at timestamptz)
language sql stable security definer set search_path=public as $$
 select d.slug,d.title,d.artist,d.cover_path,d.package_path,d.created_at from public.indesign_dems d
 where d.visibility='public' and exists (
  select 1 from jsonb_array_elements(case when jsonb_typeof(d.contributions)='array' then d.contributions else '[]'::jsonb end) c
  where c->>'user_id'=target_user::text or (coalesce(target_username,'')<>'' and lower(c->>'username')=lower(target_username))
 ) order by d.created_at desc;
$$;
revoke all on function public.in_music_artist_contributions(uuid,text) from public;
grant execute on function public.in_music_artist_contributions(uuid,text) to anon,authenticated;
