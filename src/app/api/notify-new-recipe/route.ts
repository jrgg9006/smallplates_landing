import { NextRequest, NextResponse } from 'next/server';
// import { sendNewRecipeNotification } from '@/lib/postmark';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      cookbookOwnerId,
      sharedByName,
      recipeTitle 
    } = await request.json();

    if (!cookbookOwnerId || !sharedByName || !recipeTitle) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get cookbook owner details
    const { data: cookbookOwner, error: ownerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', cookbookOwnerId)
      .single();

    if (ownerError || !cookbookOwner) {
      return NextResponse.json({ 
        error: 'Cookbook owner not found' 
      }, { status: 404 });
    }

    // Check if user has opted out of recipe notifications (future feature)
    // For now, we'll send to everyone

    // Generate URLs
    const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/profile`;
    const preferencesUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/settings/notifications`;

    // Send the notification email
    // TODO: Implement email sending with postmark
    // const result = await sendNewRecipeNotification({
    //   to: cookbookOwner.email,
    //   recipientName: cookbookOwner.full_name || 'Chef',
    //   sharedByName,
    //   recipeTitle,
    //   profileUrl,
    //   preferencesUrl,
    // });

    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Recipe notification would be sent (email not configured yet)',
      cookbookOwner: {
        email: cookbookOwner.email,
        name: cookbookOwner.full_name
      }
    });
  } catch (error) {
    console.error('Error in notify-new-recipe API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}