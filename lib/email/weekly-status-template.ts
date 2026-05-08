/**
 * Email HTML template — weekly status update.
 *
 * Sent to all captains + the organizer of an active book each week.
 * Executive summary: total recipes, recipes this week, new guests this week,
 * days remaining. Goal: keep momentum, prevent demotivation.
 */

interface WeeklyStatusEmailParams {
  recipientName: string;          // First name preferred, falls back to "There"
  coupleName: string;             // HTML-safe
  coupleNamePlain: string;        // Plain text
  totalRecipes: number;
  recipesThisWeek: number;
  newGuestsThisWeek: number;
  daysLeft: number | null;        // null when book_close_date is unset
  collectionLink: string;         // Public /collect/{token}?group=... URL the recipient shares
  unsubscribeUrl: string;
}

export function buildWeeklyStatusSubject({
  coupleNamePlain,
}: {
  coupleNamePlain: string;
  totalRecipes?: number;
  daysLeft?: number | null;
}): string {
  return `Your weekly update - ${coupleNamePlain}'s book`;
}

export function buildWeeklyStatusHTML({
  recipientName,
  coupleName,
  coupleNamePlain,
  totalRecipes,
  recipesThisWeek,
  newGuestsThisWeek,
  daysLeft,
  collectionLink,
  unsubscribeUrl,
}: WeeklyStatusEmailParams): string {
  // Reason: shown below the CTA without protocol so it reads cleaner; href has the full URL.
  const collectionLinkDisplay = collectionLink.replace(/^https?:\/\//, '');
  const daysLeftLabel = daysLeft === null
    ? '&mdash;'
    : daysLeft.toString();
  const daysLeftCaption = daysLeft === null
    ? 'no close date set'
    : `day${daysLeft === 1 ? '' : 's'} left`;

  // Reason: tone shifts based on momentum so the same email doesn't feel canned every week.
  let bodyLine: string;
  if (totalRecipes === 0) {
    bodyLine = `Still early. The first few recipes always take the longest. Once people see one, the rest start coming.`;
  } else if (recipesThisWeek === 0) {
    bodyLine = `Quiet week. A nudge to one or two people usually shakes a few loose.`;
  } else if (recipesThisWeek >= 5) {
    bodyLine = `Good week. Keep it going.`;
  } else {
    bodyLine = `Steady. ${recipesThisWeek === 1 ? 'One recipe' : `${recipesThisWeek} recipes`} this week.`;
  }

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
  <title>${coupleNamePlain}'s book — weekly update</title>
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
      .stat-num { font-size: 28px !important; }
      .stat-cell { padding: 12px 6px !important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #242424 !important; }
      .card-divider { border-top-color: #3a3a3a !important; }
      .stat-divider { border-color: #3a3a3a !important; }
      h1, .darkmode-heading { color: #f0f0f0 !important; }
      p, .darkmode-body { color: #aaaaaa !important; }
      .stat-num { color: #f0f0f0 !important; }
      .stat-label { color: #666666 !important; }
      .footer-text { color: #666666 !important; }
      .logo-img { filter: invert(1) !important; }
      .cta-button { background-color: #f0f0f0 !important; color: #1a1a1a !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">

  <!-- Preview text -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${totalRecipes} recipes total. ${recipesThisWeek} this week. ${newGuestsThisWeek} new ${newGuestsThisWeek === 1 ? 'person' : 'people'}.
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

                <!-- Eyebrow -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 8px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 11px; color: #9A9590; letter-spacing: 0.18em;
                        text-transform: uppercase; text-align: center;" class="stat-label">
                        Weekly update
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Headline -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400;
                        color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-heading">
                        ${coupleName}'s book
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Stats grid: 3 columns -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="margin-bottom: 28px;">
                  <tr>
                    <td align="center" class="stat-cell"
                      style="padding: 16px 8px; border-right: 1px solid #E8E0D5;" class="stat-divider">
                      <p style="margin: 0; font-family: Georgia, serif; font-size: 32px;
                        font-weight: 400; color: #2D2D2D; line-height: 1;"
                        class="darkmode-heading stat-num">
                        ${totalRecipes}
                      </p>
                      <p style="margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 11px; color: #9A9590; letter-spacing: 0.1em;
                        text-transform: uppercase;" class="stat-label">
                        recipe${totalRecipes === 1 ? '' : 's'}
                      </p>
                    </td>
                    <td align="center" class="stat-cell"
                      style="padding: 16px 8px; border-right: 1px solid #E8E0D5;" class="stat-divider">
                      <p style="margin: 0; font-family: Georgia, serif; font-size: 32px;
                        font-weight: 400; color: #2D2D2D; line-height: 1;"
                        class="darkmode-heading stat-num">
                        +${recipesThisWeek}
                      </p>
                      <p style="margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 11px; color: #9A9590; letter-spacing: 0.1em;
                        text-transform: uppercase;" class="stat-label">
                        this week
                      </p>
                    </td>
                    <td align="center" class="stat-cell" style="padding: 16px 8px;">
                      <p style="margin: 0; font-family: Georgia, serif; font-size: 32px;
                        font-weight: 400; color: #2D2D2D; line-height: 1;"
                        class="darkmode-heading stat-num">
                        ${daysLeftLabel}
                      </p>
                      <p style="margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 11px; color: #9A9590; letter-spacing: 0.1em;
                        text-transform: uppercase;" class="stat-label">
                        ${daysLeftCaption}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- New people sub-stat -->
                ${newGuestsThisWeek > 0 ? `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 14px; color: #9A9590; line-height: 1.5; text-align: center;
                        font-style: italic;" class="darkmode-body">
                        ${newGuestsThisWeek} new ${newGuestsThisWeek === 1 ? 'person' : 'people'} this week.
                      </p>
                    </td>
                  </tr>
                </table>` : ''}

                <!-- Body line -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 28px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: center;" class="darkmode-body">
                        ${recipientName ? `${recipientName}. ` : ''}${bodyLine}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA + small link below -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 12px;">
                      <a href="${collectionLink}"
                        class="cta-button"
                        style="display: inline-block; background-color: #2D2D2D; color: #ffffff;
                          text-decoration: none; padding: 14px 36px; border-radius: 6px;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                          font-size: 15px; font-weight: 500; letter-spacing: 0.02em;">
                        Collect Recipes
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <a href="${collectionLink}"
                        style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                          font-size: 12px; color: #C8C3BC; text-decoration: underline;
                          word-break: break-all;">
                        ${collectionLinkDisplay}
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
                  You're getting this because you're a captain or organizer for ${coupleNamePlain}'s book. &nbsp;&middot;&nbsp;
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
