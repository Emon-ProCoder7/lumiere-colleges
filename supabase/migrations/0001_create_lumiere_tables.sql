-- Lumiere college group — voicemail and call visibility, by college.
-- Written by the Vodia webhook -> n8n workflow, read by this app.
-- Both sides use the service_role key; RLS stays on with no policies.

create table if not exists public.lumiere_colleges (
  code text primary key,
  display_name text not null,
  existing_number text not null,
  local_number text not null,
  local_number_e164 text not null,
  ring_group_account text not null
);

insert into public.lumiere_colleges
  (code, display_name, existing_number, local_number, local_number_e164, ring_group_account)
values
  ('SCBM', 'SCBM', '1800 07 7226', '03 7064 0656', '61370640656', '200'),
  ('ACTS', 'ACTS', '1800 00 2287', '03 7064 0657', '61370640657', '201'),
  ('EDUWIRE', 'Eduwire', '1800 0 39473', '03 7064 0658', '61370640658', '202'),
  ('SMTA', 'SMTA', '1800 00 7682', '03 7064 0659', '61370640659', '203'),
  ('MUSS', 'MUSS', '1300 03 6877', '03 7064 0660', '61370640660', '204'),
  ('EBC', 'Edward Business College', '1800 000 322', '03 7064 0661', '61370640661', '205'),
  ('TRADEXCEL', 'TradeXcel Institute', '1800 000 894', '03 7064 0662', '61370640662', '206'),
  ('MAPLE_RIDGE', 'Maple Ridge College Australia', '1800 00 6722', '03 7064 0663', '61370640663', '207'),
  ('AIHBM', 'AIHBM', '1800 0 24426', '03 7064 0664', '61370640664', '208'),
  ('NOVUS', 'Novus Health Institute', '1800 0 66887', '03 7064 0665', '61370640665', '209'),
  ('LUMIERE', 'Lumiere Solutions', '1800 001 527', '03 7064 0666', '61370640666', '210'),
  ('YSCI', 'YSCI', '1800 00 9724', '03 7064 0667', '61370640667', '211')
on conflict (code) do nothing;

-- One row per voicemail. college_code is resolved by the n8n workflow (it
-- matches the webhook's {to} number against lumiere_colleges.local_number_e164)
-- before the insert, so this app never has to do that lookup itself.
create table if not exists public.lumiere_voicemails (
  id uuid primary key default gen_random_uuid(),
  college_code text references public.lumiere_colleges (code),
  to_number text not null,
  from_number text,
  extension text,
  received_at timestamptz not null,
  duration_seconds integer not null default 0,
  transcription text,
  recording_ref text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lumiere_voicemails_college_idx on public.lumiere_voicemails (college_code);
create index if not exists lumiere_voicemails_received_idx on public.lumiere_voicemails (received_at desc);

-- One row per completed call, from the Vodia CDR webhook.
create table if not exists public.lumiere_calls (
  id uuid primary key default gen_random_uuid(),
  call_id text unique,
  college_code text references public.lumiere_colleges (code),
  to_number text not null,
  from_number text,
  direction text,
  status text,
  started_at timestamptz,
  duration_seconds integer not null default 0,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lumiere_calls_college_idx on public.lumiere_calls (college_code);
create index if not exists lumiere_calls_started_idx on public.lumiere_calls (started_at desc);

alter table public.lumiere_colleges enable row level security;
alter table public.lumiere_voicemails enable row level security;
alter table public.lumiere_calls enable row level security;
