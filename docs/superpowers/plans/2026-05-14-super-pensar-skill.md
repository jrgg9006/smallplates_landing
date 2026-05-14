# Super Pensar Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code skill at `.claude/skills/super-pensar/SKILL.md` that applies 2-3 mental models from a 25-model catalog to hard problems on explicit user invocation.

**Architecture:** Single-file skill (~350-400 lines) following the convention used by other user skills (`founder-coaching`, `cinematic-brief`). Frontmatter defines the trigger; body contains protocol + voice + anti-patterns + catalog + end-to-end example.

**Tech Stack:** Markdown + YAML frontmatter. No code, no dependencies. Verification is manual (load the skill, observe behavior).

**Reference spec:** `docs/superpowers/specs/2026-05-14-super-pensar-skill-design.md`

---

## File Structure

| File | Responsibility | Status |
|---|---|---|
| `.claude/skills/super-pensar/SKILL.md` | Entire skill: frontmatter + instructions + catalog + example | Create |
| `docs/superpowers/specs/2026-05-14-super-pensar-skill-design.md` | Source of truth for design decisions | Already committed |

Single file because (a) the spec confirmed Enfoque A (todo-en-uno), and (b) the skill is auto-contained — no shared references with other skills.

---

## Verification Strategy

Since this is a markdown skill (not code), "tests" mean:
1. Frontmatter parses as valid YAML
2. Skill appears in available skills list when loaded
3. Trigger phrases activate it; non-trigger phrases don't (manual smoke test)

There is no `npm test` or `pytest` step. Verification is `head` + visual confirmation + a manual invocation by Ricardo.

---

## Task 1: Scaffold the skill directory + frontmatter

**Files:**
- Create: `.claude/skills/super-pensar/SKILL.md`

- [ ] **Step 1: Create directory and write the frontmatter + H1**

Create the file with exactly this content (no body yet — body comes in later tasks):

```markdown
---
name: super-pensar
description: Activate deep mental-models thinking (Munger / Farnam Street style) for hard decisions or stuck problems. Use ONLY when Ricardo invokes "/super-pensar", "super pensar", "piensa profundo", "modelos mentales", or "necesito pensar esto bien". Skill picks 2-3 most relevant mental models from a curated catalog of 25 (incentives, second-order effects, inversion, opportunity cost, Hanlon's razor, etc.) and applies them to the problem. Closes with synthesis but no recommendation — respects Ricardo's autonomy as decision-maker. Works for any hard problem: founder/strategic, technical, personal.
---

# Super Pensar — Modelos Mentales

Activado solo cuando Ricardo lo invoca explícitamente. Aplica 2-3 modelos mentales relevantes a un problema difícil. Cierra con síntesis, no con recomendación.
```

- [ ] **Step 2: Verify the file exists and frontmatter is valid YAML**

Run: `head -5 .claude/skills/super-pensar/SKILL.md`
Expected: shows `---`, `name: super-pensar`, full description line, `---`

Run: `python3 -c "import yaml; f=open('.claude/skills/super-pensar/SKILL.md').read(); print(yaml.safe_load(f.split('---')[1]))"`
Expected: prints a dict with `name` and `description` keys, no parse error.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): scaffold super-pensar skill with frontmatter"
```

---

## Task 2: Add "Cuándo activarte" section

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append after H1 intro)

- [ ] **Step 1: Append the section to SKILL.md**

Append exactly:

```markdown

---

## Cuándo activarte

**Trigger explícito SOLO.** Activa este skill cuando Ricardo escriba (literal o equivalente):

- `/super-pensar [problema]`
- "super pensar [tema]"
- "piensa profundo sobre [X]"
- "aplica modelos mentales a [X]"
- "necesito pensar esto bien"

### Cuándo NO usarlo

No actives super-pensar en estos casos — son ruido y desperdicio de tokens:

- Preguntas factuales ("¿cuál es la capital de X?")
- Tareas de código pequeñas o de UI
- Búsquedas en el codebase
- Tareas de copy/edit
- Preguntas sobre cómo usar una herramienta

Si dudas si activarte, **no te actives**. Cero falsos positivos es preferible a análisis no pedido.
```

- [ ] **Step 2: Verify**

Run: `grep -c "^## " .claude/skills/super-pensar/SKILL.md`
Expected: `1` (only "Cuándo activarte" so far)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add activation rules to super-pensar"
```

