---
name: cinematic-brief
description: Translate an idea or scene description into an image-generation prompt rendered in the cinematic language of Olivia Dean's music videos (as codified by her Director of Photography). Use this skill WHENEVER Ricardo asks for an image, visualization, prompt, or visual brief — including requests phrased as "hazme una imagen de", "dame un prompt para", "visualiza", "generate an image", "necesito una foto/visual de", or any scene description Ricardo seems to want rendered. This skill is subject-agnostic: it works for people, places, objects, animals, interiors, exteriors, moments — not just weddings or cookbooks. The goal is to build a consistent visual world piece by piece, so treat every image as a contribution to the same universe.
---

# Cinematic Brief

A skill for turning Ricardo's ideas into image prompts in the visual world of Olivia Dean's music videos, translated through the philosophy of her Director of Photography.

## The philosophy (non-negotiable)

Every prompt this skill produces honors four principles from the DP:

1. **Modern nostalgia, not "old."** Not retro, not vintage-filter. It should feel like a vivid memory — rich, tactile, emotionally warm — rendered with contemporary clarity.
2. **Texture over perfection.** Film grain, diffusion bloom on highlights, soft shadows. Never clinical digital sharpness. Never "catalog clean."
3. **The camera is enamored.** It's a proactive observer, physically close (35mm–50mm equivalent), slow drift, caressing the edges of the frame. Not documentary-neutral, not aggressive.
4. **Honest imperfection.** Real grain, real shadows, real asymmetry of life. The frame should feel like a still from an auteur film, not a Pinterest ad.

If a prompt violates any of these, rewrite it.

---

## Input: what to gather from the user

Before generating, make sure you have:

- **Subject / scene**: what's in the frame (people, objects, place, moment)
- **Feeling**: what should it evoke? If the user didn't say, infer one of: *intimacy, confidence, freedom, introspection, anticipation, longing, ease*
- **Tool preference**: GPT Image (ChatGPT) or Midjourney. If not specified, recommend (see §Tool selection)

If the user gives you just a subject ("two people in a restaurant"), don't ask five questions — pick a feeling that fits and proceed. You can note your choice: *"I'm rendering this with an 'intimacy' anchor — say if you'd prefer 'ease' or 'anticipation' instead."*

---

## Step 1: Set the atmospheric anchor

The DP's first decision is always the **contrast and density of light**, determined by feeling. Map the feeling to an anchor:

| Feeling | Light quality | Composition bias | Lens |
|---|---|---|---|
| Intimacy | Warm, low, lateral; deep shadows | Close-up, centered or slightly offset | 35mm or 50mm equiv. |
| Confidence / status | Controlled, architectural, symmetrical key light | Symmetry, wider angle | 35mm or wider |
| Freedom | Natural daylight, overcast or golden hour, wind in the image | Wide, horizon visible, subject small | 35mm or wider |
| Introspection | Cool overcast, window light, soft | Rule of thirds, negative space | 50mm equiv. |
| Anticipation | Light entering from offscreen (window, door) suggesting something about to happen | Subject off-center, object in foreground | 50mm equiv. |
| Longing | Diffused, slightly backlit, slight haze | Subject looking away from camera, or partial obstruction | 50mm or 85mm equiv. |
| Ease | Soft, even, bright but not flat | Loose framing, room to breathe | 35mm equiv. |

---

## Step 2: Pick a world mode

Every image lives in one of four modes. Pick based on the scene:

### A. Outdoor Natural ("Dive" mode)
Coastal, street, countryside, dune, overcast town. Natural light only. Documentary framing but with the enamored camera. Subjects often in motion — walking, wind in hair, candid. Color: soft blues, sandy warmth, muted greens, overcast grays.
**Use for**: anything outdoors, travel moments, morning/evening walks, nature, unscripted life.

### B. Elevated Studio ("So Easy" mode)
Controlled warehouse/stage set with pastel color blocks (mint green, butter yellow, peach, dusty blue). Symmetrical architecture, theatrical but intimate, hints of surrealism. Visible set elements (scaffolding, color blocks, cars as props).
**Use for**: brand-forward imagery, product-as-character shots, editorial portraits, stylized moments where the world is constructed.

