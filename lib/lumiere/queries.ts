import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CallVolumeBucket,
  CollegeAnswerRate,
  CollegeSummary,
  HeatmapCell,
  LumiereCall,
  LumiereOverview,
  LumiereVoicemail,
  RangePreset,
} from "./types";

const RECENT_LIMIT = 50;
const MELBOURNE_TZ = "Australia/Melbourne";

export type RangeInput = { kind: "preset"; preset: RangePreset } | { kind: "custom"; from: string; to: string };

function resolveRange(range: RangeInput): { since: string; until: string; label: string; days: number } {
  const now = new Date();
  if (range.kind === "custom") {
    const since = new Date(range.from);
    const until = new Date(range.to);
    const days = Math.max(1, Math.round((until.getTime() - since.getTime()) / (24 * 60 * 60 * 1000)));
    return { since: since.toISOString(), until: until.toISOString(), label: "Custom range", days };
  }
  const days = range.preset === "24h" ? 1 : range.preset === "7d" ? 7 : 30;
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const label = range.preset === "24h" ? "last 24 hours" : range.preset === "7d" ? "last 7 days" : "last 30 days";
  return { since, until: now.toISOString(), label, days };
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
  recording_url: string | null;
};

type CallRow = {
  id: string;
  college_code: string | null;
  from_number: string | null;
  direction: string | null;
  status: string | null;
  started_at: string | null;
  duration_seconds: number;
  call_recording_url: string | null;
};

type CallAnalyticsRow = {
  college_code: string | null;
  started_at: string | null;
  status: string | null;
  duration_seconds: number;
};

function melbourneDayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: MELBOURNE_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso)
  );
}

