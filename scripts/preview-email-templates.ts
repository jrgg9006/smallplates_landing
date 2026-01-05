/**
 * Script to generate HTML preview files for email templates
 * 
 * Run with: npx ts-node scripts/preview-email-templates.ts
 * Or: npx tsx scripts/preview-email-templates.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  invitationEmail1,
  invitationEmail2,
  invitationEmail3,
  invitationEmail4,
} from '../lib/email/invitation-templates';

// Sample data for preview
const sampleDataWithImage = {
  coupleDisplayName: 'Ana & Pedro',
  guestName: 'María',
  collectionLink: 'https://smallplatesandcompany.com/collect/abc123',
  coupleImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop', // Sample couple photo
  captainName: 'Sarah Chen',
  recipeCount: 23, // For Email 3 social proof (≥ 10 shows count)
};

const sampleDataNoImage = {
  coupleDisplayName: 'Ana & Pedro',
  guestName: 'María',
  collectionLink: 'https://smallplatesandcompany.com/collect/abc123',
  captainName: 'Sarah Chen',
  // No coupleImageUrl - should use placeholder
  recipeCount: 23, // For Email 3 social proof (≥ 10 shows count)
};

const sampleDataLowCount = {
  coupleDisplayName: 'Ana & Pedro',
  guestName: 'María',
  collectionLink: 'https://smallplatesandcompany.com/collect/abc123',
  coupleImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop',
  captainName: 'Sarah Chen',
  recipeCount: 5, // For Email 3 without social proof (< 10 hides count)
};

// Generate all 4 templates
const templates = [
  { name: 'email-1-invitation', generator: invitationEmail1 },
  { name: 'email-2-reminder-1', generator: invitationEmail2 },
  { name: 'email-3-reminder-2', generator: invitationEmail3 },
  { name: 'email-4-last-call', generator: invitationEmail4 },
];

// Create output directory
const outputDir = path.join(process.cwd(), 'email-previews');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate each template - with custom image
templates.forEach(({ name, generator }) => {
  const { subject, html } = generator(sampleDataWithImage);
  const filePath = path.join(outputDir, `${name}.html`);
  
  fs.writeFileSync(filePath, html);
  console.log(`✓ Generated: ${filePath}`);
  console.log(`  Subject: "${subject}"`);
});

// Generate one template with placeholder to show the difference
const { subject: placeholderSubject, html: placeholderHtml } = invitationEmail1(sampleDataNoImage);
const placeholderFilePath = path.join(outputDir, 'email-1-invitation-placeholder.html');
fs.writeFileSync(placeholderFilePath, placeholderHtml);
console.log(`✓ Generated: ${placeholderFilePath} (with placeholder image)`);
console.log(`  Subject: "${placeholderSubject}"`);

// Generate Email 3 without social proof (low recipe count)
const { subject: lowCountSubject, html: lowCountHtml } = invitationEmail3(sampleDataLowCount);
const lowCountFilePath = path.join(outputDir, 'email-3-reminder-2-no-social-proof.html');
fs.writeFileSync(lowCountFilePath, lowCountHtml);
console.log(`✓ Generated: ${lowCountFilePath} (without social proof - low recipe count)`);
console.log(`  Subject: "${lowCountSubject}"`);

console.log(`\n🎉 Done! Open the files in email-previews/ folder to preview.`);
console.log(`\nTip: Open in browser to see how they look!`);
console.log(`\n📧 Email 3 generates two versions:`);
console.log(`   • With social proof: when recipeCount ≥ 10`);
console.log(`   • Without social proof: when recipeCount < 10`);