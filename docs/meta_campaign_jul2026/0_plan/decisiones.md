# Log de decisiones — Meta Ads jul 2026

Registro vivo. Cada decisión con fecha y razón. Si algo se revierte, se anota, no se borra.

---

## 7 jul 2026 — Sesión de arranque del sprint

**1. Audiencia "mamá hispana en EE.UU." DESCARTADA.**
Ya no se le habla a la mamá hispana de los novios. Los ads son en INGLÉS, mercado Estados Unidos.

**2. El ad vende "empieza gratis", no un libro de $169.**
Con la plataforma abierta (free hasta imprimir), la conversión del ad es CompleteRegistration (signup de organizadora), no una compra. Economía: signup < $12–15 × conversión free→paid ≥ 25% ≈ CAC pagado < $60.

**3. La variable principal del test es la OCASIÓN, no el hook.**
Razón: los 18 clientes son bodas porque solo se vendían bodas — no es señal de mercado. Las entrevistas validan la mecánica (grupo → recetas + notas → objeto), no la ocasión. Saber en qué mercado vive el producto vale más que saber qué frase funciona. El hook se optimiza en ronda 2 dentro de la ocasión ganadora.

**4. Ronda 1: boda vs. cumpleaños milestone (60/70 de mamá/papá). Dos brazos, no tres.**
Aniversario queda en la banca: se parece demasiado a boda en imaginería y dividir $60/día en 3 hace la lectura muy lenta. ABO, ~$30/día por brazo, mismo formato de creativo entre brazos para comparación limpia.

**5. Ads sin ocasión ("a cookbook for someone special") NO entran a ronda 1.**
Razones: (a) la especificidad detiene el scroll, lo genérico no le habla a nadie; (b) la ocasión crea el deadline que hace actuar; (c) categoría nueva + ocasión abstracta = doble abstracción; (d) el creativo es el targeting en Meta broad. La versión "lista compuesta" (varias ocasiones concretas y rápidas) queda en banca para retargeting o post-test.

**6. Voz: baseline Margot-ish en inglés (match con el landing). "La que más convierta" se decide con datos.**
Si se testea una voz más cálida, es como variante de copy dentro del mismo hook, no como campaña aparte.

**7. Regla invariable de creativo: slide 1 enseña el libro físico y nombra la categoría.**
(Regla previa que sigue vigente.)

**8. Multi-ocasión = secuencia, no simultaneidad.**
Boda + milestone birthday validan el canal en jul–ago; Thanksgiving es la siguiente ocasión en Q4 (ya en el plan maestro).

**9. Prerequisito técnico: curva $199 implementada ANTES de mandar tráfico.**
Confirmado que `lib/stripe/pricing.ts` sigue con 169/129/113/103/95. Si cambia a mitad del test, contamina la lectura de conversión.

**10. Lanzamiento: martes 28 de julio. Go/no-go: lunes 27.**

---

## 8 jul 2026 — Brazo challenger definido

**11. Ronda 1 queda: BODA vs. CUMPLEAÑOS DE MAMÁ/PAPÁ (framing milestone en el creativo: "her 60th").**
Criterio que decidió: la ocasión debe traer su propio ritual de regalo + presupuesto preexistente ("el producto no crea la ocasión" — análisis de clientes, punto 6). Boda y cumpleaños milestone de padres los tienen; mudanza tiene la emoción pero NO el ritual de regalo grupal premium (farewell gift en US = tarjeta y flores, no $199 coordinando 30 personas) — habría que crear categoría Y ritual a la vez. Graduación descartada por estacional (mayo–jun; el test corre jul–ago).
- Evidencia del challenger: cero clientes propios, pero Storyworth Celebrations valida "regalo significativo para papá/mamá" a escala con paid ads. Comprador constante entre brazos: la organizadora ~28–50 (amiga / hija adulta) — experimento limpio: misma compradora, distinta ocasión.
- En banca para rondas futuras: mudanza/despedida (requiere crear ritual), graduación (primavera 2027), aniversario, lista compuesta multi-ocasión (retargeting).

**12. Corrección de premisa (8 jul):** los 18 clientes NO son solo bodas — el análisis de clientes documenta mudanza (Karla), graduación/grupo de amigas (Clementina), aniversario (Donald y Emily), parejas regalando a parejas. La evidencia multi-ocasión es historial, no hipótesis.

