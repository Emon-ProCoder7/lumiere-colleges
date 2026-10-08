-- Staging table for the college-matching fix.
-- Vodia's "new mailbox message" webhook only tells us which mailbox received
-- the message (the shared reception extension), not which college's number
-- was originally dialled. "When a new call comes in" fires at the very start
-- of every call and does carry the real dialled number, so we log a row here
-- the moment each call begins, then look it up by caller number when the
-- matching voicemail arrives a little later.

create table if not exists public.lumiere_call_starts (
  id uuid primary key default gen_random_uuid(),
  call_id text,
  college_code text references public.lumiere_colleges (code),
  from_number text not null,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists lumiere_call_starts_from_idx
  on public.lumiere_call_starts (from_number, started_at desc);

alter table public.lumiere_call_starts enable row level security;
