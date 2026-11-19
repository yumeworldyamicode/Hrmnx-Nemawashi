-- Hrmnx messaging: Stage 6B - harden Space membership helper
-- Run after Stage 6. This moves the helper to the non-exposed private schema.
-- The helper only checks the membership of auth.uid(), never an arbitrary user.

-- Remove policies that depend on the previous helper.
drop policy if exists "Employees can read permitted Hrmnx messages" on public.hrmnx_messages;
drop policy if exists "Employees can send Hrmnx messages" on public.hrmnx_messages;
drop policy if exists "Employees can mark Hrmnx messages read" on public.hrmnx_message_reads;

-- Remove the old public helper.
drop function if exists public.hrmnx_user_is_space_member(bigint, uuid);
drop function if exists public.hrmnx_user_is_space_member(bigint);

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.hrmnx_user_is_space_member(target_space_id bigint)
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

revoke all on function private.hrmnx_user_is_space_member(bigint) from public, anon;
grant execute on function private.hrmnx_user_is_space_member(bigint) to authenticated;

-- Recreate policies against the private, self-only helper.
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
    or (category = 'space' and private.hrmnx_user_is_space_member(space_id))
  )
);

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
        select 1 from public.profiles rp
        where rp.id = recipient_id and rp.is_staff = true
      )
    )
    or (category = 'business' and recipient_id is null and space_id is null)
    or (
      category = 'space'
      and recipient_id is null
      and space_id is not null
      and private.hrmnx_user_is_space_member(space_id)
    )
  )
);

create policy "Employees can mark Hrmnx messages read"
on public.hrmnx_message_reads
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_staff = true
  )
  and exists (
    select 1 from public.hrmnx_messages m
    where m.id = message_id
      and (
        (m.category = 'personal' and (m.sender_id = auth.uid() or m.recipient_id = auth.uid()))
        or m.category = 'business'
        or (m.category = 'space' and private.hrmnx_user_is_space_member(m.space_id))
      )
  )
);

-- Verify helper and legacy signatures.
select
  to_regprocedure('private.hrmnx_user_is_space_member(bigint)') as safe_helper,
  to_regprocedure('public.hrmnx_user_is_space_member(bigint,uuid)') as old_helper,
  to_regprocedure('public.hrmnx_user_is_space_member(bigint)') as prior_public_helper;
