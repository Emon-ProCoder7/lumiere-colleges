import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_RETENTION_DAYS = 90;

// Pulls {bucket, path} out of a Supabase Storage public URL, e.g.
// https://xxx.supabase.co/storage/v1/object/public/voicemails/SCBM/34461.wav
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: decodeURIComponent(match[2]) };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const retentionDays = Number(process.env.RECORDING_RETENTION_DAYS) || DEFAULT_RETENTION_DAYS;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createAdminClient();
  const result = {
    retentionDays,
    cutoff,
    voicemails: { checked: 0, deleted: 0, errors: [] as string[] },
    calls: { checked: 0, deleted: 0, errors: [] as string[] },
  };

  // Voicemail recordings
  const { data: voicemails, error: vmError } = await supabase
    .from("lumiere_voicemails")
    .select("id, recording_url")
    .not("recording_url", "is", null)
    .lt("received_at", cutoff);

  if (vmError) {
    result.voicemails.errors.push(vmError.message);
  } else if (voicemails) {
    result.voicemails.checked = voicemails.length;
    for (const row of voicemails) {
      const parsed = row.recording_url ? parseStorageUrl(row.recording_url) : null;
      if (!parsed) {
        result.voicemails.errors.push(`${row.id}: could not parse storage URL`);
        continue;
      }
      const { error: removeError } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
      if (removeError) {
        result.voicemails.errors.push(`${row.id}: ${removeError.message}`);
        continue;
      }
      const { error: updateError } = await supabase
        .from("lumiere_voicemails")
        .update({ recording_url: null })
        .eq("id", row.id);
      if (updateError) {
        result.voicemails.errors.push(`${row.id}: deleted file but failed to clear URL: ${updateError.message}`);
        continue;
      }
      result.voicemails.deleted += 1;
    }
  }

  // Call recordings
  const { data: calls, error: callError } = await supabase
    .from("lumiere_calls")
    .select("id, call_recording_url")
    .not("call_recording_url", "is", null)
    .lt("started_at", cutoff);

  if (callError) {
    result.calls.errors.push(callError.message);
  } else if (calls) {
    result.calls.checked = calls.length;
    for (const row of calls) {
      const parsed = row.call_recording_url ? parseStorageUrl(row.call_recording_url) : null;
      if (!parsed) {
        result.calls.errors.push(`${row.id}: could not parse storage URL`);
        continue;
      }
      const { error: removeError } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
      if (removeError) {
        result.calls.errors.push(`${row.id}: ${removeError.message}`);
        continue;
      }
      const { error: updateError } = await supabase
        .from("lumiere_calls")
        .update({ call_recording_url: null })
        .eq("id", row.id);
      if (updateError) {
        result.calls.errors.push(`${row.id}: deleted file but failed to clear URL: ${updateError.message}`);
        continue;
      }
      result.calls.deleted += 1;
    }
  }

  return Response.json(result);
}
