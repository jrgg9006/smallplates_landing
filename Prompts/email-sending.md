# Recipe Showcase — Admin Panel Spec

> **What:** A new section in the admin panel to send recipe preview emails to guests who opted in.
> **Why:** Guests who contributed a recipe and opted in want to see their page in the final book. This email is also a conversion tool — it includes a CTA to purchase a book for someone else.
> **Lifespan:** Temporary. Year 1 tool. Will be replaced by Customer.io or equivalent. Build simple, build practical, delete later.

---

## The Job

When a book is in production, Ricardo takes a screenshot of each recipe's 2-page spread from InDesign. This tool lets him:

1. See which guests opted in (filtered by group/wedding)
2. Upload the spread screenshot for each guest's recipe
3. Send the preview email with one click
4. Track what's been sent

That's it. No automations. No batch sends. One guest at a time, manually triggered.

---

## Where It Lives

```
app/(admin)/admin/showcase/page.tsx     ← The page
app/api/v1/admin/showcase/send/route.ts ← API: send email
app/api/v1/admin/showcase/upload/route.ts ← API: upload spread image
```

New card on the admin dashboard (`app/(admin)/admin/page.tsx`):
- Emoji: 📖
- Title: "Recipe Showcase"
- Description: "Send recipe previews to opted-in guests"
- Links to `/admin/showcase`

---

## Database Tables Involved

### Reading (no changes needed)

| Table | What We Pull | Join |
|-------|-------------|------|
| `guests` | `id`, `first_name`, `last_name`, `notify_opt_in`, `notify_email`, `group_id`, `status` | Filter: `notify_opt_in = true` |
| `guest_recipes` | `id`, `recipe_name`, `guest_id`, `group_id` | Join on `guest_id` where `deleted_at IS NULL` |
| `groups` | `id`, `name`, `couple_display_name` | Join on `group_id` for couple name and group filter |

### Writing

| Table | What We Write | When |
|-------|--------------|------|
| `communication_log` | Log every sent email | After successful Postmark send |
| `guest_recipes` | `showcase_image_url` (new column) | After uploading spread image |

### New Column Needed

```sql
ALTER TABLE guest_recipes
ADD COLUMN showcase_image_url text;

COMMENT ON COLUMN guest_recipes.showcase_image_url IS
  'URL to the spread screenshot in Supabase Storage. Used for the recipe showcase email.';
```

That's the only schema change. One column.

---

## Supabase Storage

Spread images go to a new bucket or folder:

```
showcase/{group_id}/{recipe_id}.png
```

Example:
```
showcase/79670c62-9aa9-4d75-ad9a-7a72478d6f39/abc123-recipe-id.png
```

Public URL is used directly in the email (no CID embedding needed from the admin panel — the API route handles Postmark attachment).

---

## The Query

One query powers the whole page:

```sql
SELECT
  g.id AS guest_id,
  g.first_name,
  g.last_name,
  g.notify_email,
  g.notify_opt_in_at,
  gr.id AS recipe_id,
  gr.recipe_name,
  gr.showcase_image_url,
  grp.id AS group_id,
  grp.name AS group_name,
  grp.couple_display_name,
  cl.sent_at AS email_sent_at
FROM guests g
JOIN guest_recipes gr ON gr.guest_id = g.id AND gr.deleted_at IS NULL
JOIN groups grp ON grp.id = g.group_id
LEFT JOIN communication_log cl ON cl.guest_id = g.id
  AND cl.type = 'recipe_showcase'
  AND cl.status = 'sent'
WHERE g.notify_opt_in = true
ORDER BY grp.name, g.first_name;
```

Note: The LEFT JOIN on `communication_log` checks if we already sent this email. We filter by `type = 'recipe_showcase'` (a new type we add to the allowed values).

---

## communication_log Update

The existing `type` check constraint needs a new value:

```sql
ALTER TABLE communication_log
DROP CONSTRAINT IF EXISTS communication_log_type_check;

ALTER TABLE communication_log
ADD CONSTRAINT communication_log_type_check
CHECK (type = ANY (ARRAY['invitation', 'reminder', 'thank_you', 'custom', 'recipe_showcase']));
```

When an email is sent, we insert:

```sql
INSERT INTO communication_log (guest_id, user_id, type, channel, subject, status, sent_at)
VALUES (
  :guest_id,
  :admin_user_id,
  'recipe_showcase',
  'email',
  'You''re in the book.',
  'sent',
  NOW()
);
```

---

## UI Design

### Layout

Simple. Matches the existing admin style (white cards, clean table, minimal).

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Admin                                    │
│                                                     │
│  📖 Recipe Showcase                                 │
│  Send recipe previews to opted-in guests            │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Filter by group: [All Groups ▼]             │    │
│  │ Stats: 35 opted in · 12 images uploaded ·   │    │
│  │        3 emails sent                        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Guest        │ Recipe      │ Image │ Status  │   │
│  ├──────────────┼─────────────┼───────┼─────────┤   │
│  │ Male Sánchez │ Dip de      │  ✅   │ [Send]  │   │
│  │              │ Queso Feta  │       │         │   │
│  ├──────────────┼─────────────┼───────┼─────────┤   │
│  │ Begoña S.    │ "Marry me"  │  —    │ Upload  │   │
│  │              │ chicken     │       │ first   │   │
│  ├──────────────┼─────────────┼───────┼─────────┤   │
│  │ Jorge Avila  │ Ceviche de  │  ✅   │  Sent ✓ │   │
│  │              │ Camarón     │       │ Feb 19  │   │
│  └──────────────┴─────────────┴───────┴─────────┘   │
└─────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Content |
|--------|---------|
| **Guest** | `first_name last_name` + email below in gray |
| **Group** | Group name (e.g., "Rocío & Víctor") — visible when "All Groups" is selected |
| **Recipe** | Recipe name |
| **Image** | Thumbnail if uploaded, upload button if not |
| **Status** | "Send" button, "Sent ✓ + date", or "Upload first" (disabled) |

