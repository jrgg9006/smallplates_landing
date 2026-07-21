/**
 * Email HTML template — "plain letter".
 *
 * The counterpart to the marketing-card templates (captain-reminder, weekly-status,
 * closing-nudge). Those look designed; this one looks written. Logo small and
 * top-left, body copy left-aligned in a plain sans-serif, one optional button whose
 * destination is whatever the caller passes (profile, landing, captains, collection
 * link, anything). No hero stats, no centered serif headlines, no card.
 *
 * Reusable by design: broadcast sends and one-off notes both call this same builder.
 * Callers pass copy that is already HTML-safe (mirrors the other templates, which
 * interpolate names the same way).
 */

export interface PlainLetterButton {
  label: string; // HTML-safe, e.g. "Open your book"
  url: string;   // full https URL
}

export interface PlainLetterImage {
  url: string;  // absolute https URL — emails can't reach relative paths
  alt: string;  // HTML-safe
  href?: string; // makes the image clickable
}

export interface PlainLetterParams {
  /** Each string becomes its own <p>. Already HTML-safe. Blank lines are ignored. */
  bodyParagraphs: string[];
  /** Optional inline image (e.g. a screenshot). Renders after the body, before the button. */
  image?: PlainLetterImage;
  /** Paragraphs after the button, before the signature. Already HTML-safe. */
  closingParagraphs?: string[];
  /** Optional single call-to-action. Omit for a text-only note. */
  button?: PlainLetterButton;
  /** Notification-preview text. Falls back to the first paragraph. */
  preheader?: string;
  /** Signer name. Defaults to Ana. */
  signatureName?: string;
  /** Line under the signer. Defaults to her role. */
  signatureRole?: string;
  /** When set, renders an unsubscribe line in the footer. */
  unsubscribeUrl?: string;
  /** Footer line explaining why they got this. Optional. */
  footerReason?: string;
}

const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

export function buildPlainLetterHTML({
  bodyParagraphs,
  image,
  closingParagraphs = [],
  button,
  preheader,
  signatureName = 'Ana',
  signatureRole = 'Cofounder, Small Plates & Co.',
  unsubscribeUrl,
  footerReason,
}: PlainLetterParams): string {
  const paragraphs = bodyParagraphs
    .map(p => p.trim())
    .filter(Boolean);
  const closing = closingParagraphs.map(p => p.trim()).filter(Boolean);

  // Reason: same preheader hack as the marketing templates. A short preview gets
  // padded with body text, which reads duplicate-y. Pad with zero-width chars.
  const previewText = (preheader || paragraphs[0] || '').slice(0, 140);
  const preheaderPadding = '&zwnj;&nbsp;'.repeat(100);

  const paragraphsHtml = paragraphs
    .map(
      p => `                <p style="margin: 0 0 18px 0; font-family: ${FONT_SANS};
                  font-size: 16px; color: #2D2D2D; font-weight: 400; line-height: 1.65;
                  text-align: left;" class="darkmode-body">${p}</p>`
    )
    .join('\n');

  const imageHtml = image
    ? `                <!-- Inline image -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="left" style="padding: 6px 0 26px;">
                      ${image.href ? `<a href="${image.href}" style="text-decoration: none;">` : ''}<img
                        src="${image.url}"
                        alt="${image.alt}"
                        width="520"
                        style="display: block; width: 100%; max-width: 520px; height: auto;
                          border: 1px solid #EDE7DD; border-radius: 10px;" />${image.href ? '</a>' : ''}
                    </td>
                  </tr>
                </table>`
    : '';

  const closingParagraphsHtml = closing
    .map(
      p => `                <p style="margin: 0 0 18px 0; font-family: ${FONT_SANS};
                  font-size: 16px; color: #2D2D2D; font-weight: 400; line-height: 1.65;
                  text-align: left;" class="darkmode-body">${p}</p>`
    )
    .join('\n');

  const buttonHtml = button
    ? `                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="padding: 8px 0 28px;">
                      <a href="${button.url}"
                        class="cta-button"
                        style="display: inline-block; background-color: #2D2D2D; color: #ffffff;
                          text-decoration: none; padding: 13px 30px; border-radius: 6px;
                          font-family: ${FONT_SANS}; font-size: 15px; font-weight: 500;
                          letter-spacing: 0.01em;">${button.label}</a>
                    </td>
                  </tr>
                </table>`
    : '';

  const footerReasonHtml = footerReason
    ? `${footerReason}${unsubscribeUrl ? ' &nbsp;&middot;&nbsp; ' : ''}`
    : '';
  const unsubscribeHtml = unsubscribeUrl
    ? `<a href="${unsubscribeUrl}" style="color: #B5AFA8; text-decoration: underline;">Unsubscribe from book updates</a>`
    : '';
  const footerHtml =
    footerReasonHtml || unsubscribeHtml
      ? `          <!-- Footer -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 520px;">
            <tr>
              <td align="left" style="padding: 24px 0 0;">
                <p style="margin: 0; font-family: ${FONT_SANS}; font-size: 11px;
                  color: #B5AFA8; line-height: 1.5; text-align: left;">
                  ${footerReasonHtml}${unsubscribeHtml}
                </p>
              </td>
            </tr>
          </table>`
      : '';

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
  <title>Small Plates &amp; Co.</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 28px 22px !important; }
      table[class="wrapper"] { width: 100% !important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .darkmode-body, p { color: #cfcfcf !important; }
      .footer-text { color: #666666 !important; }
      .logo-img { filter: invert(1) !important; }
      .cta-button { background-color: #f0f0f0 !important; color: #1a1a1a !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #ffffff;" class="darkmode-bg">

  <!-- Preview text + padding -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${previewText}</div>
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheaderPadding}</div>

  <div role="article" aria-roledescription="email" lang="en">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 32px 24px 40px;" class="mobile-padding">

          <!-- Logo, top-left -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 520px;" class="wrapper">
            <tr>
              <td align="left" style="padding-bottom: 26px;">
                <img
                  src="https://smallplatesandcompany.com/images/SmallPlates_logo_horizontal.png"
                  alt="Small Plates &amp; Co."
                  width="150"
                  height="auto"
                  class="logo-img"
                  style="display: block; max-width: 150px; height: auto;" />
              </td>
            </tr>
          </table>

          <!-- Body -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 520px;" class="wrapper">
            <tr>
              <td align="left">
${paragraphsHtml}
${imageHtml}
${buttonHtml}
${closingParagraphsHtml}
                <!-- Signature -->
                <p style="margin: 4px 0 0 0; font-family: ${FONT_SANS}; font-size: 16px;
                  color: #2D2D2D; font-weight: 400; line-height: 1.65; text-align: left;" class="darkmode-body">
                  ${signatureName}
                </p>
                <p style="margin: 2px 0 0 0; font-family: ${FONT_SANS}; font-size: 13px;
                  color: #9A9590; font-weight: 400; line-height: 1.5; text-align: left;" class="footer-text">
                  ${signatureRole}
                </p>
              </td>
            </tr>
          </table>

${footerHtml}

        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
