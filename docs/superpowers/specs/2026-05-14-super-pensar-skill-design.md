# Spec: Skill `super-pensar`

**Fecha**: 2026-05-14
**Autor**: Ricardo (con asistencia de Claude)
**Estado**: Diseño aprobado, listo para implementación

---

## 1. Propósito

Skill que aplica **modelos mentales (Munger / Farnam Street)** a problemas difíciles para iluminar ángulos no obvios. Trigger explícito. No da recomendaciones — entrega análisis y deja la decisión al usuario.

## 2. Por qué existe

Ya existen:
- `superpowers:brainstorming` → estructura ideas hacia un design doc.
- `founder-coaching` → acompaña emocional + estratégicamente con voz PG/YC.

Lo que **falta** es un modo de **pensamiento frío con frameworks**: "necesito ver este problema desde 2-3 lentes distintos antes de decidir". Eso es lo que cubre `super-pensar`.

`super-pensar` complementa, no reemplaza, los otros dos skills.

## 3. Decisiones de diseño (con justificación)

| Decisión | Elegido | Por qué |
|---|---|---|
| Trigger | Explícito (`/super-pensar` + frases naturales) | Cero falsos positivos. Skill caro en tokens — solo cuando se pide |
| Frameworks | Solo Mental Models | Foco. No mezclar con first principles, six hats, pre-mortem |
| Selección | 2-3 modelos relevantes (no todos) | Más de 3 = ruido, no señal |
| Catálogo | 25 modelos bien desarrollados | Mejor calidad de aplicación que 50 shallow |
| Estructura | Todo-en-uno (un solo SKILL.md) | Skill auto-contenido, simple de mantener |
| Cierre | Síntesis sin recomendación | Respeta autonomía del founder como decisor |
| Scope | Cualquier problema difícil | Founder, técnico, personal — todos |

## 4. Ubicación del archivo

```
/Users/macbook/Code/smallplates_landing/.claude/skills/super-pensar/SKILL.md
```

Sigue convención del usuario (mismo path que `founder-coaching`, `cinematic-brief`, etc.).

## 5. Frontmatter

```yaml
---
name: super-pensar
description: Activate deep mental-models thinking (Munger / Farnam Street style) for hard decisions or stuck problems. Use ONLY when Ricardo invokes "/super-pensar", "super pensar", "piensa profundo", "modelos mentales", or "necesito pensar esto bien". Skill picks 2-3 most relevant mental models from a curated catalog of 25 (incentives, second-order effects, inversion, opportunity cost, Hanlon's razor, etc.) and applies them to the problem. Closes with synthesis but no recommendation — respects Ricardo's autonomy as decision-maker. Works for any hard problem: founder/strategic, technical, personal.
---
```

## 6. Estructura del cuerpo del SKILL.md

```
# Super Pensar — Modelos Mentales

## Cuándo activarte
- Trigger explícito (lista de frases)
- Cuándo NO usarlo (preguntas factuales, código simple, búsquedas)

## Protocolo (4 pasos)
1. Entender el problema (1 pregunta máximo)
2. Seleccionar 2-3 modelos del catálogo
3. Aplicar cada modelo en su bloque
4. Cierre: síntesis sin recomendación

## Cómo elegir los modelos correctos
Heurística por tipo de pregunta:
- "¿Hago X o Y?" → opportunity cost + inversión
- "¿Por qué pasa esto?" → incentivos + Hanlon + 2do orden
- "¿Cómo crece esto?" → network effects + escala + Goodhart
- "¿Vale la pena?" → expected value + asimetría
Si ambiguo → 1 de comportamiento + 1 de sistemas + 1 de decisión.

## Voz
- Español por default
- Cada modelo en 3-5 líneas máximo
- Formato: **[Modelo]**: aplicación. **Lo que ilumina**: insight no obvio
- Prohibido: "fascinante", "interesante", emojis, jerga académica
- Cierre: "Eso es lo que veo. Tú decides."

## Ejemplo de aplicación end-to-end
Caso pricing como referencia del formato esperado.

## El catálogo (25 modelos en 7 grupos)
1. Toma de decisión (4 modelos)
2. Comportamiento humano (5)
3. Sistemas y consecuencias (4)
4. Probabilidad y riesgo (3)
5. Foco y simplicidad (3)
6. Negocios y estrategia (4)
7. Comunicación y aprendizaje (2)
```

