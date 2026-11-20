-- in. music Stage 19: release manager creator identity hardening.
drop policy if exists "Cinnasugar can manage home releases" on public.in_music_home_releases;
create policy "Cinnasugar can manage home releases" on public.in_music_home_releases
for all to authenticated
using (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com')
with check (lower(auth.jwt()->>'email')='mollyatkashi@gmail.com' and created_by=auth.uid());
