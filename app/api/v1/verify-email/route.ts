import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.SITE_URL || 
                   'http://localhost:3000';

    if (!token) {
      return NextResponse.redirect(
        `${baseUrl}/profile/groups?error=missing-token`
      );
    }

    // Use admin client to update email verification status
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

    // Find user with this verification token
    const { data: profile, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id, email_verification_expires_at, email_verified')
      .eq('email_verification_token', token)
      .single();

    if (findError || !profile) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile/groups?error=invalid-token`
      );
    }

    // Check if already verified
    if (profile.email_verified) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile/groups?message=already-verified`
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(profile.email_verification_expires_at);
    
    if (now > expiresAt) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile/groups?error=token-expired`
      );
    }

    // Update user as verified
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        email_verified: true,
        email_verification_token: null, // Clear the token
        email_verification_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('email_verification_token', token);

    if (updateError) {
      console.error('Error updating email verification status:', updateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/profile/groups?error=verification-failed`
      );
    }

    // Success! Redirect to profile with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/profile/groups?message=email-verified`
    );

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/profile/groups?error=verification-failed`
    );
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    // Debug logging
    console.log('🔄 RESEND EMAIL REQUEST:', {
      email,
      timestamp: new Date().toISOString(),
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasPostmarkToken: !!process.env.POSTMARK_SERVER_TOKEN,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL
    });

    if (!email) {
      console.log('❌ Missing email in request');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use admin client to resend verification email
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

    // Find user by email
    console.log('🔍 Looking for user with email:', email);
    const { data: profile, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, user_type, email_verified')
      .eq('email', email)
      .single();

    console.log('📋 Profile search result:', { profile, findError });

    if (findError || !profile) {
      console.log('❌ User not found:', findError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (profile.email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const newToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    console.log('🔑 Generated new token for user:', { 
      userId: profile.id, 
      tokenLength: newToken.length,
      expiresAt 
    });

    // Update profile with new token
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        email_verification_token: newToken,
        email_verification_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('❌ Error updating verification token:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate new verification token' },
        { status: 500 }
      );
    }

    console.log('✅ Token updated successfully in database');

    // Send new verification email
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     process.env.SITE_URL || 
                     'http://localhost:3000';
      
      const emailPayload = {
        email,
        token: newToken,
        userType: profile.user_type,
        userName: profile.full_name
      };
      
      console.log('📧 Attempting to send email:', {
        baseUrl,
        emailEndpoint: `${baseUrl}/api/v1/send-verification-email`,
        payload: emailPayload
      });
      
      const emailResponse = await fetch(`${baseUrl}/api/v1/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      console.log('📬 Email API response:', {
        status: emailResponse.status,
        statusText: emailResponse.statusText,
        ok: emailResponse.ok
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('❌ Email send failed:', errorText);
        throw new Error(`Failed to send verification email: ${emailResponse.status} ${errorText}`);
      }

      const emailResult = await emailResponse.json();
      console.log('✅ Email sent successfully:', emailResult);

      return NextResponse.json({ 
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (emailError) {
      console.error('❌ Error sending verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email', details: emailError instanceof Error ? emailError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Resend verification email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}