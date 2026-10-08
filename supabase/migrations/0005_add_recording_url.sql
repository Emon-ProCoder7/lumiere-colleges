-- The actual playable audio URL, filled in once n8n fetches the recording
-- from Vodia and uploads it to Supabase Storage (public "voicemails" bucket).
alter table public.lumiere_voicemails add column if not exists recording_url text;
