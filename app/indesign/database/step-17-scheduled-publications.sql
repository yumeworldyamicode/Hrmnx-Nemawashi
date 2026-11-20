-- indesign Stage 8: scheduled DEM/music publications.
-- Run in the Nemawashi Supabase SQL Editor after the publication-library steps.
alter table public.indesign_dems
  add column if not exists scheduled_at timestamptz;

drop policy if exists "Public can view published indesign DEMs" on public.indesign_dems;
create policy "Public can view published indesign DEMs"
on public.indesign_dems for select to anon, authenticated
using (visibility = 'public' and (scheduled_at is null or scheduled_at <= now()));

create index if not exists indesign_dems_schedule_idx
on public.indesign_dems(scheduled_at)
where visibility = 'public';