**17. Objetivo real del sprint = pasar de SOLUTION-AWARE a PRODUCT-AWARE (9 jul).** El objetivo NO es "hacer Meta" — Meta es un medio. La meta: que mucha gente sepa que existimos, entienda rápido y nos considere. Canal es negociable ("no me importa cómo sea").
- Presupuesto: ~$1,500–2,000/mes. Ricardo no le teme a invertir para aprender, pero su norte es ROI lo más rápido posible + aprendizaje estudiado (no al aire).
- Aritmética de ROI que puso Ricardo: ~$120 de contribución por libro; $1,500 invertidos ⇒ meta mínima ~14 libros/mes atribuibles a marketing para justificar.
- Tensión nombrada (Claude): "aprender el mercado rápido" y "ROI rápido" NO los sirve el mismo canal. Resolución propuesta: **Meta = motor de APRENDIZAJE** (test controlado, data limpia de mensaje/mercado/ocasión); **loop de invitados = motor de ROI** (casi gratis, cada libro expone 20–80 personas — el research dice "el producto ES el canal"). No dispersar el presupuesto en 3 canales pagados.
- Dato de origen: varias mamás dijeron que descubren cosas de boda en "Instagram" → valida la superficie, pero IG tiene dos puertas (paid = aprende rápido cuesta; orgánico/founder/influencer = más barato más lento).

**Q2 RESUELTA (9 jul): SÍ — hook de fricción-cero, emoción como recompensa.** Alineado con las 12 marcas del dossier.
**Q3 RESUELTA (9 jul): SÍ — la organizadora ES la compradora, el retrato es correcto.** Se sigue refinando quién es ELLA con más research/entrevistas.

**18. Estructura del test: UN ad set consolidado, NO 2 ad sets por ocasión (10 jul). Revierte la estructura de 2 brazos.**
Ricardo hizo challenge; research de best-practice 2026 lo confirmó (fuentes en `2_research/competencia/6_estructura_campana_meta.md`). Razones:
- **Learning phase:** Meta pide ~50 eventos/semana/ad set. A $60/día, partir en 2 ad sets deja a cada uno con la mitad → ambos learning-limited. Consolidar da el doble de datos y es la única vía de acercarse a 50/sem. Fórmula: $60×7÷50 = signup debe costar ≤ ~$8.40 (por eso optimizar al signup free-tier barato, no a compra).
- **Confound del diseño viejo:** wedding-enfocado vs composite-lista difería en DOS variables (ocasión + estructura de mensaje) → un "wedding gana" sería ilegible. Detectado por Ricardo.
- **Diseño nuevo:** UN ad set ABO, $60/día, broad US mujeres 25–54 sin intereses, optimizado al signup. Cada ocasión×ángulo = un ad distinto auto-contenido. **NO Dynamic Creative (DCT)** — mezcla componentes y roba la lectura de qué ocasión/mensaje gana.
- **Disciplina anti-starvation (crítica):** empezar con **3–4 creativos**, NO 8 (con $60/día la banda es 3–5; 8–15 es para presupuesto alto). Meta concentra 70–80% del gasto en 1–2 ganadores tempranos, y el ganador temprano puede ser de SUERTE (se sesga en 24–48h antes de ser confiable). Mitigación: ventana mínima 7 días; no matar creativos que gastaron <3% (starved, no perdedores); pausar los que gasten 2–3× CPA sin signup; rotar la siguiente tanda cada 7–14 días.
- **Límite honesto:** a $60/día NO se llega a 50 conversiones/variante → señal DIRECCIONAL (CTR + primeros leads + onboarding), no significancia 95%. Refuerza "Meta = motor de aprendizaje", no de prueba estadística.
- **Ventaja Small Plates que el consejo genérico no ve:** el breakdown de conversión por creativo de Meta es DÉBIL (CTR sí por ad, conversiones custom por ad son frágiles). PERO `groups.occasion` del onboarding cubre justo ese hueco: Meta dice qué creativo frena el scroll (CTR), el onboarding dice qué ocasión convirtió al signup. Dos lecturas complementarias.

