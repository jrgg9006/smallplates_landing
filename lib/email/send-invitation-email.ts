import { ServerClient } from 'postmark';
import { getInvitationTemplate } from './invitation-templates';

// Initialize Postmark client
const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

export interface SendGuestInvitationParams {
  to: string;
  guestName: string;
  coupleDisplayName: string;
  collectionLink: string;
  coupleImageUrl?: string;
  captainName?: string;
  emailNumber: 1 | 2 | 3 | 4;
}

export async function sendGuestInvitationEmail({
  to,
  guestName,
  coupleDisplayName,
  collectionLink,
  coupleImageUrl,
  captainName,
  emailNumber,
}: SendGuestInvitationParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get the template
    const { subject, html } = getInvitationTemplate(emailNumber, {
      coupleDisplayName,
      guestName,
      collectionLink,
      coupleImageUrl,
      captainName,
    });

    // Send email via Postmark
    const result = await postmarkClient.sendEmail({
      From: `${coupleDisplayName} <team@smallplatesandcompany.com>`,
      To: to,
      Subject: subject,
      HtmlBody: html,
      ReplyTo: 'team@smallplatesandcompany.com',
      MessageStream: 'outbound', // or your transactional stream name
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