### C. Narrative Location ("Art of Loving" mode)
Real locations (office, library, bookshop, apartment, café) with slight stylization. People interacting, narrative micro-moments. Cool institutional light OR warm domestic light. Wes-Anderson-adjacent but more naturalistic, less symmetrical.
**Use for**: multiple people in a space, storytelling moments, relationships, scenes with a beginning/middle/end implied.

### D. Intimate Everyday
Close-up, domestic, tactile. Kitchen counter morning light. A hand on a table. Steam from a cup. Warm, shallow depth of field. Objects treated as subjects. Always a foreground layer.
**Use for**: objects, details, moments of quiet, texture studies, product photography that doesn't look like product photography.

---

## Step 3: Lock the visual grammar

These are always on, in every prompt, regardless of mode:

- **Film stock feel**: 16mm or 35mm film grain, subtle. Reference *Kodak Portra 400* for daylight, *Kodak Vision3 500T* for interiors, *CineStill 800T* for night.
- **Diffusion**: soft highlight bloom, as if shot through a Pro-Mist or Black Glimmerglass filter. Never clinical.
- **Color palette**: earth tones, ochres, terracottas, soft blues, muted greens. Saturated-but-matte (70s fashion magazine logic). Never high-contrast, never fluorescent.
- **Skin tones**: golden, radiant, soft shadows. If skin is visible, it must look warm and alive — never waxy, never flat.
- **Foreground layer**: ALWAYS include something out-of-focus in the foreground that shares the palette but has texture. Rules for foreground objects:
  - Must *frame*, not *cover* the subject
  - Share the scene's palette
  - Have texture (fabric, petal, fibers, steam, fingertips, glass edge)
  - If the shape is too recognizable, it contaminates — use a blur of color+light instead
- **Asymmetry of life**: a wrinkle, a half-eaten plate, a chair slightly off, something used. No pristine surfaces.

---

## Step 4: Assemble the prompt

### For Midjourney (default for atmospheric/cinematic shots)

Template:
```
[subject and action in natural phrase], [environment / world mode], [composition — where subject sits in frame], [foreground element out of focus], shot on [film stock], [lens equivalent], [lighting description], [palette keywords], soft diffusion, film grain, editorial cinematography, [emotional quality], [era/reference if useful] --ar [ratio] --style raw --s 250
```

Aspect ratio guidance:
- `--ar 16:9` — cinematic wide, establishing shots
- `--ar 3:2` — classic 35mm photo
- `--ar 4:5` — portrait/IG-ready, intimate
- `--ar 2:3` — editorial portrait

Example:
```
two people walking into a small trattoria at dusk, warm amber window light spilling onto the cobblestone street, shot from across the road through the blurred edge of a striped awning in the foreground, Kodak Portra 400, 35mm lens, soft diffusion, golden skin tones, muted terracotta and olive palette, film grain, editorial cinematography, quiet anticipation, feels like a still from a Sofia Coppola short --ar 3:2 --style raw --s 250
```

### For GPT Image / ChatGPT image generation

Use natural descriptive prose. Shorter. Describes like a photographer briefing an assistant.

Template:
```
A [scene, in one sentence]. [Where the subject is in the frame, and what's in the foreground, in one sentence]. Shot on 35mm film (Kodak Portra 400), with soft diffusion and visible grain. [Light description: where it comes from, what it does]. Muted color palette of [2-3 palette words]. Golden skin tones, soft shadows. Editorial, cinematic, feels like a still from an auteur film — not a commercial, not a catalog shot.
```

Example:
```
A woman in a cream linen dress laughing while holding a cup of coffee outside a small Italian bakery. She's slightly off-center on the right; in the blurred foreground on the left, the edge of a striped awning frames the shot. Shot on 35mm film (Kodak Portra 400), with soft diffusion and visible grain. Morning light comes in low and golden from the left, glowing on her cheek and the rim of the cup. Muted color palette of terracotta, cream, and soft sage. Golden skin tones, soft shadows. Editorial, cinematic, feels like a still from an auteur film — not a commercial, not a catalog shot.
```

