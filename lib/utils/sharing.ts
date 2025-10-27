/**
 * Utility functions for URL sharing and WhatsApp compatibility
 */

/**
 * Check if the current user agent is iOS
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if the current user agent is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Validate URL for WhatsApp sharing compatibility
 */
export function validateWhatsAppURL(url: string): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check URL length (WhatsApp has a 2048 character limit for URLs)
  if (url.length > 2048) {
    issues.push('URL exceeds WhatsApp\'s 2048 character limit');
    recommendations.push('Shorten the URL or use a URL shortener');
  }

  // Check for problematic characters
  const problematicChars = /[&=?#%\s]/;
  if (problematicChars.test(url) && !url.includes('://')) {
    issues.push('URL contains characters that should be encoded');
    recommendations.push('Ensure proper URL encoding with encodeURIComponent()');
  }

  // Check if URL is properly formed
  try {
    new URL(url);
  } catch {
    issues.push('URL is not properly formatted');
    recommendations.push('Ensure URL includes protocol (http:// or https://)');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Get WhatsApp sharing troubleshooting tips based on user agent
 */
export function getWhatsAppTroubleshootingTips(): string[] {
  const tips: string[] = [];
  
  if (isIOSDevice()) {
    tips.push(
      'If WhatsApp "Next" button doesn\'t work:',
      '1. Open WhatsApp → Settings → Privacy → App Lock',
      '2. Turn OFF "Require Face ID"',
      '3. Or use system-level Face ID by long-pressing WhatsApp icon',
      '4. Alternative: Copy link and paste directly into WhatsApp chat'
    );
  } else {
    tips.push(
      'If sharing fails:',
      '1. Copy the link and paste it manually into WhatsApp',
      '2. Ensure WhatsApp is updated to the latest version',
      '3. Try restarting WhatsApp if issues persist'
    );
  }

  return tips;
}

/**
 * Create a properly encoded share URL for messaging apps
 */
export function createShareURL(baseUrl: string, token: string): string {
  // Ensure the token is properly encoded (though our tokens are already URL-safe)
  const encodedToken = encodeURIComponent(token);
  return `${baseUrl}/collect/${encodedToken}`;
}