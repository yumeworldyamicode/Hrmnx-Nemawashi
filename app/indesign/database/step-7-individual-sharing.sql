-- indesign Step 7: individual Music Brainstorm sharing
-- Run in the Nemawashi Supabase SQL Editor before using individual sharing.
-- All shared audio is private and readable only by the sender and recipient.

create table if not exists public.indesign_shared_segments (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  project_name text not null,
  section_name text not null default '',
  idea_text text not null,
  start_seconds numeric(10,3) not null check (start_seconds >= 0),
  end_seconds numeric(10,3) not null check (end_seconds > start_seconds),
  audio_path text not null unique,
  created_at timestamptz not null default now(),
  constraint indesign_shared_segments_distinct_users check (sender_id <> recipient_id)
);

alter table public.indesign_shared_segments enable row level security;

drop policy if exists "Participants can view their shared indesign segments" on public.indesign_shared_segments;
create policy "Participants can view their shared indesign segments"
on public.indesign_shared_segments
for select to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Employees can share indesign segments" on public.indesign_shared_segments;
create policy "Employees can share indesign segments"
on public.indesign_shared_segments
for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (select 1 from public.profiles p where p.id = sender_id and p.is_staff = true)
  and exists (select 1 from public.profiles p where p.id = recipient_id and p.is_staff = true)
);

drop policy if exists "Senders can remove their indesign segments" on public.indesign_shared_segments;
create policy "Senders can remove their indesign segments"
on public.indesign_shared_segments
for delete to authenticated
using (auth.uid() = sender_id);

create table if not exists public.nemawashi_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  share_id uuid references public.indesign_shared_segments(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint nemawashi_direct_messages_distinct_users check (sender_id <> recipient_id)
);

create index if not exists nemawashi_direct_messages_sender_recipient_created
  on public.nemawashi_direct_messages(sender_id, recipient_id, created_at);
create index if not exists nemawashi_direct_messages_recipient_sender_created
  on public.nemawashi_direct_messages(recipient_id, sender_id, created_at);

alter table public.nemawashi_direct_messages enable row level security;

drop policy if exists "Participants can read their direct messages" on public.nemawashi_direct_messages;
create policy "Participants can read their direct messages"
on public.nemawashi_direct_messages
for select to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Employees can send direct messages" on public.nemawashi_direct_messages;
create policy "Employees can send direct messages"
on public.nemawashi_direct_messages
for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (select 1 from public.profiles p where p.id = sender_id and p.is_staff = true)
  and exists (select 1 from public.profiles p where p.id = recipient_id and p.is_staff = true)
  and (
    share_id is null
    or exists (
      select 1 from public.indesign_shared_segments s
      where s.id = share_id
        and s.sender_id = sender_id
        and s.recipient_id = recipient_id
    )
  )
);

-- A private bucket: recipients only receive signed playback URLs from the share page.
insert into storage.buckets (id, name, public, file_size_limit)
values ('indesign-message-audio', 'indesign-message-audio', false, 104857600)
on conflict (id) do update
set public = false, file_size_limit = 104857600;

drop policy if exists "Senders can upload indesign message audio" on storage.objects;
create policy "Senders can upload indesign message audio"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'indesign-message-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Participants can read indesign message audio" on storage.objects;
create policy "Participants can read indesign message audio"
on storage.objects
for select to authenticated
using (
  bucket_id = 'indesign-message-audio'
  and exists (
    select 1 from public.indesign_shared_segments s
    where s.audio_path = name
      and (s.sender_id = auth.uid() or s.recipient_id = auth.uid())
  )
);

drop policy if exists "Senders can delete indesign message audio" on storage.objects;
create policy "Senders can delete indesign message audio"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'indesign-message-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);
