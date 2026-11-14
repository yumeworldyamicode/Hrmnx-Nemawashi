-- in. music Stage 5: public member profiles, pinned publications and verified artist identities.
-- Run after Step 13 (in. music social).

create table if not exists public.in_music_public_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'KiKi member',
 username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
 avatar_url text,
 bio text not null default '',
 links jsonb not null default '[]'::jsonb check (jsonb_typeof(links)='array'),
 pinned_dem_slugs text[] not null default '{}',
 updated_at timestamptz not null default now(),
 constraint in_music_max_three_pins check (cardinality(pinned_dem_slugs)<=3)
);
create index if not exists in_music_public_profiles_username_idx on public.in_music_public_profiles(username);

create table if not exists public.in_music_verified_artists (
 user_id uuid primary key references auth.users(id) on delete cascade,
 artist_name text not null,
 verified boolean not null default false,
 verified_at timestamptz,
 verified_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);

alter table public.in_music_public_profiles enable row level security;
alter table public.in_music_verified_artists enable row level security;

drop policy if exists "Public can view in music profiles" on public.in_music_public_profiles;
create policy "Public can view in music profiles" on public.in_music_public_profiles for select to anon,authenticated using (true);
drop policy if exists "Members can create their public profile" on public.in_music_public_profiles;
create policy "Members can create their public profile" on public.in_music_public_profiles for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Members can update their public profile" on public.in_music_public_profiles;
create policy "Members can update their public profile" on public.in_music_public_profiles for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "Public can view verified artist identities" on public.in_music_verified_artists;
create policy "Public can view verified artist identities" on public.in_music_verified_artists for select to anon,authenticated using (verified=true);

grant select on public.in_music_public_profiles,public.in_music_verified_artists to anon,authenticated;
grant insert,update on public.in_music_public_profiles to authenticated;

-- A SECURITY DEFINER helper lets only existing Nemawashi staff manage verification.
create or replace function public.in_music_is_staff()
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_staff=true);
$$;
revoke all on function public.in_music_is_staff() from public;
grant execute on function public.in_music_is_staff() to authenticated;

drop policy if exists "Nemawashi staff can manage verified artists" on public.in_music_verified_artists;
create policy "Nemawashi staff can manage verified artists" on public.in_music_verified_artists
 for all to authenticated using (public.in_music_is_staff()) with check (public.in_music_is_staff());
grant insert,update,delete on public.in_music_verified_artists to authenticated;
