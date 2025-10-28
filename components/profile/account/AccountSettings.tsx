"use client";

import React from 'react';
import { PersonalInfoForm } from './PersonalInfoForm';
import { EmailChangeForm } from './EmailChangeForm';
import { PasswordChangeForm } from './PasswordChangeForm';
import { DangerZone } from './DangerZone';

export function AccountSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <PersonalInfoForm />
      </div>

      {/* Email Management Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Address</h3>
        <EmailChangeForm />
      </div>

      {/* Password Management Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Password & Security</h3>
        <PasswordChangeForm />
      </div>

      {/* Account Deletion */}
      <DangerZone />
    </div>
  );
}