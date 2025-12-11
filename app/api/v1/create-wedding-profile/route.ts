import { NextResponse } from 'next/server';
import { createUserProfileAdmin } from '@/lib/supabase/wedding-onboarding';

export async function POST(req: Request) {
  try {
    const { userId, userData, userType } = await req.json();

    if (!userId || !userData || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create profile using admin client (bypasses RLS)
    const { data, error } = await createUserProfileAdmin(userId, userData, userType);

    if (error) {
      return NextResponse.json(
        { error: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}