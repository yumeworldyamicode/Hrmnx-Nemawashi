-- in. music Stage 4: community interactions and creator subscriptions.
-- Run after Step 11 (publication library) and Step 12 (in. music foundation).

create table if not exists public.in_music_likes (
  id uuid primary key default gen_random_uuid(),
  dem_slug text not null references public.indesign_dems(slug) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (dem_slug,user_id)
);
create index if not exists in_music_likes_dem_idx on public.in_music_likes(dem_slug);

create table if not exists public.in_music_comments (
  id uuid primary key default gen_random_uuid(),
  dem_slug text not null references public.indesign_dems(slug) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists in_music_comments_dem_created_idx on public.in_music_comments(dem_slug,created_at desc);

create table if not exists public.in_music_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references auth.users(id) on delete cascade,
  channel_owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint in_music_no_self_subscription check (subscriber_id <> channel_owner_id),
  unique (subscriber_id,channel_owner_id)
);
create index if not exists in_music_subscriptions_subscriber_idx on public.in_music_subscriptions(subscriber_id,created_at desc);
create index if not exists in_music_subscriptions_channel_idx on public.in_music_subscriptions(channel_owner_id);

alter table public.in_music_likes enable row level security;
alter table public.in_music_comments enable row level security;
alter table public.in_music_subscriptions enable row level security;

drop policy if exists "Public can read likes on public DEMs" on public.in_music_likes;
create policy "Public can read likes on public DEMs" on public.in_music_likes
 for select to anon,authenticated using (
  exists(select 1 from public.indesign_dems d where d.slug=dem_slug and d.visibility='public')
 );
drop policy if exists "Members can like public DEMs" on public.in_music_likes;
create policy "Members can like public DEMs" on public.in_music_likes
 for insert to authenticated with check (
  auth.uid()=user_id and exists(select 1 from public.indesign_dems d where d.slug=dem_slug and d.visibility='public')
 );
drop policy if exists "Members can remove their own likes" on public.in_music_likes;
create policy "Members can remove their own likes" on public.in_music_likes
 for delete to authenticated using (auth.uid()=user_id);

drop policy if exists "Public can read comments on public DEMs" on public.in_music_comments;
create policy "Public can read comments on public DEMs" on public.in_music_comments
 for select to anon,authenticated using (
  exists(select 1 from public.indesign_dems d where d.slug=dem_slug and d.visibility='public')
 );
drop policy if exists "Members can comment on public DEMs" on public.in_music_comments;
create policy "Members can comment on public DEMs" on public.in_music_comments
 for insert to authenticated with check (
  auth.uid()=user_id and exists(select 1 from public.indesign_dems d where d.slug=dem_slug and d.visibility='public')
 );
drop policy if exists "Members can edit their own comments" on public.in_music_comments;
create policy "Members can edit their own comments" on public.in_music_comments
 for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "Members can delete their own comments" on public.in_music_comments;
create policy "Members can delete their own comments" on public.in_music_comments
 for delete to authenticated using (auth.uid()=user_id);

drop policy if exists "Members can view their subscriptions" on public.in_music_subscriptions;
create policy "Members can view their subscriptions" on public.in_music_subscriptions
 for select to authenticated using (auth.uid()=subscriber_id or auth.uid()=channel_owner_id);
drop policy if exists "Members can subscribe to creators" on public.in_music_subscriptions;
create policy "Members can subscribe to creators" on public.in_music_subscriptions
 for insert to authenticated with check (auth.uid()=subscriber_id and subscriber_id<>channel_owner_id);
drop policy if exists "Members can unsubscribe" on public.in_music_subscriptions;
create policy "Members can unsubscribe" on public.in_music_subscriptions
 for delete to authenticated using (auth.uid()=subscriber_id);

grant select on public.in_music_likes,public.in_music_comments to anon,authenticated;
grant insert,delete on public.in_music_likes to authenticated;
grant insert,select,update,delete on public.in_music_comments to authenticated;
grant select,insert,delete on public.in_music_subscriptions to authenticated;
