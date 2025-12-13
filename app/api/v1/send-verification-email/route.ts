import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, token, userType, userName } = await req.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Postmark integration
    // For now, this is a placeholder that logs the email data
    
    // Get base URL - try multiple sources
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.SITE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                   'http://localhost:3000';
    
    // Ensure we have a valid URL
    if (!baseUrl || baseUrl === 'undefined') {
      console.error('❌ No valid base URL found for verification link');
      return NextResponse.json(
        { error: 'Server configuration error: Missing base URL' },
        { status: 500 }
      );
    }
    
    const verificationLink = `${baseUrl}/api/v1/verify-email?token=${token}`;
    
    const emailData = {
      to: email,
      subject: userType === 'couple' 
        ? 'Welcome to SmallPlates! Please verify your email' 
        : 'Your SmallPlates gift cookbook is ready! Please verify your email',
      templateData: {
        userName: userName || 'there',
        verificationLink,
        userType,
        baseUrl
      }
    };

    // Debug logging
    console.log('📧 Email verification request:', {
      to: email,
      subject: emailData.subject,
      verificationLink,
      baseUrl,
      userType,
      userName,
      hasBaseUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      envSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      templateModel: {
        userName: userName || 'there',
        userEmail: email,
        verificationLink,
      }
    });

    // Send email via Postmark
    const postmarkResponse = await fetch('https://api.postmarkapp.com/email/withTemplate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN!
      },
      body: JSON.stringify({
        From: 'Small Plates & Co. <team@smallplatesandcompany.com>',
        To: email,
        TemplateAlias: 'email-verification', // Use the alias we created
        TemplateModel: {
          userName: userName || 'there',
          userEmail: email,
          verificationLink: verificationLink
        }
      })
    });
    
    if (!postmarkResponse.ok) {
      const errorData = await postmarkResponse.json().catch(() => ({}));
      console.error('Postmark API error:', {
        status: postmarkResponse.status,
        statusText: postmarkResponse.statusText,
        errorData,
        hasToken: !!process.env.POSTMARK_SERVER_TOKEN
      });
      throw new Error(`Failed to send email via Postmark: ${postmarkResponse.status} ${postmarkResponse.statusText}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification email sent (placeholder)',
      verificationLink // For testing purposes
    });

  } catch (error) {
    console.error('Send verification email error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      hasToken: !!process.env.POSTMARK_SERVER_TOKEN
    });
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}