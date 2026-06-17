import { redirect } from "next/navigation";

// Reason: the old upfront paid onboarding (Stripe `create-checkout-session`) was
// retired when the platform moved fully to free-tier. Anyone landing on the old
// /onboarding URL (stale bookmark or printed link) is sent to the current
// free-tier flow instead of a broken checkout.
export default function OnboardingRedirect() {
  redirect("/onboarding/welcome");
}
