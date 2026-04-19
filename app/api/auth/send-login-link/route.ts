import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeLoginEmail } from "@/lib/postmark";

/**
 * POST /api/auth/send-login-link
 *
 * Sends a magic link to the user's email via Postmark. Uses `admin.generateLink` from
 * the Supabase Admin API so the link uses the **implicit flow** (`#access_token` in the
 * hash). This avoids the PKCE verifier requirement — the user can click the link from
 * any browser or device.
 *
 * Body: { email }
 * Returns: { success: true } — always, regardless of whether the email is registered,
 *   to avoid leaking account existence to attackers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail: string | undefined = body.email;

    if (!rawEmail) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Reason: Only send a link if the user actually has a profile. Pre-checking here
    // prevents `admin.generateLink` from silently creating new auth users for arbitrary
    // emails a visitor might enter.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      // Reason: Return success to avoid account-enumeration. Attacker can't tell whether
      // the email is registered from the response.
      return NextResponse.json({ success: true });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/welcome`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("send-login-link: generateLink failed", linkError);
      // Reason: Still return success — don't leak the failure either. The user will just
      // not receive an email and can try again or contact support.
      return NextResponse.json({ success: true });
    }

    try {
      const firstName = profile.full_name?.split(" ")[0] || "";
      await sendWelcomeLoginEmail({
        to: email,
        buyerName: firstName,
        loginLink: linkData.properties.action_link,
      });
    } catch (err) {
      console.error("send-login-link: Postmark send failed", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-login-link route error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