---

## Tool selection

If the user doesn't specify, recommend:

**Midjourney** when:
- Wide or medium shots with atmospheric weight
- The "film feel" is the point (grain, color science, diffusion)
- Outdoor, environmental, multi-element compositions
- Scenes where specific film-stock emulation matters
- Default choice for brand imagery Ricardo will actually use

**GPT Image (ChatGPT)** when:
- Tight portraits or single-subject focus
- You need specific elements the prompt literally describes (a specific logo, a readable sign, a particular object shape)
- Quick iteration / brainstorming where fidelity to prompt matters more than atmosphere
- Scenes with text or graphic elements

When in doubt: **Midjourney for the hero shot, GPT Image for the iteration**.

Always offer the alternative prompt at the end of your response, so Ricardo can try both.

---

## Output format

Every response should include:

1. **One-line visual brief**: "Here's how I'm reading this: [feeling] in [world mode], camera at [distance/lens], [one distinctive element]."
2. **The primary prompt** (Midjourney or GPT Image, whichever is recommended) in a code block.
3. **The alternative prompt** in the other tool's format, also in a code block.
4. **A short note (optional)** if there's a stylistic choice Ricardo should know about — e.g., "I went with introspection here because a dog alone reads better as a quiet moment than a playful one; say the word if you want it playful instead."

Keep commentary minimal. The prompts are the deliverable.

---

## Worked examples

### Example 1 — "Two people entering a restaurant"

Reading: **anticipation** in **Narrative Location**. 35mm equivalent, wide enough to see the threshold, foreground obstruction from the doorway.

Midjourney:
```
a couple in their late twenties stepping through the doorway of a small neighborhood restaurant, seen from inside looking back toward the street, their silhouettes backlit by the street outside, blurred edge of a hanging menu in the foreground, Kodak Portra 400, 35mm lens, warm tungsten interior light meeting cool blue street light, muted terracotta and soft blue palette, soft diffusion, film grain, editorial cinematography, anticipation, feels like the opening shot of a film --ar 16:9 --style raw --s 250
```

GPT Image:
```
A couple in their late twenties stepping through the doorway of a small neighborhood restaurant, photographed from inside looking back toward the street. They're slightly silhouetted against the cool blue evening outside, while warm tungsten light from inside catches the edges of their clothes. In the blurred foreground on the right, the edge of a hanging paper menu frames the shot. Shot on 35mm film (Kodak Portra 400), with soft diffusion and visible grain. Muted palette of terracotta, warm amber, and soft blue. Golden skin tones, soft shadows. Editorial, cinematic, feels like the opening shot of an auteur film — not a commercial, not a catalog shot.
```

### Example 2 — "A dog"

Reading: **introspection** in **Intimate Everyday**. Close-ish, a dog in a sunbeam on a wooden floor; foreground of a curtain edge or table leg blurred.

Midjourney:
```
a medium-sized mixed-breed dog lying in a warm sunbeam on a worn wooden floor, chin on paws, eyes half-closed, dust motes in the light, blurred edge of a linen curtain in the foreground, Kodak Portra 400, 50mm lens, late afternoon window light, muted ochre and warm wood palette, soft diffusion, film grain, editorial cinematography, quiet introspection --ar 3:2 --style raw --s 250
```

GPT Image:
```
A medium-sized mixed-breed dog lying in a warm sunbeam on a worn wooden floor, chin resting on its paws, eyes half-closed. Dust motes hang in the light. In the blurred foreground, the edge of a linen curtain frames the shot. Shot on 35mm film (Kodak Portra 400), with soft diffusion and visible grain. Late afternoon light comes through a window, casting a long golden shape across the floor. Muted palette of ochre, warm wood, and cream. Soft shadows. Editorial, cinematic, feels like a still from an auteur film — not a commercial, not a catalog shot.
```

