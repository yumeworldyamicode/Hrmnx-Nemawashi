-- InDesign Step 13: public Music Brainstorm projects for the Producer Programme
-- Run after step-12-producer-programme.sql in the shared Supabase SQL Editor.
--
-- This migration adds a narrowly-scoped participant path. It does not relax
-- the existing employee-only policies for ordinary InDesign projects.

alter table public.indesign_projects
  add column if not exists producer_program_id uuid
    references public.indesign_producer_programs(id) on delete set null;

create index if not exists indesign_projects_producer_owner_idx
  on public.indesign_projects(owner_id, producer_program_id, updated_at desc)
  where producer_program_id is not null;

-- Participants may read only their own projects explicitly linked to the programme.
drop policy if exists "Programme participants read own programme projects" on public.indesign_projects;
create policy "Programme participants read own programme projects"
on public.indesign_projects for select to authenticated
using (
  auth.uid() = owner_id
  and producer_program_id is not null
);

-- Participants may create only Music Brainstorm projects while the linked programme is open.
drop policy if exists "Programme participants create Music Brainstorms" on public.indesign_projects;
create policy "Programme participants create Music Brainstorms"
on public.indesign_projects for insert to authenticated
with check (
  auth.uid() = owner_id
  and type = 'brainstorm'
  and producer_program_id is not null
  and exists (
    select 1 from public.indesign_producer_programs p
    where p.id = producer_program_id and p.is_open = true
  )
  and coalesce(content->>'mode', 'music') = 'music'
);

drop policy if exists "Programme participants update own Music Brainstorms" on public.indesign_projects;
create policy "Programme participants update own Music Brainstorms"
on public.indesign_projects for update to authenticated
using (
  auth.uid() = owner_id
  and producer_program_id is not null
)
with check (
  auth.uid() = owner_id
  and type = 'brainstorm'
  and producer_program_id is not null
  and coalesce(content->>'mode', 'music') = 'music'
);

-- Re-check the programme link on every insert/update. This prevents a client
-- from attaching an unrelated project to a closed or non-existent programme.
create or replace function public.indesign_validate_producer_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.producer_program_id is not null then
    if new.type <> 'brainstorm'
       or coalesce(new.content->>'mode', 'music') <> 'music'
       or not exists (
         select 1 from public.indesign_producer_programs p
         where p.id = new.producer_program_id and p.is_open = true
       ) then
      raise exception 'Producer Programme projects must be Music Brainstorms linked to an open programme.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists indesign_validate_producer_project on public.indesign_projects;
create trigger indesign_validate_producer_project
before insert or update of type, content, producer_program_id
on public.indesign_projects
for each row execute function public.indesign_validate_producer_project();

-- Replace the earlier broad submission policy: ordinary public DEMs must
-- never qualify just because a user manually selects them on the programme page.
drop policy if exists "Users can submit their own public DEMs to an open programme" on public.indesign_producer_submissions;
create policy "Only own programme-project DEMs can be submitted"
on public.indesign_producer_submissions for insert to authenticated
with check (
  auth.uid() = submitter_id
  and status = 'submitted'
  and exists (
    select 1
    from public.indesign_producer_programs pr
    join public.indesign_projects p on p.producer_program_id = pr.id
    join public.indesign_dems d on d.project_id = p.id
    where pr.id = program_id
      and pr.is_open = true
      and p.owner_id = auth.uid()
      and p.type = 'brainstorm'
      and coalesce(p.content->>'mode', 'music') = 'music'
      and d.id = dem_id
      and d.owner_id = auth.uid()
      and d.visibility = 'public'
      and d.is_public = true
  )
);

-- A public DEM published from a programme project is automatically submitted.
-- An unlisted DEM cannot qualify through this path.
create or replace function public.indesign_auto_submit_producer_dem()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  programme_id uuid;
begin
  if new.project_id is null then
    return new;
  end if;

  select p.producer_program_id
    into programme_id
  from public.indesign_projects p
  where p.id = new.project_id
    and p.owner_id = new.owner_id
    and p.type = 'brainstorm'
    and coalesce(p.content->>'mode', 'music') = 'music';

  if programme_id is not null then
    if new.visibility <> 'public' or new.is_public is not true then
      raise exception 'Producer Programme DEMs must be published publicly to qualify.';
    end if;

    insert into public.indesign_producer_submissions
      (program_id, dem_id, project_id, submitter_id, status)
    values
      (programme_id, new.id, new.project_id, new.owner_id, 'submitted')
    on conflict (dem_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists indesign_auto_submit_producer_dem on public.indesign_dems;
create trigger indesign_auto_submit_producer_dem
after insert on public.indesign_dems
for each row execute function public.indesign_auto_submit_producer_dem();

-- Allow signed-in programme participants to publish a DEM only when it belongs
-- to their own programme Music Brainstorm. Existing staff policies remain intact.
drop policy if exists "Programme participants publish DEMs from own programme projects" on public.indesign_dems;
create policy "Programme participants publish DEMs from own programme projects"
on public.indesign_dems for insert to authenticated
with check (
  auth.uid() = owner_id
  and visibility = 'public'
  and is_public = true
  and project_id is not null
  and exists (
    select 1 from public.indesign_projects p
    join public.indesign_producer_programs pr on pr.id = p.producer_program_id
    where p.id = project_id
      and p.owner_id = auth.uid()
      and p.type = 'brainstorm'
      and coalesce(p.content->>'mode', 'music') = 'music'
      and pr.is_open = true
  )
);


-- Allow participants with an open Producer Programme Music Brainstorm to
-- upload their .dem package. The DEM row insert policy separately validates
-- the exact project ownership and programme link.
drop policy if exists "Programme participants upload DEM packages" on storage.objects;
create policy "Programme participants upload DEM packages"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'indesign-dems'
  and name like '%.dem'
  and exists (
    select 1 from public.indesign_projects p
    join public.indesign_producer_programs pr on pr.id = p.producer_program_id
    where p.owner_id = auth.uid()
      and p.type = 'brainstorm'
      and coalesce(p.content->>'mode', 'music') = 'music'
      and pr.is_open = true
  )
);

-- Cover artwork upload permission for open programme Music Brainstorm owners.
drop policy if exists "Programme participants upload DEM cover artwork" on storage.objects;
create policy "Programme participants upload DEM cover artwork"
on storage.objects for insert to authenticated
with check (bucket_id = 'in-music-artwork' and exists (select 1 from public.indesign_projects p join public.indesign_producer_programs pr on pr.id = p.producer_program_id where p.owner_id = auth.uid() and p.type = 'brainstorm' and coalesce(p.content->>'mode', 'music') = 'music' and pr.is_open = true));
