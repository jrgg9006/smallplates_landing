import { NextRequest, NextResponse } from "next/server";
import { isFreeTierEnabled } from "@/lib/feature-flags";
import { createFreeTierGroup } from "@/lib/supabase/onboarding";

export async function POST(request: NextRequest) {
  if (!isFreeTierEnabled()) {
    return NextResponse.json({ error: "Free tier not enabled" }, { status: 404 });
  }

  const { bookName, coupleFirstName, partnerFirstName, occasion, bookDate, bookDateUndecided } = await request.json();

  if (!bookName || typeof bookName !== "string") {
    return NextResponse.json({ error: "Book name required" }, { status: 400 });
  }

  try {
    const { groupId } = await createFreeTierGroup({
      bookName,
      coupleFirstName: coupleFirstName || undefined,
      partnerFirstName: partnerFirstName || undefined,
      occasion: occasion || null,
      bookDate: bookDate || null,
      bookDateUndecided: bookDateUndecided || false,
    });
    return NextResponse.json({ groupId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
