"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import Image from "next/image";

interface GroupInfo {
  id: string;
  name: string;
  description?: string;
}

interface GroupJoinFormProps {
  // Content customization
  title: string;
  groupData: GroupInfo | null;
  inviterName?: string; // Optional - shows "John invited you to join:" if provided
  subtitle?: string; // Optional custom subtitle
  
  // Pre-filled form data
  preFilledData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  
  // Form submission
  onJoin: (formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Loading states
  verifying?: boolean;
  verifyMessage?: string;
  
  // Error states
  verifyError?: string | null;
  errorTitle?: string;
  
  // Footer text
  footerText?: string;
  
  // Auto-focus first input
  autoFocus?: boolean;
}

export function GroupJoinForm({
  title,
  groupData,
  inviterName,
  subtitle,
  preFilledData,
  onJoin,
  verifying = false,
  verifyMessage = "Loading...",
  verifyError = null,
  errorTitle = "Error",
  footerText = "By joining, you're helping create a beautiful keepsake for the couple.",
  autoFocus = false
}: GroupJoinFormProps) {
  const router = useRouter();
  
  // Toggle state - false = create account, true = sign in
  const [hasAccount, setHasAccount] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: preFilledData?.firstName || '',
    lastName: preFilledData?.lastName || '',
    email: preFilledData?.email || '',
    password: '',
    confirmPassword: ''
  });

  // Update form when pre-filled data changes
  useEffect(() => {
    if (preFilledData) {
      setFormData(prev => ({
        ...prev,
        firstName: preFilledData.firstName || prev.firstName,
        lastName: preFilledData.lastName || prev.lastName,
        email: preFilledData.email || prev.email,
      }));
    }
  }, [preFilledData]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [groupName, setGroupName] = useState<string>('');

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form - firstName only required for new accounts
    if (!hasAccount && !formData.firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Password confirmation only required for new accounts
    if (!hasAccount && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await onJoin({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (!result.success) {
        // Handle already member case
        if (result.data?.alreadyMember) {
          setError('You are already a member of this group');
          setTimeout(() => {
            router.push('/profile/groups');
          }, 2000);
          return;
        }
        setError(result.error || 'Failed to join group');
        return;
      }

      // Success! Show success message briefly, then redirect
      setSuccess(true);
      setGroupName(result.data?.groupName || groupData?.name || 'the group');

      // Sign in the user automatically (both new and existing users)
      // API has already verified password for existing users, so we can log them in
      const supabase = createSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      });

      if (signInError) {
        console.error('Auto sign-in failed:', signInError);
        // Don't block the flow - user can sign in manually
        // But show an error message
        setError('Successfully joined group, but auto-login failed. Please log in manually.');
        setTimeout(() => {
          router.push('/');
        }, 3000);
        return;
      }

      console.log('✅ User logged in successfully, redirecting to groups page');

      // Redirect to groups page after a brief delay
      // For better UX, we could redirect directly to the specific group if we have the groupId
      const redirectPath = result.data?.groupId 
        ? `/profile/groups?group=${result.data.groupId}`
        : '/profile/groups';
      
      setTimeout(() => {
        router.push(redirectPath);
      }, 2000);

    } catch (err) {
      console.error('Error joining group:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Loading verification state
  if (verifying) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{verifyMessage}</p>
        </div>
      </div>
    );
  }

  // Error state (verification failed)
  if (verifyError && !groupData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-4">
            {errorTitle}
          </h1>
          <p className="text-gray-600 mb-6">
            {verifyError}
          </p>
          <Button 
            onClick={() => router.push('/')}
            className="bg-black text-white hover:bg-gray-800"
          >
            Go to Home Page
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-4">
            Welcome to the Cookbook!
          </h1>
          <p className="text-gray-600 mb-6">
            You&apos;ve successfully joined <span className="font-medium">{groupName}</span> and can now help create this special gift.
            Redirecting to your cookbooks...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Main join form
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center justify-center">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={180}
            height={28}
            className="mx-auto"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-serif font-semibold text-gray-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 mb-4">{subtitle}</p>
          )}
          {groupData && (
            <div className="space-y-2 mt-4">
              {inviterName ? (
                <p className="text-gray-600">
                  <span className="font-medium">{inviterName}</span> invited you to join:
                </p>
              ) : (
                <p className="text-gray-600">
                  You&apos;ve been invited to join:
                </p>
              )}
              <h3 className="text-2xl font-serif font-bold text-black text-center mt-2 mb-6">
                {groupData.name}
              </h3>
            </div>
          )}
        </div>

        {/* Account Type Toggle */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="relative">
              <input
                id="hasAccount"
                type="checkbox"
                checked={hasAccount}
                onChange={(e) => {
                  setHasAccount(e.target.checked);
                  setError(null);
                  // Clear confirm password when switching to sign in mode
                  if (e.target.checked) {
                    setFormData(prev => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                className="sr-only"
              />
              <div className={`block w-14 h-8 rounded-full cursor-pointer transition-colors duration-300 ${
                hasAccount ? 'bg-amber-400' : 'bg-gray-300'
              }`} onClick={() => setHasAccount(!hasAccount)}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-all duration-300 transform shadow-sm ${
                hasAccount ? 'translate-x-6' : 'translate-x-0'
              } cursor-pointer`} onClick={() => setHasAccount(!hasAccount)}></div>
            </div>
            <label htmlFor="hasAccount" className="text-sm font-medium text-gray-700 cursor-pointer" onClick={() => setHasAccount(!hasAccount)}>
              I already have a Small Plates account
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {hasAccount ? 'Sign in with your existing password' : 'Create your account to start sharing recipes'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleJoinGroup} className="space-y-4">
          {/* Name Fields - Only show for new accounts */}
          {!hasAccount && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="First name"
                  required
                  disabled={loading}
                  autoFocus={autoFocus}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Last name"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          {/* Password Fields */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={hasAccount ? "Your current password" : "Create a password"}
              required
              disabled={loading}
              minLength={hasAccount ? 1 : 8}
              autoFocus={hasAccount ? autoFocus : false}
            />
            {!hasAccount && (
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
            )}
          </div>

          {/* Confirm Password - Only show for new accounts */}
          {!hasAccount && (
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800 py-3"
            disabled={loading}
          >
            {loading 
              ? (hasAccount ? 'Signing In...' : 'Creating Account...') 
              : (hasAccount ? 'Sign In & Join Group' : 'Create Account & Join Group')
            }
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {footerText}
          </p>
        </div>
      </div>
    </div>
  );
}

