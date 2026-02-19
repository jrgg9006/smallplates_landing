SMALL PLATES & CO.
AI IMAGE GENERATION PIPELINE
Technical Architecture & Implementation Brief

Prepared for: CTO — Small Plates & Company
Purpose: Implement automated recipe → image generation pipeline using Black Forest (FLUX) integrated into existing infrastructure.

1. Executive Summary

Small Plates currently receives recipes from clients and processes them through an AI workflow that:

Stores recipes in Supabase.

Cleans text using AI agents hosted on Railway.

Generates prompts using ChatGPT.

Saves processed data back into Supabase.

Requires manual image generation in MidJourney.

Uploads images manually through an admin panel.

Upscales images via Replicate.

This manual image step is the main scalability bottleneck.

Objective

Create a fully automated image generation pipeline that:

Converts recipes into images automatically.

Maintains brand consistency.

Achieves ~80–90% correctness automatically.

Operates within ultra-low cost constraints.

Reuses existing infrastructure.

Requires minimal architectural changes.

Key Insight

The correct architecture is NOT:

Recipe → Prompt → Image


Instead:

Recipe → Visual Interpretation → Structured Schema → Prompt → Image → AI Validation → Upscale


The addition of a visual schema layer dramatically increases image accuracy and consistency.

2. Current System (Existing Infrastructure)
Data Flow (Today)
Client Recipe Input
        ↓
Supabase (recipes table)
        ↓
Railway AI Agent (cleaning)
        ↓
Prompt generation agent
        ↓
Update Supabase
        ↓
Manual MidJourney image creation ❌
        ↓
Admin upload
        ↓
Replicate upscale

Existing Components (REUSED)
Component	Status
Supabase database	✅ keep
Railway microservice agents	✅ keep
ChatGPT prompt agent	✅ extend
Landing codebase	✅ keep
Admin panel	✅ keep
Replicate upscaling	✅ keep

No rebuild required.

3. New System Overview

We introduce three new automated agents:

Visual Schema Agent (NEW)

FLUX Image Generator (NEW)

Vision QA Validator (NEW)

New Pipeline
Recipe Stored
      ↓
Cleaner Agent
      ↓
Visual Schema Agent
      ↓
Prompt Generator
      ↓
FLUX Image Generator
      ↓
Vision QA Validation
      ↓
Retry if needed
      ↓
Replicate Upscale
      ↓
Ready Image

4. Architectural Principles
1. Separation of Responsibilities

Each AI step performs ONE task only.

2. Deterministic Style

Brand visual identity is locked via:

fixed prompt base

fixed seed

fixed model parameters

3. Automated Quality Control

Images are validated automatically using vision models.

4. Cost Optimization

Primary model:

FLUX.2 klein


Target cost:
≈ $0.01 per recipe image.

5. Database Changes (Supabase)
Extend recipes table

Add columns:

cleaned_recipe_name TEXT
cleaned_ingredients JSONB
cleaned_steps TEXT

visual_schema JSONB

image_prompt TEXT
image_model TEXT

image_status TEXT
image_attempts INT DEFAULT 0

image_url_raw TEXT
image_url_upscaled TEXT

image_validation_notes JSONB
last_error TEXT

Status Enum
new
cleaned
schema_ready
prompted
generating
validating
retrying
upscaling
ready
failed

6. Agent Architecture (Railway)

All agents can live inside the same microservice.

Recommended endpoints:

POST /clean
POST /schema
POST /prompt
POST /generate
POST /validate
POST /upscale

7. Step-by-Step Technical Flow
STEP 1 — Recipe Insert

Trigger: client submission

Supabase record created:

image_status = 'new'

STEP 2 — Cleaner Agent (existing)

Railway agent:

grammar correction

normalization

ingredient structuring

Update:

image_status = 'cleaned'

STEP 3 — Visual Schema Agent (NEW)
Purpose

Translate recipe into visual-only information.

Input

cleaned recipe.

Output (JSON example)
{
  "dish_type": "pasta",
  "must_show": ["spaghetti", "lemon zest", "parmesan"],
  "must_not_show": ["chicken", "shrimp"],
  "plating": "shallow ceramic bowl",
  "lighting": "soft natural window light",
  "camera_angle": "45 degree",
  "brand_style": "Small Plates editorial warm minimal"
}


Update:

visual_schema saved
image_status = 'schema_ready'

STEP 4 — Prompt Generator (Modified Existing Agent)

Prompt generated from:

visual_schema + Brand DNA Prompt Base


Example:

editorial cookbook photography, creamy lemon pasta served in a shallow ceramic bowl, visible spaghetti coated in glossy lemon butter sauce, grated parmesan and lemon zest garnish, soft natural window light, warm neutral tones, imperfect linen tablecloth, analog film feeling


Update:

image_status = 'prompted'

STEP 5 — FLUX Image Generation (NEW)

Railway calls:

Black Forest FLUX API
Model: flux.2-klein


Parameters (locked):

seed: fixed
resolution: fixed
steps: constant
guidance: constant


Store image → Supabase Storage.

Update:

image_url_raw
image_attempts += 1
image_status = 'validating'

STEP 6 — Vision QA Validation (NEW)

ChatGPT Vision evaluates image.

Checklist:

correct dish present?

required ingredients visible?

forbidden items absent?

composition valid?

Outcomes
PASS
image_status = 'upscaling'

FAIL (attempts < 2)

Prompt auto-adjusted → regenerate.

FAIL final
image_status = 'failed'

STEP 7 — Upscaling (Existing Replicate Integration)

Send raw image → Replicate.

Update:

image_url_upscaled
image_status = 'ready'

STEP 8 — Admin Panel

Admin panel now becomes:

review layer only

approve / reject

Reject → rerun pipeline.

8. System Diagram
flowchart TD
A[Recipe Inserted] --> B[Cleaner Agent]
B --> C[Visual Schema Agent]
C --> D[Prompt Generator]
D --> E[FLUX Image Generation]
E --> F[Vision QA Validation]
F -->|Pass| G[Replicate Upscale]
F -->|Retry| D
F -->|Fail| X[Failed]
G --> H[Ready Image]

9. Cost Model

Approximate per recipe:

Step	Cost
ChatGPT schema	~$0.002
Prompt generation	~$0.001
FLUX klein	~$0.004
Validation	~$0.003
Upscale	~$0.002
Total	≈ $0.01

50 recipes ≈ $0.50.

10. Implementation Order (Recommended)
Phase 1 (1–2 days)

Add DB fields

Add status workflow

Phase 2 (2–3 days)

Implement schema agent

Modify prompt generator

Phase 3 (2 days)

Integrate FLUX API

Phase 4 (2 days)

Vision QA + retries

Phase 5 (1 day)

Connect upscale trigger

Total estimated implementation:
~1 week engineering time.

11. Expected Outcome

After deployment:

✅ Recipes automatically produce images
✅ Brand-consistent visuals
✅ 80–90% success without manual work
✅ Cost under $8 for entire cookbook production
✅ Fully scalable pipeline

12. Strategic Result

Small Plates transitions from:

Manual AI-assisted design

to

Fully automated editorial image generation.

This effectively creates a permanent AI food photography system aligned with brand identity.