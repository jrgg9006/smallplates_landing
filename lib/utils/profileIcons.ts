/**
 * Utility functions for handling guest profile icons
 */

// Available profile icons in the public/images/icons_profile/ directory
const PROFILE_ICONS = [
  'chef1.png',
  'chef2.png',
  'chef3.png',
  'chef4.png',
  'chef5.png',
  'chef6.png',
  'chef7.png',
  'chef8.png',
  'chef9.png',
  'chef10.png',
  'chef11.png',
  'chef12.png',
  'chef13.png',
  'chef14.png',
  'chef15.png',
];

/**
 * Get a profile icon path for a guest based on their ID
 * Uses a deterministic approach so the same guest always gets the same icon
 * 
 * Args:
 *   guestId (string): The unique ID of the guest
 * 
 * Returns:
 *   string: The full path to the profile icon
 */
export function getGuestProfileIcon(guestId: string): string {
  // Convert guest ID to a number for deterministic selection
  let hash = 0;
  for (let i = 0; i < guestId.length; i++) {
    const char = guestId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value to ensure positive index
  const iconIndex = Math.abs(hash) % PROFILE_ICONS.length;
  const iconFilename = PROFILE_ICONS[iconIndex];
  
  return `/images/icons_profile/${iconFilename}`;
}

/**
 * Get a random profile icon path (for new guests without an ID yet)
 * 
 * Returns:
 *   string: The full path to a random profile icon
 */
export function getRandomProfileIcon(): string {
  const randomIndex = Math.floor(Math.random() * PROFILE_ICONS.length);
  const iconFilename = PROFILE_ICONS[randomIndex];
  
  return `/images/icons_profile/${iconFilename}`;
}

/**
 * Get the total number of available profile icons
 * 
 * Returns:
 *   number: The total count of available profile icons
 */
export function getProfileIconCount(): number {
  return PROFILE_ICONS.length;
}