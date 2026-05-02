/**
 * Email HTML template for the complete digital PDF delivery.
 *
 * Sent ~4 weeks after recipe submission once the couple has received
 * their physical book. Gifts the guest the full PDF as an attachment
 * alongside a referral discount code.
 */

interface PdfDeliveryEmailParams {
  guestName: string;
  coupleName: string;           // HTML-safe, e.g. "Sarah &amp; Mike"
  coupleNamePlain: string;      // Plain text, e.g. "Sarah & Mike"
  totalRecipeCount: number;
  totalContributorCount: number;
  bookCoverCid?: string;        // e.g. "cid:book-cover-0" — pending image generation pipeline; omit to skip the cover block
  guestId: string;
  unsubscribeUrl?: string;
}

export function buildPdfDeliverySubjectLine(coupleNamePlain: string): string {
  return `${coupleNamePlain}'s cookbook is done — your copy is attached.`;
}

export function buildPdfDeliveryEmailHTML({
  guestName,
  coupleName,
  coupleNamePlain,
  totalRecipeCount,
  totalContributorCount,
  bookCoverCid,
  guestId,
  unsubscribeUrl,
}: PdfDeliveryEmailParams): string {
  // Reason: mailto fallback keeps CAN-SPAM compliance before a full unsubscribe endpoint exists
  const unsubHref = unsubscribeUrl
    || `mailto:team@smallplatesandcompany.com?subject=Unsubscribe&body=Guest%20ID%3A%20${encodeURIComponent(guestId)}`;

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
  <title>${coupleNamePlain}'s cookbook is done — your copy is attached.</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 24px 20px !important; }
      table[class="wrapper"] { width: 100% !important; }
      .cover-img { width: 100% !important; height: auto !important; }
      h1 { font-size: 22px !important; }
      .stat-num { font-size: 22px !important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #242424 !important; }
      .card-divider { border-top-color: #3a3a3a !important; }
      h1, .darkmode-heading { color: #f0f0f0 !important; }
      p, .darkmode-body { color: #aaaaaa !important; }
      .stat-num { color: #f0f0f0 !important; }
      .stat-dot { color: #444444 !important; }
      .caption-text { color: #7a7a7a !important; }
      .footer-text { color: #666666 !important; }
      .book-bg { background-color: #1e1e1e !important; }
      .logo-img { filter: invert(1) !important; }
      .referral-bg { background-color: #3a3632 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">

  <!-- Preview text -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    The cookbook is done. Here's your copy, ${guestName}.
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
                        Here's the whole book, ${guestName}.
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Stats -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 28px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 14px; color: #9A9590; line-height: 1.4; text-align: center;" class="darkmode-body">
                        <strong style="font-family: Georgia, serif; font-size: 26px; font-weight: 400;
                          color: #2D2D2D;" class="darkmode-heading stat-num">${totalContributorCount}</strong>
                        &thinsp;people
                        &nbsp;<span class="stat-dot" style="color: #C8C0B6;">&middot;</span>&nbsp;
                        <strong style="font-family: Georgia, serif; font-size: 26px; font-weight: 400;
                          color: #2D2D2D;" class="darkmode-heading stat-num">${totalRecipeCount}</strong>
                        &thinsp;recipes
                        &nbsp;<span class="stat-dot" style="color: #C8C0B6;">&middot;</span>&nbsp;
                        <strong style="font-family: Georgia, serif; font-size: 26px; font-weight: 400;
                          color: #2D2D2D;" class="darkmode-heading stat-num">1</strong>
                        &thinsp;cookbook
                      </p>
                    </td>
                  </tr>
                </table>

                ${bookCoverCid ? `
                <!-- Book cover image — pending: generated by image pipeline when available -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 12px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center"
                            style="background-color: transparent; padding: 8px 20px;">
                            <img
                              src="${bookCoverCid}"
                              alt="${coupleNamePlain}'s cookbook — ${totalRecipeCount} recipes from ${totalContributorCount} contributors"
                              width="260"
                              style="display: block; width: 100%; max-width: 260px; height: auto;
                                border-radius: 3px;
                                box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 12px 40px rgba(0,0,0,0.18);"
                              class="cover-img">
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Cover caption -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <p style="margin: 0; font-family: Georgia, serif; font-size: 13px; color: #9A9590;
                        line-height: 1.5; text-align: center; font-style: italic;" class="caption-text">
                        ${coupleNamePlain}'s Cookbook
                      </p>
                    </td>
                  </tr>
                </table>` : ''}

                <!-- Body -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 8px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #666666; font-weight: 300; line-height: 1.65; text-align: center;" class="darkmode-body">
                        ${coupleName} just got their hardcover.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 28px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #666666; font-weight: 300; line-height: 1.65; text-align: center;" class="darkmode-body">
                        This is your digital version.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Emotional close -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        font-size: 16px; color: #555555; font-weight: 300; line-height: 1.7; text-align: center;" class="darkmode-body">
                        Everyone who showed up for them is in there.
                      </p>
                      <p style="margin: 16px 0 0 0; font-family: Georgia, serif;
                        font-size: 16px; color: #555555; font-weight: 400; font-style: italic;
                        line-height: 1.6; text-align: center;" class="darkmode-body">
                        Thanks for being part of it.
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
                            <p style="margin: 0 0 16px 0; font-family: Georgia, serif;
                              font-size: 14px; color: #9A9590; line-height: 1.4;
                              text-align: center; font-style: italic;">
                              Ready to do this for the next one?
                            </p>
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
                  You received this because you submitted a recipe. Discount code REFERRAL2026 can be applied directly at checkout. No expiration. &nbsp;&middot;&nbsp;
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
