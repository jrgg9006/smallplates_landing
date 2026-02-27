# TikTok Content Agent — Complete Implementation Spec (v2)

## Small Plates & Co.

**What this document is:** Everything needed to build a TikTok/Reels content generation tool inside the Small Plates admin panel. Three parts: the system prompt for the Claude API agent, the UI spec for the admin page, and the API route spec.

**What it does:** Ricardo or Ana Karen enters a content idea + selects a content pillar → the system sends it to Claude API with a comprehensive system prompt → Claude returns a complete video production brief with script, second-by-second editing timeline, text overlay specs, music cues, and CapCut-specific guidance → the brief is displayed in the admin panel for Ana Karen to execute.

**What changed in v2:**
- Complete video design system (colors, fonts, positions, animations) baked into the prompt
- Second-by-second editing timeline in the output format (the key improvement)
- Two-playlist music strategy (Headphones In + Dinner at Ours)
- 80/20 content philosophy (platform-native vs editorial)
- Enhanced Pillar 2 "What They Wrote" format with series identity
- More detailed CapCut editing checklist
- Optimization notes include target algorithm metric

**No database required.** Generation-only tool.

---

# PART 1: THE SYSTEM PROMPT

The system prompt is stored in `lib/tiktok-agent/system-prompt.ts` as a TypeScript constant. See the separate `system-prompt.ts` file for the complete prompt.

The prompt contains:
- Brand knowledge (who we are, voice, audiences)
- Content philosophy (80/20 split, two-voice architecture)
- Five content pillars with specific guidance for each
- Complete video design system (colors, typography, transitions, image overlays, color grading, framing)
- Music strategy with two moods mapped to specific playlists and pillars
- Video anatomy (hook → context → content → close → end card)
- 6 hook structures with examples
- 3 close types
- Standard end card spec
- Duration targets by pillar
- TikTok algorithm signals
- Complete output format spec with editing timeline
- 14 generation guidelines

### Key design decisions in the prompt:

**The Editing Timeline is the core output.** Previous version had a script + a text table + a checklist. The new version adds a detailed second-by-second editing timeline that describes every moment of the video across four layers: video, text, audio, and edit notes. This is what makes briefs actually executable — Ana Karen can sit in CapCut and follow it step by step.

**Music enters after second 2-3.** The hook is always voice-only. This makes the opening feel like a person talking to you, not a brand ad. Music fades in subtly after the hook.

**Hard cuts everywhere except end card.** No crossfades, no effects, no transitions between shots. The only fade is to the Warm White end card. Exception: Pillar 2 can use a soft dissolve entering the message moment.

**End card is always the same.** "Recipes from the people who love you." + "smallplatesandco.com" on Warm White (#FAF7F2) background. This creates visual consistency across all videos.

**Pillar 3 has no music.** Voice-only for hot takes. The absence of music signals authenticity and seriousness.

---

# PART 2: UI SPEC

## Location
`app/(admin)/admin/tiktok/page.tsx`

## Layout
Simple, single-column. Form on top, results below.

### Input Form

```
+---------------------------------------------------+
|  TikTok Content Generator                         |
|                                                   |
|  Pillar: [Dropdown]                               |
|  +-----------------------------------------------+|
|  | Product  v                                    ||
|  | ---------                                     ||
|  | Product (This Is What We Make)                ||
|  | What They Wrote (Emotional Gold)              ||
|  | Wedding Talk (Wedding Real Talk)              ||
|  | Kitchen Life                                  ||
|  | Other                                         ||
|  +-----------------------------------------------+|
|                                                   |
|  Your idea:                                       |
|  +-----------------------------------------------+|
|  |                                               ||
|  |  Textarea — 3-4 lines visible                 ||
|  |  Placeholder: "Describe your video            ||
|  |  idea. What do you want to talk about?        ||
|  |  Any specific angle or message?"              ||
|  |                                               ||
|  +-----------------------------------------------+|
|                                                   |
|  [Generate Brief]                                 |
|                                                   |
+---------------------------------------------------+
```

**Dropdown options (value -> label):**
- `product` -> "Pillar 1: Product — This Is What We Make"
- `notes` -> "Pillar 2: Notes — What They Wrote"
- `wedding_talk` -> "Pillar 3: Wedding Talk — Wedding Real Talk"
- `kitchen_life` -> "Pillar 4: Kitchen Life"
- `other` -> "Pillar 5: Other"

**Textarea:** Free-form text. No character limit but placeholder guides the user. The user may write in Spanish or English. The agent always generates the SCRIPT in English (US market) but the rest of the brief can match the user's language.

**Generate Brief button:** Sends request to API route. Loading state during generation. Disabled during generation.

### Results Section

The generated brief appears below the form, rendered as formatted markdown. Use a markdown renderer.

Buttons:
- **"Copy"** — copies entire brief as plain text to clipboard (for pasting into Notes on phone while filming)
- **"Generate Another"** — clears results and scrolls back to form

---

# PART 3: API ROUTE SPEC

## Endpoint
`POST /api/admin/tiktok/generate`

## Request Body
```typescript
{
  pillar: 'product' | 'notes' | 'wedding_talk' | 'kitchen_life' | 'other';
  idea: string;
}
```

## Validation
- `pillar` must be one of the five options
- `idea` must be non-empty and less than 2000 characters
- Request must be authenticated (admin only)

## Claude API Call

```typescript
import { TIKTOK_SYSTEM_PROMPT, buildUserMessage, type Pillar } from '@/lib/tiktok-agent/system-prompt';

const stream = await anthropic.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4000,
  system: TIKTOK_SYSTEM_PROMPT,
  messages: [
    {
      role: 'user',
      content: buildUserMessage(pillar as Pillar, idea)
    }
  ]
});
```

**Model:** claude-sonnet-4-5-20250929 for best quality/speed balance with long system prompt.

**Streaming:** Use Anthropic streaming API for progressive rendering.

## Error Handling
- API down/rate limited: "Generation failed. Try again in a moment."
- Empty input: validation error before sending
- Short/malformed response: show raw response anyway

---

# PART 4: ENVIRONMENT & FILES

## Required
- `ANTHROPIC_API_KEY` in environment variables
- System prompt as version-controlled constant (not database)

## File Structure
```
lib/
  tiktok-agent/
    system-prompt.ts    — The system prompt, pillar config, and message builder

app/(admin)/admin/tiktok/
  page.tsx              — The UI page

api/admin/tiktok/
  generate/
    route.ts            — The API route
```

---

# PART 5: FUTURE ADDITIONS (NOT NOW)

1. **Save briefs** — Database persistence with pillar, idea, timestamp
2. **Performance tracking** — Enter metrics after publishing, link to brief
3. **Learning loop** — Feed performance data into prompt
4. **Calendar view** — Planned and published content
5. **Template library** — Save best briefs as reusable templates
6. **Batch generation** — Generate a week's content at once

Build simple first. Use for 2-3 weeks. Then decide what to add.