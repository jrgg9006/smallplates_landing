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
  // Reason: when set, replaces the hardcoded body copy with the organizer's
  // edited message. Each newline becomes a paragraph break. Used for both the
  // initial invite and the reminder.
  customBody?: string;
  // Reason: drives occasion-aware copy. Weddings/bridal showers say "wedding
  // cookbook"; non-couple occasions (birthday/other) carry a book title in
  // coupleDisplayName, so they drop the "gift for {person}" framing and possessive.
  occasion?: string | null;
  // Reason: when the heading is a real person (first names captured) we keep the
  // "gift for {name}" framing + possessive even on non-wedding occasions. A book
  // title stays neutral.
  namesArePeople?: boolean;
}

// Reason: couples (wedding/bridal/anniversary, plus legacy groups with no
// occasion) are framed as a gift "for" people; weddings/bridal showers say
// "wedding cookbook". Non-couple occasions hold a book title, not a person.
function occasionCopy(
  occasion: string | null | undefined,
  namesArePeople: boolean,
): { isPerson: boolean; isWedding: boolean; heroLabel: string } {
  const isWedding = !occasion || occasion === 'wedding' || occasion === 'bridal_shower';
  // Reason: the "gift for {name}" framing + possessive subject only make sense
  // when the heading is a real person. Weddings are always people; other
  // occasions depend on whether first names were captured. A book title
  // ("Grandma's recipes") stays neutral — no "for", no possessive.
  const isPerson = isWedding || namesArePeople;
  const heroLabel = isWedding
    ? 'A wedding cookbook gift for'
    : isPerson
      ? 'A cookbook gift for'
      : 'A cookbook gift';
  return { isPerson, isWedding, heroLabel };
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
                      <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #9A9590; line-height: 1.5; text-align: center;" class="footer-text">
                        Something off? Just reply to this email.
                      </p>
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

// Reason: render a user-edited custom body as paragraphs. Each blank line in
// the source becomes a paragraph break. HTML is escaped to prevent injection.
function customBodySection(body: string): string {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => escapeHtml(p).replace(/\n/g, "<br/>"))
    .map((p) => `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">${p}</p>`)
    .join("\n                            ");
  return `
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="max-width: 340px; margin: 0 auto;">
                            ${paragraphs}
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

// Hero section — label + couple/book name + gold line
function heroSection(coupleDisplayName: string, heroLabel: string): string {
  return `
                      <!-- Hero: Couple Names -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9A9590; text-align: center;">
                              ${heroLabel}
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
export function invitationEmail1(params: InvitationTemplateParams): { subject: string; html: string; text: string } {
  const { coupleDisplayName, collectionLink, coupleImageUrl, customBody } = params;
  const { isPerson, heroLabel } = occasionCopy(params.occasion, !!params.namesArePeople);

  // Reason: people's names take a possessive ("Ana & Pedro's cookbook"); a book
  // title ("Grandma's recipes") doesn't, so it stands alone.
  const subject = isPerson
    ? `Your recipe goes in ${coupleDisplayName}'s cookbook`
    : `Your recipe goes in ${coupleDisplayName}`;

  // Reason: when the organizer edited a custom body, use it; otherwise fall back
  // to the brand-default copy.
  const bodySection = customBody?.trim()
    ? customBodySection(customBody)
    : `
                      <!-- Body Copy (default) -->
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
                      </table>`;

  const content = `
                      ${heroSection(coupleDisplayName, heroLabel)}

                      ${coupleImageSection(coupleImageUrl, coupleDisplayName)}

                      ${bodySection}

                      ${ctaButton(collectionLink)}`;

  const defaultText = `We're making them a cookbook. A real one. With recipes from the people who matter most to them.

Send a recipe and you're in their kitchen.

Doesn't have to be fancy. Just has to be yours.`;

  const text = `${isPerson ? `${heroLabel} ${coupleDisplayName}` : coupleDisplayName}

${customBody?.trim() || defaultText}

Add your recipe: ${collectionLink}

5 minutes. That's it.\n\nSomething off? Just reply to this email.${params.captainName ? `\n\nThis invitation was sent by ${params.captainName} via Small Plates & Co.` : ''}`;

  return { subject, html: baseTemplate(content, subject, params.captainName), text };
}

// ============================================
// EMAIL 2: Reminder — plain text-style, intentionally different from
// the visual invitation. Inline HTML (not baseTemplate) because the layout
// is left-aligned with a top logo, which doesn't fit the email-1 frame.
// ============================================
export function invitationEmail2(params: InvitationTemplateParams): { subject: string; html: string; text: string } {
  const { coupleDisplayName, guestName, collectionLink, customBody } = params;
  const { isPerson } = occasionCopy(params.occasion, !!params.namesArePeople);

  const subject = isPerson
    ? `Reminder: your recipe for ${coupleDisplayName}'s cookbook`
    : `Reminder: your recipe for ${coupleDisplayName}`;

  // Reason: keep in sync with SendRemindersModal.DEFAULT_REMINDER_BODY so
  // that "user kept the default → we save NULL → template uses this fallback"
  // produces the same text the organizer saw in the modal.
  const defaultBody = `Thanks to everyone who has already sent a recipe. The book is starting to come together.

If you haven't yet, the page is still open and we'd love yours. It only takes 5 minutes. Doesn't have to be fancy. Just something you actually make.`;

  const bodyText = customBody?.trim() || defaultBody;

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Reason: reminder paragraphs are left-aligned at 16px on a card layout —
  // distinct from customBodySection which centers at 15px for email 1.
  const bodyParagraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => escapeHtml(p).replace(/\n/g, "<br/>"))
    .map((p) => `<p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #555555; line-height: 1.7;" class="darkmode-subtext">${p}</p>`)
    .join("\n                  ");

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject} - Small Plates &amp; Co.</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 36px 24px !important; }
    }
    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #2d2d2d !important; }
      .darkmode-text { color: #ffffff !important; }
      .darkmode-subtext { color: #cccccc !important; }
    }
    .button-a { transition: all 100ms ease-in; }
    .button-a:hover { background: #C19940 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    A quick reminder — your recipe for ${coupleDisplayName}'s cookbook is still pending.
  </div>
  <div role="article" aria-roledescription="email" lang="en">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width: 560px; border-collapse: collapse;">
            <tr>
              <td style="background-color: #ffffff; border-radius: 12px; padding: 56px 44px;" class="container-bg mobile-padding">

                <!-- Logo -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="left" style="padding-bottom: 36px;">
                      <img src="https://smallplatesandcompany.com/images/SmallPlates_logo_horizontal1.png"
                           alt="Small Plates &amp; Co."
                           width="140"
                           height="auto"
                           style="display: block; max-width: 140px; height: auto;" />
                    </td>
                  </tr>
                </table>

                <!-- Greeting -->
                <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.7;" class="darkmode-text">
                  Hi ${escapeHtml(guestName)},
                </p>

                <!-- Body (custom or default) -->
                ${bodyParagraphs}

                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 12px 0 14px;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${collectionLink}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="60%" stroke="f" fillcolor="#D4A854">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:500;">Add Your Recipe</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${collectionLink}" class="button-a"
                         style="display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 500; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 999px; background-color: #D4A854;">
                        Add Your Recipe
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 36px;">
                      <p style="margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #9A9590; line-height: 1.5;">
                        Or copy this link:<br>
                        <a href="${collectionLink}" style="color: #9A9590; text-decoration: underline; word-break: break-all;">${collectionLink}</a>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Signature -->
                <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #555555; line-height: 1.7;" class="darkmode-subtext">
                  Thanks,
                </p>
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.7;" class="darkmode-text">
                  ${coupleDisplayName}
                </p>

                <!-- Disclaimer divider -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 40px;">
                  <tr>
                    <td style="border-top: 1px solid #F0EDE8; padding-top: 24px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #9A9590; line-height: 1.6;">
                        Something off? Just reply to this email.${params.captainName ? ` This reminder was sent by ${escapeHtml(params.captainName)} via Small Plates &amp; Co.` : ''}
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

          <!-- Outside-card credit -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width: 560px;">
            <tr>
              <td align="center" style="padding: 16px 20px 0;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #B5AFA8; line-height: 1.5; text-align: center;">
                  Sent via Small Plates &amp; Co. &nbsp;&middot;&nbsp;
                  <a href="mailto:team@smallplatesandcompany.com" style="color: #B5AFA8; text-decoration: underline;">Contact us</a>
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

  const text = `Hi ${guestName},

${bodyText}

Add your recipe: ${collectionLink}

Thanks,
${coupleDisplayName}

—
Something off? Just reply to this email.${params.captainName ? ` This reminder was sent by ${params.captainName} via Small Plates & Co.` : ''}`;

  return { subject, html, text };
}

// ============================================
// EMAIL 3: Second Reminder with Social Proof
// ============================================
// Templates 3 and 4 removed — single reminder (email2) is enough for MVP.
// ============================================

// Helper to get template by number — only 1 (invite) and 2 (reminder) supported.
export function getInvitationTemplate(
  emailNumber: 1 | 2,
  params: InvitationTemplateParams
): { subject: string; html: string; text: string } {
  switch (emailNumber) {
    case 1:
      return invitationEmail1(params);
    case 2:
      return invitationEmail2(params);
    default:
      throw new Error(`Invalid email number: ${emailNumber}`);
  }
}
