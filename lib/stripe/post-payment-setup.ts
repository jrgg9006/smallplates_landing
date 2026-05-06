import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeLoginEmail, sendReturningCustomerEmail } from "@/lib/postmark";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

export interface EmitAutoLoginInput {
  email: string;
  buyerName: string;
  wasExisting: boolean;
  sendEmail?: boolean;
}

export interface EmitAutoLoginResult {
  tokenHash: string | null;
  actionLink: string | null;
}

/**
 * Phase B — generate the magic-link token and send the post-payment email.
 *
 * MUST be called exactly once per payment. Each `admin.generateLink` call invalidates
 * prior magic-link tokens for the same email, so concurrent callers would break each
 * other's auto-login. Callers orchestrate who runs this:
 *
 *   - post-payment-login: runs this when `orderCreated === true` (it was first).
 *   - webhook: runs this when `orderCreated === true` (post-payment-login didn't fire,
 *     we're the safety net responsible for delivering the email).
 *
 * When `orderCreated === false`, the other caller already emitted — skip.
 *
 * Returns `tokenHash` so post-payment-login can pass it back to the browser for
 * `verifyOtp` auto-login. The returning-vs-first-time email template is chosen based on
 * `wasExisting` (returning customers buying their Nth book).
 */
export async function emitPostPaymentAutoLogin(
  input: EmitAutoLoginInput
): Promise<EmitAutoLoginResult> {
  const { wasExisting, sendEmail = true } = input;
  const email = input.email.trim().toLowerCase();
  const buyerName = input.buyerName?.trim() || "";

  const supabaseAdmin = createSupabaseAdminClient();

  let tokenHash: string | null = null;
  let actionLink: string | null = null;

  try {
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      },
    });
    if (linkError) {
      console.error("emitPostPaymentAutoLogin: generateLink failed", linkError);
      return { tokenHash: null, actionLink: null };
    }
    // Reason: Use `hashed_token` directly — that's the canonical field for verifyOtp's
    // `token_hash` param.
    tokenHash = linkData?.properties?.hashed_token ?? null;
    actionLink = linkData?.properties?.action_link ?? null;
  } catch (err) {
    console.error("emitPostPaymentAutoLogin: generateLink threw", err);
    return { tokenHash: null, actionLink: null };
  }

  if (sendEmail && actionLink) {
    try {
      const firstName = buyerName.split(" ")[0] || "";
      if (wasExisting) {
        await sendReturningCustomerEmail({
          to: email,
          buyerName: firstName,
          loginLink: actionLink,
        });
      } else {
        await sendWelcomeLoginEmail({
          to: email,
          buyerName: firstName,
          loginLink: actionLink,
        });
      }
    } catch (err) {
      console.error("emitPostPaymentAutoLogin: email send failed", err);
    }
  }

  return { tokenHash, actionLink };
}

interface FindOrCreateUserResult {
  userId: string | null;
  wasExisting: boolean;
}

/**
 * Find user by email (via profiles), validate the corresponding auth.users row still exists,
 * and create a fresh auth user if missing. Handles the orphaned-profile case where a previous
 * auth user was deleted without cascading to profiles.
 *
 * Passes `full_name` in user_metadata so the handle_new_user trigger picks it up.
 *
 * Returns `wasExisting` so callers can tailor messaging (e.g. welcome vs. "your new book"
 * email for a returning customer buying their Nth book).
 */
