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
  emailNumber: 1 | 2 | 3 | 4;
  recipeCount?: number;
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
}: SendGuestInvitationParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Use coupleName if provided, otherwise use coupleDisplayName for backward compatibility
    const displayName = coupleName || coupleDisplayName || 'The Couple';

    // Get the template
    const { subject, html, text } = getInvitationTemplate(emailNumber, {
      coupleDisplayName: displayName,
      guestName,
      collectionLink,
      coupleImageUrl,
      captainName,
      recipeCount,
    });

    // Send email via Postmark
    const result = await postmarkClient.sendEmail({
      From: `${displayName} <team@smallplatesandcompany.com>`,
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