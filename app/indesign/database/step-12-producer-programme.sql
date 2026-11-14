-- InDesign Music Producer Programme + Competition foundation
-- Run after step-11-publication-library.sql in the shared Nemawashi Supabase SQL Editor.

create table if not exists public.indesign_producer_programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default 'InDesign Music Producer Programme',
  description text not null default '',
  is_open boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.indesign_producer_programs (slug,title,description,is_open)
values (
  'open-producer-programme',
  'InDesign Music Producer Programme',
  'Create a Music Brainstorm, build a DEM and submit it to InDesign Music.',
  false
)
on conflict (slug) do nothing;

create table if not exists public.indesign_producer_submissions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.indesign_producer_programs(id) on delete cascade,
  dem_id uuid not null unique references public.indesign_dems(id) on delete cascade,
  project_id uuid references public.indesign_projects(id) on delete set null,
  submitter_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted','withdrawn')),
  submitted_at timestamptz not null default now(),
  constraint producer_submission_dem_public check (status in ('submitted','withdrawn'))
);

create table if not exists public.indesign_producer_competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  announcement text not null default '',
  status text not null default 'draft' check (status in ('draft','submissions','round_1','round_2','round_3','public_final','completed','cancelled')),
  current_round smallint not null default 0 check (current_round between 0 and 4),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  starts_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.indesign_producer_competition_rounds (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.indesign_producer_competitions(id) on delete cascade,
  round_number smallint not null check (round_number between 1 and 4),
  target_count smallint not null check (target_count between 1 and 20),
  label text not null,
  status text not null default 'upcoming' check (status in ('upcoming','open','finalized')),
  opened_at timestamptz,
  finalized_at timestamptz,
  finalized_by uuid references auth.users(id) on delete set null,
  unique (competition_id,round_number)
);

create table if not exists public.indesign_producer_competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.indesign_producer_competitions(id) on delete cascade,
  submission_id uuid not null references public.indesign_producer_submissions(id) on delete restrict,
  entry_number smallint not null check (entry_number between 1 and 20),
  added_by uuid not null references auth.users(id) on delete restrict,
  added_at timestamptz not null default now(),
  unique (competition_id,submission_id),
  unique (competition_id,entry_number)
);

create table if not exists public.indesign_producer_competition_selections (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.indesign_producer_competitions(id) on delete cascade,
  round_number smallint not null check (round_number between 1 and 3),
  submission_id uuid not null references public.indesign_producer_submissions(id) on delete restrict,
  selected_by uuid not null references auth.users(id) on delete restrict,
  selected_at timestamptz not null default now(),
  unique (competition_id,round_number,submission_id)
);

create table if not exists public.indesign_producer_competition_votes (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.indesign_producer_competitions(id) on delete cascade,
  round_number smallint not null check (round_number between 1 and 4),
  submission_id uuid not null references public.indesign_producer_submissions(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (competition_id,round_number,voter_id)
);

create index if not exists indesign_producer_submissions_program_idx
  on public.indesign_producer_submissions(program_id,status,submitted_at desc);
create index if not exists indesign_producer_competition_status_idx
  on public.indesign_producer_competitions(status,created_at desc);
create index if not exists indesign_producer_entries_competition_idx
  on public.indesign_producer_competition_entries(competition_id,entry_number);
create index if not exists indesign_producer_votes_round_idx
  on public.indesign_producer_competition_votes(competition_id,round_number,submission_id);

alter table public.indesign_producer_programs enable row level security;
alter table public.indesign_producer_submissions enable row level security;
alter table public.indesign_producer_competitions enable row level security;
alter table public.indesign_producer_competition_rounds enable row level security;
alter table public.indesign_producer_competition_entries enable row level security;
alter table public.indesign_producer_competition_selections enable row level security;
alter table public.indesign_producer_competition_votes enable row level security;

-- Staff helper: employee status is always checked against the shared profiles table.
create or replace function public.indesign_is_staff()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_staff=true);
$$;
revoke all on function public.indesign_is_staff() from public;
grant execute on function public.indesign_is_staff() to anon,authenticated;

