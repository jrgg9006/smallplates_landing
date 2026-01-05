# Prompt 2B-2: Email Templates para Invitaciones

## Contexto

Small Plates es una plataforma donde invitados de boda suben recetas para crear un libro colaborativo. Estamos implementando un sistema de emails automatizados para invitar guests a subir sus recetas.

**Objetivo:** Crear 4 templates de email HTML y la función para enviarlos via Postmark.

---

## Archivos a crear

| Archivo | Descripción |
|---------|-------------|
| `lib/email/invitation-templates.ts` | Los 4 templates HTML como funciones |
| `lib/email/send-invitation-email.ts` | Función para enviar emails de invitación |

---

## 1. CREAR: lib/email/invitation-templates.ts

Este archivo contiene los 4 templates como funciones que retornan HTML.

```typescript
/**
 * Email invitation templates for guest recipe collection
 * 
 * Variables available:
 * - coupleName: "Ana & Pedro"
 * - guestName: "María"
 * - collectionLink: "https://smallplatesandcompany.com/collect/abc123"
 * - coupleImageUrl: URL to couple's photo (optional)
 */

interface InvitationTemplateParams {
  coupleName: string;
  guestName: string;
  collectionLink: string;
  coupleImageUrl?: string;
}

// Base template wrapper with all styles
function baseTemplate(content: string, subject: string): string {
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
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }

    /* Remove default styling */
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    /* Mobile styles */
    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-center { text-align: center !important; }
      table[class="wrapper"] { width: 100% !important; }
      .couple-image { width: 80px !important; height: 80px !important; }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body, .darkmode-bg { background-color: #1a1a1a !important; }
      .container-bg { background-color: #2d2d2d !important; }
      h1, h2, h3, .darkmode-text { color: #ffffff !important; }
      p, .darkmode-subtext { color: #cccccc !important; }
      .footer-text { color: #999999 !important; }
    }

    /* Button hover effect */
    .button-td, .button-a { transition: all 100ms ease-in; }
    .button-td:hover, .button-a:hover { background: #C19940 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #FAF7F2;" class="darkmode-bg">
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
                           alt="Small Plates & Co." 
                           width="180" 
                           height="auto" 
                           style="display: block; margin: 0 auto; max-width: 180px; height: auto; font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #2D2D2D; text-align: center;" />
                    </td>
                  </tr>
                </table>

                ${content}

                <!-- Footer -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-top: 30px; border-top: 1px solid #E8E0D5;">
                      <p style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 14px; color: #9A9590; line-height: 1.5; text-align: center; font-style: italic;" class="footer-text">
                        Recipes from the people who love you.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #9A9590; line-height: 1.5; text-align: center;" class="footer-text">
                        Small Plates & Co.
                      </p>
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

// Couple image section (if image URL provided)
function coupleImageSection(coupleImageUrl: string | undefined, coupleName: string): string {
  if (!coupleImageUrl) return '';
  
  return `
                <!-- Couple Image -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <img src="${coupleImageUrl}" 
                           alt="${coupleName}" 
                           width="100" 
                           height="100" 
                           class="couple-image"
                           style="display: block; width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #E8E0D5;" />
                    </td>
                  </tr>
                </table>`;
}

// CTA Button
function ctaButton(link: string, text: string = "Add Your Recipe"): string {
  return `
                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td align="center" style="padding: 32px 0;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="58%" stroke="f" fillcolor="#2D2D2D">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:500;">${text}</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${link}" 
                         style="display: inline-block; 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
                                font-size: 16px; 
                                font-weight: 500; 
                                color: #ffffff; 
                                text-decoration: none; 
                                padding: 16px 32px; 
                                border-radius: 30px; 
                                background-color: #2D2D2D;
                                transition: background-color 0.2s ease;">
                        ${text}
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>`;
}

// ============================================
// EMAIL 1: Initial Invitation
// ============================================
export function invitationEmail1(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleName, guestName, collectionLink, coupleImageUrl } = params;
  
  const subject = `You're invited to ${coupleName}'s recipe book`;
  
  const content = `
                ${coupleImageSection(coupleImageUrl, coupleName)}

                <!-- Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-text">
                        ${coupleName} want your recipe
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Hi ${guestName},
                      </p>
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        ${coupleName} are creating a cookbook filled with recipes from the people who matter most to them—and they want yours.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        It doesn't have to be fancy. Your go-to pasta. The thing you make when you're tired. That dish everyone asks about. Whatever feels like you.
                      </p>
                    </td>
                  </tr>
                </table>

                ${ctaButton(collectionLink)}

                <!-- Subtext -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #9A9590; line-height: 1.5; text-align: center;">
                        Takes about 5 minutes.
                      </p>
                    </td>
                  </tr>
                </table>`;

  return { subject, html: baseTemplate(content, subject) };
}

// ============================================
// EMAIL 2: First Reminder
// ============================================
export function invitationEmail2(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleName, guestName, collectionLink, coupleImageUrl } = params;
  
  const subject = `${coupleName}'s cookbook is coming together`;
  
  const content = `
                ${coupleImageSection(coupleImageUrl, coupleName)}

                <!-- Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-text">
                        The book is filling up
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Hi ${guestName},
                      </p>
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Just a gentle nudge—${coupleName}'s recipe book is starting to take shape, and there's a spot waiting for you.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        No pressure to be perfect. The best recipes are the real ones.
                      </p>
                    </td>
                  </tr>
                </table>

                ${ctaButton(collectionLink)}

                <!-- Subtext -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #9A9590; line-height: 1.5; text-align: center;">
                        Your recipe. Their kitchen. Forever.
                      </p>
                    </td>
                  </tr>
                </table>`;

  return { subject, html: baseTemplate(content, subject) };
}