## 7. Catálogo — 25 modelos finales

Cada modelo se documenta con:
- **Nombre** (negritas)
- Definición en 1 línea
- *Ejemplo concreto* en 1-2 líneas
- *Úsalo cuando*: criterio de aplicación en 1 línea

### Grupo 1: Toma de decisión (4)
1. **Inversión** (think backwards)
2. **Opportunity cost**
3. **Expected value**
4. **Asimetría / costo de equivocarse**

### Grupo 2: Comportamiento humano (5)
5. **Incentivos**
6. **Sesgo de confirmación**
7. **Hanlon's razor**
8. **Social proof**
9. **Reciprocidad**

### Grupo 3: Sistemas y consecuencias (4)
10. **Segundo orden**
11. **Chesterton's fence**
12. **Ley de Goodhart**
13. **Efectos compuestos**

### Grupo 4: Probabilidad y riesgo (3)
14. **Padrón base (base rates)**
15. **Regresión a la media**
16. **Black Swan / asimetría de cola**

### Grupo 5: Foco y simplicidad (3)
17. **Navaja de Occam**
18. **Pareto 80/20**
19. **Círculo de competencia**

### Grupo 6: Negocios y estrategia (4)
20. **Moats**
21. **Network effects**
22. **Switching costs**
23. **Comoditización**

### Grupo 7: Comunicación y aprendizaje (2)
24. **Técnica Feynman**
25. **Mapa vs territorio**

## 8. Ejemplo end-to-end (referencia para el implementador)

```
Tu pregunta: "¿Subo el precio del libro de $2,500 a $3,200?"

Modelos relevantes: incentivos, asimetría, segundo orden.

Incentivos: A $3,200 atraes parejas con menos sensibilidad al precio
(boda más cara, menos negociación). El cliente cambia, no solo el precio.

Asimetría: Subir precio cuesta poco si te equivocas (bajas otra vez).
Mantener precio bajo cuesta meses de runway si era posible cobrar más.

Segundo orden: Si subes precio sin subir percepción, conversión cae.
Si subes ambos a la vez, no sabes cuál movió la aguja.

Síntesis: Lo que importa no es el precio nuevo — es si tu narrativa actual
sostiene $3,200. Eso depende de qué dicen los clientes que ya pagaron $2,500:
¿les pareció caro o barato?

Eso es lo que veo. Tú decides.
```

## 9. Anti-patrones a evitar (van en el SKILL.md)

- ❌ Aplicar más de 3 modelos por inercia
- ❌ Dar recomendación cuando no se pidió
- ❌ Usar jerga académica ("la heurística de disponibilidad sugiere...")
- ❌ Análisis genérico que no aterriza al problema concreto
- ❌ Cerrar con "espero que esto te ayude" o equivalente performativo
- ❌ Aplicar siempre los mismos 3 modelos (incentivos / 2do orden / asimetría) sin pensar si aplican

## 10. Tamaño esperado

- SKILL.md: ~350-400 líneas
- Tokens al cargar: ~3,000-3,500
- Tiempo estimado de implementación: 1 sesión (~30-45 min)

## 11. Criterios de éxito

El skill funciona si:
- Se invoca solo cuando Ricardo lo pide explícitamente (cero falsos positivos)
- Selecciona 2-3 modelos genuinamente relevantes (no los mismos siempre)
- Cada modelo se aplica al problema concreto (no definiciones genéricas)
- El cierre nunca incluye recomendación directa
- Voz consistente con `founder-coaching` (español, dry, específico)

## 12. Out of scope (NO está en este spec)

- Auto-trigger por detección semántica
- Catálogo extendido más allá de 25 modelos
- First principles, six hats, pre-mortem (skills futuros si se necesitan)
- Persistencia de análisis en archivos
- Integración automática desde `founder-coaching`

---

**Próximo paso**: invocar `superpowers:writing-plans` para detallar el plan de implementación de este SKILL.md.
