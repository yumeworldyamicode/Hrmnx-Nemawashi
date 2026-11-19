-- Hrmnx messaging: Stage 6 final privilege and membership-check hardening
-- Run after Stage 5. Does not change or delete message data.
-- Uses a narrowly-scoped SECURITY DEFINER helper to test Space membership
-- while bypassing RLS on nemawashi_space_members (which has no SELECT policy).

create or replace function public.hrmnx_user_is_space_member(
  target_space_id bigint,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.nemawashi_space_members sm
    where sm.space_id = target_space_id
      and sm.user_id = target_user_id
  );
$$;

revoke all on function public.hrmnx_user_is_space_member(bigint, uuid) from public;
revoke all on function public.hrmnx_user_is_space_member(bigint, uuid) from anon;
grant execute on function public.hrmnx_user_is_space_member(bigint, uuid) to authenticated;

-- Remove API privileges from anonymous users and limit authenticated grants
-- to the operations used by this messaging interface.
revoke all privileges on table public.hrmnx_messages from anon;
revoke all privileges on table public.hrmnx_message_reads from anon;

revoke all privileges on table public.hrmnx_messages from authenticated;
revoke all privileges on table public.hrmnx_message_reads from authenticated;

grant select, insert on table public.hrmnx_messages to authenticated;
grant select, insert on table public.hrmnx_message_reads to authenticated;

-- Replace policies so membership checks use the controlled helper function.
drop policy if exists "Employees can read permitted Hrmnx messages" on public.hrmnx_messages;
create policy "Employees can read permitted Hrmnx messages"
on public.hrmnx_messages
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_staff = true
  )
  and (
    (category = 'personal' and (sender_id = auth.uid() or recipient_id = auth.uid()))
    or category = 'business'
    or (
      category = 'space'
      and public.hrmnx_user_is_space_member(space_id, auth.uid())
    )
  )
);

drop policy if exists "Employees can send Hrmnx messages" on public.hrmnx_messages;
create policy "Employees can send Hrmnx messages"
on public.hrmnx_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_staff = true
  )
  and (
    (
      category = 'personal'
      and recipient_id is not null
      and recipient_id <> auth.uid()
      and space_id is null
      and exists (
        select 1 from public.profiles p
        where p.id = recipient_id and p.is_staff = true
      )
    )
    or (category = 'business' and recipient_id is null and space_id is null)
    or (
      category = 'space'
      and recipient_id is null
      and public.hrmnx_user_is_space_member(space_id, auth.uid())
    )
  )
);

drop policy if exists "Employees can mark Hrmnx messages read" on public.hrmnx_message_reads;
create policy "Employees can mark Hrmnx messages read"
on public.hrmnx_message_reads
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.hrmnx_messages m
    where m.id = hrmnx_message_reads.message_id
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_staff = true
      )
      and (
        (m.category = 'personal' and (m.sender_id = auth.uid() or m.recipient_id = auth.uid()))
        or m.category = 'business'
        or (
          m.category = 'space'
          and public.hrmnx_user_is_space_member(m.space_id, auth.uid())
        )
      )
  )
);

-- Final verification: API grants
select grantee, table_name, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('hrmnx_messages', 'hrmnx_message_reads')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Final verification: policy names and helper function presence
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('hrmnx_messages', 'hrmnx_message_reads')
order by tablename, policyname;

select to_regprocedure('public.hrmnx_user_is_space_member(bigint,uuid)') as membership_helper;
