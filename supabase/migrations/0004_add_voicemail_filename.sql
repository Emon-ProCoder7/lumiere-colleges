-- Diagnostic column: capture Vodia's raw {filename} value alongside {mp3} so
-- we can work out how it maps to the numeric REST message ID
-- (https://175.158.106.137/rest/user/<mailbox>/message/<id>) needed for
-- audio playback.
alter table public.lumiere_voicemails add column if not exists filename text;
alter table public.lumiere_voicemails add column if not exists raw jsonb;