async function findOrCreateUser(
  supabaseAdmin: SupabaseAdmin,
  email: string,
  buyerName: string
): Promise<FindOrCreateUserResult> {
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    // Reason: Profile might be orphaned (auth user was deleted without cascading to profiles).
    // Verify the auth user exists; if not, delete the stale profile and fall through to create a fresh one.
    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
    if (authUserData?.user) {
      return { userId: existingProfile.id, wasExisting: true };
    }

    console.warn(
      "findOrCreateUser: orphaned profile detected (no matching auth.users row) — deleting and recreating",
      { profileId: existingProfile.id, email }
    );
    await supabaseAdmin.from("profiles").delete().eq("id", existingProfile.id);
  }

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: buyerName,
      source: "post_payment_setup",
    },
  });

  if (!createError && newUser?.user) {
    return { userId: newUser.user.id, wasExisting: false };
  }

  // Reason: `email_exists` means an auth user already exists for this email but we
  // didn't find a matching profile row. This happens if profiles were deleted without
  // cascading to auth.users. Recover the auth user's id by listing users filtered by email.
  // NOTE: We avoid calling `generateLink` here — that would consume a magic-link token
  // prematurely and invalidate the one that `emitPostPaymentAutoLogin` will generate.
  const isEmailExists =
    createError?.code === "email_exists" ||
    createError?.message?.includes("already been registered");

  if (isEmailExists) {
    console.warn(
      "findOrCreateUser: auth user exists but profile missing — recovering via listUsers",
      email
    );
    try {
      // `listUsers` is paginated; for recovery we only need the first match.
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      const match = listData?.users.find((u) => u.email?.toLowerCase() === email);
      if (match) {
        return { userId: match.id, wasExisting: true };
      }
    } catch (err) {
      console.error("findOrCreateUser: listUsers recovery failed", err);
    }
  }

  // Reason: Final fallback — race condition where another call created the profile
  // after our initial query.
  const { data: retryProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (retryProfile) return { userId: retryProfile.id, wasExisting: true };

  console.error("findOrCreateUser: could not resolve user id", createError);
  return { userId: null, wasExisting: false };
}

/**
 * Upsert the buyer's profile row with full_name + user_type.
 * Called after the Supabase Auth user exists; handle_new_user may have already
 * created a blank profile row via trigger, so we upsert to win the race.
 */
/**
 * Find-or-update the profile row tied to a Stripe Checkout buyer's auth user.
 * Writes id, email, user_type='gift_giver', and full_name. Called after the
 * auth user is provisioned so profile data is in place before group creation.
 * Safe to call concurrently — onConflict on id ensures idempotency with the
 * handle_new_user trigger that auto-creates a blank profile row.
 */
async function upsertBuyerProfile(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  email: string,
  buyerName: string
): Promise<void> {
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        user_type: "gift_giver" as const,
        full_name: buyerName || null,
      },
      { onConflict: "id" }
    );
  if (profileError) {
    console.error("upsertBuyerProfile: failed", profileError);
  }
}

/**
 * Find-or-create a `pending_setup` group for the user, racing against concurrent
 * callers via a partial UNIQUE index on `groups(created_by) WHERE status='pending_setup'`.
 *
 * If `initialGroupId` is provided (from a pre-existing order row), skip the lookup
 * and use it directly. Otherwise search by `created_by + status=pending_setup`,
 * then INSERT if still not found, handling 23505 with a recovery re-query.
 *
 * Returns `{ groupId, groupCreated }`. `groupCreated` is true only when THIS call
 * wrote the row. The `add_group_creator_as_owner_trigger` migration auto-inserts
 * the owner row in group_members AFTER INSERT.
 */
async function findOrCreatePendingGroup(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  initialGroupId: string | null,
  giftDate: string | null,
  giftDateUndecided: boolean,
  bookCloseDate: string | null
): Promise<{ groupId: string | null; groupCreated: boolean }> {
  let groupId: string | null = initialGroupId;
  if (!groupId) {
    const { data: existingGroup } = await supabaseAdmin
      .from("groups")
      .select("id")
      .eq("created_by", userId)
      .eq("status", "pending_setup")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingGroup) groupId = existingGroup.id;
  }

  let groupCreated = false;
  if (!groupId) {
    const { data: newGroup, error: groupError } = await supabaseAdmin
      .from("groups")
      .insert({
        created_by: userId,
        name: "pending",
        description: "",
        status: "pending_setup",
        gift_date: giftDate,
        gift_date_undecided: giftDateUndecided,
        book_close_date: bookCloseDate,
      })
      .select("id")
      .single();

    if (groupError || !newGroup) {
      if (groupError?.code === "23505") {
        // Reason: Concurrent caller inserted the pending_setup group first. Re-query.
        console.warn("findOrCreatePendingGroup: group already inserted by concurrent caller (race)");
        const { data: recoveredGroup } = await supabaseAdmin
          .from("groups")
          .select("id")
          .eq("created_by", userId)
          .eq("status", "pending_setup")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (recoveredGroup) groupId = recoveredGroup.id;
      } else {
        console.error("findOrCreatePendingGroup: group insert failed", groupError);
      }
    } else {
      groupId = newGroup.id;
      groupCreated = true;
      // Reason: The `add_group_creator_as_owner_trigger` migration automatically
      // inserts the owner row in group_members AFTER INSERT on groups.
    }
  }

  return { groupId, groupCreated };
}

