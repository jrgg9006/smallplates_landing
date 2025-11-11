"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import Image from "next/image";

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  expiresAt: string;
}

type Status = 'loading' | 'valid' | 'expired' | 'used' | 'invalid' | 'error';

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isFormValid = password.length >= 8 && password === confirmPassword;

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const { token } = await params;
        const response = await fetch(`/api/invitations/verify/${token}`);
        const data = await response.json();

        if (response.ok && data.status === 'valid') {
          setInvitationData(data.data);
          setStatus('valid');
          
          // 👁️ Track that user visited the join page
          fetch('/api/invitations/mark-visited', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          }).catch(err => {
            // Silent fail - don't block user experience for tracking
            console.warn('Failed to mark invitation as visited:', err);
          });
        } else {
          setStatus(data.status || 'invalid');
          if (data.status === 'expired' && data.expiresAt) {
            setInvitationData({ ...data.data, expiresAt: data.expiresAt });
          }
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        setStatus('error');
      }
    };

    verifyToken();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setError("Please make sure passwords match and are at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { token } = await params;
      // Call consume API to create account
      const response = await fetch('/api/invitations/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token, 
          password 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      // Success! Now sign in the user
      const supabase = createSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitationData!.email,
        password: password
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        // Account was created but sign in failed - still show success
        setSuccess(true);
        setTimeout(() => {
          router.push('/'); // Redirect to home to login
        }, 3000);
      } else {
        // Signed in successfully
        setSuccess(true);
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      }
      
    } catch (err) {
      console.error("Account creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={200}
            height={40}
            className="mx-auto mb-8"
            priority
          />
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mb-3">
            Invalid Invitation Link
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This invitation link appears to be invalid. Please contact the administrator for a new invitation.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Expired token
  if (status === 'expired') {
    const expiryDate = invitationData?.expiresAt 
      ? new Date(invitationData.expiresAt).toLocaleDateString()
      : '';

    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={200}
            height={40}
            className="mx-auto mb-8"
            priority
          />
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mb-3">
            Invitation Expired
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This invitation expired on {expiryDate}. Please contact the administrator for a new invitation.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Used token
  if (status === 'used') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={200}
            height={40}
            className="mx-auto mb-8"
            priority
          />
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mb-3">
            Invitation Already Used
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This invitation has already been used to create an account. Please log in with your credentials.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={200}
              height={40}
              className="mx-auto mb-8"
              priority
            />
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-gray-900 mb-3">
              Welcome to Small Plates!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your account has been created successfully. Redirecting to your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show signup form
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto px-6 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={200}
            height={40}
            className="mx-auto mb-8"
            priority
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
            Welcome to Small Plates & Co.
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Create a password to access your profile
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Enter your password"
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Confirm your password"
              minLength={8}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              isFormValid && !loading
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Go to Site
          </button>
        </div>
      </div>
    </div>
  );
}