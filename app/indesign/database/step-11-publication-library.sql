-- indesign Stage 1: publication library, visibility and per-DEM appearance.
-- Run after step-6-dem-sharing.sql in the Nemawashi Supabase SQL Editor.
alter table public.indesign_dems
 add column if not exists project_id uuid references public.indesign_projects(id) on delete set null,
 add column if not exists description text not null default '',
 add column if not exists visibility text not null default 'public' check (visibility in ('public','unlisted')),
 add column if not exists theme text not null default 'blur' check (theme in ('blur','light','dark')),
 add column if not exists updated_at timestamptz not null default now();
update public.indesign_dems set visibility=case when is_public then 'public' else 'unlisted' end;
drop policy if exists "Public can view published indesign DEMs" on public.indesign_dems;
create policy "Public can view published indesign DEMs" on public.indesign_dems for select to anon,authenticated using (visibility='public');
drop policy if exists "Owners can view their own indesign DEMs" on public.indesign_dems;
create policy "Owners can view their own indesign DEMs" on public.indesign_dems for select to authenticated using (auth.uid()=owner_id);
drop policy if exists "Owners can update their own indesign DEMs" on public.indesign_dems;
create policy "Owners can update their own indesign DEMs" on public.indesign_dems for update to authenticated using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create index if not exists indesign_dems_owner_created_idx on public.indesign_dems(owner_id,created_at desc);
create index if not exists indesign_dems_project_idx on public.indesign_dems(project_id);
create or replace function public.get_indesign_dem_by_slug(dem_slug text)
returns table(slug text,title text,artist text,package_path text,description text,visibility text,theme text,project_id uuid)
language sql stable security definer set search_path=public as $$
 select d.slug,d.title,d.artist,d.package_path,d.description,d.visibility,d.theme,d.project_id
 from public.indesign_dems d where d.slug=dem_slug and d.visibility in ('public','unlisted') limit 1;
$$;
revoke all on function public.get_indesign_dem_by_slug(text) from public;
grant execute on function public.get_indesign_dem_by_slug(text) to anon,authenticated;
update public.indesign_dems set is_public=(visibility='public');
