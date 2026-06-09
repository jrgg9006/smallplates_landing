import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRoute } from "@/lib/supabase/route";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendGuestInvitationEmail } from "@/lib/email/send-invitation-email";
import { isFreeTierEnabled } from "@/lib/feature-flags";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  if (!isFreeTierEnabled()) {
    return NextResponse.json({ error: "Not enabled" }, { status: 404 });
  }

  const { groupId } = await params;
  const { name, email } = await request.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  const supabase = await createSupabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const nameParts = name.trim().split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "";

  try {
    // Fetch group data
    const { data: group } = await supabaseAdmin
      .from("groups")
      .select("name, occasion, couple_first_name, partner_first_name, couple_image_url, created_by")
      .eq("id", groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Reason: Book name (groups.name) is the source of truth — "A & B" for couples,
    // the cookbook title otherwise.
    const coupleName = group.name
      || [group.couple_first_name, group.partner_first_name].filter(Boolean).join(" & ")
      || "The Couple";

    // Get collection link token
    const { data: creatorProfile } = await supabaseAdmin
      .from("profiles")
      .select("collection_link_token, full_name")
      .eq("id", group.created_by)
      .single();

    if (!creatorProfile?.collection_link_token) {
      return NextResponse.json({ error: "Collection link not configured" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smallplatesandcompany.com";
    const collectionLink = `${appUrl}/collect/${creatorProfile.collection_link_token}?group=${groupId}&utm_source=collection_link&utm_medium=email&utm_campaign=onboarding_invite`;

    // Create guest in DB
    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .insert({
        user_id: user.id,
        group_id: groupId,
        first_name: firstName,
        last_name: lastName,
        email: normalizedEmail,
        source: "manual",
        status: "pending",
        invitation_started_at: new Date().toISOString(),
        emails_sent_count: 1,
        last_email_sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (guestError) {
      return NextResponse.json({ error: guestError.message }, { status: 500 });
    }

    // Send invitation email
    const captainName = creatorProfile.full_name?.split(" ")[0] || undefined;
    await sendGuestInvitationEmail({
      to: normalizedEmail,
      guestName: firstName,
      coupleName,
      collectionLink,
      coupleImageUrl: group.couple_image_url || undefined,
      captainName,
      emailNumber: 1,
      occasion: group.occasion,
      namesArePeople: Boolean(group.couple_first_name || group.partner_first_name),
    });

    return NextResponse.json({ success: true, guestId: guest.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
