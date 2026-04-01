/**
 * API Route - Verify & Accept Group Invitation
 * GET: Validates token, returns group + inviter info
 * POST: Accepts invitation (creates account if needed, adds to group)
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
    const group = invitation.groups as { id: string; name: string; description: string | null; couple_image_url: string | null; created_at: string };
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
    const { password, fullName, email: providedEmail } = await request.json();

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
    const email = invitation.email || providedEmail;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Reason: Check existing users to determine create vs sign-in flow
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;

      if (!password) {
        return NextResponse.json(
          { error: 'Password is required to verify your account' },
          { status: 400 }
        );
      }

      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError || !signInData.user) {
        return NextResponse.json(
          { error: 'Invalid password. Please check your password and try again.' },
          { status: 401 }
        );
      }

      if (signInData.user.id !== userId) {
        await supabaseAdmin.auth.signOut();
        return NextResponse.json({ error: 'Authentication error. Please try again.' }, { status: 401 });
      }

      // Reason: Sign out after verification — frontend creates its own session
      await supabaseAdmin.auth.signOut();

      const { data: existingMember } = await supabaseAdmin
        .from('group_members')
        .select('profile_id')
        .eq('group_id', invitation.group_id)
        .eq('profile_id', userId)
        .single();

      if (existingMember) {
        await supabaseAdmin
          .from('group_invitations')
          .update({ status: 'accepted' as const })
          .eq('token', token);

        return NextResponse.json({
          success: true,
          message: 'You are already a member of this group',
          data: {
            userId,
            isNewUser: false,
            groupId: invitation.group_id,
            groupName: group.name,
            alreadyMember: true
          }
        });
      }

    } else {
      if (!password) {
        return NextResponse.json({ error: 'Password is required for new users' }, { status: 400 });
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      if (!fullName?.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          invited_from_group: true,
          group_id: invitation.group_id,
          group_name: group.name,
          full_name: fullName.trim()
        }
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          // Reason: Handle race condition where user was created between check and create
          const { data: { users: refreshed } } = await supabaseAdmin.auth.admin.listUsers();
          const found = refreshed?.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (found) {
            userId = found.id;
          } else {
            return NextResponse.json({ error: 'Unable to create account. Please try again.' }, { status: 500 });
          }
        } else {
          return NextResponse.json(
            { error: signUpError.message || 'Failed to create account' },
            { status: 500 }
          );
        }
      } else if (!signUpData.user) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
      } else {
        userId = signUpData.user.id;
      }

      isNewUser = true;
    }

    // Reason: Invitation email serves as email verification
    await supabaseAdmin
      .from('profiles')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null
      })
      .eq('id', userId);

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

    // Reason: Mark invitation as accepted so it can't be reused
    await supabaseAdmin
      .from('group_invitations')
      .update({ status: 'accepted' as const })
      .eq('token', token);

    return NextResponse.json({
      success: true,
      message: isNewUser ? 'Account created and added to group' : 'Added to group',
      data: {
        userId,
        email,
        isNewUser,
        groupId: invitation.group_id,
        groupName: group.name,
        groupDescription: group.description
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
