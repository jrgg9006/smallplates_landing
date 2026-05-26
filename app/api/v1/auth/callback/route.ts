import { NextResponse } from "next/server";
import { createSupabaseRoute } from "@/lib/supabase/route";
import { isFreeTierEnabled } from "@/lib/feature-flags";

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error.message);
      return NextResponse.redirect(`${origin}/`);
    }

    // Reason: When free tier is enabled and user came from Google OAuth during onboarding,
    // redirect to onboarding if they have no groups yet (new user).
    if (isFreeTierEnabled() && next === "/onboarding/about-you") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingGroup } = await supabase
          .from("groups")
          .select("id")
          .eq("created_by", user.id)
          .limit(1)
          .maybeSingle();

        if (!existingGroup) {
          return NextResponse.redirect(`${origin}/onboarding/about-you?from_google=true`);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
