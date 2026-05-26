# M1 Onboarding — Manual Test Checklist

Run with `NEXT_PUBLIC_FREE_TIER_ENABLED=true` in `.env.local`. Use fresh incognito browser.

## Happy path (magic link)
- [ ] Visit `/signin`
- [ ] Enter test email → click "Continuar con correo"
- [ ] Verify email arrives via Postmark (check spam too)
- [ ] Click magic link → lands on `/onboarding/about-you?continue=true`
- [ ] Walk through `/onboarding/welcome` → `occasion` → `book-date` → `about-you`
- [ ] Submit about-you → verify Supabase row in `groups` with `status='free_tier'`
- [ ] Continue through co-organizer (Skip)
- [ ] Continue through event-details (Skip — data not persisted in M1)
- [ ] Continue through personalize-invite (edit message, click Preview)
- [ ] Continue through invite-first → verify Copy button copies, WhatsApp button opens WA
- [ ] Click "Ir al dashboard" → lands on `/profile/groups`

## Happy path (Google OAuth)
- [ ] At `/signin`, click "Continuar con Google"
- [ ] Complete OAuth
- [ ] Verify landed on `/onboarding/about-you?from_google=true` if no existing group
- [ ] Complete flow → verify group created with `status='free_tier'`

## Feature flag off
- [ ] Set `NEXT_PUBLIC_FREE_TIER_ENABLED=false` in `.env.local`
- [ ] Visit `/onboarding/welcome` → redirects to `/`
- [ ] POST to `/api/v1/groups/free` → returns 404

## Zustand persist
- [ ] Start onboarding, select occasion, pick date
- [ ] Refresh the browser at `/onboarding/book-date`
- [ ] Verify occasion and date are preserved

## Free → Paid upgrade
- [ ] Create a free_tier group via the onboarding flow
- [ ] Note the group ID in Supabase
- [ ] Trigger a Stripe checkout (existing flow)
- [ ] Verify the SAME group transitions from `free_tier` → `pending_setup`
- [ ] Verify NO new group was created

## Existing paid flow (regression check)
- [ ] With feature flag ON, go through the normal paid Stripe checkout
- [ ] Verify group is created as `pending_setup` (existing behavior unchanged)
- [ ] Verify magic link email arrives and login works
