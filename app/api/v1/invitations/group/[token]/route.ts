/**
 * API Route - Verify & Accept Group Invitation
 * GET: Validates token, returns group + inviter info
 * POST: Accepts invitation passwordlessly — clicking the emailed link proves
 *       inbox ownership, so we auto-provision (or reuse) the account, add the
 *       person to the group, and return a magic-link token_hash the client
 *       redeems for an instant session. No password, no form.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Reason: Shared validation logic for both GET and POST to avoid duplication
async function validateInvitation(token: string) {
  const { data: invitation, error } = await supabaseAdmin
    .from('group_invitations')
    .select(`
      *,
      groups (
        id,
        name,
        description,
        couple_image_url,
        couple_first_name,
        partner_first_name,
        created_at
      ),
      inviter:profiles!group_invitations_invited_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('token', token)
    .single();

  if (error || !invitation) {
    return { error: 'invalid' as const, invitation: null };
  }

  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);

  if (now > expiresAt) {
    return { error: 'expired' as const, invitation, expiresAt: invitation.expires_at };
  }

  if (invitation.status === 'accepted') {
    return { error: 'used' as const, invitation: null };
  }

  if (invitation.status === 'declined') {
    return { error: 'declined' as const, invitation: null };
  }

  return { error: null, invitation };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const result = await validateInvitation(token);

    if (result.error === 'invalid') {
      return NextResponse.json(
        { error: 'Invalid invitation link', status: 'invalid' },
        { status: 404 }
      );
    }

    if (result.error === 'expired') {
      return NextResponse.json(
        { error: 'This invitation has expired', status: 'expired', expiresAt: result.expiresAt },
        { status: 410 }
      );
    }

    if (result.error === 'used') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted', status: 'used' },
        { status: 410 }
      );
    }

    if (result.error === 'declined') {
      return NextResponse.json(
        { error: 'This invitation was declined', status: 'declined' },
        { status: 410 }
      );
    }

    const invitation = result.invitation!;
    const group = invitation.groups as { id: string; name: string; description: string | null; couple_image_url: string | null; couple_first_name: string | null; partner_first_name: string | null; created_at: string };
    const inviter = invitation.inviter as { id: string; full_name: string | null; email: string } | null;

    return NextResponse.json({
      success: true,
      status: 'valid',
      data: {
        email: invitation.email,
        name: invitation.name,
        expiresAt: invitation.expires_at,
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          coupleImageUrl: group.couple_image_url,
          // Reason: lets the join page decide between a possessive ("Mom's
          // cookbook") for a person's name vs. a book title used as-is
          // ("Grandma's Recipes") — same rule the rest of the app applies.
          namesArePeople: Boolean(group.couple_first_name || group.partner_first_name),
        },
        inviter: {
          name: inviter?.full_name || inviter?.email || 'Someone',
        }
      }
    });

  } catch (error) {
    console.error('Error verifying group invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify invitation', status: 'error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const result = await validateInvitation(token);

    if (result.error) {
      const messages: Record<string, string> = {
        invalid: 'Invalid invitation link',
        expired: 'This invitation has expired',
        used: 'This invitation has already been accepted',
        declined: 'This invitation was declined',
      };
      return NextResponse.json(
        { error: messages[result.error] },
        { status: result.error === 'invalid' ? 404 : 410 }
      );
    }

    const invitation = result.invitation!;
    const group = invitation.groups as { id: string; name: string; description: string | null };
    const email = (invitation.email || '').toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Reason: Find or create the auth user WITHOUT a password. We try to create
    // first (email already confirmed since the invite proves inbox ownership);
    // if the email is already registered, fall back to the existing profile id.
    // Same passwordless pattern as /api/v1/groups/free.
    let userId: string;
    let isNewUser = false;

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: invitation.name?.trim() || '',
        invited_from_group: true,
        group_id: invitation.group_id,
        group_name: group.name,
      },
    });

    if (created?.user) {
      userId = created.user.id;
      isNewUser = true;
    } else if (createError?.message?.includes('already been registered') || createError?.message?.includes('already registered')) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      if (!profile) {
        return NextResponse.json({ error: 'Could not find account' }, { status: 500 });
      }
      userId = profile.id;
    } else {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    // Reason: Add to the group (idempotent). Detect prior membership so the UI
    // can message "already a member" instead of treating it as a fresh join.
    const { data: existingMember } = await supabaseAdmin
      .from('group_members')
      .select('profile_id')
      .eq('group_id', invitation.group_id)
      .eq('profile_id', userId)
      .maybeSingle();

    const alreadyMember = !!existingMember;

    if (!alreadyMember) {
      const { error: memberError } = await supabaseAdmin
        .from('group_members')
        .upsert({
          group_id: invitation.group_id,
          profile_id: userId,
          role: 'member',
          invited_by: invitation.invited_by,
          relationship_to_couple: invitation.relationship_to_couple
        }, {
          onConflict: 'group_id,profile_id'
        });

      if (memberError) {
        return NextResponse.json(
          { error: 'Failed to add user to group: ' + memberError.message },
          { status: 500 }
        );
      }
    }

    // Reason: Mark invitation as accepted so the single-use link can't be reused.
    await supabaseAdmin
      .from('group_invitations')
      .update({ status: 'accepted' as const })
      .eq('token', token);

    // Reason: Generate a magic-link token_hash for an instant passwordless
    // session (same mechanism the main onboarding uses). The client redeems it
    // with verifyOtp, no password ever involved.
    const origin = new URL(request.url).origin;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || origin;
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${baseUrl}/profile/groups?group=${invitation.group_id}` },
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: 'Could not establish a session. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: alreadyMember
        ? 'You are already a member of this group'
        : (isNewUser ? 'Account created and added to group' : 'Added to group'),
      data: {
        userId,
        email,
        isNewUser,
        alreadyMember,
        groupId: invitation.group_id,
        groupName: group.name,
        groupDescription: group.description,
        tokenHash: linkData.properties.hashed_token,
      }
    });

  } catch (error) {
    console.error('Error accepting group invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
