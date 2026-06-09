import type { Metadata } from "next";
import { validateCollectionToken } from "@/lib/supabase/collection";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EventInviteLanding } from "./EventInviteLanding";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getEventData(token: string, groupId: string | null) {
  const { data: tokenInfo, error } = await validateCollectionToken(token, groupId);
  if (error || !tokenInfo) return null;

  const resolvedGroupId = groupId || tokenInfo.resolved_group_id;
  if (!resolvedGroupId) return null;

  const supabase = createSupabaseAdminClient();
  const { data: group } = await supabase
    .from("groups")
    .select("name, couple_display_name, event_date, event_time, event_location, event_venue, invite_title, invite_tagline, invite_message, couple_image_url, couple_image_position_x, couple_image_position_y, group_members(role, profiles!group_members_profile_id_fkey(full_name))")
    .eq("id", resolvedGroupId)
    .single();

  if (!group) return null;

  // Reason: default the "Hosted by" tagline to the organizer's name when they
  // haven't set one manually, mirroring the editor. The editor doesn't persist
  // this default, so the public page must derive it too — otherwise it falls
  // back to a generic "You're invited".
  const ownerMember = (group.group_members || []).find(
    (m: { role: string }) => m.role === "owner"
  );
  const ownerName =
    (ownerMember?.profiles as { full_name?: string | null } | null)?.full_name || "";

  return {
    tokenInfo,
    group,
    ownerName,
    groupId: resolvedGroupId,
    token,
  };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const resolved = await searchParams;
  const groupId = typeof resolved.group === "string" ? resolved.group : null;

  const data = await getEventData(token, groupId);
  if (!data) {
    return {
      title: "Event Invite — Small Plates & Co.",
      robots: { index: false, follow: false },
    };
  }

  const coupleName = data.group.invite_title || data.group.couple_display_name || data.group.name || "the couple";
  const description = data.group.invite_message || `${coupleName} invites you to share your favorite recipe!`;

  const ogImageUrl = data.tokenInfo.couple_image_og_url
    || (data.tokenInfo.couple_image_url
      ? `/api/og-image?url=${encodeURIComponent(data.tokenInfo.couple_image_url)}`
      : "/images/2SmallPlates-verticallogowhiteback.png");

  return {
    title: coupleName,
    description,
    metadataBase: new URL("https://www.smallplatesandcompany.com"),
    openGraph: {
      title: coupleName,
      description,
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const resolved = await searchParams;
  const groupId = typeof resolved.group === "string" ? resolved.group : null;

  const data = await getEventData(token, groupId);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--brand-warm-white))]">
        <p className="text-[hsl(var(--brand-warm-gray))]">This invite link is not valid.</p>
      </div>
    );
  }

  const coupleName = data.group.invite_title || data.group.couple_display_name || data.group.name || "the couple";
  const tagline = data.group.invite_tagline || data.ownerName || "You're invited";
  // Reason: keep the default message identical to the editor preview
  // (event-invite/page.tsx). The editor derives the name from couple_display_name
  // (NOT invite_title), so mirror that here to avoid a divergent fallback.
  const messageName = data.group.couple_display_name || data.group.name || "the couple";
  const message = data.group.invite_message || `${messageName} invites you to share your favorite recipe with them! They will print a cookbook with recipes from family and friends.`;
  const collectionUrl = `/collect/${data.token}?group=${data.groupId}&from=event`;

  return (
    <EventInviteLanding
      coupleName={coupleName}
      tagline={tagline}
      message={message}
      eventDate={data.group.event_date}
      eventTime={data.group.event_time}
      eventLocation={data.group.event_location}
      eventVenue={data.group.event_venue}
      coupleImageUrl={data.group.couple_image_url}
      coupleImagePositionX={data.group.couple_image_position_x ?? 50}
      coupleImagePositionY={data.group.couple_image_position_y ?? 50}
      collectionUrl={collectionUrl}
    />
  );
}
