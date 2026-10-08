-- Diagnostic safety net: keep the raw webhook body so we can see exactly
-- what Vodia sent if the college match ever fails again.
alter table public.lumiere_call_starts add column if not exists raw jsonb;
