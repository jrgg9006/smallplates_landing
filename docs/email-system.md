# Email System — Single Source of Truth

> **Purpose:** every email Small Plates sends, in one table. Use this as the safety net before touching anything email-related — auto vs manual, where it lives in code, who receives it, and whether it has unsubscribe handling.
>
> **Update this file whenever** you add, remove, or change how an email is sent.

---

## Active emails

| # | Name | Trigger | Recipient | Auto / Manual | Code path | Postmark | Unsubscribe | Notes |
|---|------|---------|-----------|---------------|-----------|----------|-------------|-------|
| 1 | Welcome login | First purchase via Stripe checkout | Buyer | **Auto** (Stripe webhook) | `app/api/stripe/webhook/route.ts` → `lib/postmark.ts:sendWelcomeLoginEmail` | Template `welcome-login`, stream `outbound` | None (transactional account setup) | Also fired by `app/api/auth/send-login-link/route.ts` (manual login-link request) and `app/api/stripe/resend-setup-link/route.ts` (admin/user resend) |
| 2 | Returning customer | Repeat purchase via Stripe checkout | Buyer | **Auto** (Stripe webhook) | `app/api/stripe/webhook/route.ts` → `lib/postmark.ts:sendReturningCustomerEmail` | Inline HTML, stream `outbound` | None (transactional) | Different copy than #1 — acknowledges they're already a customer |
| 3 | Password reset | User requests reset | User | **Manual** (user-initiated) | `app/api/auth/send-reset-link/route.ts` → `lib/postmark.ts:sendPasswordResetEmail` | Inline HTML, stream `outbound` | None (transactional) | Token good for 1h |
| 4 | Order confirmation (copy order) | Public copy purchase via Stripe | Third-party buyer | **Auto** (Stripe webhook) | `app/api/stripe/webhook/route.ts` → `lib/postmark.ts:sendCopyOrderConfirmation` | Inline HTML, stream `outbound` | None (transactional) | Buyer has no Small Plates account — no dashboard link |
| 5 | Group invitation | Organizer invites someone to join group | Invitee | **Manual** (user-initiated) | `app/api/v1/groups/[groupId]/invitations/route.ts` → `lib/postmark.ts:sendGroupInvitationEmail` | Template `invite-to-group`, stream `invite-user` | None (transactional invite) | Resend at `.../invitations/[invitationId]/resend/route.ts` |
| 6 | New recipe notification | Recipe shared in a group | Other group members | **Currently DISABLED** | `app/api/v1/recipes/notify-new-recipe/route.ts` (commented out) | Template `new-recipe-notification`, stream `transactional` | `PreferencesURL` in template | Not in production right now — kept in code for future revival |
| 7 | PDF delivery (cookbook) | Admin clicks "Send PDF" in dashboard | Recipe contributors (guests) | **Manual** (admin via dashboard) | `app/api/v1/admin/pdf-delivery/send/route.ts` ← `app/(admin)/admin/pdf-delivery/page.tsx` | Inline HTML (`lib/email/pdf-delivery-template.ts`), stream `outbound` | One-click via `/api/v1/unsubscribe?gid=...` (sets `guests.showcase_opted_out`) | PDF attached as base64. Sent ~4 weeks after recipe submission, when couple has received the physical book. Includes referral discount code |
| 8 | Recipe showcase | Admin clicks "Send showcase" in dashboard | Recipe contributors (guests) | **Manual** (admin via dashboard) | `app/api/v1/admin/showcase/send/route.ts` ← `app/(admin)/admin/showcase/page.tsx` | Inline HTML (`lib/email/showcase-template.ts`), stream `outbound` | One-click via `/api/v1/unsubscribe?gid=...` (sets `guests.showcase_opted_out`) | Sent before print. CID-based inline images of recipe spreads |
| 9 | **Captain reminder** | Group has organizer but **no captains** (`group_members.role = 'admin'`) | Organizer (profile) | **Manual** (admin via Email Dashboard) | `app/api/v1/admin/email-dashboard/captain-reminder/send/route.ts` ← `app/(admin)/admin/email-dashboard/page.tsx` | Inline HTML (`lib/email/captain-reminder-template.ts`), stream `outbound` | One-click via `/api/v1/unsubscribe-profile?uid=...` (sets `profiles.notification_emails_opt_out`) | Send weekly, max 3 times per group. Tracked in `communication_log` with `type = 'captain_reminder'` |
| 10 | **Weekly status** | Active book, dashboard reviews + sends | All captains + organizer (profiles) | **Manual** (admin via Email Dashboard) | `app/api/v1/admin/email-dashboard/weekly-status/send/route.ts` ← same dashboard | Inline HTML (`lib/email/weekly-status-template.ts`), stream `outbound` | Same profile-level unsubscribe as #9 | Send weekly. Stats: total recipes, recipes this week, new guests this week, days until close. Tracked with `type = 'weekly_status'` |
| 11 | **Pre-closing nudge** | `book_close_date` ≤ 7 days away | Guests with email opted in | **Manual** (admin via Email Dashboard) | `app/api/v1/admin/email-dashboard/closing-nudge/send/route.ts` ← same dashboard | Inline HTML (`lib/email/closing-nudge-template.ts`), stream `outbound` | One-click via existing `/api/v1/unsubscribe?gid=...` | Send once per group per close cycle. Filters: `email IS NOT NULL`, `notify_opt_in = true`, `showcase_opted_out = false`. Tracked with `type = 'closing_nudge'` |

## Conventions

- **Postmark stream**: most outbound mail uses stream `outbound`; group invites use `invite-user`; if you add a new email, stay in `outbound` unless there's a deliberate reason.
- **From line**: `Small Plates & Co. <{POSTMARK_FROM_EMAIL}>` is the default. PDF delivery overrides to `{coupleName} via Small Plates` for warmth — only do this when the couple's name carries the relationship.
- **ReplyTo**: always `team@smallplatesandcompany.com`.
- **Logo**: `https://smallplatesandcompany.com/images/SmallPlates_logo_horizontal.png`, 160px wide.
- **Visual reference**: `lib/email/pdf-delivery-template.ts` — copy its dark-mode CSS, mobile breakpoints, footer card pattern, RFC 8058 unsubscribe headers.
- **Voice**: see `brand/voice.md`. Margot voice. Specific, dry, direct, warm without performing it.
- **Logging**: every send writes one row to `communication_log` with the right `type`, `sent_at`, `subject`, and either `guest_id` or `recipient_profile_id` (and `group_id` for the new emails). Never skip the log — the dashboard reads it to show "X reminders sent."

## When you add a new email

1. Add a row to the table above **before** writing code — forces you to think through trigger / recipient / unsubscribe.
2. Mirror the structure of `pdf-delivery-template.ts`. Don't reinvent the layout.
3. If the recipient is a `guests` row, reuse `/api/v1/unsubscribe?gid=...`. If it's a `profiles` row, reuse `/api/v1/unsubscribe-profile?uid=...`. Don't invent a third unsubscribe mechanism.
4. Add a `type` value to `communication_log_type_check` (CHECK constraint) and to the `CommunicationType` union in `lib/types/database.ts`.
5. Pass the email through the Margot test before shipping — read it out loud.