/**
 * Back-fill `orders.group_id` for the given payment intent if the column is still null.
 * No-op when `groupId` is null.
 */
async function backfillOrderGroupId(
  supabaseAdmin: SupabaseAdmin,
  stripePaymentIntentId: string,
  groupId: string | null
): Promise<void> {
  if (!groupId) return;
  const { error: backfillError } = await supabaseAdmin
    .from("orders")
    .update({ group_id: groupId })
    .eq("stripe_payment_intent", stripePaymentIntentId)
    .is("group_id", null);
  if (backfillError) {
    console.error("backfillOrderGroupId: failed", backfillError);
  }
}

export interface PostPaymentSetupFromSessionInput {
  session: Stripe.Checkout.Session;
}

export interface PostPaymentSetupFromSessionResult {
  userId: string | null;
  wasExisting: boolean;
  orderCreated: boolean;
  groupId: string | null;
}

/**
 * Idempotent post-payment DB setup driven by a Stripe Checkout Session from
 * the `checkout.session.completed` webhook event for `initial_purchase`.
 *
 * Extracts email, name, and payment-intent from the Checkout Session and:
 *   - Finds or creates a Supabase Auth user + profile (user_type='gift_giver')
 *   - Creates a placeholder group (name='pending', status='pending_setup') with
 *     the owner row populated via DB trigger
 *   - Writes the order row (status='paid') and back-fills group_id
 *
 * `onboarding_data` captures the full session metadata for downstream use.
 *
 * Throws on missing email, missing payment_intent, or metadata.type mismatch
 * — all three are programmer errors that should never happen in production.
 * Returns `orderCreated: true` when this call wrote the order row; the caller
 * may then emit the magic-link email via `emitPostPaymentAutoLogin`.
 */
