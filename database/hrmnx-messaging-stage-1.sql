-- Hrmnx unified messaging: Stage 1
-- Create core tables and RLS. Does not migrate data or install triggers.
-- Matched to the verified Nemawashi schema (Space IDs are bigint).

create table if not exists public.hrmnx_messages (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('personal', 'business', 'space')),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  space_id bigint references public.nemawashi_spaces(id) on delete cascade,
  share_id uuid references public.indesign_shared_segments(id) on delete set null,
  content text not null default '',
  source_table text,
  source_id text,
  created_at timestamptz not null default now(),
  is_edited boolean not null default false,
  constraint hrmnx_message_category_target check (
    (category = 'personal' and recipient_id is not null and space_id is null and sender_id <> recipient_id)
    or (category = 'business' and recipient_id is null and space_id is null)
    or (category = 'space' and recipient_id is null and space_id is not null)
  )
);

create unique index if not exists hrmnx_messages_legacy_source_unique
  on public.hrmnx_messages(source_table, source_id)
  where source_table is not null and source_id is not null;

create index if not exists hrmnx_messages_personal_thread
  on public.hrmnx_messages(sender_id, recipient_id, created_at desc)
  where category = 'personal';

create index if not exists hrmnx_messages_category_created
  on public.hrmnx_messages(category, created_at desc);

create index if not exists hrmnx_messages_space_created
  on public.hrmnx_messages(space_id, created_at desc)
  where category = 'space';

alter table public.hrmnx_messages enable row level security;

drop policy if exists "Employees can read permitted Hrmnx messages" on public.hrmnx_messages;
create policy "Employees can read permitted Hrmnx messages"
  on public.hrmnx_messages for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true)
    and (
      (category = 'personal' and (sender_id = auth.uid() or recipient_id = auth.uid()))
      or category = 'business'
      or (category = 'space' and exists (
        select 1 from public.nemawashi_spaces s where s.id = hrmnx_messages.space_id
      ))
    )
  );

drop policy if exists "Employees can send Hrmnx messages" on public.hrmnx_messages;
create policy "Employees can send Hrmnx messages"
  on public.hrmnx_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_staff = true)
    and (
      (category = 'personal' and recipient_id is not null and recipient_id <> auth.uid()
        and space_id is null
        and exists (select 1 from public.profiles p where p.id = recipient_id and p.is_staff = true))
      or (category = 'business' and recipient_id is null and space_id is null)
      or (category = 'space' and recipient_id is null
        and exists (select 1 from public.nemawashi_spaces s where s.id = space_id))
    )
  );

create table if not exists public.hrmnx_message_reads (
  message_id uuid not null references public.hrmnx_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.hrmnx_message_reads enable row level security;

drop policy if exists "Employees can view own Hrmnx message reads" on public.hrmnx_message_reads;
create policy "Employees can view own Hrmnx message reads"
  on public.hrmnx_message_reads for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Employees can mark Hrmnx messages read" on public.hrmnx_message_reads;
create policy "Employees can mark Hrmnx messages read"
  on public.hrmnx_message_reads for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.hrmnx_messages m where m.id = message_id)
  );
