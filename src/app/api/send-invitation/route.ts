import { NextRequest, NextResponse } from 'next/server';
import { sendInvitationEmail } from '@/lib/postmark';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify the user is authorized to send invitations (optional)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate invitation link (you might want to store this in DB)
    const invitationToken = crypto.randomUUID();
    const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${invitationToken}`;

    // TODO: Store invitation in database with token, email, expiry, etc.

    // Send the invitation email
    const result = await sendInvitationEmail({
      to: email,
      confirmationUrl,
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Invitation sent successfully',
        messageId: result.messageId 
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send invitation', 
        details: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in send-invitation API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}