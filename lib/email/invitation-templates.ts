/**
 * Email invitation templates for guest recipe collection
 * 
 * Variables available:
 * - coupleDisplayName: "Ana & Pedro" (formatted for emails)
 * - guestName: "María"
 * - collectionLink: "https://smallplatesandcompany.com/collect/abc123"
 * - coupleImageUrl: URL to couple's photo (optional)
 */

interface InvitationTemplateParams {
  coupleDisplayName: string;
  guestName: string;
  collectionLink: string;
  coupleImageUrl?: string;
  captainName?: string;
  recipeCount?: number; // For social proof in Email 3 (only shown if ≥10)
}

// Base template wrapper with all styles
function baseTemplate(content: string, subject: string, captainName?: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" 
xmlns:v="urn:schemas-microsoft-com:vml" 
xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject} - Small Plates & Co.</title>
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }

    /* Remove default styling */
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    /* Mobile styles */
    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-center { text-align: center !important; }
      table[class="wrapper"] { width: 100% !important; }
      .couple-image { width: 80px !important; height: 80px !important; }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #2d2d2d !important; }
      h1, h2, h3, .darkmode-text { color: #ffffff !important; }
      p, .darkmode-subtext { color: #cccccc !important; }
      .footer-text { color: #999999 !important; }
    }

    /* Button hover effect */
    .button-td, .button-a { transition: all 100ms ease-in; }
    .button-td:hover, .button-a:hover { background: #C19940 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">
  <div role="article" aria-roledescription="email" lang="en">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <!-- Email Container -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width: 600px; border-collapse: collapse;" class="wrapper">
            <tr>
              <td align="center" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; padding: 40px;" class="container-bg mobile-padding">

                <!-- Logo Section -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 30px;">
                      <img src="https://smallplatesandcompany.com/images/SmallPlates_logo_horizontal.png" 
                           alt="Small Plates & Co." 
                           width="180" 
                           height="auto" 
                           style="display: block; margin: 0 auto; max-width: 180px; height: auto; font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #2D2D2D; text-align: center;" />
                    </td>
                  </tr>
                </table>

                ${content}

                <!-- Footer -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-top: 30px; border-top: 1px solid #E8E0D5;">
                      ${captainName ? `
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #B8B0A8; line-height: 1.5; text-align: center;" class="footer-text">
                        Sent with ♥ by ${captainName}
                      </p>
                      ` : ''}
                      <p style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 14px; color: #9A9590; line-height: 1.5; text-align: center; font-style: italic;" class="footer-text">
                        Recipes from the people who love you.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #9A9590; line-height: 1.5; text-align: center;" class="footer-text">
                        Small Plates & Co.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

// Couple image section (if image URL provided)
function coupleImageSection(coupleImageUrl: string | undefined, coupleDisplayName: string): string {
  // Use placeholder image if no couple image is provided
  const imageUrl = coupleImageUrl || 'https://smallplatesandcompany.com/images/emails/email_placeholder.jpg';
  
  return `
                <!-- Couple Image -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <img src="${imageUrl}" 
                           alt="${coupleDisplayName}" 
                           width="100" 
                           height="100" 
                           class="couple-image"
                           style="display: block; width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #E8E0D5;" />
                    </td>
                  </tr>
                </table>`;
}

// CTA Button
function ctaButton(link: string, text: string = "Add Your Recipe"): string {
  return `
                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td align="center" style="padding: 32px 0;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="58%" stroke="f" fillcolor="#D4A854">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:500;">${text}</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${link}" 
                         style="display: inline-block; 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
                                font-size: 16px; 
                                font-weight: 500; 
                                color: #ffffff; 
                                text-decoration: none; 
                                padding: 16px 32px; 
                                border-radius: 30px; 
                                background-color: #D4A854;
                                transition: background-color 0.2s ease;">
                        ${text}
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>`;
}

// ============================================
// EMAIL 1: Initial Invitation
// ============================================
export function invitationEmail1(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleDisplayName, guestName, collectionLink, coupleImageUrl } = params;
  
  const subject = `You're invited to ${coupleDisplayName}'s wedding cookbook`;
  
  const content = `
                ${coupleImageSection(coupleImageUrl, coupleDisplayName)}

                <!-- Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-text">
                        ${coupleDisplayName} are getting married. We're giving them a special gift.
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Hi ${guestName},
                      </p>
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        We are collecting recipes from everyone who loves ${coupleDisplayName} and turning it into a real cookbook.
                      </p>
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        It's not going on a shelf. It's going in their kitchen. The place where their marriage actually happens.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Doesn't have to be fancy. The pasta you always make. The thing you bring to every dinner. Whatever feels like you.
                      </p>
                    </td>
                  </tr>
                </table>

                ${ctaButton(collectionLink)}

                <!-- Subtext -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #9A9590; line-height: 1.5; text-align: center;">
                        Takes about 5 minutes.
                      </p>
                    </td>
                  </tr>
                </table>`;

  return { subject, html: baseTemplate(content, subject, params.captainName) };
}

// ============================================
// EMAIL 2: First Reminder
// ============================================
export function invitationEmail2(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleDisplayName, guestName, collectionLink, coupleImageUrl } = params;
  
  const subject = `Still thinking what recipe to send?`;
  
  const content = `
                ${coupleImageSection(coupleImageUrl, coupleDisplayName)}

                <!-- Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-text">
                        Still thinking what recipe to send?
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Hi ${guestName},
                      </p>
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Here's the secret about ${coupleDisplayName}'s cookbook: the best recipes are the ones you already make.
                      </p>
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        You know—that thing you throw together on Tuesdays. The dip that disappears first at parties. Your hangover cure. The sandwich that fixes bad days.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Just pick one and write it like you're texting a friend. Or just take a photo if it's already written down somewhere.
                      </p>
                    </td>
                  </tr>
                </table>

                ${ctaButton(collectionLink)}

                <!-- Subtext -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #9A9590; line-height: 1.5; text-align: center;">
                        Takes 5 minutes, promise.
                      </p>
                    </td>
                  </tr>
                </table>`;

  return { subject, html: baseTemplate(content, subject, params.captainName) };
}

// ============================================
// EMAIL 3: Second Reminder with Social Proof
// ============================================
export function invitationEmail3(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleDisplayName, guestName, collectionLink, coupleImageUrl, recipeCount } = params;
  
  // Show social proof only if we have 10+ recipes
  const showSocialProof = recipeCount && recipeCount >= 10;
  
  const subject = showSocialProof 
    ? `${coupleDisplayName}'s cookbook is taking shape`
    : `There's still time`;
  
  const headerText = showSocialProof
    ? `${coupleDisplayName}'s cookbook is taking shape`
    : `There's still time`;
  
  const mainContent = showSocialProof
    ? `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
         Hi ${guestName},
       </p>
       <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
         ${recipeCount} people have already shared their recipes. Every page tells a story about someone who loves them.
       </p>
       <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
         There's still room for yours. The pasta dish you always make. That dessert everyone asks about. Whatever feels like you.
       </p>`
    : `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
         Hi ${guestName},
       </p>
       <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
         We know life gets busy. But if you've been meaning to add your recipe to ${coupleDisplayName}'s book, now's a good time.
       </p>
       <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
         Five minutes. One recipe. A page in their kitchen forever.
       </p>`;
  
  const content = `
                ${coupleImageSection(coupleImageUrl, coupleDisplayName)}

                <!-- Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-text">
                        ${headerText}
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      ${mainContent}
                    </td>
                  </tr>
                </table>

                ${ctaButton(collectionLink)}`;

  return { subject, html: baseTemplate(content, subject, params.captainName) };
}

// ============================================
// EMAIL 4: Last Reminder
// ============================================
export function invitationEmail4(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleDisplayName, guestName, collectionLink, coupleImageUrl } = params;
  
  const subject = `Last call for ${coupleDisplayName}'s book`;
  
  const content = `
                ${coupleImageSection(coupleImageUrl, coupleDisplayName)}

                <!-- Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-text">
                        One last nudge
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Hi ${guestName},
                      </p>
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        This is our last reminder about ${coupleDisplayName}'s recipe book. If you'd like to be part of it, we'd love to have you.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        No hard feelings if not—but the door's still open.
                      </p>
                    </td>
                  </tr>
                </table>

                ${ctaButton(collectionLink)}`;

  return { subject, html: baseTemplate(content, subject, params.captainName) };
}

// Helper to get template by number
export function getInvitationTemplate(
  emailNumber: 1 | 2 | 3 | 4,
  params: InvitationTemplateParams
): { subject: string; html: string } {
  switch (emailNumber) {
    case 1:
      return invitationEmail1(params);
    case 2:
      return invitationEmail2(params);
    case 3:
      return invitationEmail3(params);
    case 4:
      return invitationEmail4(params);
    default:
      throw new Error(`Invalid email number: ${emailNumber}`);
  }
}