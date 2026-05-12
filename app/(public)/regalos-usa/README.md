# /regalos-usa — Landing aislada para mamá hispana en EE.UU.

## Qué es esto
Variante de `/regalos` enfocada en un persona distinto: la mamá hispana (50–65) que vive en Estados Unidos. NO es la novia, NO es la mamá en México — vive en USA, posiblemente con familia repartida entre dos países.

- **Audiencia:** Mamá hispana en EE.UU., paga el regalo significativo
- **Idioma:** Español, trato de "usted"
- **CTA único:** WhatsApp (todos los botones llevan a `wa.me`)
- **URL:** `smallplatesandcompany.com/regalos-usa`

## Por qué existe
Segundo test de Meta Ads para Small Plates. La hipótesis es que mamá hispana en USA tiene tensiones distintas a mamá MX (distancia con familia, nostalgia, generaciones que pierden la comida de la casa) y necesita su propio copy + creatividades.

`/regalos` y `/regalos-usa` corren en paralelo. Cero código compartido — cada una vive sola.

## Reglas de aislamiento
1. Todos los archivos bajo `app/(public)/regalos-usa/`.
2. Ningún archivo importa de `@/components/landing/*` ni de `app/(public)/regalos/*`. Si algo se necesita, se copia con prefijo `RegalosUSA`.
3. Imports externos permitidos: `@/lib/*`, `next/*`, `react`, `framer-motion`, `lucide-react`, `embla-carousel-autoplay`, `@/components/ui/*`.

## Diferenciación medible
- **Analytics:** todos los `trackEvent` usan `cta_location: "regalos_usa_*"` (vs `regalos_*` en la otra landing).
- **WhatsApp:** todos los mensajes pre-rellenados arrancan con `[USA]` para que Ana Karen distinga la audiencia al recibir el mensaje.

## Cómo borrar esta landing
```bash
rm -rf "app/(public)/regalos-usa/"
```
Cero side effects en el resto del codebase.

## CTAs y mensajes WhatsApp
Cada sección tiene su propio mensaje pre-rellenado. Ver `_components/whatsapp.ts`.

## Variables de entorno requeridas
- `NEXT_PUBLIC_WHATSAPP_NUMBER` (compartida con `/regalos` y landing principal — actualmente número MX)

## Estado del copy
Al momento de la creación, el copy es una copia 1:1 de `/regalos` como placeholder. Falta diferenciar sección por sección con base en las tensiones reales de mamá hispana en USA.
