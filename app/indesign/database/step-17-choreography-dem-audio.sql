-- InDesign Choreography: project type + extracted DEM audio storage support
-- Run this in Supabase SQL Editor before creating Choreography projects.
alter table public.indesign_projects drop constraint if exists indesign_projects_type_check;
alter table public.indesign_projects add constraint indesign_projects_type_check
  check (type in ('moodboard','board','brainstorm','choreography'));

update storage.buckets
set public = true,
    file_size_limit = 524288000,
    allowed_mime_types = array[
      'application/zip','audio/mpeg','audio/wav','audio/mp4','audio/aac',
      'audio/ogg','audio/flac','audio/webm','audio/aiff','audio/x-aiff'
    ]
where id = 'indesign-dems';
