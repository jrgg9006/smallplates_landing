import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, userData } = await request.json();

    if (!userId || !userData) {
      return NextResponse.json(
        { error: 'Missing userId or userData' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
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

    // Generate collection token
    const { data: newToken, error: tokenError } = await supabaseAdmin
      .rpc('generate_collection_token');

    if (tokenError || !newToken) {
      console.error('Failed to generate collection token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate collection token' },
        { status: 500 }
      );
    }

    // Map recipe category to number
    function mapRecipeCategoryToNumber(category: string): number {
      switch (category) {
        case '40-or-less':
          return 40;
        case '40-60':
          return 60;
        case '60-or-more':
          return 80;
        default:
          return 40;
      }
    }

    // Build full name
    let fullName = `${userData.firstName} ${userData.lastName}`;
    if (userData.hasPartner && userData.partnerFirstName && userData.partnerLastName) {
      fullName = `${userData.firstName} ${userData.lastName} and ${userData.partnerFirstName} ${userData.partnerLastName}`;
    }

    const recipeGoalNumber = mapRecipeCategoryToNumber(userData.recipeCount || '40-or-less');

    // Create profile with admin privileges
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: userData.email,
        recipe_goal_category: userData.recipeCount,
        recipe_goal_number: recipeGoalNumber,
        use_case: userData.useCase || null,
        collection_link_token: newToken,
        collection_enabled: true,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Ensure user has a default group (safety check in case trigger didn't run)
    const { data: existingGroups, error: groupsCheckError } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('created_by', userId)
      .limit(1);

    if (!groupsCheckError && (!existingGroups || existingGroups.length === 0)) {
      // User doesn't have any groups, create default group
      const { error: groupError } = await supabaseAdmin
        .from('groups')
        .insert({
          name: 'My First Book',
          description: 'Add recipes and invite friends to build your book',
          created_by: userId,
        });

      if (groupError) {
        console.error('Error creating default group:', groupError);
        // Don't fail the request, just log the error
      } else {
        console.log('Default group created for user:', userId);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: data?.[0] || null 
    });

  } catch (err) {
    console.error('Error in create-profile API:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}