import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrganizerRelationship } from "@/lib/types/database";

const VALID_RELATIONSHIPS: OrganizerRelationship[] = ["couple", "family", "friend", "wedding-planner"];

interface Body {
  coupleFirstName?: string;
  partnerFirstName?: string;
  weddingDate?: string | null;
  weddingDateUndecided?: boolean;
  organizerRelationship?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const coupleFirstName = body.coupleFirstName?.trim();
    const partnerFirstName = body.partnerFirstName?.trim();
    const weddingDateUndecided = Boolean(body.weddingDateUndecided);
    const weddingDate = weddingDateUndecided ? null : body.weddingDate || null;
    const organizerRelationship = body.organizerRelationship;

    if (!coupleFirstName || !partnerFirstName) {
      return NextResponse.json({ error: "Names are required" }, { status: 400 });
    }
    if (
      !organizerRelationship ||
      !VALID_RELATIONSHIPS.includes(organizerRelationship as OrganizerRelationship)
    ) {
      return NextResponse.json({ error: "Invalid relationship" }, { status: 400 });
    }

    // Reason: Use admin client to bypass RLS, but enforce ownership via created_by match.
    const admin = createSupabaseAdminClient();

    const { data: group, error: lookupError } = await admin
      .from("groups")
      .select("id, created_by")
      .eq("id", groupId)
      .single();

    if (lookupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (group.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const coupleName = `${coupleFirstName} & ${partnerFirstName}`;

    const { error: updateError } = await admin
      .from("groups")
      .update({
        name: coupleName,
        description: `A wedding recipe book for ${coupleName}`,
        couple_first_name: coupleFirstName,
        partner_first_name: partnerFirstName,
        wedding_date: weddingDate,
        wedding_date_undecided: weddingDateUndecided,
        relationship_to_couple: organizerRelationship as OrganizerRelationship,
        status: "active",
      })
      .eq("id", groupId);

    if (updateError) {
      console.error("Error updating group:", updateError);
      return NextResponse.json({ error: "Could not update group" }, { status: 500 });
    }

    const { error: orderError } = await admin
      .from("orders")
      .update({ couple_name: coupleName })
      .eq("group_id", groupId);

    if (orderError) {
      console.error("Error back-filling order couple_name:", orderError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("complete-setup route error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
