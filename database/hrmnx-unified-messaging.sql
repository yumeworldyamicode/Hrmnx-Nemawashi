-- Hrmnx unified messaging foundation. Run once in the Nemawashi Supabase SQL Editor.
create table if not exists public.hrmnx_messages (
 id uuid primary key default gen_random_uuid(),
 category text not null check (category in ('personal','business','space')),
 sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid references auth.users(id) on delete cascade,
 space_id uuid references public.nemawashi_spaces(id) on delete cascade,
 content text not null default '',
 source_table text, source_id uuid,
 created_at timestamptz not null default now(),
 is_edited boolean not null default false,
 constraint hrmnx_message_category_target check (
  (category='personal' and recipient_id is not null and space_id is null and sender_id<>recipient_id)
  or (category='business' and recipient_id is null and space_id is null)
  or (category='space' and recipient_id is null and space_id is not null)
 )
);
create unique index if not exists hrmnx_messages_legacy_source_unique on public.hrmnx_messages(source_table,source_id) where source_table is not null and source_id is not null;
create index if not exists hrmnx_messages_personal_thread on public.hrmnx_messages(sender_id,recipient_id,created_at desc) where category='personal';
create index if not exists hrmnx_messages_category_created on public.hrmnx_messages(category,created_at desc);
create index if not exists hrmnx_messages_space_created on public.hrmnx_messages(space_id,created_at desc) where category='space';
alter table public.hrmnx_messages enable row level security;
drop policy if exists "Employees can read permitted Hrmnx messages" on public.hrmnx_messages;
create policy "Employees can read permitted Hrmnx messages" on public.hrmnx_messages for select to authenticated using (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_staff=true)
 and ((category='personal' and (sender_id=auth.uid() or recipient_id=auth.uid())) or category='business'
 or (category='space' and exists(select 1 from public.nemawashi_spaces s where s.id=hrmnx_messages.space_id)))
);
drop policy if exists "Employees can send Hrmnx messages" on public.hrmnx_messages;
create policy "Employees can send Hrmnx messages" on public.hrmnx_messages for insert to authenticated with check (
 sender_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_staff=true)
 and ((category='personal' and recipient_id is not null and recipient_id<>auth.uid() and space_id is null
       and exists(select 1 from public.profiles p where p.id=recipient_id and p.is_staff=true))
   or (category='business' and recipient_id is null and space_id is null)
   or (category='space' and recipient_id is null and exists(select 1 from public.nemawashi_spaces s where s.id=space_id)))
);
create table if not exists public.hrmnx_message_reads (
 message_id uuid not null references public.hrmnx_messages(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key(message_id,user_id)
);
alter table public.hrmnx_message_reads enable row level security;
drop policy if exists "Employees can view own Hrmnx message reads" on public.hrmnx_message_reads;
create policy "Employees can view own Hrmnx message reads" on public.hrmnx_message_reads for select to authenticated using(user_id=auth.uid());
drop policy if exists "Employees can mark Hrmnx messages read" on public.hrmnx_message_reads;
create policy "Employees can mark Hrmnx messages read" on public.hrmnx_message_reads for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.hrmnx_messages m where m.id=message_id));
create or replace function public.hrmnx_mirror_legacy_space_message() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.hrmnx_messages(category,sender_id,space_id,content,source_table,source_id,created_at,is_edited)
 values('space',new.user_id,new.space_id,coalesce(new.content,''),'nemawashi_messages',new.id,new.created_at,coalesce(new.is_edited,false))
 on conflict(source_table,source_id) where source_table is not null and source_id is not null do nothing;
 return new;
end; $$;
drop trigger if exists hrmnx_mirror_legacy_space_message on public.nemawashi_messages;
create trigger hrmnx_mirror_legacy_space_message after insert on public.nemawashi_messages for each row execute function public.hrmnx_mirror_legacy_space_message();
insert into public.hrmnx_messages(category,sender_id,recipient_id,content,source_table,source_id,created_at)
select 'personal',sender_id,recipient_id,coalesce(content,''),'nemawashi_direct_messages',id,created_at from public.nemawashi_direct_messages
on conflict(source_table,source_id) where source_table is not null and source_id is not null do nothing;
insert into public.hrmnx_messages(category,sender_id,space_id,content,source_table,source_id,created_at,is_edited)
select 'space',user_id,space_id,coalesce(content,''),'nemawashi_messages',id,created_at,coalesce(is_edited,false) from public.nemawashi_messages
on conflict(source_table,source_id) where source_table is not null and source_id is not null do nothing;
do $$ begin alter publication supabase_realtime add table public.hrmnx_messages; exception when duplicate_object then null; end $$;
create table if not exists public.hrmnx_app_releases (
 id uuid primary key default gen_random_uuid(), app_slug text not null, version text not null,
 title text not null, summary text not null default '', released_at timestamptz not null default now(),
 is_published boolean not null default true, unique(app_slug,version)
);
alter table public.hrmnx_app_releases enable row level security;
drop policy if exists "Published Hrmnx release notes are readable" on public.hrmnx_app_releases;
create policy "Published Hrmnx release notes are readable" on public.hrmnx_app_releases for select to authenticated using(is_published=true);

insert into public.hrmnx_app_releases(app_slug,version,title,summary,is_published)
values
 ('nemawashi','1.1.0','Unified Hrmnx Messages','Personal, Business and Space messages now share one communication foundation. Notifications and quick chat are being introduced across Hrmnx apps.',true),
 ('indesign','1.1.0','Connected to Hrmnx Messages','InDesign now uses the shared Nemawashi messaging service, with Personal, Business and Space categories.',true)
on conflict(app_slug,version) do nothing;
