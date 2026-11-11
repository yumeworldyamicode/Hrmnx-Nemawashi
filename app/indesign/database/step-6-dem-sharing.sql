-- indesign Step 6C: public DEM packages
-- Run once in the Nemawashi Supabase SQL Editor.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('indesign-dems','indesign-dems',true,524288000,array['application/zip'])
on conflict (id) do update set public=true,file_size_limit=524288000,allowed_mime_types=array['application/zip'];

create table if not exists public.indesign_dems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(trim(title)) between 1 and 160),
  artist text not null check (char_length(trim(artist)) between 1 and 160),
  owner_id uuid not null references auth.users(id) on delete cascade,
  package_path text not null unique,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.indesign_dems enable row level security;
drop policy if exists "Public can view published indesign DEMs" on public.indesign_dems;
create policy "Public can view published indesign DEMs" on public.indesign_dems
for select to anon, authenticated using (is_public = true);
drop policy if exists "Employees can publish their own indesign DEMs" on public.indesign_dems;
create policy "Employees can publish their own indesign DEMs" on public.indesign_dems
for insert to authenticated with check (
  auth.uid() = owner_id and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true
  )
);
drop policy if exists "Employees can remove their own indesign DEMs" on public.indesign_dems;
create policy "Employees can remove their own indesign DEMs" on public.indesign_dems
for delete to authenticated using (
  auth.uid() = owner_id and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true
  )
);

drop policy if exists "Public can read published indesign DEM packages" on storage.objects;
create policy "Public can read published indesign DEM packages" on storage.objects
for select to anon, authenticated using (bucket_id = 'indesign-dems');
drop policy if exists "Employees can upload indesign DEM packages" on storage.objects;
create policy "Employees can upload indesign DEM packages" on storage.objects
for insert to authenticated with check (
  bucket_id = 'indesign-dems' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true
  )
);
drop policy if exists "Employees can delete indesign DEM packages" on storage.objects;
create policy "Employees can delete indesign DEM packages" on storage.objects
for delete to authenticated using (
  bucket_id = 'indesign-dems' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true
  )
);