export async function runPostPaymentSetupFromSession(
  input: PostPaymentSetupFromSessionInput
): Promise<PostPaymentSetupFromSessionResult> {
  const { session } = input;
  const metadata = session.metadata || {};

  const rawEmail = session.customer_details?.email || session.customer_email || "";
  const email = rawEmail.trim().toLowerCase();
  const buyerName = session.customer_details?.name?.trim() || "";

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (!email) {
    throw new Error(
      `runPostPaymentSetupFromSession: no email in session ${session.id}`
    );
  }
  if (!paymentIntentId) {
    throw new Error(
      `runPostPaymentSetupFromSession: no payment_intent in session ${session.id}`
    );
  }
  if (metadata.type !== "initial_purchase") {
    throw new Error(
      `runPostPaymentSetupFromSession: session ${session.id} metadata.type is '${metadata.type}', expected 'initial_purchase'`
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const bookQuantity = parseInt(metadata.bookQuantity || "1", 10);
  const giftDate: string | null = metadata.giftDate || null;
  const giftDateUndecided: boolean = metadata.giftDateUndecided === "true";
  const bookCloseDate: string | null = metadata.bookCloseDate || null;
  const userType: "couple" | "gift_giver" =
    metadata.userType === "couple" ? "couple" : "gift_giver";

  // Reason: Attribution from /from-the-book QR flow. The presence of a
  // referrer_book_id (i.e. the GROUP_ID of the wedding book whose QR was
  // scanned) is the queryable signal that this lead came from a physical
  // book. The full UTM bag stays in onboarding_data JSONB for any deeper
  // inspection — no need for dedicated columns until a second source of
  // tracked traffic exists.
  // Defensive: book_id may arrive malformed (URL tampering, dev test data,
  // etc.). Validate UUID shape before persisting; fall back to NULL so a
  // bad attribution param never blocks the order from being recorded.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const rawBookId = metadata.book_id || "";
  const referrerBookId: string | null = UUID_RE.test(rawBookId) ? rawBookId : null;
  const fromBook = metadata.utm_source === "book";

  // Reason: Stripe reports the actual discount applied in cents (smallest
  // currency unit). Stored as-is in `discount_amount` (integer column) for
  // consistency with `amount_total` which is also cents. Source of truth
  // is Stripe — survives coupon config changes without code deploy.
  const amountDiscountCents = session.total_details?.amount_discount;
  const discountAmount = typeof amountDiscountCents === "number" && amountDiscountCents > 0
    ? amountDiscountCents
    : null;
  const discountCode = fromBook && discountAmount ? "BOOK15" : null;

  // 1. Find or create user.
  const { userId, wasExisting } = await findOrCreateUser(supabaseAdmin, email, buyerName);
  if (!userId) {
    return {
      userId: null,
      wasExisting: false,
      orderCreated: false,
      groupId: null,
    };
  }

  // 2. Upsert profile.
  await upsertBuyerProfile(supabaseAdmin, userId, email, buyerName);

  // 3. Order idempotency. Relies on DB UNIQUE constraint on `orders.stripe_payment_intent`.
  const { data: preCheckOrder } = await supabaseAdmin
    .from("orders")
    .select("id, group_id")
    .eq("stripe_payment_intent", paymentIntentId)
    .maybeSingle();

  let existingOrder = preCheckOrder;
  let orderCreated = false;
  if (!existingOrder) {
    const { data: inserted, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        email,
        stripe_payment_intent: paymentIntentId,
        amount_total: session.amount_total,
        book_quantity: bookQuantity,
        couple_name: null,
        user_type: userType,
        onboarding_data: metadata,
        order_type: "initial_purchase",
        status: "paid",
        referrer_book_id: referrerBookId,
        discount_code: discountCode,
        discount_amount: discountAmount,
      })
      .select("id, group_id")
      .maybeSingle();

    if (orderError) {
      if (orderError.code === "23505") {
        console.warn(
          "runPostPaymentSetupFromSession: order already inserted by concurrent caller (race)"
        );
        const { data: recovered } = await supabaseAdmin
          .from("orders")
          .select("id, group_id")
          .eq("stripe_payment_intent", paymentIntentId)
          .maybeSingle();
        existingOrder = recovered;
      } else {
        console.error("runPostPaymentSetupFromSession: order insert failed", orderError);
      }
    } else if (inserted) {
      existingOrder = inserted;
      orderCreated = true;
    }
  }

  // 4. Group idempotency.
  const { groupId } = await findOrCreatePendingGroup(
    supabaseAdmin,
    userId,
    existingOrder?.group_id ?? null,
    giftDate,
    giftDateUndecided,
    bookCloseDate
  );

  // 5. Back-fill order.group_id if needed.
  await backfillOrderGroupId(supabaseAdmin, paymentIntentId, groupId);

  return {
    userId,
    wasExisting,
    orderCreated,
    groupId,
  };
}

export interface ExtraCopiesSetupFromSessionInput {
  session: Stripe.Checkout.Session;
}

export interface ExtraCopiesSetupFromSessionResult {
  orderCreated: boolean;
}

/**
 * Records an `extra_copy` order from a Stripe Checkout Session fired by the
 * post-close upsell flow (Phase 7A). Parallel to `runPostPaymentSetupFromSession`
 * but scoped to orders only — does NOT create users, profiles, or groups. The
 * captain already exists and the group is already active.
 *
 * Shipping address snapshot is pulled from `shipping_addresses.group_id` —
 * StepShipping in PostCloseFlow persists it before the user redirects to Stripe.
 * If the address is missing (shouldn't happen), logs loudly but still creates
 * the order — missing address is recoverable via support; a missing order is not.
 *
 * Idempotent via UNIQUE `orders.stripe_payment_intent` (23505 → skip + log warn).
 */
export async function runExtraCopiesSetupFromSession(
  input: ExtraCopiesSetupFromSessionInput
): Promise<ExtraCopiesSetupFromSessionResult> {
  const { session } = input;
  const metadata = session.metadata || {};

  const groupId = metadata.groupId;
  const userId = metadata.userId;
  const qty = parseInt(metadata.qty || "0", 10);

  if (!groupId || !userId || !qty) {
    throw new Error(
      `runExtraCopiesSetupFromSession: missing metadata in session ${session.id}`
    );
  }
  if (metadata.type !== "extra_copies_purchase") {
    throw new Error(
      `runExtraCopiesSetupFromSession: session ${session.id} metadata.type is '${metadata.type}', expected 'extra_copies_purchase'`
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (!paymentIntentId) {
    throw new Error(
      `runExtraCopiesSetupFromSession: no payment_intent in session ${session.id}`
    );
  }

  const email = (
    session.customer_details?.email ||
    session.customer_email ||
    ""
  )
    .trim()
    .toLowerCase();

  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Lookup shipping address captured during StepShipping.
  const { data: shippingAddress, error: shippingError } = await supabaseAdmin
    .from("shipping_addresses")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (shippingError) {
    console.error(
      "runExtraCopiesSetupFromSession: shipping lookup failed",
      { groupId, err: shippingError }
    );
  }
  if (!shippingAddress) {
    console.error(
      `runExtraCopiesSetupFromSession: NO shipping address for group ${groupId} — order will be created without one`
    );
  }

  // 2. Lookup group.name for couple_name on the order record.
  const { data: group } = await supabaseAdmin
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .maybeSingle();

  // 3. Idempotent INSERT. Race with webhook retries is broken by UNIQUE on
  //    orders.stripe_payment_intent — the losing caller gets 23505, logs, returns.
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      email,
      stripe_payment_intent: paymentIntentId,
      amount_total: session.amount_total,
      book_quantity: qty,
      shipping_address: shippingAddress ?? null,
      couple_name: group?.name || null,
      user_type: "extra_copy_buyer",
      status: "paid",
      order_type: "extra_copy",
      group_id: groupId,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      console.warn(
        "runExtraCopiesSetupFromSession: order already exists (race), skipping",
        { paymentIntentId }
      );
      return { orderCreated: false };
    }
    console.error(
      "runExtraCopiesSetupFromSession: order insert failed",
      { paymentIntentId, err: insertError }
    );
    throw insertError;
  }

  return { orderCreated: !!inserted };
}

export interface DashboardExtrasSetupFromSessionInput {
  session: Stripe.Checkout.Session;
}

export interface DashboardExtrasSetupFromSessionResult {
  orderCreated: boolean;
}

/**
 * Records an `extra_copy` order from a Stripe Checkout Session fired by the
 * dashboard "Get more copies" flow (Phase 7B). Reads the shipping address
 * from `session.metadata` (stored there at session creation) and persists
 * it as a JSONB snapshot in `orders.shipping_address`.
 *
 * Critically: does NOT touch `public.shipping_addresses`. The main book's
 * shipping address is preserved — each dashboard extras order carries its
 * own address snapshot, independent of the primary delivery.
 *
 * Idempotent via UNIQUE `orders.stripe_payment_intent` (23505 → skip + log warn).
 */
export async function runDashboardExtrasSetupFromSession(
  input: DashboardExtrasSetupFromSessionInput
): Promise<DashboardExtrasSetupFromSessionResult> {
  const { session } = input;
  const metadata = session.metadata || {};

  const groupId = metadata.groupId;
  const userId = metadata.userId;
  const qty = parseInt(metadata.qty || "0", 10);

  if (!groupId || !userId || !qty) {
    throw new Error(
      `runDashboardExtrasSetupFromSession: missing metadata in session ${session.id}`
    );
  }
  if (metadata.type !== "dashboard_extras_purchase") {
    throw new Error(
      `runDashboardExtrasSetupFromSession: session ${session.id} metadata.type is '${metadata.type}', expected 'dashboard_extras_purchase'`
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (!paymentIntentId) {
    throw new Error(
      `runDashboardExtrasSetupFromSession: no payment_intent in session ${session.id}`
    );
  }

  const email = (
    session.customer_details?.email ||
    session.customer_email ||
    ""
  )
    .trim()
    .toLowerCase();

  // Reason: Reconstruct the shipping snapshot from session metadata. The UI
  // collected and validated these fields before creating the session, so
  // required pieces are guaranteed present — we treat empty strings on
  // optional fields as absent.
  const shippingAddress = {
    recipient_name: metadata.shipping_recipient_name || "",
    street_address: metadata.shipping_street_address || "",
    apartment_unit: metadata.shipping_apartment_unit || null,
    city: metadata.shipping_city || "",
    state: metadata.shipping_state || "",
    postal_code: metadata.shipping_postal_code || "",
    country: metadata.shipping_country || "",
    phone_number: metadata.shipping_phone_number || null,
  };

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: group } = await supabaseAdmin
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .maybeSingle();

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      email,
      stripe_payment_intent: paymentIntentId,
      amount_total: session.amount_total,
      book_quantity: qty,
      shipping_address: shippingAddress,
      couple_name: group?.name || null,
      user_type: "extra_copy_buyer",
      status: "paid",
      order_type: "extra_copy",
      group_id: groupId,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      console.warn(
        "runDashboardExtrasSetupFromSession: order already exists (race), skipping",
        { paymentIntentId }
      );
      return { orderCreated: false };
    }
    console.error(
      "runDashboardExtrasSetupFromSession: order insert failed",
      { paymentIntentId, err: insertError }
    );
    throw insertError;
  }

  return { orderCreated: !!inserted };
}

