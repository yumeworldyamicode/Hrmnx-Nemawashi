-- Hrmnx unified messaging: Stage 4
-- Add unified message tables to Supabase Realtime publication (if not already present).
-- Also run final schema/count/trigger verification queries.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'hrmnx_messages'
  ) then
    alter publication supabase_realtime add table public.hrmnx_messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'hrmnx_message_reads'
  ) then
    alter publication supabase_realtime add table public.hrmnx_message_reads;
  end if;
end;
$$;

-- Realtime publication membership
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('hrmnx_messages', 'hrmnx_message_reads')
order by tablename;

-- Unified message counts by category
select category, count(*) as total_messages
from public.hrmnx_messages
group by category
order by category;

-- Confirm the legacy synchronization triggers exist
select distinct trigger_name, event_object_table as source_table
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in (
    'trg_sync_direct_messages_hrmnx',
    'trg_sync_space_messages_hrmnx'
  )
order by source_table, trigger_name;
