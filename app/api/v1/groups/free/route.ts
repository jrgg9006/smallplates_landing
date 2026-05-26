import { NextRequest, NextResponse } from "next/server";
import { isFreeTierEnabled } from "@/lib/feature-flags";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendFreeTierWelcomeEmail } from "@/lib/postmark";

export async function POST(request: NextRequest) {
  if (!isFreeTierEnabled()) {
    return NextResponse.json({ error: "Free tier not enabled" }, { status: 404 });
  }

  const { email, yourName, coupleFirstName, partnerFirstName, occasion, bookDate, bookDateUndecided } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }
  if (!coupleFirstName || !partnerFirstName) {
    return NextResponse.json({ error: "Couple names required" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const bookName = `${coupleFirstName.trim()} & ${partnerFirstName.trim()}'s Book`;

  try {
    // 1. Find or create the auth user.
    //    Try to create first; if email already exists, look up via profiles table.
    let userId: string;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: { full_name: yourName?.trim() || "" },
    });

    if (newUser?.user) {
      userId = newUser.user.id;
    } else if (createError?.message?.includes("already been registered")) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", normalizedEmail)
        .single();
      if (!profile) {
        return NextResponse.json({ error: "Could not find account" }, { status: 500 });
      }
      userId = profile.id;
    } else {
      return NextResponse.json({ error: createError?.message || "Could not create account" }, { status: 500 });
    }

    // 2. Find existing group to update (trigger-created placeholder or previous free_tier).
    //    Reason: handle_new_user trigger auto-creates a "My First Cookbook" group for new
    //    users. Instead of creating a second group, we update that one to become the
    //    free_tier group. For returning users, we look for an existing free_tier group first.
    const { data: existingGroup } = await supabaseAdmin
      .from("groups")
      .select("id, status")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let groupId: string;
    if (existingGroup) {
      groupId = existingGroup.id;
      await supabaseAdmin
        .from("groups")
        .update({
          name: bookName,
          status: "free_tier",
          couple_first_name: coupleFirstName.trim(),
          partner_first_name: partnerFirstName.trim(),
          ...(bookDate ? { gift_date: bookDate } : {}),
          gift_date_undecided: bookDateUndecided || false,
        })
        .eq("id", groupId);
    } else {
      // Reason: fallback if trigger didn't fire (shouldn't happen, but defensive).
      const { data: newGroup, error: groupError } = await supabaseAdmin
        .from("groups")
        .insert({
          name: bookName,
          created_by: userId,
          status: "free_tier",
          description: "",
          couple_first_name: coupleFirstName.trim(),
          partner_first_name: partnerFirstName.trim(),
          ...(bookDate ? { gift_date: bookDate } : {}),
          gift_date_undecided: bookDateUndecided || false,
        })
        .select("id")
        .single();

      if (groupError || !newGroup) {
        return NextResponse.json({ error: groupError?.message || "Could not create group" }, { status: 500 });
      }
      groupId = newGroup.id;
    }

    // 3. Generate magic link token for instant session (same pattern as post-payment-setup).
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: { redirectTo: `${baseUrl}/onboarding/co-organizer?groupId=${groupId}` },
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: "Could not generate session" }, { status: 500 });
    }

    // 4. Build collection link from the organizer's collection_link_token.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("collection_link_token")
      .eq("id", userId)
      .single();

    const collectionToken = profile?.collection_link_token;
    const collectionLink = collectionToken
      ? `${baseUrl}/collect/${collectionToken}?group=${groupId}`
      : `${baseUrl}/profile/groups`;

    const coupleName = `${coupleFirstName.trim()} & ${partnerFirstName.trim()}`;
    const firstName = yourName?.trim().split(" ")[0] || "";

    // Reason: format bookDate for the email (e.g. "July 4, 2026") if provided.
    let formattedBookDate: string | null = null;
    if (bookDate) {
      try {
        formattedBookDate = new Date(bookDate + "T00:00:00").toLocaleDateString("en-US", {
          month: "long", day: "numeric", year: "numeric",
        });
      } catch { /* ignore */ }
    }

    // 5. Send welcome email in background (fire and forget).
    sendFreeTierWelcomeEmail({
      to: normalizedEmail,
      buyerName: firstName,
      coupleName,
      loginLink: linkData.properties.action_link,
      collectionLink,
      bookDate: formattedBookDate,
    }).catch((err) => console.error("free-tier: welcome email failed", err));

    return NextResponse.json({
      groupId,
      tokenHash: linkData.properties.hashed_token,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
