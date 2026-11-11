-- indesign Step 8: shared design + DAW integration foundation
-- Run once in Supabase Dashboard -> SQL Editor.
-- OAuth access/refresh tokens MUST NOT be stored in these client-readable tables.

create table if not exists public.indesign_integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in (
    'figma', 'adobe', 'canva', 'penpot',
    'ableton_live', 'fl_studio', 'logic_pro', 'studio_one'
  )),
  provider_account_id text,
  account_label text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'connected', 'expired', 'error', 'disconnected')),
  scopes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists indesign_integration_connections_user_idx
  on public.indesign_integration_connections (user_id, provider);

alter table public.indesign_integration_connections enable row level security;

drop policy if exists "Employees can view their own integration connections"
  on public.indesign_integration_connections;
create policy "Employees can view their own integration connections"
  on public.indesign_integration_connections
  for select to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_staff = true
    )
  );

-- Connection records are written by trusted server-side OAuth functions only.
revoke insert, update, delete on public.indesign_integration_connections from anon, authenticated;
grant select on public.indesign_integration_connections to authenticated;
grant all on public.indesign_integration_connections to service_role;

create table if not exists public.indesign_project_integrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.indesign_projects(id) on delete cascade,
  connection_id uuid not null references public.indesign_integration_connections(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, connection_id)
);

create index if not exists indesign_project_integrations_project_idx
  on public.indesign_project_integrations (project_id);
create index if not exists indesign_project_integrations_connection_idx
  on public.indesign_project_integrations (connection_id);

alter table public.indesign_project_integrations enable row level security;

drop policy if exists "Employees can view their project integrations"
  on public.indesign_project_integrations;
create policy "Employees can view their project integrations"
  on public.indesign_project_integrations
  for select to authenticated
  using (
    exists (
      select 1 from public.indesign_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.indesign_integration_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Employees can attach their own integrations to projects"
  on public.indesign_project_integrations;
create policy "Employees can attach their own integrations to projects"
  on public.indesign_project_integrations
  for insert to authenticated
  with check (
    exists (
      select 1 from public.indesign_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.indesign_integration_connections c
      where c.id = connection_id
        and c.user_id = auth.uid()
        and c.status = 'connected'
    )
  );

drop policy if exists "Employees can detach their own project integrations"
  on public.indesign_project_integrations;
create policy "Employees can detach their own project integrations"
  on public.indesign_project_integrations
  for delete to authenticated
  using (
    exists (
      select 1 from public.indesign_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.indesign_integration_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

grant select, insert, delete on public.indesign_project_integrations to authenticated;
grant all on public.indesign_project_integrations to service_role;

create table if not exists public.indesign_integration_sync_runs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.indesign_integration_connections(id) on delete cascade,
  project_id uuid references public.indesign_projects(id) on delete set null,
  direction text not null check (direction in ('import', 'export', 'sync')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  summary text not null default '',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists indesign_integration_sync_runs_connection_idx
  on public.indesign_integration_sync_runs (connection_id, created_at desc);
create index if not exists indesign_integration_sync_runs_project_idx
  on public.indesign_integration_sync_runs (project_id, created_at desc);

alter table public.indesign_integration_sync_runs enable row level security;

drop policy if exists "Employees can view their own integration sync history"
  on public.indesign_integration_sync_runs;
create policy "Employees can view their own integration sync history"
  on public.indesign_integration_sync_runs
  for select to authenticated
  using (
    exists (
      select 1 from public.indesign_integration_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
  );

-- Sync jobs and their results are created/updated by trusted server-side adapters.
revoke insert, update, delete on public.indesign_integration_sync_runs from anon, authenticated;
grant select on public.indesign_integration_sync_runs to authenticated;
grant all on public.indesign_integration_sync_runs to service_role;

create or replace function public.indesign_set_integration_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists indesign_integration_connections_updated_at
  on public.indesign_integration_connections;
create trigger indesign_integration_connections_updated_at
before update on public.indesign_integration_connections
for each row execute function public.indesign_set_integration_updated_at();
