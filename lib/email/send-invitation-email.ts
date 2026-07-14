import { ServerClient } from 'postmark';
import { getInvitationTemplate } from './invitation-templates';

// Initialize Postmark client
const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

export interface SendGuestInvitationParams {
  to: string;
  guestName: string;
  coupleDisplayName?: string;
  coupleName?: string;
  collectionLink: string;
  coupleImageUrl?: string;
  captainName?: string;
  emailNumber: 1 | 2;
  recipeCount?: number;
  customBody?: string;
  // Reason: drives occasion-aware copy in the templates (wedding vs neutral).
  occasion?: string | null;
  // Reason: when the heading is a real person, non-wedding occasions still get
  // the "gift for {name}" framing + possessive subject.
  namesArePeople?: boolean;
  // Reason: organizer-edited sender name. Overrides the "From" display name and
  // the reminder signature. The real address stays team@smallplatesandcompany.com.
  fromName?: string;
  // Reason: organizer-edited subject line. Overrides the auto-generated subject.
  customSubject?: string;
}

export async function sendGuestInvitationEmail({
  to,
  guestName,
  coupleDisplayName,
  coupleName,
  collectionLink,
  coupleImageUrl,
  captainName,
  emailNumber,
  recipeCount,
  customBody,
  occasion,
  namesArePeople,
  fromName,
  customSubject,
}: SendGuestInvitationParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Use coupleName if provided, otherwise use coupleDisplayName for backward compatibility
    const displayName = coupleName || coupleDisplayName || 'The Couple';
    // Reason: the sender name shown in "From" — organizer's custom name if set,
    // otherwise the book name. Only the display name changes; the sending address
    // stays verified (team@smallplatesandcompany.com) so deliverability holds.
    const senderName = fromName?.trim() || displayName;

    // Get the template
    const { subject, html, text } = getInvitationTemplate(emailNumber, {
      coupleDisplayName: displayName,
      guestName,
      collectionLink,
      coupleImageUrl,
      captainName,
      recipeCount,
      customBody,
      occasion,
      namesArePeople,
      fromName,
      customSubject,
    });

    // Send email via Postmark
    const result = await postmarkClient.sendEmail({
      From: `${senderName} <team@smallplatesandcompany.com>`,
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      ReplyTo: 'team@smallplatesandcompany.com',
      MessageStream: 'outbound',
    });

    console.log(`Invitation email ${emailNumber} sent to ${to}, MessageID: ${result.MessageID}`);
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error(`Error sending invitation email ${emailNumber} to ${to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}