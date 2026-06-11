"use client";

import React, { useEffect, useState } from 'react';
import { PersonalInfoForm } from './PersonalInfoForm';
import { EmailChangeForm } from './EmailChangeForm';
import { PasswordChangeForm } from './PasswordChangeForm';
import { DangerZone } from './DangerZone';
import { getCurrentProfile } from '@/lib/supabase/profiles';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="grid gap-6 py-10 md:grid-cols-[220px_1fr] md:gap-12">
      <div>
        <h3 className="font-serif text-2xl font-medium tracking-tight text-[hsl(var(--brand-charcoal))]">
          {title}
        </h3>
        {description && <p className="mt-1.5 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="max-w-xl">{children}</div>
    </section>
  );
}

export function AccountSettings() {
  // Reason: whether the user deliberately set a password decides what the
  // Email, Password and Delete sections ask for. null = still loading.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    getCurrentProfile().then(({ data }) => {
      setHasPassword(Boolean(data?.password_set_at));
    });
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="pb-10">
        <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-[hsl(var(--brand-charcoal))]">
          Your account
        </h1>
        <p className="mt-3 text-gray-600">
          Your name, your email, your password. That&apos;s it.
        </p>
      </div>

      <div className="divide-y divide-[hsl(var(--brand-border))] border-t border-[hsl(var(--brand-border))]">
        <SettingsSection
          title="Your details"
          description="Your name here, and how it appears in the book."
        >
          <PersonalInfoForm />
        </SettingsSection>

        <SettingsSection title="Email" description="Where we reach you.">
          <EmailChangeForm hasPassword={hasPassword} />
        </SettingsSection>

        <SettingsSection title="Password">
          <PasswordChangeForm
            hasPassword={hasPassword}
            onPasswordSet={() => setHasPassword(true)}
          />
        </SettingsSection>

        <SettingsSection title="Delete account">
          <DangerZone hasPassword={hasPassword} />
        </SettingsSection>
      </div>
    </div>
  );
}
