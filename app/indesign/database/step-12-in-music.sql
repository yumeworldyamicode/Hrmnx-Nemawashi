-- in. music Stage 2 foundation.
-- Run after Step 11 publication library migration.
alter table public.indesign_dems add column if not exists cover_path text;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('in-music-artwork','in-music-artwork',true,12582912,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=12582912,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];
drop policy if exists "Public can view in music artwork" on storage.objects;
create policy "Public can view in music artwork" on storage.objects for select to anon,authenticated using (bucket_id='in-music-artwork');
drop policy if exists "Employees can upload in music artwork" on storage.objects;
create policy "Employees can upload in music artwork" on storage.objects for insert to authenticated with check (
 bucket_id='in-music-artwork' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_staff=true)
);
drop policy if exists "Employees can delete in music artwork" on storage.objects;
create policy "Employees can delete in music artwork" on storage.objects for delete to authenticated using (
 bucket_id='in-music-artwork' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_staff=true)
);
