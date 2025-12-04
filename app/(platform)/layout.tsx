"use client";

import { ProfileOnboardingProvider } from '@/lib/contexts/ProfileOnboardingContext';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileOnboardingProvider>
      {children}
    </ProfileOnboardingProvider>
  );
}