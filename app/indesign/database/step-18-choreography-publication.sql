-- Choreography publication support for DEM posts
alter table public.indesign_dems
  add column if not exists choreography jsonb,
  add column if not exists choreography_project_id uuid references public.indesign_projects(id) on delete set null;

drop function if exists public.get_indesign_dem_by_slug(text);
create function public.get_indesign_dem_by_slug(dem_slug text)
returns table(slug text,title text,artist text,package_path text,description text,visibility text,theme text,project_id uuid,choreography jsonb)
language sql stable security definer set search_path=public as $$
 select d.slug,d.title,d.artist,d.package_path,d.description,d.visibility,d.theme,d.project_id,d.choreography
 from public.indesign_dems d where d.slug=dem_slug and d.visibility in ('public','unlisted') limit 1;
$$;
revoke all on function public.get_indesign_dem_by_slug(text) from public;
grant execute on function public.get_indesign_dem_by_slug(text) to anon,authenticated;
