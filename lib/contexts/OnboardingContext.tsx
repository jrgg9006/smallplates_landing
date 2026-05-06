"use client";

import React, { useEffect } from "react";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  OnboardingState,
  OnboardingContextType,
  ShippingCountry,
  OnboardingUtm,
} from "@/lib/types/onboarding";

// Reason: Bump this when the step order changes to invalidate stale localStorage
const STATE_VERSION = 8;

// Reason: Consolidated flow — 1. Date → 2. Copies → 3. Review + Pay (name/email inline)
const TOTAL_STEPS_COUPLE = 3;
const TOTAL_STEPS_GIFT = 3;

const getInitialState = (userType: 'couple' | 'gift_giver'): OnboardingState => ({
  currentStep: 1,
  totalSteps: userType === 'couple' ? TOTAL_STEPS_COUPLE : TOTAL_STEPS_GIFT,
  answers: {},
  selectedProductTier: null,
  bookQuantity: 1,
  shippingCountry: null,
  isComplete: false,
  paymentIntentId: null,
  clientSecret: null,
  utm: null,
});

/**
 * Read UTM params + book_id from current URL. Returns null if nothing present.
 * Reason: A fresh visit with UTMs in the URL must override any persisted UTM
 * context — different campaigns shouldn't bleed into each other.
 */
const readUtmFromUrl = (): OnboardingUtm | null => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: OnboardingUtm = {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      book_id: params.get('b') || undefined,
    };
    const hasAny = !!(utm.source || utm.medium || utm.campaign || utm.book_id);
    return hasAny ? utm : null;
  } catch {
    return null;
  }
};

/**
 * UTMs persist in sessionStorage (NOT localStorage) so they only live during
 * the current browser session. Reason: si los guardáramos en localStorage,
 * un usuario que visitó /from-the-book ayer y hoy entra desde la landing
 * principal recibiría descuento del 15% aunque no venga del libro físico.
 * sessionStorage se limpia al cerrar la pestaña, lo cual ata el descuento
 * a UNA sesión real.
 */
const UTM_SESSION_KEY = 'sp_onboarding_utm';

const saveUtmToSession = (utm: OnboardingUtm | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (utm === null) {
      sessionStorage.removeItem(UTM_SESSION_KEY);
    } else {
      sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(utm));
    }
  } catch {
    // Silent fail — UTM tracking should never break the app.
  }
};

const loadUtmFromSession = (): OnboardingUtm | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(UTM_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as OnboardingUtm;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Get localStorage key for onboarding state
 */
const getStorageKey = (userType: 'couple' | 'gift_giver'): string => {
  return `onboarding_state_${userType}`;
};

/**
 * Load onboarding state from localStorage
 */
const loadStateFromStorage = (userType: 'couple' | 'gift_giver'): OnboardingState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(getStorageKey(userType));
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure and version — discard stale state from old step layouts
      if (parsed && typeof parsed === 'object' && 'currentStep' in parsed && parsed._version === STATE_VERSION) {
        return parsed as OnboardingState;
      }
    }
  } catch (e) {
    // Ignore parsing errors
    console.warn('Failed to load onboarding state from localStorage:', e);
  }
  
  return null;
};

/**
 * Save onboarding state to localStorage.
 * Reason: `utm` se excluye intencionalmente del payload de localStorage —
 * los UTMs viven en sessionStorage para que no contaminen sesiones futuras.
 */
const saveStateToStorage = (userType: 'couple' | 'gift_giver', state: OnboardingState): void => {
  if (typeof window === 'undefined') return;

  try {
    const { utm: _utm, ...stateWithoutUtm } = state;
    void _utm;
    localStorage.setItem(
      getStorageKey(userType),
      JSON.stringify({ ...stateWithoutUtm, _version: STATE_VERSION }),
    );
  } catch (e) {
    console.warn('Failed to save onboarding state to localStorage:', e);
  }
};

/**
 * Clear onboarding state from localStorage AND clear UTM context from
 * sessionStorage. Reason: cuando un onboarding se completa o resetea, los
 * UTMs ya cumplieron su función — no deben persistir para el siguiente
 * visitante en la misma pestaña.
 */
const clearStateFromStorage = (userType: 'couple' | 'gift_giver'): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(getStorageKey(userType));
  } catch (e) {
    console.warn('Failed to clear onboarding state from localStorage:', e);
  }
  saveUtmToSession(null);
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
  userType?: 'couple' | 'gift_giver';
  skipAuth?: boolean;
}

/**
 * Onboarding Provider component to manage questionnaire state
 *
 * Args:
 *   children (ReactNode): Child components
 *   userType (string): Type of user - 'couple' or 'gift_giver'
 */