export interface CopyOrderSetupFromSessionInput {
  session: Stripe.Checkout.Session;
}

export interface CopyOrderSetupFromSessionResult {
  orderCreated: boolean;
}

/**
 * Records a `copy_order` from a Stripe Checkout Session fired by the public
 * copy-order flow (Phase 8). The buyer is a third party without an account;
 * `user_id` remains NULL on the order row. Shipping address is persisted as
 * a JSONB snapshot in `orders.shipping_address`. Does NOT touch
 * `public.shipping_addresses`.
 *
 * Idempotent via UNIQUE `orders.stripe_payment_intent` (23505 → skip + log warn).
 */
export async function runCopyOrderSetupFromSession(
  input: CopyOrderSetupFromSessionInput
): Promise<CopyOrderSetupFromSessionResult> {
  const { session } = input;
  const metadata = session.metadata || {};

  const bookId = metadata.bookId;
  const qty = parseInt(metadata.qty || "0", 10);
  const email = (metadata.email || "").trim().toLowerCase();

  if (!bookId || !qty || !email) {
    throw new Error(
      `runCopyOrderSetupFromSession: missing metadata in session ${session.id}`
    );
  }
  if (metadata.type !== "copy_order_purchase") {
    throw new Error(
      `runCopyOrderSetupFromSession: session ${session.id} metadata.type is '${metadata.type}', expected 'copy_order_purchase'`
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (!paymentIntentId) {
    throw new Error(
      `runCopyOrderSetupFromSession: no payment_intent in session ${session.id}`
    );
  }

  // Reason: Reconstruct shipping snapshot from session metadata. Validated
  // client-side and by the endpoint before session creation.
  const shippingAddress = {
    recipient_name: metadata.shipping_recipient_name || "",
    street_address: metadata.shipping_street_address || "",
    apartment_unit: metadata.shipping_apartment_unit || null,
    city: metadata.shipping_city || "",
    state: metadata.shipping_state || "",
    postal_code: metadata.shipping_postal_code || "",
    country: metadata.shipping_country || "",
    phone_number: metadata.shipping_phone_number || null,
  };

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: book } = await supabaseAdmin
    .from("groups")
    .select("name")
    .eq("id", bookId)
    .maybeSingle();

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert({
      // Reason: Copy-order buyer is a third party without a Supabase account.
      user_id: null,
      email,
      stripe_payment_intent: paymentIntentId,
      amount_total: session.amount_total,
      book_quantity: qty,
      shipping_address: shippingAddress,
      couple_name: book?.name || null,
      user_type: "copy_buyer",
      status: "paid",
      order_type: "copy_order",
      group_id: bookId,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      console.warn(
        "runCopyOrderSetupFromSession: order already exists (race), skipping",
        { paymentIntentId }
      );
      return { orderCreated: false };
    }
    console.error(
      "runCopyOrderSetupFromSession: order insert failed",
      { paymentIntentId, err: insertError }
    );
    throw insertError;
  }

  return { orderCreated: !!inserted };
}
