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

export async function sendLoginLinkEmail({ to, buyerName, loginLink }: SendWelcomeLoginEmailParams) {
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      From: `Small Plates & Co. <${process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com'}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
      To: to,
      TemplateAlias: 'login-link',
      TemplateModel: {
        buyerName,
        loginLink,
      },
      MessageStream: 'outbound',
    });

    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending login link email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface SendFreeTierWelcomeEmailParams {
  to: string;
  buyerName: string;
  coupleName: string;
  loginLink: string;
  collectionLink: string;
  bookDate: string | null;
}

export async function sendFreeTierWelcomeEmail({ to, buyerName, coupleName, loginLink, collectionLink, bookDate }: SendFreeTierWelcomeEmailParams) {
  try {
    const collectionLinkDisplay = collectionLink.replace(/^https?:\/\//, '');
    const bookDateLine = bookDate ? ` by ${bookDate}` : '';

    const result = await postmarkClient.sendEmailWithTemplate({
      From: `Small Plates & Co. <${process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com'}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
      To: to,
      TemplateAlias: 'welcome-free-tier',
      TemplateModel: {
        buyerName,
        coupleName,
        loginLink,
        collectionLink,
        collectionLinkDisplay,
        bookDateLine,
      },
      MessageStream: 'outbound',
    });

    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending free-tier welcome email:', error);
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

export interface SendCopyOrderConfirmationParams {
  to: string;
  recipientName: string;
  coupleName: string;
  quantity: number;
  totalDollars: number;
  shippingAddress: {
    recipient_name?: string;
    street_address?: string;
    apartment_unit?: string | null;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  orderedAt: Date;
}

/**
 * Receipt for a public copy-order purchase. Buyer is a third party without
 * a Small Plates account, so this email has no dashboard link — it's a plain
 * confirmation. Uses inline HTML to avoid managing yet another Postmark template.
 */
export async function sendCopyOrderConfirmation({
  to,
  recipientName,
  coupleName,
  quantity,
  totalDollars,
  shippingAddress,
  orderedAt,
}: SendCopyOrderConfirmationParams) {
  const greeting = recipientName ? `Hi ${recipientName}.` : 'Hi.';
  const copiesLine = quantity === 1 ? '1 copy' : `${quantity} copies`;
  const totalLine = `$${totalDollars.toFixed(2)}`;
  const orderedLine = orderedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const addressLines: string[] = [];
  if (shippingAddress.recipient_name) addressLines.push(shippingAddress.recipient_name);
  const street = [shippingAddress.street_address, shippingAddress.apartment_unit].filter(Boolean).join(', ');
  if (street) addressLines.push(street);
  const cityLine = [
    shippingAddress.city,
    shippingAddress.state && shippingAddress.postal_code
      ? `${shippingAddress.state} ${shippingAddress.postal_code}`
      : shippingAddress.state || shippingAddress.postal_code,
  ]
    .filter(Boolean)
    .join(', ');
  if (cityLine) addressLines.push(cityLine);
  if (shippingAddress.country) addressLines.push(shippingAddress.country);

  const addressHtml = addressLines.map((l) => escapeHtml(l)).join('<br>');
  const addressText = addressLines.join('\n');

  const rowStyle = 'margin: 0 0 14px;';
  const labelStyle = 'font-size: 11px; color: #9A9590; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 2px;';
  const valueStyle = 'font-size: 15px; color: #2D2D2D; margin: 0;';

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2D2D2D;">
      <h1 style="font-family: Georgia, 'Times New Roman', serif; font-weight: 500; font-size: 28px; margin: 0 0 16px; color: #2D2D2D;">Order confirmed</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #5A5550; margin: 0 0 24px;">
        ${escapeHtml(greeting)} Here's what's coming.
      </p>

      <div style="background: #FFFFFF; border: 1px solid rgba(45, 45, 45, 0.12); border-radius: 10px; padding: 18px 18px 4px;">
        <div style="${rowStyle}">
          <p style="${labelStyle}">Book</p>
          <p style="${valueStyle}">${escapeHtml(coupleName)}</p>
        </div>
        <div style="${rowStyle}">
          <p style="${labelStyle}">Copies</p>
          <p style="${valueStyle}">${escapeHtml(copiesLine)}</p>
        </div>
        <div style="${rowStyle}">
          <p style="${labelStyle}">Total paid</p>
          <p style="${valueStyle}">${escapeHtml(totalLine)}</p>
        </div>
        <div style="${rowStyle}">
          <p style="${labelStyle}">Ordered on</p>
          <p style="${valueStyle}">${escapeHtml(orderedLine)}</p>
        </div>
        ${
          addressLines.length > 0
            ? `<div style="${rowStyle}">
                 <p style="${labelStyle}">Ships to</p>
                 <p style="${valueStyle}">${addressHtml}</p>
               </div>`
            : ''
        }
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #9A9590; margin: 24px 0 0;">
        It takes about 3 weeks to print and ship. We'll email tracking when it leaves the warehouse.
      </p>
      <p style="font-size: 12px; color: #C8C3BC; margin: 24px 0 0;">
        Questions? Just reply to this email or write to <a href="mailto:team@smallplatesandcompany.com" style="color: #9A9590;">team@smallplatesandcompany.com</a>.
      </p>
    </div>
  `.trim();

  const textBody =
    `${greeting} Here's what's coming.\n\n` +
    `Book:        ${coupleName}\n` +
    `Copies:      ${copiesLine}\n` +
    `Total paid:  ${totalLine}\n` +
    `Ordered on:  ${orderedLine}\n` +
    (addressText ? `\nShips to:\n${addressText}\n` : '') +
    `\nIt takes about 3 weeks to print and ship. We'll email tracking when it leaves the warehouse.\n\n` +
    `Questions? Just reply to this email or write to team@smallplatesandcompany.com.`;

  try {
    const result = await postmarkClient.sendEmail({
      From: `Small Plates & Co. <${process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com'}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
      To: to,
      Subject: `Order confirmed — ${coupleName}`,
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: 'outbound',
    });
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('Error sending copy-order confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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