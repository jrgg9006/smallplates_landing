import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("profile_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const type = request.nextUrl.searchParams.get("type");

    // Reason: Sum book_quantity from all paid orders of the given type for this group
    const { data: orders } = await supabase
      .from("orders")
      .select("book_quantity")
      .eq("group_id", groupId)
      .eq("status", "paid")
      .eq("order_type", type || "extra_copy");

    const totalCopies = orders?.reduce((sum, o) => sum + (o.book_quantity || 0), 0) || 0;

    return NextResponse.json({ totalCopies });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
