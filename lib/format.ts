export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${rem}s`;
  return `${m}m ${rem}s`;
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-AU").format(Math.round(n));
}

export function formatRelativeTime(iso: string, nowMs = Date.now()): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((nowMs - then) / 1000));
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

/**
 * Vodia hands back caller/callee numbers wrapped in SIP syntax, e.g.
 * `"61393770352" <sip:61393770352@lumiere.ftcpbx.com.au>`. Nobody outside
 * telecom should ever see that. Pull the real number out and format it the
 * way a person would write it on a business card.
 */
export function formatPhoneDisplay(raw: string | null): string {
  if (!raw) return "Unknown number";

  const sipMatch = raw.match(/sip:\+?(\d+)@/i);
  let digits = sipMatch ? sipMatch[1] : raw.replace(/\D/g, "");

  if (!digits) return "Unknown number";

  // 61XXXXXXXXX -> 0XXXXXXXXX (national format), but keep 1800/1300 toll-free
  // numbers as-is since they don't carry a leading 0 the way geographic numbers do.
  if (digits.length === 11 && digits.startsWith("61")) {
    digits = "0" + digits.slice(2);
  }

  if (digits.length === 10 && digits.startsWith("04")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10 && (digits.startsWith("1800") || digits.startsWith("1300"))) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }

  return digits;
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