export function OnboardingProvider({ children, userType = 'couple', skipAuth = false }: OnboardingProviderProps) {
  // Initialize with default state first (to avoid hydration mismatch)
  const [state, setState] = useState<OnboardingState>(() => getInitialState(userType));
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration (client-side only)
  useEffect(() => {
    // Reason: URLs ganan siempre. Si la URL trae UTMs, esos son la fuente —
    // refrescamos sessionStorage. Si la URL no trae nada, usamos lo que haya
    // en sessionStorage (mismo browser tab, journey en curso). NO leer
    // localStorage para UTMs — eso causaría leak entre sesiones.
    const urlUtm = readUtmFromUrl();
    if (urlUtm) {
      saveUtmToSession(urlUtm);
    }
    const effectiveUtm = urlUtm ?? loadUtmFromSession();

    if (!skipAuth) {
      const saved = loadStateFromStorage(userType);
      if (saved && !saved.isComplete) {
        const totalSteps = userType === 'couple' ? TOTAL_STEPS_COUPLE : TOTAL_STEPS_GIFT;
        // Reason: If payment already completed and user was past step 3, resume there.
        // Don't force-jump if user was still on steps 1-3 with a stale paymentIntentId.
        const restoredStep = saved.currentStep;

        setState({
          ...saved,
          totalSteps,
          currentStep: restoredStep,
          // Reason: Migrate old localStorage state that lacks new fields
          bookQuantity: saved.bookQuantity ?? 1,
          shippingCountry: saved.shippingCountry ?? null,
          paymentIntentId: saved.paymentIntentId ?? null,
          clientSecret: saved.clientSecret ?? null,
          utm: effectiveUtm,
        });
      } else if (effectiveUtm) {
        setState((prev) => ({ ...prev, utm: effectiveUtm }));
      }
    } else if (effectiveUtm) {
      setState((prev) => ({ ...prev, utm: effectiveUtm }));
    }
    setIsHydrated(true);
  }, [userType, skipAuth]);

  // Save state to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && !state.isComplete && !skipAuth) {
      saveStateToStorage(userType, state);
    }
  }, [state, userType, isHydrated, skipAuth]);

  /**
   * Navigate to the next step
   */
  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.totalSteps),
    }));
  }, []);

  /**
   * Navigate to the previous step
   */
  const previousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  /**
   * Update data for a specific step
   *
   * Args:
   *   stepId (number): The step number
   *   data (Record<string, any>): The data to store for this step
   */
  const updateStepData = useCallback(
    (stepId: number, data: Record<string, any>) => {
      return new Promise<void>((resolve) => {
        setState((prev) => ({
          ...prev,
          answers: {
            ...prev.answers,
            [`step${stepId}`]: data,
          },
        }));
        // Use setTimeout to ensure state update has completed
        setTimeout(resolve, 0);
      });
    },
    []
  );

  /**
   * Update selected product tier
   */
  const updateProductTier = useCallback((tierId: string) => {
    setState((prev) => ({
      ...prev,
      selectedProductTier: tierId,
    }));
  }, []);

  /**
   * Store Stripe payment intent info after creating a PI
   */
  const setPaymentInfo = useCallback((paymentIntentId: string, clientSecret: string) => {
    setState((prev) => ({
      ...prev,
      paymentIntentId,
      clientSecret,
    }));
  }, []);

  /**
   * Update book quantity and shipping country selection
   */
  const updateBookSelection = useCallback((quantity: number, country: ShippingCountry) => {
    setState((prev) => ({
      ...prev,
      bookQuantity: quantity,
      shippingCountry: country,
      // Reason: Keep selectedProductTier in sync with book selection
      selectedProductTier: 'the-book',
    }));
  }, []);

  /**
   * Legacy completeOnboarding — payment is now handled inline.
   * Kept for interface compatibility.
   */
  const completeOnboarding = useCallback(
    async () => {
      clearStateFromStorage(userType);
      setState(prev => ({ ...prev, isComplete: true }));
    },
    [userType]
  );

  /**
   * Reset onboarding state to initial values
   */
  const resetOnboarding = useCallback(() => {
    clearStateFromStorage(userType);
    setState(getInitialState(userType));
  }, [userType]);

  const value: OnboardingContextType = {
    state,
    nextStep,
    previousStep,
    updateStepData,
    updateProductTier,
    updateBookSelection,
    setPaymentInfo,
    completeOnboarding,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to use onboarding context
 *
 * Returns:
 *   OnboardingContextType: Onboarding context with state and methods
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
