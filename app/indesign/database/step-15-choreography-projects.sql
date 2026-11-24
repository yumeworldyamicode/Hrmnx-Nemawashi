-- InDesign Stage 1: choreography project type support
-- Run in Supabase SQL Editor after the original projects migration.
alter table public.indesign_projects drop constraint if exists indesign_projects_type_check;
alter table public.indesign_projects add constraint indesign_projects_type_check check (type in ('moodboard','board','brainstorm','choreography'));
