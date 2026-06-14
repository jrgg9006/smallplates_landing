import { NextRequest, NextResponse } from "next/server";
import { isFreeTierEnabled } from "@/lib/feature-flags";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendFreeTierWelcomeEmail } from "@/lib/postmark";

export async function POST(request: NextRequest) {
  if (!isFreeTierEnabled()) {
    return NextResponse.json({ error: "Free tier not enabled" }, { status: 404 });
  }

  const { email, yourName, coupleFirstName, partnerFirstName, honoreeName, occasion, bookDate, bookDateUndecided } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Reason: weddings, bridal showers and anniversaries are about a couple (two
  // names → "A & B"). Birthdays / "Other" honour one person, captured by name.
  const isCoupleOccasion =
    occasion === "wedding" || occasion === "bridal_shower" || occasion === "anniversary";

  if (isCoupleOccasion) {
    if (!coupleFirstName || !partnerFirstName) {
      return NextResponse.json({ error: "Couple names required" }, { status: 400 });
    }
  } else if (!honoreeName || typeof honoreeName !== "string" || !honoreeName.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const bookName = isCoupleOccasion
    ? `${coupleFirstName.trim()} & ${partnerFirstName.trim()}`
    : honoreeName.trim();

  try {
    // 1. Find or create the auth user.
    let userId: string;
    let isNewUser = false;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: { full_name: yourName?.trim() || "" },
    });

    if (newUser?.user) {
      userId = newUser.user.id;
      isNewUser = true;
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

    // 2. Find or create the free_tier group.
    //    Three scenarios:
    //    A) New user: trigger created a placeholder "My First Cookbook" → update it to free_tier.
    //    B) Existing user re-doing free tier: has a free_tier group → update it.
    //    C) Existing user with paid books wanting another: no free_tier → create new one.
    //    NEVER touch active/pending_setup groups.

    // Reason: book_close_date = gift_date - 20 days (same rule as EditGroupModal),
    // so the dashboard shows "Recipes due X" for free-tier groups too.
    let bookCloseDate: string | null = null;
    if (bookDate) {
      const d = new Date(bookDate + "T00:00:00");
      d.setDate(d.getDate() - 20);
      bookCloseDate = d.toISOString().split("T")[0];
    }

    const freeTierFields = {
      name: bookName,
      status: "free_tier" as const,
      // Reason: couple occasions store both names (cover/emails build "A & B").
      // Non-couple occasions store the honoree in couple_first_name (so later
      // messages/emails can address them by name) and mirror it into
      // couple_display_name so the cover prints "...who love {name}" verbatim.
      couple_first_name: isCoupleOccasion ? coupleFirstName.trim() : honoreeName.trim(),
      partner_first_name: isCoupleOccasion ? partnerFirstName.trim() : null,
      couple_display_name: isCoupleOccasion ? null : bookName,
      ...(bookDate ? { gift_date: bookDate } : {}),
      ...(bookCloseDate ? { book_close_date: bookCloseDate } : {}),
      gift_date_undecided: bookDateUndecided || false,
      ...(occasion ? { occasion } : {}),
    };

    let groupId: string;

    if (isNewUser) {
      // Scenario A: update the trigger-created placeholder.
      const { data: placeholder } = await supabaseAdmin
        .from("groups")
        .select("id")
        .eq("created_by", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (placeholder) {
        groupId = placeholder.id;
        await supabaseAdmin.from("groups").update(freeTierFields).eq("id", groupId);
      } else {
        const { data: g, error: e } = await supabaseAdmin
          .from("groups")
          .insert({ ...freeTierFields, created_by: userId, description: "" })
          .select("id").single();
        if (e || !g) return NextResponse.json({ error: e?.message || "Could not create group" }, { status: 500 });
        groupId = g.id;
      }
    } else {
      // Existing user — ALWAYS create a new group. Never touch existing ones
      // (even free_tier — they may have recipes already).
      const { data: g, error: e } = await supabaseAdmin
        .from("groups")
        .insert({ ...freeTierFields, created_by: userId, description: "" })
        .select("id").single();
      if (e || !g) return NextResponse.json({ error: e?.message || "Could not create group" }, { status: 500 });
      groupId = g.id;
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

    // Reason: non-couple occasions (birthday/other) have no "A & B" pair — using
    // the couple-name template would email a literal " & ". bookName already holds
    // the right label ("A & B" for couples, the cookbook title otherwise).
    const coupleName = bookName;
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
      isNewUser,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
