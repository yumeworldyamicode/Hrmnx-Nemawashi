-- Hrmnx messaging: Stage 6B - make Space membership helper non-enumerable
-- Run after Stage 6. This replaces the helper with a current-user-only function.
-- Authenticated callers can only test their own membership in a Space.

create or replace function public.hrmnx_user_is_space_member(
  target_space_id bigint
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
      and sm.user_id = auth.uid()
  );
$$;

revoke all on function public.hrmnx_user_is_space_member(bigint) from public;
revoke all on function public.hrmnx_user_is_space_member(bigint) from anon;
grant execute on function public.hrmnx_user_is_space_member(bigint) to authenticated;

-- Remove the older helper that accepted an arbitrary user ID.
drop function if exists public.hrmnx_user_is_space_member(bigint, uuid);

-- Update policies to use the new helper signature.
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
      and public.hrmnx_user_is_space_member(space_id)
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
      and public.hrmnx_user_is_space_member(space_id)
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
          and public.hrmnx_user_is_space_member(m.space_id)
        )
      )
  )
);

-- Verify new signature exists and old signature is gone.
select
  to_regprocedure('public.hrmnx_user_is_space_member(bigint)') as safe_helper,
  to_regprocedure('public.hrmnx_user_is_space_member(bigint,uuid)') as old_helper;
