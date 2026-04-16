import { ServerClient } from 'postmark';

// Initialize Postmark client
const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

export interface SendNewRecipeNotificationParams {
  to: string;
  recipientName: string;
  sharedByName: string;
  recipeTitle: string;
  profileUrl: string;
  preferencesUrl: string;
}

export interface SendWelcomeLoginEmailParams {
  to: string;
  buyerName: string;
  loginLink: string;
}

export async function sendWelcomeLoginEmail({ to, buyerName, loginLink }: SendWelcomeLoginEmailParams) {
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      From: `Small Plates & Co. <${process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com'}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
      To: to,
      TemplateAlias: 'welcome-login',
      TemplateModel: {
        buyerName,
        loginLink,
        userEmail: to,
      },
      MessageStream: 'outbound',
    });

    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending welcome login email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface SendReturningCustomerEmailParams {
  to: string;
  buyerName: string;
  loginLink: string;
}

/**
 * Email sent when a returning customer (one who already had a Small Plates account)
 * buys another book. Different subject + copy than the first-time welcome — acknowledges
 * they're back and avoids the "welcome to Small Plates" tone that would feel off.
 * Uses inline HTML/Text (no Postmark template dependency).
 */
export async function sendReturningCustomerEmail({
  to,
  buyerName,
  loginLink,
}: SendReturningCustomerEmailParams) {
  const greeting = buyerName ? `Welcome back, ${buyerName}.` : "Welcome back.";

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2D2D2D;">
      <h1 style="font-family: Georgia, 'Times New Roman', serif; font-weight: 500; font-size: 28px; margin: 0 0 16px; color: #2D2D2D;">${greeting}</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #5A5550; margin: 0 0 24px;">
        Your new book is on its way. Click below to open your dashboard and set it up — we'll keep it ready for you.
      </p>
      <p style="margin: 24px 0;">
        <a href="${loginLink}" style="display: inline-block; background: #D4A854; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 500; font-size: 15px;">Open your dashboard</a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #9A9590; margin: 32px 0 0;">
        Thanks for coming back. Each book is its own — different people, different recipes, different stories.
      </p>
      <p style="font-size: 12px; color: #C8C3BC; margin: 24px 0 0;">
        Need help? <a href="mailto:team@smallplatesandcompany.com" style="color: #9A9590;">team@smallplatesandcompany.com</a>
      </p>
    </div>
  `.trim();

  const textBody = `${greeting}\n\nYour new book is on its way. Open your dashboard to set it up:\n${loginLink}\n\nThanks for coming back.\n\nNeed help? team@smallplatesandcompany.com`;

  try {
    const result = await postmarkClient.sendEmail({
      From: `Small Plates & Co. <${process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com'}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
      To: to,
      Subject: `Your new book is on its way${buyerName ? `, ${buyerName}` : ''}`,
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: 'outbound',
    });
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending returning-customer email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface SendPasswordResetEmailParams {
  to: string;
  resetLink: string;
}

/**
 * Sends a password-reset email with an inline HTML body. Avoids depending on a
 * Postmark template so we don't have to manage one just for this flow.
 */
export async function sendPasswordResetEmail({ to, resetLink }: SendPasswordResetEmailParams) {
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2D2D2D;">
      <h1 style="font-family: Georgia, 'Times New Roman', serif; font-weight: 500; font-size: 28px; margin: 0 0 16px; color: #2D2D2D;">Reset your password</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #5A5550; margin: 0 0 24px;">
        We got a request to reset the password for your Small Plates account. Click the button below to set a new one. The link is good for one hour.
      </p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="display: inline-block; background: #D4A854; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 500; font-size: 15px;">Reset password</a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #9A9590; margin: 32px 0 0;">
        If you didn't ask for this, you can safely ignore this email — your password won't change.
      </p>
      <p style="font-size: 12px; color: #C8C3BC; margin: 24px 0 0;">
        Need help? <a href="mailto:team@smallplatesandcompany.com" style="color: #9A9590;">team@smallplatesandcompany.com</a>
      </p>
    </div>
  `.trim();

  const textBody = `Reset your password\n\nWe got a request to reset the password for your Small Plates account.\n\nOpen this link to set a new one (good for one hour):\n${resetLink}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.\n\nNeed help? team@smallplatesandcompany.com`;

  try {
    const result = await postmarkClient.sendEmail({
      From: `Small Plates & Co. <${process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com'}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
      To: to,
      Subject: 'Reset your Small Plates password',
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: 'outbound',
    });
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface SendGroupInvitationEmailParams {
  to: string;
  groupName: string;
  groupDescription?: string;
  inviterName: string;
  joinUrl: string;
  recipientName?: string;
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
      From: `Small Plates & Co. <${process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com'}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
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

    // console.log removed for production
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
      From: `Small Plates & Co. <${process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com'}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
      To: to,
      TemplateAlias: 'invite-to-group',
      TemplateModel: {
        RecipientName: recipientName,
        GroupName: groupName,
        GroupDescription: groupDescription || '',
        InviterName: inviterName,
        InvitationURL: joinUrl,
      },
      MessageStream: 'invite-user',
    });

    // console.log removed for production
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending group invitation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}