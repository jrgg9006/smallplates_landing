import { NextResponse } from "next/server";
import { createSupabaseRoute } from "@/lib/supabase/route";

/**
 * OAuth callback handler for Supabase authentication
 *
 * This route handles the OAuth callback after successful authentication
 * with providers like Google. It exchanges the code for a session.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseRoute();

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error.message);
      return NextResponse.redirect(`${origin}?error=auth_failed`);
    }
  }

  // Redirect to specified page or home page after successful authentication
  return NextResponse.redirect(`${origin}${next}`);
}
