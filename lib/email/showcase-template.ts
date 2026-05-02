/**
 * Email HTML template for recipe showcase (spread preview).
 *
 * Supports multiple recipes per guest — 1 email with all their spreads.
 * Each recipe spread uses a unique CID (cid:recipe-spread-0, cid:recipe-spread-1, etc.)
 */

interface ShowcaseRecipeItem {
  recipeName: string;
  cid: string; // e.g. "cid:recipe-spread-0"
}

interface ShowcaseEmailParams {
  guestName: string;
  coupleName: string;        // HTML-safe, e.g. "Sarah &amp; Mike"
  coupleNamePlain: string;   // Plain text, e.g. "Sarah & Mike"
  recipes: ShowcaseRecipeItem[];
  guestId: string;           // Reason: used as inviter_id in the seed link for GA4 attribution
  unsubscribeUrl?: string;   // One-click unsubscribe URL; falls back to mailto if omitted
}

function buildRecipeSpreadBlock(recipe: ShowcaseRecipeItem, guestName: string, coupleNamePlain: string): string {
  return `
                <!-- Spread image — ${recipe.recipeName} -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center"
                            style="background-color: #EDE8E0; border-radius: 6px; padding: 20px 16px;"
                            class="book-bg">
                            <img
                              src="${recipe.cid}"
                              alt="${recipe.recipeName} — ${guestName}'s page in ${coupleNamePlain}'s cookbook"
                              width="500"
                              style="display: block; width: 100%; max-width: 500px; height: auto;
                                border-radius: 3px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.10), 0 8px 28px rgba(0,0,0,0.14);"
                              class="spread-img">
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Caption -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <p style="margin: 0; font-family: Georgia, serif; font-size: 13px; color: #9A9590;
                        line-height: 1.5; text-align: center; font-style: italic;" class="caption-text">
                        ${recipe.recipeName} &mdash; by ${guestName}
                      </p>
                    </td>
                  </tr>
                </table>`;
}

export function buildShowcaseEmailHTML({
  guestName,
  coupleName,
  coupleNamePlain,
  recipes,
  guestId,
  unsubscribeUrl,
}: ShowcaseEmailParams): string {
  // Reason: mailto fallback lets us stay CAN-SPAM compliant before we build a full
  // one-click endpoint. We include the guest ID in the body so we can process it manually.
  const unsubHref = unsubscribeUrl
    || `mailto:team@smallplatesandcompany.com?subject=Unsubscribe&body=Guest%20ID%3A%20${encodeURIComponent(guestId)}`;

  // Reason: UTMs + inviter_id let us see in GA4 which showcase emails actually drove
  // traffic back to the site, and decode which specific guest clicked when needed.
  const seedLinkBase = 'https://smallplatesandcompany.com/';
  const seedLinkParams = new URLSearchParams({
    utm_source: 'showcase_email',
    utm_medium: 'email',
    utm_campaign: 'showcase_seed',
    utm_content: 'footer_link',
    inviter_id: guestId,
  });
  const seedLinkHref = `${seedLinkBase}?${seedLinkParams.toString()}`;
  const isSingle = recipes.length === 1;
  const recipeListText = isSingle
    ? `Your ${recipes[0].recipeName} is`
    : `Your recipes are`;

  // Reason: singular "Here's your page" vs plural "Here are your pages"
  const pageText = isSingle ? "Here's your page." : "Here are your pages.";

  const spreadBlocks = recipes
    .map(r => buildRecipeSpreadBlock(r, guestName, coupleNamePlain))
    .join('\n');

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
  <title>You're in their cookbook, ${guestName}.</title>
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    /* Mobile */
    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 24px 20px !important; }
      table[class="wrapper"] { width: 100% !important; }
      .spread-img { width: 100% !important; height: auto !important; }
      h1 { font-size: 22px !important; }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #242424 !important; }
      .card-divider { border-top-color: #3a3a3a !important; }
      h1, .darkmode-heading { color: #f0f0f0 !important; }
      p, .darkmode-body { color: #aaaaaa !important; }
      .caption-text { color: #7a7a7a !important; }
      .footer-text { color: #666666 !important; }
      .book-bg { background-color: #1e1e1e !important; }
      .seed-text { color: #666666 !important; }
      .seed-link { color: #888888 !important; border-bottom-color: #3a3a3a !important; }
      /* Invert logo to white in dark mode — works in Apple Mail */
      .logo-img { filter: invert(1) !important; }
      .referral-bg { background-color: #3a3632 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">

  <!-- Preview text -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Here's how your page looks in ${coupleNamePlain}'s cookbook.
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
                    <td align="center" style="padding-bottom: 20px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400;
                        color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-heading">
                        You're in the book, ${guestName}.
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Body -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 6px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #666666; font-weight: 300; line-height: 1.65; text-align: center;" class="darkmode-body">
                        ${recipeListText} in ${coupleName}'s cookbook now.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #666666; font-weight: 300; line-height: 1.65; text-align: center;" class="darkmode-body">
                        In their kitchen. <span style="color: #2D2D2D; font-weight: 500;" class="darkmode-heading">For good.</span>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 28px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #666666; font-weight: 300; line-height: 1.65; text-align: center;" class="darkmode-body">
                        ${pageText}
                      </p>
                    </td>
                  </tr>
                </table>

${spreadBlocks}

                <!-- Emotional close -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 14px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: center;" class="darkmode-body">
                        Every time they make this, you'll be right there with them.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Referral block -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding-bottom: 32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center"
                            style="background-color: #2D2D2D; border-radius: 6px; padding: 24px 40px;"
                            class="referral-bg">

                            <!-- Intro line -->
                            <p style="margin: 0 0 16px 0; font-family: Georgia, serif;
                              font-size: 14px; color: #9A9590; line-height: 1.4;
                              text-align: center; font-style: italic;">
                              Someone you know is getting married.
                            </p>

                            <!-- Label + code -->
                            <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                              font-size: 11px; color: #9A9590; letter-spacing: 0.12em;
                              text-transform: uppercase; text-align: center;">
                              Discount code
                            </p>
                            <p style="margin: 0 0 16px 0; font-family: Georgia, serif;
                              font-size: 22px; color: #F5F1EB; letter-spacing: 0.18em;
                              text-align: center; font-weight: 400;">
                              REFERRAL2026
                            </p>

                            <!-- Subtext -->
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                              font-size: 13px; color: #9A9590; line-height: 1.5; text-align: center;">
                              15% off their next book.
                            </p>

                          </td>
                        </tr>
                      </table>
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
                  You received this because you opted in when you submitted your recipe. Discount code REFERRAL2026 can be applied directly at checkout. No expiration. &nbsp;&middot;&nbsp;
                  <a href="${unsubHref}"
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
