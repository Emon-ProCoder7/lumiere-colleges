import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CollegeSummary, LumiereCall, LumiereOverview, LumiereVoicemail } from "./types";

const RECENT_LIMIT = 30;
const WINDOW_HOURS = 24;

function windowStart(): string {
  return new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
}

type CollegeRow = {
  code: string;
  display_name: string;
  existing_number: string;
  local_number: string;
};

type VoicemailRow = {
  id: string;
  college_code: string | null;
  from_number: string | null;
  received_at: string;
  duration_seconds: number;
  transcription: string | null;
};

type CallRow = {
  id: string;
  college_code: string | null;
  from_number: string | null;
  direction: string | null;
  status: string | null;
  started_at: string | null;
  duration_seconds: number;
};

export async function getLumiereOverview(): Promise<LumiereOverview> {
  const supabase = createAdminClient();
  const since = windowStart();

  const [collegesRes, voicemailsRes, callsRes, vmWindowRes, callWindowRes] = await Promise.all([
    supabase
      .from("lumiere_colleges")
      .select("code, display_name, existing_number, local_number")
      .order("ring_group_account"),
    supabase
      .from("lumiere_voicemails")
      .select("id, college_code, from_number, received_at, duration_seconds, transcription")
      .order("received_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("lumiere_calls")
      .select("id, college_code, from_number, direction, status, started_at, duration_seconds")
      .order("started_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase.from("lumiere_voicemails").select("college_code, received_at").gte("received_at", since),
    supabase.from("lumiere_calls").select("college_code, started_at").gte("started_at", since),
  ]);

  for (const [label, res] of [
    ["lumiere_colleges", collegesRes],
    ["lumiere_voicemails", voicemailsRes],
    ["lumiere_calls", callsRes],
    ["lumiere_voicemails window", vmWindowRes],
    ["lumiere_calls window", callWindowRes],
  ] as const) {
    if (res.error) throw new Error(`Lumiere query failed (${label}): ${res.error.message}`);
  }

  const colleges = (collegesRes.data ?? []) as CollegeRow[];
  const collegeByCode = new Map(colleges.map((c) => [c.code, c]));
  const nameFor = (code: string | null) =>
    code ? collegeByCode.get(code)?.display_name ?? code : "Unmatched number";

  const vmWindow = (vmWindowRes.data ?? []) as Array<{ college_code: string | null; received_at: string }>;
  const callWindow = (callWindowRes.data ?? []) as Array<{
    college_code: string | null;
    started_at: string | null;
  }>;

  const lastActivity = new Map<string, string>();
  const vmCount = new Map<string, number>();
  const callCount = new Map<string, number>();

  for (const row of vmWindow) {
    const key = row.college_code ?? "unmatched";
    vmCount.set(key, (vmCount.get(key) ?? 0) + 1);
    const prev = lastActivity.get(key);
    if (!prev || row.received_at > prev) lastActivity.set(key, row.received_at);
  }
  for (const row of callWindow) {
    const key = row.college_code ?? "unmatched";
    callCount.set(key, (callCount.get(key) ?? 0) + 1);
    if (row.started_at) {
      const prev = lastActivity.get(key);
      if (!prev || row.started_at > prev) lastActivity.set(key, row.started_at);
    }
  }

  const collegeSummaries: CollegeSummary[] = colleges.map((c) => ({
    code: c.code,
    displayName: c.display_name,
    existingNumber: c.existing_number,
    localNumber: c.local_number,
    callCount24h: callCount.get(c.code) ?? 0,
    voicemailCount24h: vmCount.get(c.code) ?? 0,
    lastActivityAt: lastActivity.get(c.code) ?? null,
  }));

  const recentVoicemails: LumiereVoicemail[] = ((voicemailsRes.data ?? []) as VoicemailRow[]).map((row) => ({
    id: row.id,
    collegeCode: row.college_code,
    collegeName: nameFor(row.college_code),
    fromNumber: row.from_number,
    receivedAt: row.received_at,
    durationSeconds: row.duration_seconds,
    transcription: row.transcription,
  }));

  const recentCalls: LumiereCall[] = ((callsRes.data ?? []) as CallRow[]).map((row) => ({
    id: row.id,
    collegeCode: row.college_code,
    collegeName: nameFor(row.college_code),
    fromNumber: row.from_number,
    direction: row.direction,
    status: row.status,
    startedAt: row.started_at,
    durationSeconds: row.duration_seconds,
  }));

  return {
    kpis: {
      totalCalls24h: callWindow.length,
      totalVoicemails24h: vmWindow.length,
      collegesWithActivity24h: lastActivity.size,
    },
    colleges: collegeSummaries,
    recentVoicemails,
    recentCalls,
    generatedAt: new Date().toISOString(),
  };
}
