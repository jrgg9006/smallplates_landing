import { NextResponse } from 'next/server';
import { createUserProfileAdmin } from '@/lib/supabase/wedding-onboarding';
import { handleApiError } from '@/lib/errors/api-errors';

export async function POST(req: Request) {
  try {
    const { userId, userData, userType, userEmail, isAdditionalBook } = await req.json();

    if (!userId || !userData || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create profile using admin client (bypasses RLS)
    // isAdditionalBook=true means user already exists, only create new group
    const { data, error } = await createUserProfileAdmin(userId, userData, userType, userEmail, isAdditionalBook);

    if (error) {
      return NextResponse.json(
        { error: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const apiError = handleApiError(error, 'create-wedding-profile', 'Failed to create wedding profile');
    return NextResponse.json(
      { 
        error: apiError.message,
        type: apiError.type,
        timestamp: apiError.timestamp,
        ...(apiError.details && { details: apiError.details })
      },
      { status: apiError.statusCode }
    );
  }
}