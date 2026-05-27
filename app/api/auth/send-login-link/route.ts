import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeLoginEmail, sendLoginLinkEmail } from "@/lib/postmark";
import { isFreeTierEnabled } from "@/lib/feature-flags";

/**
 * POST /api/auth/send-login-link
 *
 * Sends a magic link to the user's email via Postmark. Uses `admin.generateLink` from
 * the Supabase Admin API so the link uses the **implicit flow** (`#access_token` in the
 * hash). This avoids the PKCE verifier requirement — the user can click the link from
 * any browser or device.
 *
 * Body: { email, allowSignup?, redirectTo? }
 * Returns: { success: true } — always, regardless of whether the email is registered,
 *   to avoid leaking account existence to attackers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail: string | undefined = body.email;
    const allowSignup: boolean = body.allowSignup === true && isFreeTierEnabled();
    const redirectTo: string | undefined = body.redirectTo;

    if (!rawEmail) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("email", email)
      .maybeSingle();

    // Reason: In signup mode (free tier onboarding), we create the user if they don't exist.
    // In login mode (original behavior), we silently succeed to prevent account enumeration.
    if (!profile && !allowSignup) {
      return NextResponse.json({ success: true });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    const safeRedirect = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/welcome";
    const redirectUrl = `${baseUrl}${safeRedirect}`;

    // Reason: generateLink({ type: "signup" }) requires a password, which we don't want
    // for passwordless signup. Instead, create the auth user first, then send a magiclink.
    if (!profile) {
      const randomPassword = crypto.randomUUID();
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: false,
      });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: redirectUrl },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("send-login-link: generateLink failed", linkError);
      return NextResponse.json({ success: true });
    }

    try {
      const firstName = profile?.full_name?.split(" ")[0] || "";
      // Reason: existing users get the simple login-link template;
      // new users (signup mode) get the welcome template with onboarding context.
      if (profile) {
        await sendLoginLinkEmail({
          to: email,
          buyerName: firstName || "there",
          loginLink: linkData.properties.action_link,
        });
      } else {
        await sendWelcomeLoginEmail({
          to: email,
          buyerName: firstName,
          loginLink: linkData.properties.action_link,
        });
      }
    } catch (err) {
      console.error("send-login-link: Postmark send failed", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-login-link route error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
