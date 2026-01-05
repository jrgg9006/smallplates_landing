# Prompt: Script para Preview de Email Templates

## Objetivo

Crear un script que genere los 4 emails como archivos HTML para poder verlos en el navegador.

## Archivo a crear

```
scripts/preview-email-templates.ts
```

## Código

```typescript
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
const sampleData = {
  coupleName: 'Ana & Pedro',
  guestName: 'María',
  collectionLink: 'https://smallplatesandcompany.com/collect/abc123',
  coupleImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop', // Sample couple photo
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

// Generate each template
templates.forEach(({ name, generator }) => {
  const { subject, html } = generator(sampleData);
  const filePath = path.join(outputDir, `${name}.html`);
  
  fs.writeFileSync(filePath, html);
  console.log(`✓ Generated: ${filePath}`);
  console.log(`  Subject: "${subject}"`);
});

console.log(`\n🎉 Done! Open the files in email-previews/ folder to preview.`);
console.log(`\nTip: Open in browser to see how they look!`);
```

## Cómo ejecutar

En la terminal, desde la raíz del proyecto:

```bash
npx tsx scripts/preview-email-templates.ts
```

O si no tienes tsx:

```bash
npm install -D tsx
npx tsx scripts/preview-email-templates.ts
```

## Resultado

Se creará una carpeta `email-previews/` con 4 archivos:
- `email-1-invitation.html`
- `email-2-reminder-1.html`
- `email-3-reminder-2.html`
- `email-4-last-call.html`

Abre cualquiera en el navegador para ver el preview.

## Agregar a .gitignore

Agrega esta línea a `.gitignore` para no subir los previews:

```
email-previews/
```