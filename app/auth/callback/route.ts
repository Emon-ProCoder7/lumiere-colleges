import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Handles the redirect from Supabase invite / password-reset emails.
// Exchanges the one-time code for a session, then sends the user to set
// their own password.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/set-password`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
