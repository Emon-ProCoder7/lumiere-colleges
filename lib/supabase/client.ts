import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client, used only for auth (sign in, sign out,
 * password set/reset). Uses the public anon key — safe to ship to the
 * client. All actual data access still goes through our own API routes
 * backed by the service-role admin client.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
