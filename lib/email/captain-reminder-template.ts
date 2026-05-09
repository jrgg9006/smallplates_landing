/**
 * Email HTML template — captain reminder.
 *
 * Sent to the organizer of a group that has no captains yet.
 * Captain = group_members.role === 'member' (organizer is the row with role === 'owner').
 * Up to 3 weekly sends per group.
 * Goal: explain that captains 3x recipes and that adding one takes 30 seconds.
 */

interface CaptainReminderEmailParams {
  organizerName: string;          // First name preferred, falls back to "There"
  coupleName: string;             // HTML-safe, e.g. "Sarah &amp; Mike"
  coupleNamePlain: string;        // Plain text, e.g. "Sarah & Mike"
  joinLink: string;               // Public /groups/[id]/join URL — the organizer shares this
  unsubscribeUrl: string;         // /api/v1/unsubscribe-profile?uid=...
}

export function buildCaptainReminderSubject(coupleNamePlain: string): string {
  return `${coupleNamePlain}'s book needs captains.`;
}

export function buildCaptainReminderHTML({
  organizerName,
  coupleName,
  coupleNamePlain,
  joinLink,
  unsubscribeUrl,
}: CaptainReminderEmailParams): string {
  // Reason: shown in the email body without protocol so it reads cleaner;
  // the href still has the full URL for the click.
  const joinLinkDisplay = joinLink.replace(/^https?:\/\//, '');
  // Reason: industry-standard preheader hack. iOS/Gmail/Outlook fill the
  // notification preview by reading the first visible text. A short preheader
  // gets padded with the email body, which looked duplicate-y. Solution:
  // (1) a longer preheader (~100 chars) that adds info beyond the subject,
  // (2) a long block of zero-width-non-joiner + non-breaking-space pairs to
  // push any leftover body text out of the notification window.
  const preheader = 'Books with captains get 3x more recipes. Add a few people who can share the link with the ones you can\'t easily reach.';
  const preheaderPadding = '&zwnj;&nbsp;'.repeat(100);
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
  <title>${coupleNamePlain}'s book needs captains.</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 24px 20px !important; }
      table[class="wrapper"] { width: 100% !important; }
      h1 { font-size: 22px !important; }
      .stat-num { font-size: 36px !important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #242424 !important; }
      .card-divider { border-top-color: #3a3a3a !important; }
      h1, .darkmode-heading { color: #f0f0f0 !important; }
      p, .darkmode-body { color: #aaaaaa !important; }
      .stat-num { color: #f0f0f0 !important; }
      .footer-text { color: #666666 !important; }
      .logo-img { filter: invert(1) !important; }
      .cta-button { background-color: #f0f0f0 !important; color: #1a1a1a !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">

  <!-- Preview text + padding (industry-standard preheader hack) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
  </div>
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${preheaderPadding}
  </div>

  <div role="article" aria-roledescription="email" lang="en">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 40px 20px 48px;">

          <!-- Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="max-width: 580px;" class="wrapper">
            <tr>
              <td align="center"
                style="background-color: #ffffff; border-radius: 12px; overflow: hidden; padding: 44px 44px 36px;"
                class="container-bg mobile-padding">

                <!-- Logo -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <img
                        src="https://smallplatesandcompany.com/images/SmallPlates_logo_horizontal.png"
                        alt="Small Plates &amp; Co."
                        width="160"
                        height="auto"
                        class="logo-img"
                        style="display: block; max-width: 160px; height: auto;" />
                    </td>
                  </tr>
                </table>

                <!-- Headline -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 28px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400;
                        color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-heading">
                        ${coupleName}'s book needs captains.
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Hero stat — sentence broken around the number for max scannability -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <p style="margin: 0 0 14px 0; font-family: Georgia, serif; font-size: 17px;
                        font-style: italic; font-weight: 400; color: #5A5550; line-height: 1.5;
                        text-align: center;" class="darkmode-body">
                        Books with captains get
                      </p>
                      <p style="margin: 0; font-family: Georgia, serif; font-size: 56px;
                        font-weight: 400; color: #2D2D2D; line-height: 1; text-align: center;"
                        class="darkmode-heading stat-num">
                        3&times;
                      </p>
                      <p style="margin: 14px 0 0 0; font-family: Georgia, serif; font-size: 17px;
                        font-style: italic; font-weight: 400; color: #5A5550; line-height: 1.5;
                        text-align: center;" class="darkmode-body">
                        more recipes.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Body -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="left" style="padding-bottom: 20px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: left;" class="darkmode-body">
                        ${organizerName}, captains will help you share the link with people you can't easily reach.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="padding-bottom: 8px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: left;" class="darkmode-body">
                        The best captains are usually:
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="padding-bottom: 24px; padding-left: 12px;">
                      <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: left;" class="darkmode-body">
                        <span style="color: #2D2D2D;" class="darkmode-heading">&bull;</span>&nbsp;&nbsp;The couple's parents
                      </p>
                      <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: left;" class="darkmode-body">
                        <span style="color: #2D2D2D;" class="darkmode-heading">&bull;</span>&nbsp;&nbsp;A sibling or cousin from each side
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: left;" class="darkmode-body">
                        <span style="color: #2D2D2D;" class="darkmode-heading">&bull;</span>&nbsp;&nbsp;Their closest friends
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="padding-bottom: 32px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: left;" class="darkmode-body">
                        It takes 30 seconds. They sign in and they're in.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA + small link below -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 12px;">
                      <a href="${joinLink}"
                        class="cta-button"
                        style="display: inline-block; background-color: #2D2D2D; color: #ffffff;
                          text-decoration: none; padding: 14px 36px; border-radius: 6px;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                          font-size: 15px; font-weight: 500; letter-spacing: 0.02em;">
                        Invite captains
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <a href="${joinLink}"
                        style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                          font-size: 12px; color: #9A9590; text-decoration: underline;
                          word-break: break-all;">
                        ${joinLinkDisplay}
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Footer -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="border-top: 1px solid #E8E0D5; padding-top: 28px;"
                      class="card-divider">
                      <p style="margin: 0; font-family: Georgia, serif; font-size: 13px; color: #9A9590;
                        line-height: 1.5; text-align: center; font-style: italic;" class="footer-text">
                        &mdash; Small Plates &amp; Co.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

          <!-- Disclaimer outside card -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="max-width: 580px;">
            <tr>
              <td align="center" style="padding: 16px 20px 0;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                  font-size: 11px; color: #B5AFA8; line-height: 1.5; text-align: center;">
                  You're getting this because you're organizing ${coupleNamePlain}'s book. &nbsp;&middot;&nbsp;
                  <a href="${unsubscribeUrl}"
                    style="color: #B5AFA8; text-decoration: underline;">Unsubscribe from book updates</a>
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
}
