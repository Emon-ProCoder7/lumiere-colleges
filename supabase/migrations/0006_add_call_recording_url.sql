-- The actual playable call-recording URL, filled in once n8n fetches the
-- recording from Vodia and uploads it to Supabase Storage (public
-- "call-recordings" bucket). Also store raw CDR fields we didn't capture
-- before, now that we're parsing the real webcdr JSON schema.
alter table public.lumiere_calls add column if not exists call_recording_url text;
alter table public.lumiere_calls add column if not exists raw jsonb;