### Example 3 — "A person alone in a kitchen"

Reading: **ease** in **Intimate Everyday**. 50mm close-ish, window light, hands-and-counter detail with the person softened behind.

Midjourney:
```
a woman in her late twenties in a loose cotton shirt standing at a kitchen counter in the morning, slicing a lemon, her face half-lit by window light, blurred edge of a ceramic bowl in the foreground, Kodak Portra 400, 50mm lens, soft morning light from the left, muted sage and cream palette with a citrus yellow accent, soft diffusion, film grain, editorial cinematography, quiet ease, feels like a still from a slow film --ar 4:5 --style raw --s 250
```

GPT Image:
```
A woman in her late twenties, wearing a loose cotton shirt, standing at a kitchen counter on a weekday morning. She's slicing a lemon; her face is half-lit by window light from the left. In the blurred foreground on the right, the edge of a ceramic bowl frames the shot. Shot on 35mm film (Kodak Portra 400), with soft diffusion and visible grain. Soft morning light, golden skin, muted palette of sage green and cream with a citrus yellow accent. Editorial, cinematic, feels like a still from a slow film — not a commercial, not a catalog shot.
```

### Example 4 — "A table after dinner"

Reading: **longing / anticipation** in **Intimate Everyday**. No people in frame, but their presence implied through the use marks.

Midjourney:
```
a long wooden table after a dinner party, half-empty wine glasses, a crumpled linen napkin, candle wax pooled on a brass holder, the last of the evening light from a window, blurred edge of an empty chair in the foreground, Kodak Portra 400, 35mm lens, low warm side light, muted terracotta and olive and wine red palette, soft diffusion, film grain, editorial cinematography, quiet longing, the feeling of people who just left the room --ar 16:9 --style raw --s 250
```

GPT Image:
```
A long wooden table after a dinner party, photographed from the end of the table looking down its length. Half-empty wine glasses, a crumpled linen napkin, candle wax pooled on a brass holder. In the blurred foreground, the edge of an empty chair back frames the shot. Shot on 35mm film (Kodak Portra 400), with soft diffusion and visible grain. The last warm evening light comes in low from a window on the left. Muted palette of terracotta, olive, and wine red. Editorial, cinematic — the feeling of a room someone just left. Not a commercial, not a catalog shot.
```

---

## Quality check before outputting

Before returning a prompt, verify:

- [ ] Does it name a film stock or explicitly say "film grain"?
- [ ] Does it specify soft diffusion or bloomed highlights?
- [ ] Does it include a foreground layer out of focus?
- [ ] Is the palette muted (not saturated, not pastel-bright, not high-contrast)?
- [ ] Is the lens equivalent 35mm or 50mm (enamored camera range)?
- [ ] Does it feel like an auteur film frame, or like a catalog shot?
- [ ] Does it avoid clichés like "cinematic lighting," "hyper-realistic," "masterpiece," "8k"?

If any box is unchecked, rewrite before outputting.

---

## What this skill deliberately avoids

- Wedding industry clichés ("light & airy," "dreamy," "magical")
- The words "cherish," "memories," "treasure," "special," "beautiful" in prompts — describe through concrete image, not adjective
- Pinterest-ad aesthetic (perfect, bright, centered, saturated)
- Over-prompt engineering ("masterpiece, 8k, trending on artstation" — noise)
- Symmetry as default (only when the feeling calls for confidence/status)
- Saturated colors, high contrast, clean digital look

---

## Notes for iteration with Ricardo

- He'll often describe a scene in one line. That's enough — infer the feeling and pick a mode.
- If he gives feedback ("too dark," "make it more intimate," "less studio, more outdoor"), adjust the mode and/or anchor, don't just add words.
- When building a series, keep the film stock and palette language consistent across prompts so the world feels continuous.
- He sometimes references Brooklyn / NYC editorial sensibilities (Margot Cole filter). That's already aligned with this grammar — no special handling needed, just keep the imperfection honest.
