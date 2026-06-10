# Cómo medimos Small Plates — Guía para el equipo

*Escrita en junio 2026, después de instrumentar el funnel completo. Si lees esto y algo no cuadra con lo que ves en las herramientas, pregunta antes de tocar nada.*

---

## 1. La idea general (léelo aunque no leas nada más)

Cuando alguien visita smallplatesandcompany.com, el sitio le manda "avisos" a dos sistemas cada vez que esa persona hace algo importante. Esos avisos se llaman **eventos**.

- **Google Analytics (GA4)** recibe TODOS los eventos. Es donde analizamos: cuánta gente llega, qué hace, dónde se atora.
- **Meta (Facebook/Instagram)** recibe solo los eventos clave. Es lo que usan las campañas de ads para aprender a quién mostrarle anuncios.

La pregunta que todo esto responde: **de la gente que llega a la página, ¿cuántos crean su libro, y los que no, en qué paso se nos van?**

---

## 2. El recorrido del cliente y qué medimos en cada paso

Este es el camino que sigue una persona, y el evento que se dispara en cada punto:

| El cliente... | Evento que se dispara | Dónde se ve |
|---|---|---|
| Llega a la página | `page_view` | GA4 y Meta (PageView) |
| Hace click en "Start their book for free" | `start_book_click` | GA4 y Meta (StartBookClick) |
| Ve cada paso del onboarding (son 7) | `onboarding_step_view` con el número y nombre del paso | GA4 |
| Crea su cuenta (en el paso "About you") | `sign_up` ← **LA conversión** | GA4 y Meta (Complete registration) |
| Se crea su libro | `book_created` | GA4 |
| Comparte su link de recetas (copia, WhatsApp, email o QR) | `share` con el método usado | GA4 |
| Llega al dashboard (terminó el onboarding) | `onboarding_completed` | GA4 y Meta (OnboardingCompleted) |
| Un invitado manda una receta | `submit_recipe` | GA4 |
| Alguien paga | `purchase` | GA4 y Meta (Purchase) |

**Los 7 pasos del onboarding**, por si necesitas leer los números de paso: 1 welcome · 2 occasion · 3 book_date · 4 about_you · 5 co_organizer · 6 personalize_invite · 7 invite_first.

La lógica del funnel: cada paso debería tener un número igual o menor que el anterior. Si 100 personas hacen click en el CTA, 80 ven el paso 1, 50 llegan al paso 4 y 30 crean cuenta — la caída entre el 1 y el 4 es donde hay que trabajar.

---

## 3. Quién es quién

### Google Analytics 4 (analytics.google.com)
- Propiedad: **Small Plates Website** · Measurement ID: `G-96BCVQ91GC`
- **Realtime** (Reports → Realtime): lo que pasa AHORITA, últimos 30 min. Útil para verificar que algo funciona, no para analizar.
- **Reports**: los datos históricos. Aquí se analiza de verdad.
- **Key events** = los eventos que marcamos como "conversión". Son solo 3 a propósito: `sign_up` (adquisición), `submit_recipe` (el producto funcionando), `purchase` (dinero). Todo lo demás se mide igual, pero no es "conversión". Regla para decidir si algo merece ser key event: *¿pagaríamos dinero por que este evento ocurra?*

### Meta Events Manager (business.facebook.com/events_manager2)
- Pixel: **874855655049594** (dataset "Website")
- Aquí se verifica que los eventos lleguen a Meta. La columna "Last received" dice hace cuánto llegó el último de cada tipo.
- **`Complete registration` es el evento con el que las campañas optimizan**: Meta busca gente parecida a la que ya creó cuenta.

### Microsoft Clarity (clarity.ms)
- Graba sesiones anónimas (videos de cómo navega la gente) y mapas de calor. No tiene que ver con eventos; es para VER el comportamiento cuando los números nos digan que algo anda mal.

---

## 4. Cosas que tienen explicación (y que te van a confundir si no las sabes)

**"Entré al sitio y no aparezco en Google Analytics."**
Correcto, y es a propósito. Hay un **filtro de tráfico interno** activo con nuestras IPs: nuestras propias visitas NO cuentan en los reportes, para no ensuciar los datos. Si haces pruebas desde la oficina/casa registrada, eres invisible. Así debe ser.

**"Necesito probar el flujo con una cuenta de prueba."**
Usa el truco del `+`: `tucorreo+test15@gmail.com` llega a tu inbox normal pero el sistema lo ve como cuenta nueva. NO borres usuarios de Supabase para reusar un email — deja registros huérfanos.

**"Quiero verificar que los eventos disparan."**
NO instales extensiones de Chrome tipo "GA Debugger" ni uses Google Tag Assistant — las dos nos rompieron el tracking durante horas (ponen a Google Analytics en un modo debug que bloquea todo). Las formas que sí funcionan:
1. **GA4 Realtime** desde un dispositivo con datos móviles (fuera de nuestra IP filtrada), o
2. Pedirle a quien administre GA4 que ponga el filtro "Internal Traffic" en *Inactive* durante la prueba — **y lo regrese a Active al terminar** (esto es crítico).

**"En Meta veo eventos viejos como Initiate checkout o Contact."**
Normales: `Initiate checkout` es del flujo viejo de compra, `Contact` son clicks de WhatsApp en las landings /regalos. No estorban.

**"Un evento nuevo no aparece en las listas de Admin de GA4."**
Las listas de Admin tardan hasta 24 horas en registrar un nombre nuevo. Realtime sí es instantáneo.

---

## 5. De dónde sale todo esto (para curiosos)

Los eventos viven en el código del sitio. Hay un archivo central (`lib/analytics.ts`) con la lista oficial de nombres — nadie inventa nombres de eventos sobre la marcha; si se necesita uno nuevo, se agrega ahí primero. Cada botón o paso importante del sitio llama a ese archivo cuando el usuario hace algo.

Dos protecciones integradas que vale la pena conocer:

- **Dedupe de sign_up**: si una persona recarga la página o re-envía el formulario, `sign_up` solo cuenta UNA vez por sesión. Y si alguien ya tenía cuenta y crea otro libro, cuenta `book_created` pero NO `sign_up`. Los números de conversión no están inflados.
- **Los UTMs sobreviven**: cuando alguien llega de un ad con `?utm_source=meta&utm_campaign=x`, esa información viaja con el usuario por todo el onboarding y queda pegada a su `sign_up`. Así sabemos qué campaña produjo cada registro.

---

## 6. Si vas a publicar links (lo que te toca a ti)

Cualquier link que publiquemos fuera del sitio (ads, bio de Instagram, email, influencers) debe llevar UTMs para saber de dónde vino la gente:

```
https://www.smallplatesandcompany.com/?utm_source=FUENTE&utm_medium=MEDIO&utm_campaign=CAMPAÑA
```

- `utm_source` = de dónde: `meta`, `instagram_bio`, `tiktok`, `newsletter`
- `utm_medium` = tipo: `paid`, `organic`, `email`
- `utm_campaign` = el nombre de la iniciativa: `wedding-broad-jun26`, `lanzamiento-x`

Regla simple: minúsculas, sin espacios, sin acentos, y consistente — `meta` y `Meta` cuentan como fuentes distintas para Google, así que decidimos una vez y no la cambiamos.

---

*Dudas: pregunta antes de cambiar cualquier cosa en Google Analytics o Meta Events Manager. Cambiar un filtro, borrar un evento o desmarcar una estrella afecta los datos de todos.*
