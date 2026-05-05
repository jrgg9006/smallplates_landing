# /regalos — Landing aislada para mamá MX

## Qué es esto
Landing dedicada al early adopter de Small Plates: mamás de novios y novias en México.

- **Audiencia:** Mamá MX, paga el regalo significativo
- **Idioma:** Español, trato de "usted"
- **CTA único:** WhatsApp (todos los botones llevan a `wa.me`)
- **URL:** `smallplatesandcompany.com/regalos`

## Por qué existe
Creada como prueba para validar canal Meta Ads → WhatsApp para mamá MX. Mientras la landing principal (`/`) atiende a la organizadora US, esta atiende a una audiencia distinta con mecánica distinta (conversión por chat humano, no por checkout digital).

## Reglas de aislamiento
1. Todos los archivos bajo `app/(public)/regalos/`.
2. Ningún archivo importa de `@/components/landing/*`. Si algo se necesita, se copia con prefijo `Regalos`.
3. Imports externos permitidos: `@/lib/*`, `next/*`, `react`, `framer-motion`, `lucide-react`, `embla-carousel-autoplay`, `@/components/ui/*`.

## Cómo borrar esta landing
```bash
rm -rf "app/(public)/regalos/"
```
Cero side effects en el resto del codebase.

## CTAs y mensajes WhatsApp
Cada sección tiene su propio mensaje pre-rellenado. Ver `_components/whatsapp.ts`.

## Variables de entorno requeridas
- `NEXT_PUBLIC_WHATSAPP_NUMBER` (ya configurada, reusada de la landing principal)
