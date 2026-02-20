/**
 * Email HTML template for recipe showcase (spread preview).
 * Structure matches invitation-templates.ts: logo inside the white card,
 * centered text, Georgia serif for headers, system sans for body.
 * Uses cid:recipe-spread for the inline image attachment.
 */

interface ShowcaseEmailParams {
  guestName: string;
  coupleName: string;      // HTML-safe, e.g. "Sarah &amp; Mike"
  coupleNamePlain: string;  // Plain text, e.g. "Sarah & Mike"
  recipeName: string;
}

export function buildShowcaseEmailHTML({
  guestName,
  coupleName,
  coupleNamePlain,
  recipeName,
}: ShowcaseEmailParams): string {
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
  <title>You're in the book, ${guestName}.</title>
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    /* Mobile styles */
    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-center { text-align: center !important; }
      table[class="wrapper"] { width: 100% !important; }
      .spread-img { width: 100% !important; height: auto !important; }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #2d2d2d !important; }
      h1, h2, h3, .darkmode-text { color: #ffffff !important; }
      p, .darkmode-subtext { color: #cccccc !important; }
      .footer-text { color: #999999 !important; }
      .book-bg { background-color: #222222 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Here's how your recipe looks in ${coupleNamePlain}'s cookbook.
    &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
  </div>
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
                           alt="Small Plates &amp; Co."
                           width="180"
                           height="auto"
                           style="display: block; margin: 0 auto; max-width: 180px; height: auto; font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #2D2D2D; text-align: center;" />
                    </td>
                  </tr>
                </table>

                <!-- Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-text">
                        You're in the book, ${guestName}.
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Body Text -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Your ${recipeName} is now part of ${coupleName}'s cookbook &mdash; and their kitchen &mdash; forever.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Here's how your page turned out.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Spread Image -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding: 32px 0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="background-color: #F5F1EB; border-radius: 8px; padding: 20px;" class="book-bg">
                            <img src="cid:recipe-spread"
                                 alt="Your recipe — ${recipeName} — in ${coupleNamePlain}'s cookbook"
                                 width="480"
                                 style="display: block; width: 100%; max-width: 480px; height: auto;
                                        border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);"
                                 class="spread-img">
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Recipe credit -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #9A9590; line-height: 1.5; text-align: center; font-style: italic;" class="footer-text">
                        ${recipeName} &mdash; by ${guestName}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Emotional close -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Every time they make this, you're right there with them.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Thanks for being a part of their story.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Footer inside card -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-top: 40px; border-top: 1px solid #E8E0D5;">
                      <p style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 14px; color: #9A9590; line-height: 1.5; text-align: center; font-style: italic;" class="footer-text">
                        &mdash; The Small Plates team
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

          <!-- Opt-in disclaimer outside card -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width: 600px;">
            <tr>
              <td align="center" style="padding: 16px 20px 0 20px;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #B5AFA8; line-height: 1.5; text-align: center;">
                  You received this because you opted in when you submitted your recipe.
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
