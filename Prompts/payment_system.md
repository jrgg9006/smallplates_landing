## Context

This is a Next.js 14 + Supabase + Stripe app for Small Plates & Co.
We are NOT building anything new from scratch. We are reorganizing 
existing code into a better sequence. Read everything before touching 
anything.

## Core Rules

- Do NOT delete any Supabase data or tables
- Do NOT break the Stripe payment flow
- Do NOT break Supabase Auth user creation
- Read each file fully before modifying it
- Make surgical changes only — preserve all existing logic
- If something already exists and works, reuse it

---

## What We're Fixing

Currently, group creation is deferred until after the user fills in 
couple details post-payment. This creates orphaned orders (paid but 
no group). We need the webhook to always create the group immediately 
after payment, with a placeholder status.

We're also reorganizing the checkout flow to be simpler and cleaner.

---

## Change 1 — Supabase: Add status field to groups table

Run this migration. Do not touch any other columns or existing data:

ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_setup';

UPDATE groups 
SET status = 'active' 
WHERE status = 'pending_setup' AND name IS NOT NULL AND name != '';

This marks all existing complete groups as active. Incomplete ones 
stay as pending_setup.

---

## Change 2 — Stripe Webhook: Always create group after payment

File: app/api/stripe/webhook/route.ts

After the order insert (which already exists and works — do not touch 
that logic), add group creation immediately after:

1. Insert into groups table with these fields:
  - user_id: the newly created userId
  - name: 'pending' (placeholder — will be updated in onboarding)
  - status: 'pending_setup'
  - created_by: userId
  - book_quantity: bookQuantity (already in metadata)
2. Insert into group_members table:
  - group_id: the new group's id
  - user_id: userId
  - role: 'owner'
3. Back-fill the order with group_id (same pattern already used in
  complete-onboarding/route.ts — copy that logic, don't reinvent it)
4. After creating the group, update the generateLink redirectTo to
  point to: ${NEXT_PUBLIC_BASE_URL}/welcome

Do this for BOTH the embedded gift flow and the fallback/legacy flow.

Important: wrap the group creation in a try/catch. If group creation 
fails, log the error but do NOT fail the webhook — the order and user 
are more important. The group can be recovered manually.

---

## Change 3 — New page: /welcome

Create app/welcome/page.tsx

This is where the magic link lands after payment. It should:

1. Confirm the user has an active session (they do — magic link
  created it). If no session, redirect to /login.
2. Show a simple, warm screen with:
  - Heading: "You're in."
  - Subheading: "Want to set a password so you can log in faster 
  next time?"
  - Password input field
  - Confirm password input field
  - Primary button: "Save password and continue"
  - Secondary link: "Skip for now →"
3. On save: call supabase.auth.updateUser({ password }) — this works
  because the magic link already created an active session.
   On success or skip: redirect to /profile/groups
4. Style it consistent with the existing design system. Keep it
  minimal — this is not an onboarding step, it's a one-time offer.

---

## Change 4 — Dashboard: Couple names modal before onboarding wizard

File: wherever /profile/groups renders (likely 
app/profile/groups/page.tsx or a layout above it)

Add this logic at the top of the page render:

1. Fetch the user's group from Supabase
2. If group.status === 'pending_setup', show the couple names modal
  BEFORE anything else (it should block the rest of the UI)
3. The modal already exists in complete-onboarding — find that
  component and reuse it here. Do not rebuild it.
4. When the user submits:
  - Update groups SET name = coupleNames, status = 'active', 
   wedding_date = date, partner1_name = ..., partner2_name = ... 
   WHERE id = group.id
  - Update orders SET couple_name = coupleNames WHERE group_id = group.id
  - Close modal → show onboarding wizard normally
5. If group.status === 'active', skip modal entirely, show dashboard
  normally.

---

## Change 5 — Checkout flow reorganization

Currently the onboarding modal collects data in a mixed order. 
Reorganize the steps to:

Step 1: Your name + Your email  
Step 2: How many copies? (existing UI — reuse it)  
Step 3: Review (name, email, quantity, total price, shipping included)  
Step 4: Payment → redirect to Stripe  

Rules:

- Reuse all existing step components — just reorder them
- Email must be collected in Step 1 so we can pass it to Stripe 
session metadata (already works this way in the webhook)
- Remove any fields that ask for couple names or wedding date 
from the checkout flow — those move to post-payment modal
- Pass to Stripe session metadata: email, buyerName, bookQuantity 
(same keys the webhook already reads — do not rename them)
- Do not change anything in /api/stripe/create-checkout-session 
unless strictly necessary to pass the metadata correctly

---

## Change 6 — complete-onboarding route cleanup

File: app/api/stripe/complete-onboarding/route.ts

This route currently creates the group. After Change 2, the group 
already exists. Update this route to:

- Instead of INSERT into groups → do UPDATE groups SET ... WHERE 
id = group_id AND user_id = userId
- Keep all the same fields it currently sets (names, dates, etc.)
- Keep the order back-fill logic exactly as is
- Add: SET status = 'active' in the same UPDATE

Do not delete this route — it may still be called from 
existing flows.

---

## Verification checklist

After making all changes, confirm:

[ ] A test payment creates: 1 user in Supabase Auth, 1 order with 
    status 'paid', 1 group with status 'pending_setup'
[ ] The magic link email is sent via Postmark with redirectTo /welcome
[ ] /welcome page loads with active session, password save works, 
    skip works, both redirect to /profile/groups
[ ] /profile/groups shows couple names modal when 
    group.status === 'pending_setup'
[ ] Filling in couple names sets group.status = 'active' and hides 
    modal permanently
[ ] Existing groups in Supabase are unaffected
[ ] Existing orders in Supabase are unaffected

---

## What NOT to touch

- lib/postmark.ts — works as is
- The Stripe webhook's user creation logic (createUser block)
- The Stripe webhook's order insert logic
- Any existing RLS policies in Supabase
- Any existing group data in production