### Row States

1. **No image uploaded** → Image column shows "Upload" button. Status shows "Upload first" (gray, disabled).
2. **Image uploaded, not sent** → Image column shows thumbnail. Status shows "Send" button (black, active).
3. **Email sent** → Image column shows thumbnail. Status shows "Sent ✓ Feb 19" (green text).

### Multiple Recipes Per Guest

Guests with multiple recipes (like Begoña with 5) show one row per recipe. Each recipe gets its own spread image and its own send. The email is per-recipe, not per-guest.

---

## Upload Flow

1. Ricardo clicks "Upload" on a recipe row
2. File picker opens (accept: `.png, .jpg, .jpeg`)
3. Image uploads to Supabase Storage: `showcase/{group_id}/{recipe_id}.png`
4. `guest_recipes.showcase_image_url` is updated with the public URL
5. Thumbnail appears in the table row
6. "Send" button becomes active

**API route:** `POST /api/v1/admin/showcase/upload`

```json
{
  "recipe_id": "uuid",
  "group_id": "uuid"
}
// + FormData with the image file
```

Returns:
```json
{
  "url": "https://xxxxx.supabase.co/storage/v1/object/public/showcase/..."
}
```

---

## Send Flow

1. Ricardo clicks "Send" on a recipe row
2. Confirmation dialog: "Send preview to Male Sánchez (male@email.com)?"
3. On confirm, API call to `/api/v1/admin/showcase/send`
4. Backend:
   - Fetches the spread image from Supabase Storage
   - Converts to base64
   - Builds the HTML email (same template from our email design session)
   - Sends via Postmark with the image as a CID attachment
   - Inserts row into `communication_log`
5. UI updates row to "Sent ✓" with date

**API route:** `POST /api/v1/admin/showcase/send`

```json
{
  "guest_id": "uuid",
  "recipe_id": "uuid",
  "guest_name": "Male",
  "guest_email": "male@email.com",
  "recipe_name": "Dip de Queso Feta",
  "couple_name": "Rocío & Víctor",
  "showcase_image_url": "https://xxxxx.supabase.co/storage/v1/object/public/showcase/..."
}
```

Returns:
```json
{
  "success": true,
  "postmark_message_id": "xxx-xxx",
  "sent_at": "2026-02-19T23:00:00Z"
}
```

---

## The Email

Already designed. Subject: **"You're in the book."**

Template lives in the send API route (inline, not a separate file). Variables auto-populated:

| Variable | Source |
|----------|--------|
| `guest_name` | `guests.first_name` |
| `couple_name` | `groups.couple_display_name` or `groups.name` |
| `recipe_name` | `guest_recipes.recipe_name` |
| `spread_image` | `guest_recipes.showcase_image_url` → fetched and attached as CID |

The email HTML is the same template from the design session. It's embedded directly in the API route — no external template file needed.

**Postmark config:**
- Server token: `process.env.POSTMARK_SERVER_TOKEN` (already in `.env.local`)
- From: `team@smallplatesandcompany.com` (already verified sender)
- MessageStream: `outbound`

---

## Existing Script Reference

There's a standalone Node script at `scripts/send-recipe-preview-postmark.js` that does the same thing from the command line. The admin panel version is the UI wrapper around that same logic. The script can stay as a fallback for quick one-offs.

---

## What NOT to Build

This is a temporary tool. Keep it simple:

- **No batch send.** One at a time. You need to review each spread anyway.
- **No email preview in the admin.** You already tested the template. It works.
- **No undo/resend protection.** If you send twice, it sends twice. Just be careful.
- **No open/click tracking.** Postmark tracks that in their dashboard if you need it.
- **No drag-and-drop image ordering.** One image per recipe, that's it.
- **No guest-facing unsubscribe.** This is a one-time email, not a campaign.

---

## Implementation Order

1. **Migration:** Add `showcase_image_url` to `guest_recipes` + update `communication_log` type constraint
2. **Supabase Storage:** Create `showcase` bucket (or use existing bucket with new folder)
3. **Upload API route:** `/api/v1/admin/showcase/upload`
4. **Send API route:** `/api/v1/admin/showcase/send` (Postmark + communication_log insert)
5. **Admin page:** `app/(admin)/admin/showcase/page.tsx` — table + filters + upload + send
6. **Admin dashboard card:** Add link to showcase from main admin page

---

## Current Data Snapshot (Feb 2026)

| Group | Opted-In Guests | Total Recipes |
|-------|----------------|---------------|
| Rocío & Víctor | 14 guests | 18 recipes |
| Albert & Bárbara | 12 guests | 17 recipes |
| Renata & Javier | 6 guests | 6 recipes |
| Clementina & Clementina | 2 guests | 7 recipes |
| Sophie & Emiliano | 2 guests | 3 recipes |
| Donald & Emily | 1 guest | 1 recipe |
| **Total** | **35 guests** | **~52 recipes** |

Notes:
- Some guests have multiple recipes (Begoña has 5, Natalia has 3)
- 2 guests opted in but have no recipe linked (Soso, Andrea) — hide these or show as "No recipe"
- Some `couple_display_name` values are null — fall back to `groups.name`