drop policy if exists "Anyone can view open producer programmes" on public.indesign_producer_programs;
create policy "Anyone can view open producer programmes" on public.indesign_producer_programs
for select to anon,authenticated using (is_open=true or public.indesign_is_staff());
drop policy if exists "Staff manage producer programmes" on public.indesign_producer_programs;
create policy "Staff manage producer programmes" on public.indesign_producer_programs
for all to authenticated using (public.indesign_is_staff()) with check (public.indesign_is_staff());

drop policy if exists "Public can view producer submissions" on public.indesign_producer_submissions;
create policy "Public can view producer submissions" on public.indesign_producer_submissions
for select to anon,authenticated using (
  status='submitted' and exists (
    select 1 from public.indesign_dems d where d.id=dem_id and d.visibility='public' and d.is_public=true
  )
);
drop policy if exists "Submitters can view own producer submissions" on public.indesign_producer_submissions;
create policy "Submitters can view own producer submissions" on public.indesign_producer_submissions
for select to authenticated using (auth.uid()=submitter_id);
drop policy if exists "Users can submit their own public DEMs to an open programme" on public.indesign_producer_submissions;
create policy "Users can submit their own public DEMs to an open programme" on public.indesign_producer_submissions
for insert to authenticated with check (
  auth.uid()=submitter_id
  and status='submitted'
  and exists(select 1 from public.indesign_producer_programs p where p.id=program_id and p.is_open=true)
  and exists(select 1 from public.indesign_dems d where d.id=dem_id and d.owner_id=auth.uid() and d.visibility='public' and d.is_public=true)
);
drop policy if exists "Submitters can withdraw own entries" on public.indesign_producer_submissions;
create policy "Submitters can withdraw own entries" on public.indesign_producer_submissions
for update to authenticated using (auth.uid()=submitter_id) with check (auth.uid()=submitter_id and status='withdrawn');

drop policy if exists "Public can view active producer competitions" on public.indesign_producer_competitions;
create policy "Public can view active producer competitions" on public.indesign_producer_competitions
for select to anon,authenticated using (status not in ('draft','cancelled') or public.indesign_is_staff());
drop policy if exists "Staff manage producer competitions" on public.indesign_producer_competitions;
create policy "Staff manage producer competitions" on public.indesign_producer_competitions
for all to authenticated using (public.indesign_is_staff()) with check (public.indesign_is_staff());

drop policy if exists "Public can view competition rounds" on public.indesign_producer_competition_rounds;
create policy "Public can view competition rounds" on public.indesign_producer_competition_rounds
for select to anon,authenticated using (exists(select 1 from public.indesign_producer_competitions c where c.id=competition_id and c.status not in ('draft','cancelled')));
drop policy if exists "Staff manage competition rounds" on public.indesign_producer_competition_rounds;
create policy "Staff manage competition rounds" on public.indesign_producer_competition_rounds
for all to authenticated using (public.indesign_is_staff()) with check (public.indesign_is_staff());

drop policy if exists "Public can view competition entries" on public.indesign_producer_competition_entries;
create policy "Public can view competition entries" on public.indesign_producer_competition_entries
for select to anon,authenticated using (exists(select 1 from public.indesign_producer_competitions c where c.id=competition_id and c.status not in ('draft','cancelled')));
drop policy if exists "Staff manage competition entries" on public.indesign_producer_competition_entries;
create policy "Staff manage competition entries" on public.indesign_producer_competition_entries
for all to authenticated using (public.indesign_is_staff()) with check (public.indesign_is_staff());

drop policy if exists "Public can view competition selections" on public.indesign_producer_competition_selections;
create policy "Public can view competition selections" on public.indesign_producer_competition_selections
for select to anon,authenticated using (exists(select 1 from public.indesign_producer_competitions c where c.id=competition_id and c.status not in ('draft','cancelled')));
drop policy if exists "Staff manage competition selections" on public.indesign_producer_competition_selections;
create policy "Staff manage competition selections" on public.indesign_producer_competition_selections
for all to authenticated using (public.indesign_is_staff()) with check (public.indesign_is_staff());

