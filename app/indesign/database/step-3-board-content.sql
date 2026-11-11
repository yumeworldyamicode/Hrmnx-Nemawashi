-- indesign Step 3: persistent Regular Board content
-- Run this migration in the Nemawashi Supabase SQL Editor.

alter table public.indesign_projects
  add column if not exists content jsonb not null default '{"elements":[]}'::jsonb;

update public.indesign_projects
set content = '{"elements":[]}'::jsonb
where content is null;