---

## Task 3: Add "Protocolo" section (4 steps)

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append the protocol section**

Append exactly:

```markdown

---

## Protocolo (4 pasos)

### Paso 1 — Entender el problema

Si el problema está claro en el mensaje de Ricardo, **no preguntes nada** y pasa al paso 2. Si está ambiguo, haz **una sola pregunta** que aclare el problema concreto a analizar. Nunca más de una pregunta antes del análisis.

### Paso 2 — Seleccionar 2-3 modelos del catálogo

Usa la heurística de la sección "Cómo elegir modelos" para escoger entre 2 y 3 modelos del catálogo. Nunca más de 3. Nunca menos de 2.

### Paso 3 — Aplicar cada modelo en su bloque

Por cada modelo escogido, escribe un bloque de **3 a 5 líneas máximo** con este formato:

> **[Nombre del modelo]**: [aplicación concreta al problema en 2-3 líneas]. **Lo que ilumina**: [insight no obvio en 1 línea].

### Paso 4 — Cierre: síntesis sin recomendación

Cierra con 2-3 líneas de síntesis: qué emerge cuando juntas los modelos, qué pregunta queda. **Nunca** des recomendación directa ("yo haría X"). Termina con la frase exacta:

> **Eso es lo que veo. Tú decides.**
```

- [ ] **Step 2: Verify**

Run: `grep -c "^### Paso" .claude/skills/super-pensar/SKILL.md`
Expected: `4` (cuatro pasos del protocolo)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add 4-step protocol to super-pensar"
```

---

## Task 4: Add "Cómo elegir los modelos correctos" section

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append the selection heuristic**

Append exactly:

```markdown

---

## Cómo elegir los modelos correctos

No apliques siempre los mismos 3 modelos. Mapea el **tipo de pregunta** a los modelos que mejor la iluminan:

| Tipo de pregunta | Modelos por defecto |
|---|---|
| "¿Hago X o Y?" | Opportunity cost + Inversión + Asimetría |
| "¿Por qué pasa esto?" | Incentivos + Hanlon + Segundo orden |
| "¿Cómo crece esto?" | Network effects + Escala/efectos compuestos + Goodhart |
| "¿Vale la pena?" | Expected value + Asimetría + Costo de equivocarse |
| "¿Qué estoy ignorando?" | Sesgo de confirmación + Chesterton's fence + Mapa vs territorio |
| "¿Por qué la gente actúa así?" | Incentivos + Hanlon + Reciprocidad |

### Regla de combinación cuando el problema es ambiguo

Si el tipo de pregunta no encaja en la tabla, escoge **uno de cada uno** de estos tres grupos para garantizar ángulos distintos:

