-- Hrmnx unified messaging: Stage 2
-- Copies existing Personal and Space messages into the unified table.
-- Original tables are not modified or deleted. Safe to re-run due to source uniqueness.

insert into public.hrmnx_messages (
  category, sender_id, recipient_id, share_id, content,
  source_table, source_id, created_at
)
select
  'personal',
  dm.sender_id,
  dm.recipient_id,
  dm.share_id,
  coalesce(dm.content, ''),
  'nemawashi_direct_messages',
  dm.id::text,
  dm.created_at
from public.nemawashi_direct_messages dm
where dm.sender_id is not null
  and dm.recipient_id is not null
  and dm.sender_id <> dm.recipient_id
on conflict (source_table, source_id)
  where source_table is not null and source_id is not null
do nothing;

insert into public.hrmnx_messages (
  category, sender_id, space_id, content,
  source_table, source_id, created_at, is_edited
)
select
  'space',
  msg.user_id,
  msg.space_id,
  coalesce(msg.content, ''),
  'nemawashi_messages',
  msg.id::text,
  msg.created_at,
  coalesce(msg.is_edited, false)
from public.nemawashi_messages msg
where msg.user_id is not null
  and msg.space_id is not null
on conflict (source_table, source_id)
  where source_table is not null and source_id is not null
do nothing;

-- Verification counts
select
  category,
  count(*) as copied_messages
from public.hrmnx_messages
where source_table in ('nemawashi_direct_messages', 'nemawashi_messages')
group by category
order by category;
