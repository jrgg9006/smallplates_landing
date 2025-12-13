"use client";

import React, { useState } from "react";
import { Mail, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

interface EmailVerificationBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
  userEmail?: string;
}

export function EmailVerificationBanner({ isVisible, onDismiss, userEmail }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { user } = useAuth();

  const handleResendEmail = async () => {
    if (!userEmail && !user?.email) return;
    
    const emailToSend = userEmail || user?.email;
    console.log('🔄 BANNER: Attempting to resend email to:', {
      userEmail,
      userEmailFromAuth: user?.email,
      finalEmail: emailToSend,
      userId: user?.id
    });
    
    setIsResending(true);
    setResendStatus('idle');

    try {
      const response = await fetch('/api/v1/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToSend
        })
      });

      if (response.ok) {
        setResendStatus('success');
        setTimeout(() => setResendStatus('idle'), 5000);
      } else {
        setResendStatus('error');
        setTimeout(() => setResendStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setResendStatus('error');
      setTimeout(() => setResendStatus('idle'), 5000);
    } finally {
      setIsResending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-[hsl(var(--brand-honey))]/10 border border-[hsl(var(--brand-honey))]/20 p-3 mb-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-[hsl(var(--brand-honey))] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-[hsl(var(--brand-charcoal))]">
              Please verify{' '}
              <span className="font-medium">{userEmail || user?.email}</span>{' '}
              to unlock all features.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="inline-flex items-center text-xs text-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey))]/80 transition-colors disabled:opacity-50"
            >
              {isResending ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Mail className="h-3 w-3 mr-1" />
              )}
              {isResending ? 'Sending...' : 'Resend'}
            </button>
            {resendStatus === 'success' && (
              <span className="text-xs text-[hsl(var(--brand-honey))] font-medium">
                ✓ Sent
              </span>
            )}
            {resendStatus === 'error' && (
              <span className="text-xs text-red-600">
                Error
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors ml-2"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}