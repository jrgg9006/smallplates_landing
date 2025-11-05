import { NextRequest, NextResponse } from 'next/server';
// import { sendInvitationEmail } from '@/lib/postmark';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify the user is authorized to send invitations (optional)
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate invitation link (you might want to store this in DB)
    const invitationToken = crypto.randomUUID();
    const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${invitationToken}`;

    // TODO: Store invitation in database with token, email, expiry, etc.

    // Send the invitation email
    // TODO: Implement email sending with postmark
    // const result = await sendInvitationEmail({
    //   to: email,
    //   confirmationUrl,
    // });

    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Invitation would be sent (email not configured yet)',
      invitationDetails: {
        email,
        confirmationUrl
      }
    });
  } catch (error) {
    console.error('Error in send-invitation API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}