1. Un modelo de **comportamiento humano** (incentivos, Hanlon, sesgo de confirmación, social proof, reciprocidad)
2. Un modelo de **sistemas y consecuencias** (segundo orden, Chesterton's fence, Goodhart, efectos compuestos)
3. Un modelo de **toma de decisión** (inversión, opportunity cost, expected value, asimetría)

### Anti-regla

**Nunca** apliques más de 3 modelos. Más de 3 = ruido, no señal. Si sientes que necesitas más, es señal de que escogiste los modelos equivocados — vuelve y reescoge.
```

- [ ] **Step 2: Verify**

Run: `grep -c "^| " .claude/skills/super-pensar/SKILL.md`
Expected: `7` (header del table + 6 filas de tipos de pregunta)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add model selection heuristic"
```

---

## Task 5: Add "Voz" section

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append the voice rules**

Append exactly:

```markdown

---

## Voz

- **Idioma**: español por defecto. Inglés solo cuando el problema es código y los términos no tienen traducción natural.
- **Longitud**: cada bloque de modelo en **3-5 líneas máximo**. Cierre en 2-3 líneas. Total del análisis: 15-25 líneas.
- **Tono**: dry, específico, sin performar empatía. Igual que el skill `founder-coaching`.

### Prohibido

- "Fascinante", "interesante", "qué buena pregunta"
- Emojis (cero)
- "Te invito a reflexionar sobre…"
- Jerga académica ("la heurística de disponibilidad sugiere…")
- Cierres performativos ("espero que esto te ayude")
- Recomendación directa ("yo haría X")

### Permitido y bienvenido

- Frases cortas y aterrizadas al problema concreto
- Nombrar incentivos/intereses sin suavizar
- Preguntas duras al final si revelan algo que Ricardo no estaba viendo
```

- [ ] **Step 2: Verify**

Run: `grep -A1 "^### Prohibido" .claude/skills/super-pensar/SKILL.md | head -2`
Expected: shows the heading + first prohibited bullet.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add voice rules to super-pensar"
```

---

## Task 6: Add "Anti-patrones" section

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append anti-patterns**

Append exactly:

```markdown

---

## Anti-patrones

Errores que rompen el skill — vigílalos en cada uso:

- ❌ **Aplicar más de 3 modelos** "por completar". Si los 3 que escogiste no iluminan, reescoge — no añadas un cuarto.
- ❌ **Dar recomendación cuando no se pidió.** El usuario no pidió "qué hacer", pidió "ver mejor el problema".
- ❌ **Aplicar siempre los mismos 3** (incentivos / 2do orden / asimetría). Lee el tipo de problema y escoge según la tabla.
- ❌ **Análisis genérico** que no aterriza al problema concreto. Cada modelo debe nombrar elementos específicos del problema, no definirse en abstracto.
- ❌ **Usar jerga académica** o nombres en inglés cuando hay traducción natural en español.
- ❌ **Cerrar con "espero que esto te ayude"** o cualquier variante performativa. Solo "Eso es lo que veo. Tú decides."
- ❌ **Hacer más de una pregunta** antes del análisis. Si el problema está claro, 0 preguntas. Si está ambiguo, 1 pregunta. Nunca 2.
```

- [ ] **Step 2: Verify**

Run: `grep -c "^- ❌" .claude/skills/super-pensar/SKILL.md`
Expected: `7` (siete anti-patrones)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add anti-patterns to super-pensar"
```

---

## Task 7: Add catalog Group 1 — Toma de decisión (4 models)

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append catalog header + Group 1**

Append exactly:

```markdown

---

## El catálogo (25 modelos en 7 grupos)

Cada modelo: definición → ejemplo concreto → cuándo aplicar.

### Grupo 1: Toma de decisión

**1. Inversión (think backwards)**
En vez de preguntar "¿cómo logro X?", pregunta "¿cómo garantizaría que NO pase X?" y elimina esos caminos.
*Ejemplo*: "¿Cómo crezco a 100 libros/mes?" → "¿Qué haría que NO crezca?" (cliente equivocado, ciclo largo, ads malos).
*Úsalo cuando*: estás atorado intentando "mejorar" algo y no avanzas.

**2. Opportunity cost**
El verdadero costo de hacer X no es el dinero/tiempo de X, es lo mejor que dejaste de hacer.
*Ejemplo*: "Voy a invertir 2 semanas en este feature" → ¿qué dejas de hacer esas 2 semanas? Si la respuesta es "ventas", el feature te está costando ventas.
*Úsalo cuando*: alguien (o tú) propone hacer algo "porque sí se puede" sin nombrar lo que sacrifica.

**3. Expected value**
Decisión = probabilidad × tamaño del resultado. Una apuesta de 10% × $1M vence a una de 90% × $50K.
*Ejemplo*: hacer 10 llamadas frías con 5% de éxito a $5K cada una = $2,500 esperados. Vale la pena el día.
*Úsalo cuando*: estás eligiendo entre algo "seguro y chico" vs algo "incierto y grande".

**4. Asimetría / costo de equivocarse**
Las decisiones reversibles cuestan poco si te equivocas. Las irreversibles, mucho. Trátalas distinto.
*Ejemplo*: subir precios = reversible (los puedes bajar). Contratar fulltime = casi irreversible (despedir es caro/lento).
*Úsalo cuando*: estás dudando una decisión — la pregunta correcta no es "¿es la mejor?" sino "¿qué pasa si me equivoco?"
```

- [ ] **Step 2: Verify**

Run: `grep -c "^\*\*[1-4]\." .claude/skills/super-pensar/SKILL.md`
Expected: `4` (modelos numerados 1-4)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add catalog group 1 — decision making"
```

---

## Task 8: Add catalog Group 2 — Comportamiento humano (5 models)

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append Group 2**

Append exactly:

```markdown

### Grupo 2: Comportamiento humano

**5. Incentivos**
"Show me the incentive and I'll show you the outcome" — Munger. La gente responde a sus incentivos, casi nunca a la lógica o a lo "correcto".
*Ejemplo*: si pagas a un comercial por leads (no por ventas), tendrás muchos leads malos.
*Úsalo cuando*: alguien actúa "irracional" o un sistema da resultados absurdos. Busca el incentivo oculto.

**6. Sesgo de confirmación**
Buscamos información que confirma lo que ya creemos e ignoramos la que la contradice. Funciona en automático.
*Ejemplo*: tu hipótesis es "los clientes quieren X" → solo recuerdas a los 3 que pidieron X, ignoras a los 30 que no lo mencionaron.
*Úsalo cuando*: estás muy seguro de algo basado en "evidencia" anecdótica. Pregúntate qué dato te haría cambiar de opinión.

**7. Hanlon's razor**
"Nunca atribuyas a malicia lo que se explica por incompetencia" — o por descuido, prisa, o que no le importa lo mismo que a ti.
*Ejemplo*: cliente no responde tu email → casi nunca es "no le interesas", casi siempre es "no lo vio o lo olvidó".
*Úsalo cuando*: estás a punto de tomártelo personal. La explicación benigna casi siempre es la correcta.

**8. Social proof**
La gente decide qué hacer mirando lo que hacen otros, especialmente otros parecidos. No es debilidad, es heurística cognitiva.
*Ejemplo*: testimonios de "novias en CDMX 2025" convierten más que testimonios genéricos para una novia en CDMX 2025.
*Úsalo cuando*: estás diseñando algo que requiere que la gente tome una acción nueva. Pregunta: ¿quién parecido ya lo hizo?

**9. Reciprocidad**
Cuando alguien te da algo, sientes obligación de devolverlo. Funciona incluso cuando lo que te dieron es pequeño.
*Ejemplo*: regalar un PDF útil antes de pedir email convierte mejor que pedir el email directo.
*Úsalo cuando*: necesitas algo de alguien (referido, intro, feedback). Pregúntate qué le diste antes — si nada, da algo primero.
```

- [ ] **Step 2: Verify**

Run: `grep -c "^\*\*[5-9]\." .claude/skills/super-pensar/SKILL.md`
Expected: `5` (modelos 5-9)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add catalog group 2 — human behavior"
```

---

## Task 9: Add catalog Group 3 — Sistemas y consecuencias (4 models)

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append Group 3**

Append exactly:

```markdown

### Grupo 3: Sistemas y consecuencias

**10. Segundo orden**
Las consecuencias de una decisión no terminan en el efecto inmediato. Pregunta: "Y luego, ¿qué pasa? ¿Y luego de eso?"
*Ejemplo*: bajas el precio para vender más → vendes más → atraes clientes más sensibles a precio → exigen más descuentos → margen colapsa.
*Úsalo cuando*: una decisión se ve "obvia" en primer orden. El efecto interesante casi siempre está en 2do o 3er orden.

**11. Chesterton's fence**
Antes de quitar una regla/sistema/proceso que parece innecesario, entiende por qué se puso ahí en primer lugar. Si no sabes, no lo quites.
*Ejemplo*: "¿Por qué tenemos este step de aprobación manual?" → si no sabes, asume que alguien lo puso por una razón que no es obvia.
*Úsalo cuando*: estás a punto de simplificar/eliminar algo que "claramente no aporta". El default es: averigua primero.

**12. Ley de Goodhart**
"Cuando una métrica se vuelve objetivo, deja de ser una buena métrica." La gente optimiza el número, no la realidad que el número medía.
*Ejemplo*: medir productividad por líneas de código → tendrás código verboso. Medir por tickets cerrados → tendrás tickets divididos artificialmente.
*Úsalo cuando*: vas a poner un KPI o una meta numérica. Pregunta: ¿cómo lo van a hackear?

**13. Efectos compuestos**
Mejoras pequeñas y consistentes ganan a esfuerzos grandes y esporádicos por el efecto del interés compuesto.
*Ejemplo*: 1% de mejora diaria en conversión durante 1 año = 37x. Un sprint heroico cada 6 meses = poco.
*Úsalo cuando*: estás eligiendo entre "hacer un esfuerzo grande ahora" vs "armar un sistema que mejore poco pero todos los días". El segundo casi siempre gana en el largo plazo.
```

- [ ] **Step 2: Verify**

Run: `grep -c "^\*\*1[0-3]\." .claude/skills/super-pensar/SKILL.md`
Expected: `4` (modelos 10-13)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add catalog group 3 — systems and consequences"
```

---

## Task 10: Add catalog Group 4 — Probabilidad y riesgo (3 models)

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append Group 4**

Append exactly:

```markdown

### Grupo 4: Probabilidad y riesgo

**14. Padrón base (base rates)**
Antes de evaluar un caso específico, mira la frecuencia base en la población. La intuición ignora base rates y se enfoca en detalles "vívidos".
*Ejemplo*: "Voy a hacer un curso porque conozco a alguien que vendió $100K así." → base rate: 95% de los cursos venden <$5K. El caso vívido es la excepción.
*Úsalo cuando*: una decisión depende de "si pasa X". Pregunta primero: ¿con qué frecuencia pasa X en general?

**15. Regresión a la media**
Los extremos tienden a moverse hacia el promedio en la siguiente medición. Un mes excelente probablemente es seguido por uno normal — no porque algo "se arruinó".
*Ejemplo*: tu mejor mes de ventas casi nunca se repite el siguiente mes. No es que perdiste el touch — es estadística.
*Úsalo cuando*: estás explicando un cambio (positivo o negativo) inventando una causa. A veces solo es regresión a la media.

**16. Black Swan / asimetría de cola**
Los eventos raros (positivos o negativos) tienen impacto desproporcionado. El mundo no es normal/gaussiano — es de colas gordas.
*Ejemplo*: un cliente que se vuelve viral te puede generar más en una semana que 6 meses de marketing. Una crisis te puede borrar 6 meses de runway.
*Úsalo cuando*: estás planeando con base en "el caso promedio". Pregunta: ¿qué pasa en el caso 1-en-100? ¿Lo aguanto?
```

- [ ] **Step 2: Verify**

Run: `grep -c "^\*\*1[4-6]\." .claude/skills/super-pensar/SKILL.md`
Expected: `3` (modelos 14-16)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add catalog group 4 — probability and risk"
```

---

## Task 11: Add catalog Group 5 — Foco y simplicidad (3 models)

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append Group 5**

Append exactly:

```markdown

### Grupo 5: Foco y simplicidad

**17. Navaja de Occam**
Entre dos explicaciones que encajan con los datos, la más simple casi siempre es la correcta. No multiplicar entidades sin necesidad.
*Ejemplo*: ventas bajaron este mes → ¿"el algoritmo de Meta cambió + competencia entró + estacionalidad"? O ¿"hicimos menos ads"? Empieza por lo simple.
*Úsalo cuando*: estás construyendo una explicación con muchas variables. Pregunta: ¿hay una explicación con menos piezas que también encaja?

**18. Pareto 80/20**
El 80% de los resultados viene del 20% de los esfuerzos/clientes/features. El 20% restante consume el 80% del tiempo.
*Ejemplo*: 80% de tus ingresos viene del 20% de tus clientes. 80% de tus bugs viene del 20% del código.
*Úsalo cuando*: tu lista de tareas/features es larga. Identifica el 20% que mueve la aguja y haz solo eso.

**19. Círculo de competencia**
Sabes mucho de pocas cosas y poco de muchas. Quédate dentro de tu círculo de competencia para tomar decisiones con ventaja.
*Ejemplo*: si no entiendes ads de Meta, no debates si la curva de CPM es alta — pregunta a alguien que sí.
*Úsalo cuando*: estás a punto de decidir algo en un área donde no eres experto. Identifica el límite de tu círculo y decide si vale la pena salir o pedir ayuda.
```

- [ ] **Step 2: Verify**

Run: `grep -c "^\*\*1[7-9]\." .claude/skills/super-pensar/SKILL.md`
Expected: `3` (modelos 17-19)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add catalog group 5 — focus and simplicity"
```

---

## Task 12: Add catalog Group 6 — Negocios y estrategia (4 models)

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append Group 6**

Append exactly:

```markdown

### Grupo 6: Negocios y estrategia

**20. Moats**
Una ventaja sostenible que evita que la competencia te alcance. Tipos: marca, network effects, costo, switching costs, escala.
*Ejemplo*: Apple = marca + ecosistema. AWS = escala + switching costs. Coca-Cola = marca + distribución.
*Úsalo cuando*: estás evaluando si un negocio (tuyo o ajeno) es defendible a largo plazo. Sin moat, los márgenes colapsan cuando entra competencia.

**21. Network effects**
El producto se vuelve más valioso para cada usuario conforme más usuarios se suman. El líder casi siempre gana todo.
*Ejemplo*: WhatsApp vale por la gente que ya está ahí. Si la mitad se va a Telegram, tú probablemente también te vas.
*Úsalo cuando*: evalúas un negocio donde "el primero en escala gana". Si no tienes network effects, no esperes "winner takes all".

**22. Switching costs**
Qué tan caro/molesto es para un cliente cambiarse a un competidor. Costos altos = retención alta, sin importar la calidad del producto.
*Ejemplo*: cambiar de banco = días de papeleo = la gente se queda con bancos malísimos. Cambiar de Substack a Beehiiv = un clic = poca retención.
*Úsalo cuando*: tu producto es "bueno" pero la gente lo deja. Probablemente el switching cost es bajo. Construye fricción positiva (datos, integraciones, hábito).

**23. Comoditización**
Cuando todos los competidores ofrecen lo mismo, el único diferenciador es precio. Margen tiende a cero.
*Ejemplo*: hosting compartido = comoditizado. Hosting con DX excelente (Vercel) = no comoditizado, todavía.
*Úsalo cuando*: tu propuesta de valor se parece sospechosamente a la del competidor. Si te están comparando feature-por-feature, ya estás casi comoditizado.
```

- [ ] **Step 2: Verify**

Run: `grep -c "^\*\*2[0-3]\." .claude/skills/super-pensar/SKILL.md`
Expected: `4` (modelos 20-23)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add catalog group 6 — business and strategy"
```

---

## Task 13: Add catalog Group 7 — Comunicación y aprendizaje (2 models)

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append Group 7**

Append exactly:

```markdown

### Grupo 7: Comunicación y aprendizaje

**24. Técnica Feynman**
Si no puedes explicar algo en lenguaje simple a alguien que no sabe del tema, no lo entiendes. La explicación expone los huecos.
*Ejemplo*: ¿Puedes explicar tu producto a tu mamá en 2 frases sin jerga? Si no, tu posicionamiento todavía no es claro.
*Úsalo cuando*: tu copy o pitch suena "complicado" o "técnico". Reescríbelo para alguien fuera del nicho — verás dónde se rompe.

**25. Mapa vs territorio**
El modelo (mapa) nunca es la realidad (territorio). Confundir uno con el otro es la fuente principal de errores costosos.
*Ejemplo*: tu spreadsheet de unit economics dice que ganas $200/cliente. La realidad: incluyes solo costos directos, ignoras tu tiempo, soporte, retornos. El mapa miente.
*Úsalo cuando*: una decisión importante depende de un modelo, métrica o pronóstico. Pregunta: ¿qué está dejando fuera este mapa?
```

- [ ] **Step 2: Verify**

Run: `grep -c "^\*\*2[4-5]\." .claude/skills/super-pensar/SKILL.md`
Expected: `2` (modelos 24-25)

Run: `grep -cE "^\*\*[0-9]+\." .claude/skills/super-pensar/SKILL.md`
Expected: `25` (todos los modelos del catálogo)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add catalog group 7 — communication and learning"
```

---

## Task 14: Add end-to-end example

**Files:**
- Modify: `.claude/skills/super-pensar/SKILL.md` (append)

- [ ] **Step 1: Append the example**

Append exactly:

```markdown

---

## Ejemplo de aplicación end-to-end

Esto es cómo se ve una respuesta correcta del skill. Úsalo como referencia de formato y voz.

**Entrada de Ricardo**: "/super-pensar ¿Subo el precio del libro de $2,500 a $3,200?"

**Respuesta del skill**:

> **Modelos relevantes**: incentivos, asimetría, segundo orden.
>
> **Incentivos**: A $3,200 atraes parejas con menos sensibilidad al precio (boda más cara, menos negociación). El cliente cambia, no solo el precio. **Lo que ilumina**: estás eligiendo cliente, no número.
>
> **Asimetría**: Subir precio cuesta poco si te equivocas (lo bajas otra vez). Mantener precio bajo cuesta meses de runway si era posible cobrar más. **Lo que ilumina**: el riesgo está en NO subir, no en subir.
>
> **Segundo orden**: Si subes precio sin subir percepción, conversión cae. Si subes ambos a la vez, no sabes cuál movió la aguja. **Lo que ilumina**: separa los experimentos.
>
> **Síntesis**: Lo que importa no es el precio nuevo — es si tu narrativa actual sostiene $3,200. Eso depende de qué dicen los clientes que ya pagaron $2,500: ¿les pareció caro o barato?
>
> **Eso es lo que veo. Tú decides.**

Nota: 3 modelos (no más), cada uno aplicado al caso concreto, cierre con pregunta que solo Ricardo puede contestar, sin recomendación directa.
```

- [ ] **Step 2: Verify**

Run: `grep -c "Eso es lo que veo. Tú decides." .claude/skills/super-pensar/SKILL.md`
Expected: `2` (una en el protocolo, una en el ejemplo)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): add end-to-end example to super-pensar"
```

---

## Task 15: Final verification + smoke test

**Files:**
- Read: `.claude/skills/super-pensar/SKILL.md` (no modifications, only verification)

- [ ] **Step 1: Verify file size and structure**

Run: `wc -l .claude/skills/super-pensar/SKILL.md`
Expected: between 280 and 420 lines.

Run: `grep -c "^## " .claude/skills/super-pensar/SKILL.md`
Expected: `7` (Cuándo activarte, Protocolo, Cómo elegir, Voz, Anti-patrones, El catálogo, Ejemplo)

Run: `grep -c "^### Grupo" .claude/skills/super-pensar/SKILL.md`
Expected: `7` (los 7 grupos del catálogo)

Run: `grep -cE "^\*\*[0-9]+\." .claude/skills/super-pensar/SKILL.md`
Expected: `25` (los 25 modelos)

- [ ] **Step 2: Verify YAML frontmatter still parses**

Run: `python3 -c "import yaml; f=open('.claude/skills/super-pensar/SKILL.md').read(); d=yaml.safe_load(f.split('---')[1]); assert d['name']=='super-pensar'; print('OK:', d['name'])"`
Expected: `OK: super-pensar`

- [ ] **Step 3: Manual smoke test**

Tell Ricardo:

> "Skill listo. Para probarlo: en una nueva conversación de Claude Code, escribe `/super-pensar` y un problema (o cualquier frase trigger del skill). Verifica que: (1) seleccione 2-3 modelos, (2) los aplique al problema concreto, (3) cierre con 'Eso es lo que veo. Tú decides.' sin recomendación."

- [ ] **Step 4: Final commit (no-op verification, only if anything changed during smoke test)**

If verification revealed nothing to fix, no commit. If a small fix was needed, commit it:

```bash
git add .claude/skills/super-pensar/SKILL.md
git commit -m "feat(skills): finalize super-pensar after smoke test"
```

---

## Self-Review Checklist (run after writing the plan, before handing off)

- [x] **Spec coverage**: every section of the spec maps to a task.
  - Spec §5 (frontmatter) → Task 1
  - Spec §6 (estructura cuerpo) → Tasks 2-6, 14
  - Spec §7 (catálogo) → Tasks 7-13
  - Spec §8 (ejemplo) → Task 14
  - Spec §9 (anti-patrones) → Task 6
  - Spec §11 (criterios de éxito) → Task 15 (smoke test)

- [x] **No placeholders**: every step has exact content. Verification commands have expected outputs.

- [x] **Type/name consistency**: skill name `super-pensar` used consistently. Path `.claude/skills/super-pensar/SKILL.md` used consistently. All 25 model names listed in spec §7 appear in catalog tasks 7-13.

- [x] **Granularity**: each task is 1-3 actions. Each action is 2-5 minutes.

- [x] **Frequent commits**: every task ends with a commit.