drop policy if exists "Public can view competition vote totals" on public.indesign_producer_competition_votes;
create policy "Public can view competition vote totals" on public.indesign_producer_competition_votes
for select to anon,authenticated using (true);
drop policy if exists "Signed-in KiKi users can vote once per round" on public.indesign_producer_competition_votes;
create policy "Signed-in KiKi users can vote once per round" on public.indesign_producer_competition_votes
for insert to authenticated with check (
  auth.uid()=voter_id
  and exists (
    select 1 from public.indesign_producer_competitions c
    where c.id=competition_id and c.status not in ('draft','cancelled','completed')
  )
  and exists (
    select 1 from public.indesign_producer_competition_entries e
    where e.competition_id=competition_id and e.submission_id=indesign_producer_competition_votes.submission_id
  )
);

-- Four rounds are created automatically when staff create a competition space.
create or replace function public.indesign_seed_competition_rounds()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.indesign_producer_competition_rounds(competition_id,round_number,target_count,label)
  values
    (new.id,1,15,'Choose 15 contestants'),
    (new.id,2,10,'Choose 10 contestants'),
    (new.id,3,3,'Choose 3 finalists'),
    (new.id,4,1,'Public vote - choose the winner');
  return new;
end;
$$;
drop trigger if exists indesign_seed_competition_rounds on public.indesign_producer_competitions;
create trigger indesign_seed_competition_rounds after insert on public.indesign_producer_competitions
for each row execute function public.indesign_seed_competition_rounds();

-- A submission can only be placed in a competition once, and must remain a public programme entry.
create or replace function public.indesign_validate_competition_entry()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (
    select 1 from public.indesign_producer_submissions s
    join public.indesign_dems d on d.id=s.dem_id
    where s.id=new.submission_id and s.status='submitted'
      and d.visibility='public' and d.is_public=true
  ) then
    raise exception 'Only public Producer Programme DEM submissions can enter a competition.';
  end if;
  return new;
end;
$$;
drop trigger if exists indesign_validate_competition_entry on public.indesign_producer_competition_entries;
create trigger indesign_validate_competition_entry before insert or update on public.indesign_producer_competition_entries
for each row execute function public.indesign_validate_competition_entry();

-- A contestant can only be selected if it is in the competition's 20-entry pool.
create or replace function public.indesign_validate_competition_selection()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.indesign_producer_competition_entries e where e.competition_id=new.competition_id and e.submission_id=new.submission_id) then
    raise exception 'This DEM is not part of this competition.';
  end if;
  return new;
end;
$$;
drop trigger if exists indesign_validate_competition_selection on public.indesign_producer_competition_selections;
create trigger indesign_validate_competition_selection before insert or update on public.indesign_producer_competition_selections
for each row execute function public.indesign_validate_competition_selection();

-- Votes are limited to the contestants visible in the relevant round.
create or replace function public.indesign_validate_competition_vote()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  current_status text;
begin
  select status into current_status from public.indesign_producer_competitions where id=new.competition_id;
  if current_status in ('draft','cancelled','completed') then
    raise exception 'Voting is closed for this competition.';
  end if;
  if new.round_number=1 then
    if not exists(select 1 from public.indesign_producer_competition_entries e where e.competition_id=new.competition_id and e.submission_id=new.submission_id) then
      raise exception 'This DEM is not in the contestant pool.';
    end if;
  elsif new.round_number between 2 and 4 then
    if not exists(select 1 from public.indesign_producer_competition_selections s where s.competition_id=new.competition_id and s.round_number=new.round_number-1 and s.submission_id=new.submission_id) then
      raise exception 'This DEM did not advance to this voting round.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists indesign_validate_competition_vote on public.indesign_producer_competition_votes;
create trigger indesign_validate_competition_vote before insert on public.indesign_producer_competition_votes
for each row execute function public.indesign_validate_competition_vote();
