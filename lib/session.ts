import "server-only";
import crypto from "node:crypto";

export const SESSION_COOKIE = "lumiere_session";

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET in the environment.");
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionCookieValue(): string {
  const payload = "authenticated";
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionCookie(value: string | undefined | null): boolean {
  if (!value) return false;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return false;
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }
  if (expected.length !== sig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
