/**
 * API Route - Join Group (Captain Invite Token)
 *
 * Token-validated captain join with passwordless auth.
 *  - New users: backend mints a magic-link hashed_token, frontend calls
 *    verifyOtp() — zero inbox check, immediate session.
 *  - Existing users: backend triggers a real magic-link email and DOES NOT
 *    return a hashed_token — captain must click from their own inbox.
 *    This prevents account takeover via shared invite URLs.
 *  - Already-a-member of this group: skip the token claim entirely so
 *    re-submits don't drain the use counter. Still send the magic link so
 *    they can log in.
 *
 * The token is validated atomically by the SQL RPC `claim_captain_invite_slot`
 * which checks expiry + max_uses + increments the counter in one round-trip.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface JoinRequestBody {
  token?: string;
  fullName?: string;
  email?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  let body: JoinRequestBody;
  try {
    body = (await request.json()) as JoinRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = body.token?.trim();
  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!token) {
    return NextResponse.json({ error: "token_missing" }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // Load group (need created_by to credit the inviter).
  const { data: group, error: groupErr } = await supabaseAdmin
    .from("groups")
    .select("created_by, name")
    .eq("id", groupId)
    .single();

  if (groupErr || !group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // ── Pre-check: are they already a member? ──
  // Reason: if they are, we DO NOT want to consume a token use. The same
  // person clicking Submit twice (or refreshing the page) shouldn't burn
  // slots from the organizer's max_uses budget.
  let existingUserId: string | null = null;
  let isAlreadyMember = false;

  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    existingUserId = existingProfile.id;
    // Reason: group_members has a composite PK (group_id, profile_id) — no
    // `id` column. Select profile_id to verify the row exists.
    const { data: existingMember } = await supabaseAdmin
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .eq("profile_id", existingUserId)
      .maybeSingle();
    if (existingMember) isAlreadyMember = true;
  }

  // ── Already a member: short-circuit, no slot consumed. ──
  // Treat them like the existing-user path (they need to log in via magic
  // link from their own inbox).
  if (isAlreadyMember) {
    return NextResponse.json({
      groupId,
      isNewUser: false,
      existingUser: true,
      alreadyMember: true,
    });
  }

  // ── Not yet a member: atomic token claim (validates + increments). ──
  const { data: claimedGroupId, error: claimError } = await supabaseAdmin.rpc(
    "claim_captain_invite_slot",
    { p_token: token }
  );

  if (claimError) {
    return NextResponse.json({ error: "Could not validate invite" }, { status: 500 });
  }

  // RPC returns NULL when the token failed validation — distinguish why.
  if (!claimedGroupId) {
    const { data: tokenStatus } = await supabaseAdmin
      .from("groups")
      .select(
        "id, captain_invite_token_expires_at, captain_invite_token_max_uses, captain_invite_token_uses"
      )
      .eq("captain_invite_token", token)
      .maybeSingle();

    if (!tokenStatus) {
      return NextResponse.json({ error: "token_invalid" }, { status: 404 });
    }
    if (
      tokenStatus.captain_invite_token_expires_at &&
      new Date(tokenStatus.captain_invite_token_expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json({ error: "token_expired" }, { status: 410 });
    }
    if (tokenStatus.captain_invite_token_uses >= tokenStatus.captain_invite_token_max_uses) {
      return NextResponse.json({ error: "token_max_uses" }, { status: 410 });
    }
    return NextResponse.json({ error: "token_invalid" }, { status: 404 });
  }

  // Reason: token must belong to the group the URL says it does.
  if (claimedGroupId !== groupId) {
    return NextResponse.json({ error: "token_invalid" }, { status: 404 });
  }

  // ── Find or create the auth user ──
  let userId: string;
  let isNewUser = false;

  if (existingUserId) {
    // We already looked them up above.
    userId = existingUserId;
  } else {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (newUser?.user) {
      userId = newUser.user.id;
      isNewUser = true;
    } else if (
      createError?.message?.toLowerCase().includes("already been registered") ||
      createError?.message?.toLowerCase().includes("already registered") ||
      createError?.message?.toLowerCase().includes("already exists")
    ) {
      // Race: profile was created between our pre-check and the createUser call.
      // Re-look up to recover gracefully.
      const { data: raceProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      if (!raceProfile) {
        return NextResponse.json(
          { error: "Could not resolve existing account" },
          { status: 500 }
        );
      }
      userId = raceProfile.id;
    } else {
      return NextResponse.json(
        { error: createError?.message || "Could not create account" },
        { status: 500 }
      );
    }
  }

  // ── Add captain to group_members ──
  // Reason: upsert is defensive in case of races (e.g., the same captain
  // submitting twice in flight).
  const { error: memberError } = await supabaseAdmin
    .from("group_members")
    .upsert(
      {
        group_id: groupId,
        profile_id: userId,
        role: "member",
        invited_by: group.created_by,
      },
      { onConflict: "group_id,profile_id" }
    );

  if (memberError) {
    return NextResponse.json({ error: "Could not add member" }, { status: 500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const redirectTo = `${baseUrl}/profile/groups?group=${groupId}`;

  if (isNewUser) {
    // Frictionless path: mint a hashed_token so the frontend can verifyOtp()
    // and log the new user in immediately, without any inbox click.
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: "Could not generate session" }, { status: 500 });
    }

    return NextResponse.json({
      groupId,
      isNewUser: true,
      tokenHash: linkData.properties.hashed_token,
    });
  }

  // Existing-user takeover defense: do NOT mint a session here. The frontend
  // will call supabase.auth.signInWithOtp({ email }) which sends a real magic
  // link to the inbox. The captain must click from their own inbox to log in,
  // proving ownership of the email.
  return NextResponse.json({
    groupId,
    isNewUser: false,
    existingUser: true,
  });
}
