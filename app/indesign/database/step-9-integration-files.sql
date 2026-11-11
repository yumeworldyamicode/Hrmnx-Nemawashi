-- indesign Step 9: shared design and DAW file exchange
-- Run after Step 8 in Supabase Dashboard -> SQL Editor.
-- Private storage: assets are only visible to their owning employee.

insert into storage.buckets (id, name, public, file_size_limit)
values ('indesign-integration-assets', 'indesign-integration-assets', false, 524288000)
on conflict (id) do update
set public = false, file_size_limit = 524288000;

create table if not exists public.indesign_integration_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.indesign_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in (
    'figma', 'adobe', 'canva', 'penpot',
    'ableton_live', 'fl_studio', 'logic_pro', 'studio_one'
  )),
  filename text not null,
  storage_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  asset_type text not null default 'file'
    check (asset_type in ('design', 'audio', 'session', 'archive', 'document', 'file')),
  created_at timestamptz not null default now()
);

create index if not exists indesign_integration_assets_project_idx
  on public.indesign_integration_assets (project_id, created_at desc);
create index if not exists indesign_integration_assets_user_idx
  on public.indesign_integration_assets (user_id, created_at desc);

alter table public.indesign_integration_assets enable row level security;

drop policy if exists "Employees can view their own integration assets"
  on public.indesign_integration_assets;
create policy "Employees can view their own integration assets"
  on public.indesign_integration_assets
  for select to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.indesign_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_staff = true
    )
  );

drop policy if exists "Employees can add assets to their own projects"
  on public.indesign_integration_assets;
create policy "Employees can add assets to their own projects"
  on public.indesign_integration_assets
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.indesign_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_staff = true
    )
  );

drop policy if exists "Employees can delete their own integration assets"
  on public.indesign_integration_assets;
create policy "Employees can delete their own integration assets"
  on public.indesign_integration_assets
  for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.indesign_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

grant select, insert, delete on public.indesign_integration_assets to authenticated;
grant all on public.indesign_integration_assets to service_role;

drop policy if exists "Employees can upload integration assets to their project folders"
  on storage.objects;
create policy "Employees can upload integration assets to their project folders"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'indesign-integration-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.indesign_projects p
      where p.id::text = (storage.foldername(name))[2]
        and p.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_staff = true
    )
  );

drop policy if exists "Employees can read their own integration assets"
  on storage.objects;
create policy "Employees can read their own integration assets"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'indesign-integration-assets'
    and exists (
      select 1 from public.indesign_integration_assets a
      where a.storage_path = name and a.user_id = auth.uid()
    )
  );

drop policy if exists "Employees can delete their own integration assets from storage"
  on storage.objects;
create policy "Employees can delete their own integration assets from storage"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'indesign-integration-assets'
    and exists (
      select 1 from public.indesign_integration_assets a
      where a.storage_path = name and a.user_id = auth.uid()
    )
  );