**19. Ronda 1 = test de ÁNGULO, occasion-OPEN (NO anclado a boda) (10 jul).**
Se decidió testear ángulo antes que ocasión (el mensaje es el prerrequisito en categoría nueva; Storyworth corre el mismo mensaje en boda/aniversario cambiando una palabra; LoveBook hace hook-swap sobre cuerpo fijo = valida el método). PERO Ricardo hizo un challenge correcto a "anclar a boda": la boda es ocasión de base ESTRECHA (pocas personas con boda cercana + rol de regalo + timing; Facebook ni siquiera sabe quién tiene boda cerca), y con presupuesto chico eso mata el hit-rate por impresión. Además ancla mal la categoría ("wedding-only").
- **Síntesis adoptada:** ángulo-primero PERO **occasion-open** — visuales neutrales de ocasión (el libro en la cocina, receta manuscrita, manos, página manchada; NO una boda), copy que deja al espectador poner su ocasión ("a cookbook written by the people you love"). Resuelve los 2 miedos de Ricardo (wedding-only + lottery de targeting) Y el problema de assets (no hay que producir fotos de aniversario/graduación).
- **Bonus:** ads occasion-neutral → la ocasión que eligen en el onboarding es señal MÁS pura de demanda (no primada por el ad).
- **Se conserva:** boda NO se excluye (ocasión probada, únicos assets reales fuertes) — un creativo (el reveal) puede usar material real de boda si el copy queda occasion-open. Guardia: occasion-open ≠ vago ("for someone special", prohibido por #5); la concreción la cargan los ángulos (comida/colaborativo/permanencia).
- Ronda 1 = un ad set, 3 creativos = los 3 diferenciadores occasion-open. Ronda 2 = tomar el ángulo ganador y sharpen por ocasión (ya sabiendo cuáles aparecieron en el onboarding).
- Corrección honesta de Claude: mi rec original (anclar a boda) sobrepesó la limpieza del experimento y subestimó el base-rate estrecho de la boda. El challenge de Ricardo corrigió un punto ciego real.

**13. SIN lead magnet de email; el signup free-tier ES el lead (8 jul).**
Se evaluó el consejo externo de "primera campaña en frío = captura de email + nurture que cierra la venta". Correcto para el modelo viejo ($169 upfront); desactualizado para el free-tier: CompleteRegistration ya es un evento de lead (nadie optimiza a compra en frío), y el signup captura algo más fuerte que un email — un libro creado con ocasión y deadline, con el grupo como nurture. No agregar escalones antes del signup.
- Lo que SÍ se adoptó de ese consejo: plan B de optimización por volumen de learning phase (ad set atorado en learning limited ~2 semanas → cambiar evento de optimización a la custom conversion StartBookClick, seguir leyendo CompleteRegistration como métrica). Documentado en `1_estrategia/estrategia.md`.
- Presupuesto se mantiene en $60/día (no $15–25): con menos, 1–2 signups/día no dan lectura en 4 semanas ni sostienen dos brazos.

**14. REVIERTE #11 — Ronda 1 queda: BODA vs. LISTA COMPUESTA multi-ocasión (8 jul).**
Ricardo rechazó el brazo cumpleaños con un argumento superior al de Storyworth: habría que FABRICAR el creativo (escena montada de un caso que nunca ha existido en el negocio), en una marca cuyo activo es que todo es real. Cero casos propios + material actuado = brazo débil.
- Brazo 2 nuevo: **lista compuesta** — varias ocasiones concretas y rápidas ("For their wedding. For their anniversary. For her graduation..."), NO genérico-vago (la decisión #5 sigue viva: lo vago no detiene el scroll; lo compuesto es específico-plural). Se arma con material 100% real (libros de boda, testimonial de aniversario de Donald, caso graduación de Clementina). Cumpleaños puede ir como línea de texto sin fabricarle escena.
- Reframe clave: el brazo compuesto es jugada de DESCUBRIMIENTO, no de conversión. El onboarding free-tier pregunta la ocasión (paso 2, `groups.occasion`: bridal_shower/wedding/anniversary/birthday/unsure) — cada signup reporta solito para qué vino. Es una encuesta de mercado pagada en signups reales.
- Expectativas escritas ANTES de lanzar: (a) es probable que el compuesto tenga peor costo por signup — si pasa, es el precio de la información, no fracaso; (b) su entregable principal es la DISTRIBUCIÓN de ocasiones de sus signups, que define la segunda ocasión con datos.
- Bonus: desaparece la sesión de fotos de cumpleaños de la ruta crítica — todo el material existe.
- Pendiente chico (call de Ricardo): agregar "Graduation" y "Moving away" como opciones del onboarding para que las líneas del ad compuesto sean medibles (hoy caerían en "Other").

**15. SIN audiencias de exclusión (8 jul).** Ricardo decidió saltarse las custom audiences de exclusión (lista de clientes + CompleteRegistration 180d): la base es tan chica que el gasto desperdiciado es despreciable, y un usuario existente no puede crear cuenta duplicada. Capa 0 queda: cuenta activa + pago + dominio ✅ + pixel ✅ + IG conectado ✅ + perfil IG vivo (tarea semana 2). Se reconsidera cuando la base crezca (post-test).

**16. [PRELIMINAR — se confirma en fase 3, tras estrategia y dirección visual] Formatos de ads: 3 por brazo, 6 en total (8 jul).**
Por ad set: (a) **imagen estática** — libro físico hero + categoría + una línea; (b) **carrusel 3–5 cards** — card 1 el libro; en COMPOSITE una ocasión por card (el formato nativo de la lista compuesta), en WEDDING el cómo-funciona en 3 pasos; (c) **video 15–30s** — manos hojeando un libro real, grabado con teléfono, 3–4 textos sobrepuestos, sin producción profesional. Cubre feed (estática/carrusel) + Reels/Stories (video). Cada asset en 4:5 y 9:16.

**Refinamiento por research consolidado (8 jul, ver `2_research/competencia/2_consolidado_12_marcas.md`):** los dos formatos HÉROE son el **carrusel del proceso** (así gana Wonderbly en Meta con producto créalo-tú: 60–70% de su budget en FB) y el **video reveal/reacción** (así vive LoveBook). La estática es soporte, no protagonista. Razón: Small Plates carga dos costos de explicación (colaborativo + categoría nueva) que solo el carrusel-proceso y el reveal cargan bien en frío. El test se gana o pierde ahí.
