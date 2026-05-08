/**
 * Email HTML template — pre-closing nudge.
 *
 * Sent to all guests of a group with email when the book is ~7 days from
 * `book_close_date`. Goal: invite a second (or third) recipe before print.
 */

interface ClosingNudgeEmailParams {
  guestName: string;              // First name preferred
  coupleName: string;             // HTML-safe
  coupleNamePlain: string;        // Plain text
  closeDateLabel: string;         // e.g. "Friday", "May 14"
  closeDateLong: string;          // e.g. "Friday, May 14" — for body line
  collectionUrl: string;          // public link back to recipe collection journey
  unsubscribeUrl: string;         // /api/v1/unsubscribe?gid=...
}

export function buildClosingNudgeSubject({
  coupleNamePlain,
  closeDateLabel,
}: {
  coupleNamePlain: string;
  closeDateLabel: string;
}): string {
  return `${coupleNamePlain}'s book closes ${closeDateLabel}.`;
}

export function buildClosingNudgeHTML({
  guestName,
  coupleName,
  coupleNamePlain,
  closeDateLabel,
  closeDateLong,
  collectionUrl,
  unsubscribeUrl,
}: ClosingNudgeEmailParams): string {
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
  <title>${coupleNamePlain}'s book closes ${closeDateLabel}.</title>
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
    }

    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #242424 !important; }
      .card-divider { border-top-color: #3a3a3a !important; }
      h1, .darkmode-heading { color: #f0f0f0 !important; }
      p, .darkmode-body { color: #aaaaaa !important; }
      .footer-text { color: #666666 !important; }
      .logo-img { filter: invert(1) !important; }
      .cta-button { background-color: #f0f0f0 !important; color: #1a1a1a !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">

  <!-- Preview text -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Last window before the book goes to print.
    &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
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
                        ${coupleName}'s book closes ${closeDateLabel}.
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Body -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="left" style="padding-bottom: 16px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: left;" class="darkmode-body">
                        ${guestName}, if you wanted to add another recipe to ${coupleNamePlain}'s book, this is the window. After ${closeDateLong}, the book goes to print.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="padding-bottom: 32px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: left;" class="darkmode-body">
                        It can be anything. The thing you make on Sundays. The one your mom always asks for. Something simple is fine.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <a href="${collectionUrl}"
                        class="cta-button"
                        style="display: inline-block; background-color: #2D2D2D; color: #ffffff;
                          text-decoration: none; padding: 14px 36px; border-radius: 6px;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                          font-size: 15px; font-weight: 500; letter-spacing: 0.02em;">
                        Add a recipe
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
                  You're getting this because you submitted a recipe for ${coupleNamePlain}'s book. &nbsp;&middot;&nbsp;
                  <a href="${unsubscribeUrl}"
                    style="color: #B5AFA8; text-decoration: underline;">Unsubscribe</a>
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
