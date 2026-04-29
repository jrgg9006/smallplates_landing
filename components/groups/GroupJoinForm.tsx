"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  coupleImageUrl?: string | null; // Optional couple image URL
  
  // Pre-filled form data
  preFilledData?: {
    fullName?: string;
    email?: string;
  };

  // Form submission
  onJoin: (formData: {
    fullName: string;
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
  coupleImageUrl,
  onJoin,
  verifying = false,
  verifyMessage = "Loading...",
  verifyError = null,
  errorTitle = "Error",
  footerText = "By joining, you're helping create a beautiful keepsake for the couple.",
  autoFocus = false
}: GroupJoinFormProps) {
  const router = useRouter();
  
  // Reason: Only show image section if couple actually uploaded one — no broken placeholder
  const [imageError, setImageError] = useState(false);
  const displayImage = (coupleImageUrl && !imageError) ? coupleImageUrl : null;

  // Toggle state - false = create account, true = sign in
  const [hasAccount, setHasAccount] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: preFilledData?.fullName || '',
    email: preFilledData?.email || '',
    password: '',
    confirmPassword: ''
  });

  // Update form when pre-filled data changes
  useEffect(() => {
    if (preFilledData) {
      setFormData(prev => ({
        ...prev,
        fullName: preFilledData.fullName || prev.fullName,
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

    // Validate form - name only required for new accounts
    if (!hasAccount && !formData.fullName.trim()) {
      setError('Name is required');
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
        fullName: formData.fullName.trim(),
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

      // console.log removed for production

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
          <h1 className="text-2xl font-serif font-semibold text-brand-charcoal mb-4">
            {errorTitle}
          </h1>
          <p className="text-[hsl(var(--brand-warm-gray-light))] mb-6">
            {verifyError}
          </p>
          <Button 
            onClick={() => router.push('/')}
            className="bg-brand-charcoal text-white hover:bg-brand-charcoal-deep"
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
          <h1 className="text-2xl font-serif font-semibold text-brand-charcoal mb-4">
            Welcome to the Cookbook!
          </h1>
          <p className="text-[hsl(var(--brand-warm-gray-light))] mb-6">
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
          <Link href="/" className="flex items-center hover:opacity-70 transition-opacity">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={180}
              height={28}
              className="mx-auto"
            />
          </Link>
        </div>
      </div>

      {/* Main Content - Editorial Layout */}
      <div className="max-w-6xl mx-auto">
        {/* Mobile: Stacked layout, Desktop: Two columns */}
        <div className={`lg:items-center lg:min-h-[calc(100vh-3.5rem)] ${displayImage ? 'lg:grid lg:grid-cols-2 lg:gap-8' : 'flex justify-center'}`}>
          
          {/* Image Section - Left side on desktop, top on mobile */}
          {displayImage && (
            <div className="flex items-center justify-center lg:justify-start mb-6 lg:mb-0">
              <div className="w-full lg:max-w-sm lg:mx-auto">
                <div className="relative w-full h-40 sm:h-44 lg:h-[450px] lg:max-h-[60vh] overflow-hidden rounded-lg lg:rounded-xl shadow-sm border border-brand-sand">
                  <Image
                    src={displayImage}
                    alt={groupData?.name || "Wedding cookbook"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 400px"
                    priority
                    onError={() => setImageError(true)}
                  />
                  {/* Subtle gradient overlay for editorial feel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/5 via-transparent to-transparent lg:bg-gradient-to-r lg:from-brand-charcoal/3 lg:via-transparent lg:to-transparent" />
                </div>
              </div>
            </div>
          )}

          {/* Content Section - Right side on desktop, below image on mobile */}
          <div className="flex items-center">
            <div className="w-full max-w-md mx-auto px-6 py-8 lg:py-6">
              
              {/* Title Section */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-brand-charcoal mb-1">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-[hsl(var(--brand-warm-gray-light))] mb-2 text-sm">{subtitle}</p>
                )}
                {groupData && (
                  <div className="mt-3">
                    {inviterName ? (
                      <p className="text-[hsl(var(--brand-warm-gray-light))] text-sm">
                        <span className="font-medium text-brand-charcoal">{inviterName}</span> invited you to join:
                      </p>
                    ) : (
                      <p className="text-[hsl(var(--brand-warm-gray-light))] text-sm">
                        You&apos;ve been invited to join:
                      </p>
                    )}
                    <h3 className="text-lg sm:text-xl font-serif font-semibold text-brand-charcoal mt-1">
                      {groupData.name}
                    </h3>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleJoinGroup} className="space-y-5">
          {/* Name Field - Only show for new accounts */}
          {!hasAccount && (
            <div>
              <Label htmlFor="fullName" className="text-xs font-medium text-[hsl(var(--brand-warm-gray-light))] uppercase tracking-wide">
                Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Your full name"
                required
                disabled={loading}
                autoFocus={autoFocus}
                className="mt-1.5"
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <Label htmlFor="email" className="text-xs font-medium text-[hsl(var(--brand-warm-gray-light))] uppercase tracking-wide">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
              className="mt-1.5"
            />
          </div>

          {/* Password Fields */}
          <div>
            <Label htmlFor="password" className="text-xs font-medium text-[hsl(var(--brand-warm-gray-light))] uppercase tracking-wide">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={hasAccount ? "Your current password" : "Min. 8 characters"}
              required
              disabled={loading}
              minLength={hasAccount ? 1 : 8}
              autoFocus={hasAccount ? autoFocus : false}
              className="mt-1.5"
            />
          </div>

          {/* Confirm Password - Only show for new accounts */}
          {!hasAccount && (
            <div>
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-[hsl(var(--brand-warm-gray-light))] uppercase tracking-wide">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
                className="mt-1.5"
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
            className="w-full bg-brand-charcoal text-white hover:bg-brand-charcoal-deep py-3 text-sm font-semibold mt-2"
            disabled={loading}
          >
            {loading
              ? (hasAccount ? 'Signing In...' : 'Creating Account...')
              : (hasAccount ? 'Sign In & Join' : 'Create Account & Join')
            }
          </Button>
              </form>

              {/* Account Toggle - Below form, less prominent */}
              <div className="mt-6 pt-5 border-t border-brand-sand">
                <button
                  type="button"
                  onClick={() => {
                    setHasAccount(!hasAccount);
                    setError(null);
                    if (!hasAccount) {
                      setFormData(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  className="w-full text-center text-sm text-[hsl(var(--brand-warm-gray-light))] hover:text-brand-charcoal transition-colors"
                >
                  {hasAccount ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-[hsl(var(--brand-warm-gray-light))]">
                  {footerText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

