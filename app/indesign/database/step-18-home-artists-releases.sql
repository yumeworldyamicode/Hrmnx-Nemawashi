-- in. music Stage 18: Hrmnx home artists, songwriter channels, releases and credits.
-- Run after Steps 6, 14, 16 and the scheduled-publications migration.
create table if not exists public.in_music_home_artists (
 id uuid primary key default gen_random_uuid(),
 artist_name text not null unique,
 slug text not null unique,
 description text not null default '',
 avatar_url text,
 artist_type text not null default 'solo' check (artist_type in ('solo','group')),
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.in_music_home_releases (
 id uuid primary key default gen_random_uuid(),
 home_artist_id uuid not null references public.in_music_home_artists(id) on delete cascade,
 title text not null,
 release_type text not null check (release_type in ('single','ep','album')),
 release_date timestamptz not null,
 cover_url text,
 description text not null default '',
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.in_music_home_songs (
 id uuid primary key default gen_random_uuid(),
 home_artist_id uuid not null references public.in_music_home_artists(id) on delete cascade,
 release_id uuid references public.in_music_home_releases(id) on delete set null,
 title text not null,
 dem_slug text references public.indesign_dems(slug) on delete set null,
 synced_lyrics jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 unique(home_artist_id,dem_slug)
);
-- Structured credits allow in-home artists to be credited on songwriter DEMs as "produced for".
create table if not exists public.in_music_home_artist_credits (
 id uuid primary key default gen_random_uuid(),
 dem_slug text not null references public.indesign_dems(slug) on delete cascade,
 home_artist_id uuid not null references public.in_music_home_artists(id) on delete cascade,
 credit_role text not null default 'produced_for' check (credit_role in ('produced_for','artist','vocalist')),
 credit_note text not null default '',
 created_at timestamptz not null default now(),
 unique(dem_slug,home_artist_id,credit_role)
);
alter table public.in_music_home_artists enable row level security;
alter table public.in_music_home_releases enable row level security;
alter table public.in_music_home_songs enable row level security;
alter table public.in_music_home_artist_credits enable row level security;
drop policy if exists "Public can view home artists" on public.in_music_home_artists;
create policy "Public can view home artists" on public.in_music_home_artists for select to anon,authenticated using (is_active);
drop policy if exists "Public can view home releases" on public.in_music_home_releases;
create policy "Public can view home releases" on public.in_music_home_releases for select to anon,authenticated using (true);
drop policy if exists "Public can view home songs" on public.in_music_home_songs;
create policy "Public can view home songs" on public.in_music_home_songs for select to anon,authenticated using (dem_slug is null or exists(select 1 from public.indesign_dems d where d.slug=in_music_home_songs.dem_slug and d.visibility='public' and (d.scheduled_at is null or d.scheduled_at<=now())));
drop policy if exists "Public can view home artist credits" on public.in_music_home_artist_credits;
create policy "Public can view home artist credits" on public.in_music_home_artist_credits for select to anon,authenticated using (exists(select 1 from public.indesign_dems d where d.slug=in_music_home_artist_credits.dem_slug and d.visibility='public' and (d.scheduled_at is null or d.scheduled_at<=now())));
drop policy if exists "Cinnasugar can manage home releases" on public.in_music_home_releases;
create policy "Cinnasugar can manage home releases" on public.in_music_home_releases for all to authenticated using (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com') with check (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com');
drop policy if exists "Cinnasugar can manage home songs" on public.in_music_home_songs;
create policy "Cinnasugar can manage home songs" on public.in_music_home_songs for all to authenticated using (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com') with check (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com');
drop policy if exists "Cinnasugar can manage home artists" on public.in_music_home_artists;
create policy "Cinnasugar can manage home artists" on public.in_music_home_artists for all to authenticated using (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com') with check (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com');
drop policy if exists "Cinnasugar can manage home credits" on public.in_music_home_artist_credits;
create policy "Cinnasugar can manage home credits" on public.in_music_home_artist_credits for all to authenticated using (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com') with check (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com');
grant select on public.in_music_home_artists,public.in_music_home_releases,public.in_music_home_songs,public.in_music_home_artist_credits to anon,authenticated;
grant insert,update,delete on public.in_music_home_artists,public.in_music_home_releases,public.in_music_home_songs,public.in_music_home_artist_credits to authenticated;
-- Seed initial Hrmnx home artists; safely rerunnable.
insert into public.in_music_home_artists(artist_name,slug,artist_type)
values ('SEIUN','seiun','solo'),('Harmonia','harmonia','group')
on conflict (slug) do nothing;
-- Automatically create home-artist song rows for public DEMs credited to home artists.
create or replace function public.in_music_generate_home_artist_songs()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.visibility='public' then
  insert into public.in_music_home_songs(home_artist_id,title,dem_slug)
  select c.home_artist_id,new.title,new.slug
  from public.in_music_home_artist_credits c
  join public.in_music_home_artists a on a.id=c.home_artist_id and a.is_active
  where c.dem_slug=new.slug and c.credit_role in ('artist','vocalist')
  on conflict (home_artist_id,dem_slug) do nothing;
 end if;
 return new;
end; $$;
drop trigger if exists in_music_generate_home_artist_songs on public.indesign_dems;
create trigger in_music_generate_home_artist_songs after insert or update of visibility,scheduled_at,title on public.indesign_dems for each row execute function public.in_music_generate_home_artist_songs();
-- Rebuild generated rows for existing public DEM credits.
insert into public.in_music_home_songs(home_artist_id,title,dem_slug)
select c.home_artist_id,d.title,d.slug from public.in_music_home_artist_credits c
join public.indesign_dems d on d.slug=c.dem_slug
join public.in_music_home_artists a on a.id=c.home_artist_id and a.is_active
where c.credit_role in ('artist','vocalist') and d.visibility='public' and (d.scheduled_at is null or d.scheduled_at<=now())
on conflict (home_artist_id,dem_slug) do nothing;

-- Attach the existing SEIUN account to the verified songwriter directory, when it exists.
do $$ declare seiun_id uuid; begin
 select id into seiun_id from auth.users where lower(email)='seiun@yumeworldyami.net' limit 1;
 if seiun_id is not null then
  insert into public.in_music_verified_artists(user_id,artist_name,verified,verified_at)
  values(seiun_id,'SEIUN',true,now()) on conflict(user_id) do update set artist_name='SEIUN',verified=true,verified_at=coalesce(public.in_music_verified_artists.verified_at,now());
  insert into public.in_music_public_profiles(user_id,display_name,username,bio)
  values(seiun_id,'SEIUN','seiun','Hrmnx Entertainment home artist.')
  on conflict(user_id) do update set display_name='SEIUN',bio='Hrmnx Entertainment home artist.',updated_at=now();
 end if;
end $$;

-- Link SEIUN's existing login to the verified songwriter identity when the account exists.
do $$ declare seiun_id uuid; begin
 select id into seiun_id from auth.users where lower(email)='seiun@yumeworldyami.net' limit 1;
 if seiun_id is not null then
  insert into public.in_music_verified_artists(user_id,artist_name,verified,verified_at)
  values(seiun_id,'SEIUN',true,now())
  on conflict(user_id) do update set artist_name='SEIUN',verified=true,verified_at=coalesce(public.in_music_verified_artists.verified_at,now());
  if exists(select 1 from public.in_music_public_profiles where user_id=seiun_id) then
   update public.in_music_public_profiles set display_name='SEIUN',bio='Hrmnx Entertainment home artist.',updated_at=now() where user_id=seiun_id;
  elsif not exists(select 1 from public.in_music_public_profiles where username='seiun') then
   insert into public.in_music_public_profiles(user_id,display_name,username,bio) values(seiun_id,'SEIUN','seiun','Hrmnx Entertainment home artist.');
  end if;
 end if;
end $$;
