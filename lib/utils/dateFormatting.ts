/**
 * Date formatting utilities for wedding dates and timeframes
 * Implements Option 4: Timeframe Poetry for elegant wedding date handling
 */

export type WeddingTimeline = '6-plus-months' | '3-6-months' | '1-3-months' | 'less-than-month' | 'already-happened' | null;

/**
 * Converts timeline options to elegant, editorial-style phrases
 * Following Margot's sophisticated voice and the brand personality
 */
export function formatWeddingTimeframe(timeline: WeddingTimeline): string {
  switch (timeline) {
    case '6-plus-months':
      return 'Celebrations ahead';
    case '3-6-months':
      return 'In the coming months';
    case '1-3-months':
      return 'Very soon';
    case 'less-than-month':
      return 'Almost here';
    case 'already-happened':
      return 'Recently celebrated';
    default:
      return 'Celebrations planned';
  }
}

/**
 * Formats an actual wedding date in an elegant, editorial style
 * Fixed timezone issue by treating date as local date instead of UTC
 */
export function formatWeddingDate(dateString: string): string {
  try {
    // Parse as local date to avoid timezone conversion issues
    // dateString comes as "YYYY-MM-DD" from the date input
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch (error) {
    // console.log removed for production
    return 'Celebrations planned';
  }
}

/**
 * Main function to determine what wedding-related text to display
 * Prioritizes actual dates, falls back to timeframe poetry, then graceful defaults
 * Updated to work with Group data instead of Profile data
 */
export function getWeddingDisplayText(
  weddingDate: string | null,
  weddingDateUndecided: boolean,
  timeline: WeddingTimeline
): string {
  // If we have a specific wedding date and it's not marked as undecided
  if (weddingDate && !weddingDateUndecided) {
    return formatWeddingDate(weddingDate);
  }
  
  // If we have a timeline (from gift giver or general planning)
  if (timeline) {
    return formatWeddingTimeframe(timeline);
  }
  
  // If date is explicitly marked as undecided
  if (weddingDateUndecided) {
    return 'Celebrations planned';
  }
  
  // Graceful fallback for any other case
  return 'Recipes collected with love';
}

/**
 * Alternative graceful fallbacks for when we want variety in the copy
 * Following Margot's editorial sensibilities
 */
export const gracefulFallbacks = [
  'Recipes collected with love',
  'A gathering of favorites',
  'Stories from the kitchen'
] as const;

/**
 * Returns a random graceful fallback for variety
 */
export function getRandomGracefulFallback(): string {
  const randomIndex = Math.floor(Math.random() * gracefulFallbacks.length);
  return gracefulFallbacks[randomIndex];
}