import { ServerClient } from 'postmark';

// Initialize Postmark client
const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

export interface SendInvitationEmailParams {
  to: string;
  confirmationUrl: string;
}

export interface SendNewRecipeNotificationParams {
  to: string;
  recipientName: string;
  sharedByName: string;
  recipeTitle: string;
  profileUrl: string;
  preferencesUrl: string;
}

export interface SendGroupInvitationEmailParams {
  to: string;
  groupName: string;
  groupDescription?: string;
  inviterName: string;
  joinUrl: string;
  recipientName?: string;
}

export async function sendInvitationEmail({ to, confirmationUrl }: SendInvitationEmailParams) {
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      From: process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com',
      To: to,
      TemplateAlias: 'invite-user-from-waitlist', // Your template name in Postmark
      TemplateModel: {
        ConfirmationURL: confirmationUrl,
      },
      MessageStream: 'invite-user', // The stream you configured
    });

    console.log('Invitation email sent successfully:', result.MessageID);
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendNewRecipeNotification({
  to,
  recipientName,
  sharedByName,
  recipeTitle,
  profileUrl,
  preferencesUrl,
}: SendNewRecipeNotificationParams) {
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      From: process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com',
      To: to,
      TemplateAlias: 'new-recipe-notification',
      TemplateModel: {
        RecipientName: recipientName,
        SharedByName: sharedByName,
        RecipeTitle: recipeTitle,
        ProfileURL: profileUrl,
        PreferencesURL: preferencesUrl,
      },
      MessageStream: 'transactional', // Using transactional stream
    });

    console.log('Recipe notification sent successfully:', result.MessageID);
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending recipe notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendGroupInvitationEmail({
  to,
  groupName,
  groupDescription,
  inviterName,
  joinUrl,
  recipientName = 'There'
}: SendGroupInvitationEmailParams) {
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      From: process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com',
      To: to,
      TemplateAlias: 'group-invitation',
      TemplateModel: {
        RecipientName: recipientName,
        GroupName: groupName,
        GroupDescription: groupDescription || '',
        InviterName: inviterName,
        JoinURL: joinUrl,
      },
      MessageStream: 'transactional',
    });

    console.log('Group invitation email sent successfully:', result.MessageID);
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending group invitation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}