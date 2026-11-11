-- indesign Step 2: project library
-- Run once in Supabase Dashboard -> SQL Editor.
create table if not exists public.indesign_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  type text not null check (type in ('moodboard', 'board', 'brainstorm')),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists indesign_projects_owner_updated_idx
  on public.indesign_projects (owner_id, updated_at desc);
alter table public.indesign_projects enable row level security;
drop policy if exists "Employees can view their own indesign projects" on public.indesign_projects;
create policy "Employees can view their own indesign projects" on public.indesign_projects
  for select to authenticated using (auth.uid() = owner_id and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true
  ));
drop policy if exists "Employees can create their own indesign projects" on public.indesign_projects;
create policy "Employees can create their own indesign projects" on public.indesign_projects
  for insert to authenticated with check (auth.uid() = owner_id and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true
  ));
drop policy if exists "Employees can update their own indesign projects" on public.indesign_projects;
create policy "Employees can update their own indesign projects" on public.indesign_projects
  for update to authenticated using (auth.uid() = owner_id and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true
  )) with check (auth.uid() = owner_id and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true
  ));
drop policy if exists "Employees can delete their own indesign projects" on public.indesign_projects;
create policy "Employees can delete their own indesign projects" on public.indesign_projects
  for delete to authenticated using (auth.uid() = owner_id and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true
  ));
create or replace function public.indesign_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists indesign_projects_updated_at on public.indesign_projects;
create trigger indesign_projects_updated_at before update on public.indesign_projects
for each row execute function public.indesign_set_updated_at();
