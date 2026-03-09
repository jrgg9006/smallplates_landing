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
  recipeCount?: number;
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
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 24px !important; }
      .couple-image { width: 120px !important; height: 120px !important; }
      .hero-name { font-size: 28px !important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #2d2d2d !important; }
      h1, h2, h3, .darkmode-text { color: #ffffff !important; }
      p, .darkmode-subtext { color: #cccccc !important; }
      .footer-text { color: #999999 !important; }
    }

    .button-td, .button-a { transition: all 100ms ease-in; }
    .button-td:hover, .button-a:hover { background: #444444 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">
  <!-- Preheader text (hidden, shown in Gmail inbox preview) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    We're making them a cookbook. A real one. Your page is waiting.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <div role="article" aria-roledescription="email" lang="en">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width: 560px; border-collapse: collapse;" class="wrapper">
            <tr>
              <td align="center" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;" class="container-bg">

                <!-- Email Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding: 48px 40px;" class="mobile-padding">
                      ${content}
                    </td>
                  </tr>
                </table>

                <!-- Footer divider + logo + attribution -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 0 40px;">
                      <div style="border-top: 1px solid #F0EDE8;"></div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 24px 40px 32px;">
                      <img src="https://smallplatesandcompany.com/images/SmallPlates_logo_horizontal1.png"
                           alt="Small Plates & Co."
                           width="120"
                           height="auto"
                           style="display: block; margin: 0 auto 16px; max-width: 120px; height: auto; opacity: 0.4;" />
                      ${captainName ? `
                      <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #9A9590; line-height: 1.5; text-align: center;" class="footer-text">
                        This invitation was sent by ${captainName} via Small Plates &amp; Co.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #C4BDB6; line-height: 1.5; text-align: center;" class="footer-text">
                        If you don't know ${captainName} or didn't expect this invitation, you can safely ignore this email.
                      </p>
                      ` : `
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #9A9590; line-height: 1.5; text-align: center;" class="footer-text">
                        Small Plates &amp; Co.
                      </p>
                      `}
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

// Couple image section — rounded rectangle, not circle
function coupleImageSection(coupleImageUrl: string | undefined, coupleDisplayName: string): string {
  if (!coupleImageUrl) return '';

  return `
                      <!-- Couple Image -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 40px;">
                            <img src="${coupleImageUrl}"
                                 alt="${coupleDisplayName}"
                                 width="140"
                                 height="140"
                                 class="couple-image"
                                 style="display: block; width: 140px; height: 140px; border-radius: 16px; object-fit: cover;" />
                          </td>
                        </tr>
                      </table>`;
}

// CTA Button — dark charcoal, uppercase tracking
function ctaButton(link: string, text: string = "ADD YOUR RECIPE"): string {
  return `
                      <!-- CTA Button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                          <td align="center" style="padding: 40px 0 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="10%" stroke="f" fillcolor="#2D2D2D">
                              <w:anchorlock/>
                              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:12px;font-weight:500;letter-spacing:2px;">${text}</center>
                            </v:roundrect>
                            <![endif]-->
                            <!--[if !mso]><!-->
                            <a href="${link}"
                               class="button-a"
                               style="display: inline-block;
                                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                                      font-size: 12px;
                                      font-weight: 500;
                                      letter-spacing: 2px;
                                      color: #ffffff;
                                      text-decoration: none;
                                      padding: 16px 40px;
                                      border-radius: 4px;
                                      background-color: #2D2D2D;">
                              ${text}
                            </a>
                            <!--<![endif]-->
                          </td>
                        </tr>
                      </table>

                      <!-- Subtext -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding-top: 16px;">
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #9A9590; line-height: 1.5; text-align: center;">
                              5 minutes. That's it.
                            </p>
                          </td>
                        </tr>
                      </table>`;
}

// Hero section — label + couple names + gold line
function heroSection(coupleDisplayName: string): string {
  return `
                      <!-- Hero: Couple Names -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9A9590; text-align: center;">
                              A wedding cookbook gift for
                            </p>
                            <h1 style="margin: 0 0 12px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 36px; font-weight: 400; color: #2D2D2D; line-height: 1.2; text-align: center;" class="darkmode-text hero-name">
                              ${coupleDisplayName}
                            </h1>
                            <!-- Gold divider -->
                            <div style="width: 48px; height: 1px; background-color: #D4A854; margin: 0 auto 40px;"></div>
                          </td>
                        </tr>
                      </table>`;
}

// ============================================
// EMAIL 1: Initial Invitation
// ============================================
export function invitationEmail1(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleDisplayName, collectionLink, coupleImageUrl } = params;

  const subject = `You're invited to ${coupleDisplayName}'s wedding cookbook`;

  const content = `
                      ${heroSection(coupleDisplayName)}

                      ${coupleImageSection(coupleImageUrl, coupleDisplayName)}

                      <!-- Body Copy -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="max-width: 340px; margin: 0 auto;">
                            <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                              We're making them a cookbook. A real one. With recipes from the people who matter most to them.
                            </p>
                            <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                              Send a recipe and you're in their kitchen.
                            </p>
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #2D2D2D; font-weight: 600; line-height: 1.6; text-align: center;" class="darkmode-text">
                              Doesn't have to be fancy. Just has to be yours.
                            </p>
                          </td>
                        </tr>
                      </table>

                      ${ctaButton(collectionLink)}`;

  return { subject, html: baseTemplate(content, subject, params.captainName) };
}

// ============================================
// EMAIL 2: First Reminder
// ============================================
export function invitationEmail2(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleDisplayName, guestName, collectionLink, coupleImageUrl } = params;

  const subject = `Still thinking what recipe to send?`;

  const content = `
                      ${heroSection(coupleDisplayName)}

                      ${coupleImageSection(coupleImageUrl, coupleDisplayName)}

                      <!-- Body Copy -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                              Hi ${guestName}, ${coupleDisplayName}'s cookbook is coming together and your page is still open.
                            </p>
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #2D2D2D; font-weight: 600; line-height: 1.6; text-align: center;" class="darkmode-text">
                              Send a recipe and you're in their kitchen.
                            </p>
                          </td>
                        </tr>
                      </table>

                      ${ctaButton(collectionLink)}`;

  return { subject, html: baseTemplate(content, subject, params.captainName) };
}

// ============================================
// EMAIL 3: Second Reminder with Social Proof
// ============================================
export function invitationEmail3(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleDisplayName, guestName, collectionLink, coupleImageUrl, recipeCount } = params;

  const showSocialProof = recipeCount && recipeCount >= 10;

  const subject = showSocialProof
    ? `${coupleDisplayName}'s cookbook is taking shape`
    : `There's still time`;

  const bodyContent = showSocialProof
    ? `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
         Hi ${guestName}, ${recipeCount} people have already shared their recipes.
       </p>
       <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #2D2D2D; font-weight: 600; line-height: 1.6; text-align: center;" class="darkmode-text">
         There's still room for yours.
       </p>`
    : `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
         Hi ${guestName}, we know life gets busy. But if you've been meaning to add your recipe to ${coupleDisplayName}'s book, now's a good time.
       </p>
       <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #2D2D2D; font-weight: 600; line-height: 1.6; text-align: center;" class="darkmode-text">
         Five minutes. One recipe. A page in their kitchen.
       </p>`;

  const content = `
                      ${heroSection(coupleDisplayName)}

                      ${coupleImageSection(coupleImageUrl, coupleDisplayName)}

                      <!-- Body Copy -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center">
                            ${bodyContent}
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
                      ${heroSection(coupleDisplayName)}

                      ${coupleImageSection(coupleImageUrl, coupleDisplayName)}

                      <!-- Body Copy -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                              Hi ${guestName}, this is our last reminder about ${coupleDisplayName}'s recipe book.
                            </p>
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #2D2D2D; font-weight: 600; line-height: 1.6; text-align: center;" class="darkmode-text">
                              No hard feelings if not. But the door's still open.
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
