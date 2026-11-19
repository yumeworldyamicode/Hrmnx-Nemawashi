-- Hrmnx unified messaging: Stage 5 security hardening
-- Uses the existing nemawashi_space_members membership table.
-- Run after Stages 1-4. Replaces policies only; does not alter message data.

-- Message visibility: staff + participants for personal, staff-wide Business,
-- and Space members (staff membership) for Space messages.
drop policy if exists "Employees can read permitted Hrmnx messages" on public.hrmnx_messages;
create policy "Employees can read permitted Hrmnx messages"
on public.hrmnx_messages
for select
to authenticated
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
      and exists (
        select 1
        from public.nemawashi_space_members sm
        where sm.space_id = hrmnx_messages.space_id
          and sm.user_id = auth.uid()
      )
    )
  )
);

-- Insert messages: sender must be staff; personal recipients must be staff;
-- Space messages require membership in that Space.
drop policy if exists "Employees can send Hrmnx messages" on public.hrmnx_messages;
create policy "Employees can send Hrmnx messages"
on public.hrmnx_messages
for insert
to authenticated
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
      and exists (
        select 1
        from public.nemawashi_space_members sm
        where sm.space_id = hrmnx_messages.space_id
          and sm.user_id = auth.uid()
      )
    )
  )
);

-- Read receipts: users may insert their own receipt only for messages they can access.
drop policy if exists "Employees can mark Hrmnx messages read" on public.hrmnx_message_reads;
create policy "Employees can mark Hrmnx messages read"
on public.hrmnx_message_reads
for insert
to authenticated
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
          and exists (
            select 1
            from public.nemawashi_space_members sm
            where sm.space_id = m.space_id
              and sm.user_id = auth.uid()
          )
        )
      )
  )
);

-- Verify the policies after installation.
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('hrmnx_messages', 'hrmnx_message_reads')
order by tablename, policyname;
