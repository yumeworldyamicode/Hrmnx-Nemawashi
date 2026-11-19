-- Hrmnx unified messaging: Stage 3
-- Keep the unified table synchronized from the legacy message tables.
-- Synchronization is one-way (legacy -> unified); the legacy tables remain the source of truth.
-- Uses SECURITY DEFINER so writes can be performed by the trigger despite RLS on the target table.

create or replace function public.sync_nemawashi_direct_message_to_hrmnx()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.hrmnx_messages
    where source_table = 'nemawashi_direct_messages'
      and source_id = old.id::text;
    return old;
  end if;

  insert into public.hrmnx_messages (
    category, sender_id, recipient_id, share_id, content,
    source_table, source_id, created_at
  )
  values (
    'personal', new.sender_id, new.recipient_id, new.share_id,
    coalesce(new.content, ''),
    'nemawashi_direct_messages', new.id::text, new.created_at
  )
  on conflict (source_table, source_id)
    where source_table is not null and source_id is not null
  do update set
    content = excluded.content,
    share_id = excluded.share_id,
    created_at = excluded.created_at;

  return new;
end;
$$;

create or replace function public.sync_nemawashi_space_message_to_hrmnx()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.hrmnx_messages
    where source_table = 'nemawashi_messages'
      and source_id = old.id::text;
    return old;
  end if;

  insert into public.hrmnx_messages (
    category, sender_id, space_id, content,
    source_table, source_id, created_at, is_edited
  )
  values (
    'space', new.user_id, new.space_id, coalesce(new.content, ''),
    'nemawashi_messages', new.id::text, new.created_at,
    coalesce(new.is_edited, false)
  )
  on conflict (source_table, source_id)
    where source_table is not null and source_id is not null
  do update set
    content = excluded.content,
    space_id = excluded.space_id,
    created_at = excluded.created_at,
    is_edited = excluded.is_edited;

  return new;
end;
$$;

drop trigger if exists trg_sync_direct_messages_hrmnx on public.nemawashi_direct_messages;
create trigger trg_sync_direct_messages_hrmnx
after insert or update or delete on public.nemawashi_direct_messages
for each row execute function public.sync_nemawashi_direct_message_to_hrmnx();

drop trigger if exists trg_sync_space_messages_hrmnx on public.nemawashi_messages;
create trigger trg_sync_space_messages_hrmnx
after insert or update or delete on public.nemawashi_messages
for each row execute function public.sync_nemawashi_space_message_to_hrmnx();

-- Verify triggers were installed
select
  trigger_name,
  event_object_table as source_table,
  action_timing,
  event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in (
    'trg_sync_direct_messages_hrmnx',
    'trg_sync_space_messages_hrmnx'
  )
order by source_table, trigger_name, event_manipulation;
