import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/postmark";

/**
 * POST /api/auth/send-reset-link
 *
 * Sends a password-reset email via Postmark. Uses `admin.generateLink({ type: 'recovery' })`
 * on the server so the resulting link uses the **implicit flow** (`#access_token` in hash)
 * and does NOT require a PKCE code verifier in localStorage. Works cross-browser/device.
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

    // Reason: Only send if the user actually has a profile. Prevents `admin.generateLink`
    // from silently creating new auth users for arbitrary emails.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      // Reason: Avoid account-enumeration — always return success.
      return NextResponse.json({ success: true });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("send-reset-link: generateLink failed", linkError);
      return NextResponse.json({ success: true });
    }

    try {
      await sendPasswordResetEmail({
        to: email,
        resetLink: linkData.properties.action_link,
      });
    } catch (err) {
      console.error("send-reset-link: Postmark send failed", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-reset-link route error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
