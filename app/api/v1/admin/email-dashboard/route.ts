import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import {
  getGroupsWithoutCaptains,
  getGroupsWithCaptains,
  getActiveGroupsForWeeklyStatus,
  getGroupsClosingSoon,
  getBooksForRemindersTip,
} from '@/lib/email/queries';

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    // Reason: ?include_all=true expands the captain-reminder tab to include
    // non-active books (reviewed / ready_to_print / printed) for reference only.
    // Weekly status and closing nudge stay scoped to active books — they're operational.
    const includeAll = request.nextUrl.searchParams.get('include_all') === 'true';

    const [captainReminder, booksWithCaptains, weeklyStatus, closingNudge, remindersTip] =
      await Promise.all([
        getGroupsWithoutCaptains(includeAll),
        getGroupsWithCaptains(includeAll),
        getActiveGroupsForWeeklyStatus(),
        getGroupsClosingSoon(7),
        getBooksForRemindersTip(),
      ]);

    return NextResponse.json({
      captainReminder,
      booksWithCaptains,
      weeklyStatus,
      closingNudge,
      remindersTip,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load' },
      { status: 500 }
    );
  }
}