function melbourneDayLabel(iso: string, days: number): string {
  if (days <= 1) {
    return new Intl.DateTimeFormat("en-AU", { timeZone: MELBOURNE_TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  }
  return new Intl.DateTimeFormat("en-AU", { timeZone: MELBOURNE_TZ, weekday: "short", day: "numeric", month: "short" }).format(
    new Date(iso)
  );
}

function melbourneHourKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MELBOURNE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

function melbourneDayOfWeekAndHour(iso: string): { dayOfWeek: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MELBOURNE_TZ,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = weekdays.indexOf(weekdayStr);
  return { dayOfWeek: dayOfWeek < 0 ? 0 : dayOfWeek, hour: Number(hourStr) % 24 };
}

function buildCallVolume(rows: CallAnalyticsRow[], since: string, until: string, days: number): CallVolumeBucket[] {
  const bucketed = new Map<string, CallVolumeBucket>();
  const hourly = days <= 1;

  // Seed every bucket in the range so the chart shows zeros, not gaps.
  const start = new Date(since).getTime();
  const end = new Date(until).getTime();
  const stepMs = hourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  for (let t = start; t <= end; t += stepMs) {
    const iso = new Date(t).toISOString();
    const key = hourly ? melbourneHourKey(iso) : melbourneDayKey(iso);
    if (!bucketed.has(key)) {
      bucketed.set(key, { key, label: melbourneDayLabel(iso, days), answered: 0, voicemail: 0, abandoned: 0 });
    }
  }

  for (const row of rows) {
    if (!row.started_at) continue;
    const key = hourly ? melbourneHourKey(row.started_at) : melbourneDayKey(row.started_at);
    let bucket = bucketed.get(key);
    if (!bucket) {
      bucket = { key, label: melbourneDayLabel(row.started_at, days), answered: 0, voicemail: 0, abandoned: 0 };
      bucketed.set(key, bucket);
    }
    if (row.status === "Answered") bucket.answered += 1;
    else if (row.status === "Voicemail") bucket.voicemail += 1;
    else bucket.abandoned += 1;
  }

  return Array.from(bucketed.values()).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

function buildCollegeAnswerRates(
  rows: CallAnalyticsRow[],
  colleges: CollegeRow[]
): CollegeAnswerRate[] {
  const byCollege = new Map<string, { total: number; answered: number }>();
  for (const row of rows) {
    const code = row.college_code ?? "unmatched";
    const entry = byCollege.get(code) ?? { total: 0, answered: 0 };
    entry.total += 1;
    if (row.status === "Answered") entry.answered += 1;
    byCollege.set(code, entry);
  }

  const nameByCode = new Map(colleges.map((c) => [c.code, c.display_name]));
  const result: CollegeAnswerRate[] = [];
  for (const [code, { total, answered }] of byCollege.entries()) {
    if (total === 0) continue;
    result.push({
      code,
      displayName: code === "unmatched" ? "Unmatched number" : nameByCode.get(code) ?? code,
      totalCalls: total,
      answered,
      answerRatePct: Math.round((answered / total) * 100),
    });
  }

  return result.sort((a, b) => a.answerRatePct - b.answerRatePct);
}

function buildHeatmap(rows: CallAnalyticsRow[]): HeatmapCell[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.started_at) continue;
    const { dayOfWeek, hour } = melbourneDayOfWeekAndHour(row.started_at);
    const key = `${dayOfWeek}-${hour}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const cells: HeatmapCell[] = [];
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ dayOfWeek, hour, count: counts.get(`${dayOfWeek}-${hour}`) ?? 0 });
    }
  }
  return cells;
}

export async function getLumiereOverview(range: RangeInput = { kind: "preset", preset: "24h" }): Promise<LumiereOverview> {
  const supabase = createAdminClient();
  const { since, until, label, days } = resolveRange(range);

  const prevSince = new Date(new Date(since).getTime() - (new Date(until).getTime() - new Date(since).getTime())).toISOString();

  const [collegesRes, voicemailsRes, callsRes, vmWindowRes, callWindowRes, prevCallWindowRes, prevVmWindowRes] = await Promise.all([
    supabase.from("lumiere_colleges").select("code, display_name, existing_number, local_number").order("ring_group_account"),
    supabase
      .from("lumiere_voicemails")
      .select("id, college_code, from_number, received_at, duration_seconds, transcription, recording_url")
      .gte("received_at", since)
      .lte("received_at", until)
      .order("received_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("lumiere_calls")
      .select("id, college_code, from_number, direction, status, started_at, duration_seconds, call_recording_url")
      .gte("started_at", since)
      .lte("started_at", until)
      .order("started_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase.from("lumiere_voicemails").select("college_code, received_at").gte("received_at", since).lte("received_at", until),
    supabase
      .from("lumiere_calls")
      .select("college_code, started_at, status, duration_seconds")
      .gte("started_at", since)
      .lte("started_at", until),
    supabase.from("lumiere_calls").select("status").gte("started_at", prevSince).lt("started_at", since),
    supabase.from("lumiere_voicemails").select("id").gte("received_at", prevSince).lt("received_at", since),
  ]);

  for (const [labelName, res] of [
    ["lumiere_colleges", collegesRes],
    ["lumiere_voicemails", voicemailsRes],
    ["lumiere_calls", callsRes],
    ["lumiere_voicemails window", vmWindowRes],
    ["lumiere_calls window", callWindowRes],
    ["lumiere_calls previous window", prevCallWindowRes],
    ["lumiere_voicemails previous window", prevVmWindowRes],
  ] as const) {
    if (res.error) throw new Error(`Lumiere query failed (${labelName}): ${res.error.message}`);
  }

  const colleges = (collegesRes.data ?? []) as CollegeRow[];
  const collegeByCode = new Map(colleges.map((c) => [c.code, c]));
  const nameFor = (code: string | null) => (code ? collegeByCode.get(code)?.display_name ?? code : "Unmatched number");

  const vmWindow = (vmWindowRes.data ?? []) as Array<{ college_code: string | null; received_at: string }>;
  const callWindow = (callWindowRes.data ?? []) as CallAnalyticsRow[];

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
    callCount: callCount.get(c.code) ?? 0,
    voicemailCount: vmCount.get(c.code) ?? 0,
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
    recordingUrl: row.recording_url,
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
    recordingUrl: row.call_recording_url,
  }));

  const answeredCalls = callWindow.filter((r) => r.status === "Answered");
  const answerRatePct = callWindow.length > 0 ? Math.round((answeredCalls.length / callWindow.length) * 100) : 0;
  const avgAnsweredDurationSeconds =
    answeredCalls.length > 0 ? Math.round(answeredCalls.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0) / answeredCalls.length) : 0;

  const prevCalls = (prevCallWindowRes.data ?? []) as Array<{ status: string | null }>;
  const prevAnswered = prevCalls.filter((r) => r.status === "Answered").length;
  const previousPeriod =
    prevCalls.length > 0 || (prevVmWindowRes.data ?? []).length > 0
      ? {
          totalCalls: prevCalls.length,
          totalVoicemails: (prevVmWindowRes.data ?? []).length,
          answerRatePct: prevCalls.length > 0 ? Math.round((prevAnswered / prevCalls.length) * 100) : 0,
        }
      : null;

  return {
    kpis: {
      totalCalls: callWindow.length,
      totalVoicemails: vmWindow.length,
      collegesWithActivity: lastActivity.size,
    },
    colleges: collegeSummaries,
    recentVoicemails,
    recentCalls,
    recentVoicemailsTruncated: vmWindow.length > RECENT_LIMIT,
    recentCallsTruncated: callWindow.length > RECENT_LIMIT,
    analytics: {
      callVolume: buildCallVolume(callWindow, since, until, days),
      collegeAnswerRates: buildCollegeAnswerRates(callWindow, colleges),
      heatmap: buildHeatmap(callWindow),
      avgAnsweredDurationSeconds,
      answerRatePct,
      previousPeriod,
    },
    rangeLabel: label,
    generatedAt: new Date().toISOString(),
  };
}
