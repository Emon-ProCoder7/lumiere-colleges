# Lumiere College Group — Live Operations

Internal dashboard showing, per college, recent voicemails (with automatic
transcription) and recent calls. Built because reception couldn't tell which
college a voicemail or missed call belonged to, with a single shared
reception line answering all 12 numbers.

**No login gate.** Deliberate short-term call to ship fast — add a gate
(Vercel Deployment Protection or Supabase Auth) before sharing the URL beyond
the people who should have it.

## Stack

- Next.js 16 (App Router), React 19
- Supabase (Postgres), read via a server-only service-role client
- No client-side Supabase usage — every number is computed server-side
- Data arrives from Vodia PBX webhooks via an n8n workflow

## Local setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local`, fill in your Supabase project's URL and service role key
3. Run the SQL in `supabase/migrations/0001_create_lumiere_tables.sql` via the Supabase SQL Editor — creates `lumiere_colleges` (pre-seeded with all 12), `lumiere_voicemails`, `lumiere_calls`
4. `npm run dev`

## Data pipeline

Vodia's tenant-level webhooks post to an n8n workflow on every new voicemail
("When a new mailbox message is available") and every completed call (the
CDR webhook). n8n matches the called number (`{to}`) against
`lumiere_colleges.local_number_e164`, attaches the matching `college_code`,
and writes the row to Supabase via the REST API with the service role key.
This app only reads.

**Known limitation:** Vodia's `{mp3}` field is a file path on the PBX server,
not a public URL, so audio playback isn't wired up yet — the dashboard shows
Vodia's automatic transcription (`{text}`) instead. Fetching and hosting the
actual recording needs Vodia admin credentials for n8n to download it with;
revisit once that's available.

## Deploying to Vercel

1. Import this repo in Vercel
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Production + Preview)
3. Deploy — no other config needed