// ============================================
// EMAIL 3: Second Reminder
// ============================================
export function invitationEmail3(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleName, guestName, collectionLink, coupleImageUrl } = params;
  
  const subject = `Still time to add your recipe`;
  
  const content = `
                ${coupleImageSection(coupleImageUrl, coupleName)}

                <!-- Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-text">
                        There's still time
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Hi ${guestName},
                      </p>
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        We know life gets busy. But if you've been meaning to add your recipe to ${coupleName}'s book, now's a good time.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Five minutes. One recipe. A page in their kitchen forever.
                      </p>
                    </td>
                  </tr>
                </table>

                ${ctaButton(collectionLink)}`;

  return { subject, html: baseTemplate(content, subject) };
}

// ============================================
// EMAIL 4: Last Reminder
// ============================================
export function invitationEmail4(params: InvitationTemplateParams): { subject: string; html: string } {
  const { coupleName, guestName, collectionLink, coupleImageUrl } = params;
  
  const subject = `Last call for ${coupleName}'s book`;
  
  const content = `
                ${coupleImageSection(coupleImageUrl, coupleName)}

                <!-- Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #2D2D2D; line-height: 1.3; text-align: center;" class="darkmode-text">
                        One last nudge
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        Hi ${guestName},
                      </p>
                      <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        This is our last reminder about ${coupleName}'s recipe book. If you'd like to be part of it, we'd love to have you.
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #2D2D2D; line-height: 1.6; text-align: center;" class="darkmode-subtext">
                        No hard feelings if not—but the door's still open.
                      </p>
                    </td>
                  </tr>
                </table>

                ${ctaButton(collectionLink)}`;

  return { subject, html: baseTemplate(content, subject) };
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
```

---

## 2. CREAR: lib/email/send-invitation-email.ts

Esta función envía los emails de invitación usando Postmark.

```typescript
import { ServerClient } from 'postmark';
import { getInvitationTemplate } from './invitation-templates';

// Initialize Postmark client
const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

export interface SendGuestInvitationParams {
  to: string;
  guestName: string;
  coupleName: string;
  collectionLink: string;
  coupleImageUrl?: string;
  emailNumber: 1 | 2 | 3 | 4;
}

export async function sendGuestInvitationEmail({
  to,
  guestName,
  coupleName,
  collectionLink,
  coupleImageUrl,
  emailNumber,
}: SendGuestInvitationParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get the template
    const { subject, html } = getInvitationTemplate(emailNumber, {
      coupleName,
      guestName,
      collectionLink,
      coupleImageUrl,
    });

    // Send email via Postmark
    const result = await postmarkClient.sendEmail({
      From: `${coupleName} <recipes@smallplatesandcompany.com>`,
      To: to,
      Subject: subject,
      HtmlBody: html,
      ReplyTo: 'team@smallplatesandcompany.com',
      MessageStream: 'outbound', // or your transactional stream name
    });

    console.log(`Invitation email ${emailNumber} sent to ${to}, MessageID: ${result.MessageID}`);
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error(`Error sending invitation email ${emailNumber} to ${to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

---

## Colores de marca usados

| Color | Hex | Uso |
|-------|-----|-----|
| Background | #FAF7F2 | Email body background (Warm White) |
| Container | #FFFFFF | Email card background |
| Primary text | #2D2D2D | Headlines, body text (Charcoal) |
| Secondary text | #9A9590 | Subtext, footer (Warm Gray) |
| Border | #E8E0D5 | Dividers, image border (Sand) |
| Button | #2D2D2D | CTA button background (Charcoal) |
| Button hover | #C19940 | CTA hover state |

---

## Variables de personalización

| Variable | Fuente en DB |
|----------|--------------|
| `coupleName` | `groups.couple_first_name` + `groups.partner_first_name` |
| `guestName` | `guests.first_name` |
| `collectionLink` | `https://smallplatesandcompany.com/collect/` + `profiles.collection_link_token` |
| `coupleImageUrl` | `groups.couple_image_url` |

---

## Preview de los emails

### Email 1: Initial Invitation
- **Subject:** You're invited to Ana & Pedro's recipe book
- **Headline:** Ana & Pedro want your recipe
- **Tone:** Warm, inviting, low pressure

### Email 2: First Reminder (Day 3)
- **Subject:** Ana & Pedro's cookbook is coming together
- **Headline:** The book is filling up
- **Tone:** Gentle nudge, social proof

### Email 3: Second Reminder (Day 6)
- **Subject:** Still time to add your recipe
- **Headline:** There's still time
- **Tone:** Understanding, easy ask

### Email 4: Last Reminder (Day 9)
- **Subject:** Last call for Ana & Pedro's book
- **Headline:** One last nudge
- **Tone:** Final, but not pushy

---

## Verificación post-implementación

1. [ ] Los 4 templates se generan correctamente
2. [ ] La imagen de los novios aparece (circular, con borde)
3. [ ] Los nombres se personalizan correctamente
4. [ ] El link de collection funciona
5. [ ] El From muestra los nombres de los novios
6. [ ] El Reply-To es team@smallplatesandcompany.com
7. [ ] Los emails se ven bien en mobile (responsive)
8. [ ] Dark mode funciona
9. [ ] No hay errores de Postmark
10. [ ] Los colores son los de la marca

---

## Notas

- El botón usa Charcoal (#2D2D2D) en lugar de Honey para mejor contraste
- La imagen de los novios es opcional (si no existe, no se muestra)
- El footer incluye el tagline "Recipes from the people who love you"
- Los templates soportan dark mode automáticamente