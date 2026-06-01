import { createSupabaseRoute } from "@/lib/supabase/route";
import type { OccasionType } from "@/components/onboarding/onboardingState";

export interface CreateFreeTierGroupParams {
  bookName: string;
  coupleFirstName?: string;
  partnerFirstName?: string;
  occasion: OccasionType;
  bookDate: string | null;
  bookDateUndecided: boolean;
}

export async function createFreeTierGroup(
  params: CreateFreeTierGroupParams
): Promise<{ groupId: string }> {
  const supabase = await createSupabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: params.bookName,
      created_by: user.id,
      status: "free_tier" as const,
      description: "",
      ...(params.coupleFirstName ? { couple_first_name: params.coupleFirstName } : {}),
      ...(params.partnerFirstName ? { partner_first_name: params.partnerFirstName } : {}),
      ...(params.bookDate ? { gift_date: params.bookDate } : {}),
      gift_date_undecided: params.bookDateUndecided,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create group: ${error?.message || "unknown"}`);
  }

  return { groupId: data.id };
}
