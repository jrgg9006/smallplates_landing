import type { OnboardingUtm } from '@/lib/types/onboarding';

/**
 * Where the X button in onboarding should navigate.
 *
 * Reason: si la persona entró al onboarding desde el QR del libro
 * (utm_source=book), salir debe regresarla a /from-the-book con sus UTMs
 * preservados — no a la landing principal — para no perder el contexto
 * emocional ni el cupón si reintenta.
 */
export function onboardingExitHref(utm: OnboardingUtm | null | undefined): string {
  if (utm?.source !== 'book') return '/';
  const params = new URLSearchParams({
    utm_source: 'book',
    utm_medium: utm.medium ?? 'qr',
    utm_campaign: utm.campaign ?? 'from_the_book',
    ...(utm.book_id ? { b: utm.book_id } : {}),
  });
  return `/from-the-book?${params.toString()}`;
}
