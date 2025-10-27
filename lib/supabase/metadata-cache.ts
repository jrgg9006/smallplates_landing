/**
 * Metadata caching utilities for fast sharing performance
 * Pre-generates and caches Open Graph meta tags to eliminate server-side delays
 */

import { createSupabaseClient } from './client';

interface CachedMetadata {
  cached_og_title: string;
  cached_og_description: string;
  cached_at: string;
}

/**
 * Generate and cache metadata for a user's collection link
 */
export async function cacheUserMetadata(userId: string, userFullName: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseClient();
  
  try {
    // Extract first name for personalization
    const firstName = userFullName.split(' ')[0] || 'Someone';
    
    // Generate personalized metadata
    const cachedTitle = 'Share a Recipe to my Cookbook - SP&Co';
    const cachedDescription = `${firstName} invites you to share your favorite recipe with them! They will print a cookbook with recipes from family and friends.`;
    
    // Cache metadata in database
    const { error } = await supabase
      .from('profiles')
      .update({
        cached_og_title: cachedTitle,
        cached_og_description: cachedDescription,
        cached_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error caching metadata:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Unexpected error caching metadata:', err);
    return { success: false, error: 'Failed to cache metadata' };
  }
}

/**
 * Get cached metadata for fast sharing (used in generateMetadata)
 */
export async function getCachedMetadata(token: string): Promise<{ data: CachedMetadata | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('cached_og_title, cached_og_description, cached_at')
      .eq('collection_link_token', token)
      .eq('collection_enabled', true)
      .single();
    
    if (error) {
      return { data: null, error: error.message };
    }
    
    // If no cached data, return null (will use defaults)
    if (!data.cached_og_title || !data.cached_og_description) {
      return { data: null, error: null };
    }
    
    return { data: data as CachedMetadata, error: null };
  } catch (err) {
    console.error('Error fetching cached metadata:', err);
    return { data: null, error: 'Failed to fetch cached metadata' };
  }
}

/**
 * Refresh metadata cache (call when user updates their name)
 */
export async function refreshMetadataCache(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseClient();
  
  try {
    // Get current user data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      return { success: false, error: 'User not found' };
    }
    
    // Re-cache metadata with current name
    return await cacheUserMetadata(userId, profile.full_name);
  } catch (err) {
    console.error('Error refreshing metadata cache:', err);
    return { success: false, error: 'Failed to refresh cache' };
  }
}