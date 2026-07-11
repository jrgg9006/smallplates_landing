# Dossier — estructura de campaña Meta para APRENDER con $60/día

*10 jul 2026. Best-practice 2025–2026. Motivó la decisión #18 (consolidar).*

## Veredicto: CONSOLIDAR (un ad set), no fragmentar por ocasión

- *"Run fewer ad sets with higher budgets rather than many ad sets with thin budgets. Consolidation beats fragmentation at every budget level."* (Pigeon Digital)
- *"If your total daily budget is $25, don't use CBO across 5 ad sets... use ABO to put all $25 into a single ad set."* (Superscale)

## El porqué duro: learning phase
- ~50 eventos de optimización/semana/ad set para salir de learning. Debajo = "Learning Limited".
- *"If you have five ad sets each getting 8 conversions per week, combining them into one gives you 40 weekly conversions—much closer to the 50-event threshold."* (Pigeon Digital)
- Fórmula: CPA × 50 ÷ 7 = presupuesto diario. A $60/día ⇒ signup ≤ ~$8.40 para salir en ~1 semana.
- Optimizar a evento barato/alto en funnel (signup free-tier, NO compra): *"Choosing the wrong optimization event is the number-one reason campaigns get stuck in Learning Limited."* (Pigeon Digital)

## Creative testing
- **# creativos por ad set: 3–5** con presupuesto normal/chico (Adligator, Motion); 8–15 es solo para presupuesto alto (era Advantage+/Andromeda). A $60/día → banda baja.
- **1 concepto = 1 anuncio distinto.** NO Dynamic Creative (DCT) si quieres atribuir el ganador a una ocasión/mensaje — DCT mezcla componentes y roba la lectura.
- ABO para testear, CBO/Advantage+ para escalar ganadores después. Cost cap solo para escala, no discovery.

## Starvation (el riesgo del consolidado) — bien documentado
- *"Inside an ad set it behaves like a reinforcement learner... skews budget toward the creatives showing the strongest signal."* (Adligator)
- *"Usually 1-2 ads capture 70-80% of spend, 2-3 get scraps, and the rest get near-zero."* (Adligator)
- El ganador temprano puede ser de SUERTE: *"the algorithm starts shifting budget toward the early front-runner often within the first 24-48 hours, before either variant has received enough impressions... producing a confident-looking but unreliable outcome."* (Benly.ai)
- Mitigación: limitar a 3–5 creativos; ventana mínima 7 días; no matar los que gastaron <3% (starved); pausar los que gasten 2–3× CPA sin resultado; rotar tandas cada 7–14 días.

## Audiencia: broad manual
- *"Broad targeting... outperforms in the majority of accounts. Meta's signal quality from creative content has gotten good enough to find your buyer."* (mr.Booster)
- *"Your creative is now your targeting."* (mr.Booster)

## Leer "qué ocasión gana" desde un ad set consolidado — la limitación clave
- Creative breakdown da CTR/CPC por ad, PERO *"you cannot see counts for custom conversions or events broken down at this level."*
- Gasto desigual sesga: un "perdedor" puede ser un starved.
- *"Consolidate when you want to maximize delivery efficiency, and separate when you need cleaner diagnostic data."* (Relevant Audience) ← el trade-off central.
- **Cobertura Small Plates:** `groups.occasion` del onboarding da la conversión-por-ocasión que Meta no da limpio. Meta = CTR (qué frena scroll); onboarding = qué ocasión convirtió.

## Límite honesto a $60/día
No se llega a "50 conversiones/variante" (ortodoxia de significancia). Decisiones con señal DIRECCIONAL (CTR + primeros leads + onboarding), no 95%. Mitigar: menos variantes vivas a la vez (2–4 hipótesis más fuertes), rotar en tandas.

## Nota
El research citó "mamá hispana en EE.UU." leyéndolo de memoria vieja — OBSOLETO (descartado, ads en inglés US, ver decisión previa). No afecta las conclusiones de estructura.

## Fuentes
Pigeon Digital (consolidation; 50-conv rule), Superscale (CBO vs ABO), AdsUploader, Motion (creative testing 2025), Adligator (# creativos 2026), Disrupter Dispatch, Madgicx (DCT), Affect Group (Advantage+/Andromeda), mr.Booster (targeting 2025), Benly.ai (A/B testing), Relevant Audience (creative breakdown), AdLibrary (atribución), The Optimizer (cost cap).
