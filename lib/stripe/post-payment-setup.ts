import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeLoginEmail, sendReturningCustomerEmail } from "@/lib/postmark";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

export interface PostPaymentSetupInput {
  paymentIntent: Stripe.PaymentIntent;
  email: string;
  buyerName: string;
}

export interface PostPaymentSetupResult {
  userId: string | null;
  groupId: string | null;
  orderCreated: boolean;
  groupCreated: boolean;
  wasExisting: boolean;
}

/**
 * Phase A — idempotent DB work only. Safe to call from multiple endpoints concurrently.
 *
 * Does NOT generate magic link tokens and does NOT send emails. That's phase B
 * (`emitPostPaymentAutoLogin`) — it must be called exactly ONCE per payment to avoid
 * token invalidation (Supabase invalidates prior magic-link tokens when a new one is
 * generated for the same email).
 *
 * Side effects:
 *   - Find-or-create Supabase Auth user + profile (user_type='gift_giver', full_name)
 *   - Placeholder group (name='pending', status='pending_setup') + owner row (via trigger)
 *   - Order row (status='paid', group_id back-filled)
 *
 * Returns `orderCreated: true` when this call was the one that wrote the order row.
 * The caller that gets `orderCreated: true` owns the responsibility to call phase B.
 */
export async function runPostPaymentSetup(
  input: PostPaymentSetupInput
): Promise<PostPaymentSetupResult> {
  const { paymentIntent } = input;
  const email = input.email.trim().toLowerCase();
  const buyerName = input.buyerName?.trim() || "";

  const supabaseAdmin = createSupabaseAdminClient();
  const metadata = paymentIntent.metadata || {};
  const bookQuantity = parseInt(metadata.bookQuantity || "1", 10);
  const discountCode: string | null = metadata.discount_code || null;
  const discountAmount: number | null = metadata.discount_amount
    ? parseInt(metadata.discount_amount, 10)
    : null;

  // Reason: These come from Step 1 (DatePickerStep) and travel through PI metadata.
  // Persist them on the placeholder group so the dashboard doesn't re-prompt the user.
  const giftDate: string | null = metadata.giftDate || null;
  const giftDateUndecided: boolean = metadata.giftDateUndecided === "true";
  const bookCloseDate: string | null = metadata.bookCloseDate || null;

  // 1. Find or create user. Pass full_name in user_metadata so the handle_new_user trigger
  //    picks it up even though we'll also upsert profile below to be safe.
  const { userId, wasExisting } = await findOrCreateUser(supabaseAdmin, email, buyerName);
  if (!userId) {
    return {
      userId: null,
      groupId: null,
      orderCreated: false,
      groupCreated: false,
      wasExisting: false,
    };
  }

  // 2. Upsert profile — guarantees full_name + user_type='gift_giver' win the race with
  //    the auth trigger that auto-creates a blank profile row.
  await upsertBuyerProfile(supabaseAdmin, userId, email, buyerName);

  // 3. Order idempotency. SELECT-then-INSERT is not atomic across concurrent callers
  //    (post-payment-login + webhook race). We rely on DB UNIQUE constraint on
  //    `orders.stripe_payment_intent` to break ties — the losing caller gets 23505,
  //    catches it, and re-fetches the winner's row.
  const { data: preCheckOrder } = await supabaseAdmin
    .from("orders")
    .select("id, group_id")
    .eq("stripe_payment_intent", paymentIntent.id)
    .maybeSingle();

  let existingOrder = preCheckOrder;
  let orderCreated = false;
  if (!existingOrder) {
    const { data: inserted, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        email,
        stripe_payment_intent: paymentIntent.id,
        amount_total: paymentIntent.amount,
        book_quantity: bookQuantity,
        couple_name: null,
        user_type: "gift_giver",
        onboarding_data: metadata,
        order_type: "initial_purchase",
        status: "paid",
        discount_code: discountCode,
        discount_amount: discountAmount,
      })
      .select("id, group_id")
      .maybeSingle();

    if (orderError) {
      if (orderError.code === "23505") {
        // Reason: Concurrent caller inserted the order first. Re-query to fetch it.
        console.warn("runPostPaymentSetup: order already inserted by concurrent caller (race)");
        const { data: recovered } = await supabaseAdmin
          .from("orders")
          .select("id, group_id")
          .eq("stripe_payment_intent", paymentIntent.id)
          .maybeSingle();
        existingOrder = recovered;
      } else {
        console.error("runPostPaymentSetup: order insert failed", orderError);
      }
    } else if (inserted) {
      existingOrder = inserted;
      orderCreated = true;
    }
  }

  // 4. Group idempotency. Same race — rely on a partial UNIQUE index on
  //    `groups(created_by) WHERE status='pending_setup'` to prevent duplicates.
  const { groupId, groupCreated } = await findOrCreatePendingGroup(
    supabaseAdmin,
    userId,
    existingOrder?.group_id ?? null,
    giftDate,
    giftDateUndecided,
    bookCloseDate
  );

  // 5. Back-fill order.group_id if needed.
  await backfillOrderGroupId(supabaseAdmin, paymentIntent.id, groupId);

  return {
    userId,
    groupId,
    orderCreated,
    groupCreated,
    wasExisting,
  };
}

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
 * Session-aware variant of `runPostPaymentSetup`, fed by the Stripe Checkout
 * hosted flow via the `checkout.session.completed` webhook event.
 *
 * Extracts email/name/payment-intent from the Checkout Session, then runs the
 * same idempotent setup (user + profile + order + group) using the shared
 * private helpers. `onboarding_data` gets the session metadata (same shape as
 * the PaymentIntent-metadata-based variant).
 *
 * Throws on missing email, missing payment_intent, or metadata.type mismatch
 * — all three are programmer errors that should never happen in production.
 * Returns `orderCreated: true` when this call wrote the order row.
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
