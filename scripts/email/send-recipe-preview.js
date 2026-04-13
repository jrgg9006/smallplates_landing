/**
 * Small Plates — Recipe Preview Email Sender (Postmark)
 * 
 * Usage:
 *   1. npm install postmark
 *   2. Fill in CONFIG below
 *   3. node send-recipe-preview-postmark.js
 */

const postmark = require("postmark");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// ============================================
// CONFIG — Fill these in for each send
// ============================================

const CONFIG = {
  // Postmark
  postmarkServerToken: process.env.POSTMARK_SERVER_TOKEN, // From Postmark dashboard → Server → API Tokens

  // Sender (must be a verified Sender Signature in Postmark)
  fromEmail: "team@smallplatesandcompany.com",
  fromName: "Small Plates & Co.",

  // Recipient
  recipientEmail: "ricardo@example.com",
  
  // Email variables
  guestName: "Male",
  coupleName: "Sarah &amp; Mike",
  coupleNamePlain: "Sarah & Mike",
  recipeName: "Dip de Queso Feta",

  // Spread image — path to the screenshot file
  spreadImagePath: "/Users/ricardo/Desktop/spread-male.png",
};

// ============================================
// TEMPLATE
// ============================================

function buildEmailHTML(config) {
  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>You're in the book</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0; padding: 0; width: 100% !important; background-color: #FAF7F2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      .darkmode-bg { background-color: #1a1a1a !important; }
      .darkmode-container { background-color: #2d2d2d !important; }
      .darkmode-text { color: #f0ece6 !important; }
      .darkmode-subtext { color: #b0aaa0 !important; }
      .darkmode-divider { border-color: #444444 !important; }
      .darkmode-cta-bg { background-color: #D4A854 !important; }
      .darkmode-cta-text { color: #1a1a1a !important; }
      .darkmode-footer { color: #777777 !important; }
      .darkmode-book-bg { background-color: #222222 !important; }
    }
    @media only screen and (max-width: 620px) {
      .wrapper { width: 100% !important; }
      .mobile-padding { padding: 32px 24px !important; }
      .spread-img { width: 100% !important; height: auto !important; }
      .cta-button { padding: 14px 28px !important; }
    }
    .cta-td:hover { background-color: #C19940 !important; }
    .cta-link:hover { background-color: #C19940 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2;" class="darkmode-bg">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Here's how your recipe looks in ${config.coupleNamePlain}'s cookbook.
    &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAF7F2;" class="darkmode-bg">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;" class="wrapper">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://smallplatesandcompany.com/images/SmallPlates_logo_horizontal.png" 
                   alt="Small Plates &amp; Co." 
                   width="180" 
                   height="auto"
                   style="display: block; margin: 0 auto; max-width: 180px; height: auto; 
                          font-family: Georgia, serif; font-size: 22px; font-weight: 600; 
                          color: #2D2D2D; text-align: center;" />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden;" class="darkmode-container">
                
                <!-- Greeting -->
                <tr>
                  <td style="padding: 40px 40px 0 40px;" class="mobile-padding">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #2D2D2D; margin: 0 0 20px 0;" class="darkmode-text">
                      Hi ${config.guestName},
                    </p>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #2D2D2D; margin: 0 0 8px 0;" class="darkmode-text">
                      ${config.coupleName}'s cookbook is coming together.
                    </p>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #2D2D2D; margin: 0 0 28px 0;" class="darkmode-text">
                      Your recipe made it in. Here's your page.
                    </p>
                  </td>
                </tr>
                
                <!-- Spread Image -->
                <tr>
                  <td style="padding: 0 28px;" class="mobile-padding">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="background-color: #F5F1EB; border-radius: 6px; padding: 20px;" class="darkmode-book-bg">
                          <img src="cid:recipe-spread" 
                               alt="Your recipe — ${config.recipeName} — in ${config.coupleNamePlain}'s cookbook" 
                               width="520" 
                               style="display: block; width: 100%; max-width: 520px; height: auto; 
                                      border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);"
                               class="spread-img">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Recipe credit -->
                <tr>
                  <td align="center" style="padding: 16px 40px 0 40px;" class="mobile-padding">
                    <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 14px; font-style: italic; color: #9A9590; margin: 0; letter-spacing: 0.3px;" class="darkmode-subtext">
                      ${config.recipeName} &mdash; by ${config.guestName}
                    </p>
                  </td>
                </tr>

                <!-- Emotional close -->
                <tr>
                  <td style="padding: 28px 40px 0 40px;" class="mobile-padding">
                    <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 18px; line-height: 1.65; color: #2D2D2D; margin: 0 0 8px 0;" class="darkmode-text">
                      Every time they make this, you're right there with them.
                    </p>
                    <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 18px; line-height: 1.65; color: #2D2D2D; margin: 0;" class="darkmode-text">
                      Still at the table.
                    </p>
                  </td>
                </tr>

                <!-- Signature -->
                <tr>
                  <td style="padding: 28px 40px 36px 40px;" class="mobile-padding">
                    <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 16px; font-style: italic; color: #9A9590; margin: 0;" class="darkmode-subtext">
                      &mdash; The Small Plates team
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;" class="mobile-padding">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="border-top: 1px solid #E8E0D5;" class="darkmode-divider">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 28px 40px 12px 40px;" class="mobile-padding">
                    <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.5; color: #2D2D2D; margin: 0; text-align: center;" class="darkmode-text">
                      Want one of these for your own wedding?<br>
                      Or someone you love?
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 0 40px 36px 40px;" class="mobile-padding">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #2D2D2D; border-radius: 50px;" class="cta-td darkmode-cta-bg">
                          <a href="https://www.smallplatesandcompany.com" target="_blank" style="display: inline-block; background-color: #2D2D2D; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 500; text-decoration: none; padding: 14px 32px; border-radius: 50px; letter-spacing: 0.3px;" class="cta-link cta-button darkmode-cta-text">
                            Give this gift
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 0 20px;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #9A9590; margin: 0; line-height: 1.6;" class="darkmode-footer">
                Small Plates &amp; Co.<br>
                Recipes from the people who love you.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 12px 20px 0 20px;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #B5AFA8; margin: 0; line-height: 1.5;" class="darkmode-footer">
                You received this because you opted in when you submitted your recipe.<br>
                <a href="https://www.smallplatesandcompany.com" style="color: #9A9590; text-decoration: underline;">smallplatesandcompany.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// SEND
// ============================================

async function sendRecipePreview() {
  const { postmarkServerToken, fromEmail, fromName, recipientEmail, guestName, coupleNamePlain, recipeName, spreadImagePath } = CONFIG;

  // Validate image exists
  if (!fs.existsSync(spreadImagePath)) {
    console.error(`\n❌ Image not found: ${spreadImagePath}`);
    console.error(`   Make sure the path to your spread screenshot is correct.\n`);
    process.exit(1);
  }

  // Read and encode image
  const imageBuffer = fs.readFileSync(spreadImagePath);
  const imageBase64 = imageBuffer.toString("base64");
  const ext = path.extname(spreadImagePath).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";

  const client = new postmark.ServerClient(postmarkServerToken);

  try {
    console.log(`\n📧 Sending recipe preview via Postmark...`);
    console.log(`   To: ${recipientEmail}`);
    console.log(`   Guest: ${guestName}`);
    console.log(`   Couple: ${coupleNamePlain}`);
    console.log(`   Recipe: ${recipeName}`);
    console.log(`   Image: ${spreadImagePath}\n`);

    const result = await client.sendEmail({
      From: `${fromName} <${fromEmail}>`,
      To: recipientEmail,
      Subject: "You're in the book.",
      HtmlBody: buildEmailHTML(CONFIG),
      MessageStream: "outbound",
      Attachments: [
        {
          Name: "recipe-spread.png",
          Content: imageBase64,
          ContentType: contentType,
          ContentID: "cid:recipe-spread",
        },
      ],
    });

    console.log(`✅ Sent. Postmark ID: ${result.MessageID}\n`);
  } catch (error) {
    console.error(`\n❌ Failed: ${error.message}`);
    if (error.code === 10) {
      console.error(`   "${fromEmail}" is not a verified Sender in Postmark.`);
      console.error(`   Go to: account.postmarkapp.com → Sender Signatures\n`);
    }
    process.exit(1);
  }
}

sendRecipePreview();