/**
 * Waitlist Service Functions
 * Simple CRUD operations for the waitlist table
 */

import { createSupabaseClient } from './client';

export interface WaitlistData {
  email: string;
  firstName: string;
  lastName: string;
  recipeGoalCategory?: string;
  useCase?: string;
  hasPartner?: boolean;
  partnerFirstName?: string;
  partnerLastName?: string;
}

export interface WaitlistUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  recipe_goal_category: string | null;
  use_case: string | null;
  has_partner: boolean;
  partner_first_name: string | null;
  partner_last_name: string | null;
  status: 'pending' | 'invited' | 'visited' | 'converted' | 'unsubscribed' | 'deleted';
  invited_at: string | null;
  converted_at: string | null;
  deleted_at: string | null;
  deleted_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Add a new user to the waitlist
 * Called during onboarding when user completes signup
 */
export async function addToWaitlist(data: WaitlistData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseClient();

    // console.log removed for production

    const { data: result, error } = await supabase
      .from('waitlist')
      .insert({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        recipe_goal_category: data.recipeGoalCategory || null,
        use_case: data.useCase || null,
        has_partner: data.hasPartner || false,
        partner_first_name: data.partnerFirstName || null,
        partner_last_name: data.partnerLastName || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding to waitlist:', error);
      
      // Check for duplicate email
      if (error.code === '23505') {
        return { success: false, error: 'This email is already on the waitlist' };
      }
      
      return { success: false, error: error.message };
    }

    // console.log removed for production
    return { success: true };

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to add to waitlist' 
    };
  }
}

/**
 * Get all waitlist users
 * Used by admin panel to display the list
 */
export async function getWaitlistUsers(includeDeleted: boolean = false): Promise<{ data: WaitlistUser[] | null; error?: string }> {
  try {
    const supabase = createSupabaseClient();

    let query = supabase
      .from('waitlist')
      .select('*');
    
    // Filter out deleted entries by default
    if (!includeDeleted) {
      query = query.neq('status', 'deleted');
    }
    
    const { data: waitlistData, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching waitlist:', error);
      return { data: null, error: error.message };
    }

    if (!waitlistData) {
      return { data: [] };
    }

    // Get invitation data to calculate visited status
    const { data: invitationsData } = await supabase
      .from('waitlist_invitations')
      .select('waitlist_id, visited_at, used');

    // Calculate enhanced status for each user
    const enhancedData = waitlistData.map(user => {
      // Find the most recent invitation for this user
      const userInvitations = invitationsData?.filter(inv => inv.waitlist_id === user.id) || [];
      const hasVisited = userInvitations.some(inv => inv.visited_at && !inv.used);
      
      // Determine enhanced status
      let enhancedStatus = user.status;
      if (user.status === 'invited' && hasVisited) {
        enhancedStatus = 'visited' as const;
      }
      
      return {
        ...user,
        status: enhancedStatus
      };
    });

    return { data: enhancedData };

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Failed to fetch waitlist' 
    };
  }
}

/**
 * Update waitlist user status
 * Used when inviting users or marking them as converted
 */
export async function updateWaitlistStatus(
  id: string, 
  status: 'pending' | 'invited' | 'converted' | 'unsubscribed' | 'deleted',
  timestampField?: 'invited_at' | 'converted_at' | 'deleted_at'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseClient();

    const updateData: any = { status };
    
    // Add timestamp if specified
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString();
    }

    const { error } = await supabase
      .from('waitlist')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('❌ Error updating waitlist status:', error);
      return { success: false, error: error.message };
    }

    // console.log removed for production
    return { success: true };

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to update status' 
    };
  }
}

/**
 * Convert waitlist user to 'converted' status
 * Called when user successfully completes signup (sets password)
 */
export async function convertWaitlistUser(
  waitlistId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseClient();

    // Only update if currently 'invited' to prevent duplicate conversions
    const { data, error } = await supabase
      .from('waitlist')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', waitlistId)
      .eq('status', 'invited') // Only update if currently invited
      .select('id, email, first_name, last_name')
      .single();

    if (error) {
      console.error('❌ Error converting waitlist user:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      // console.log removed for production
      return { success: false, error: 'Waitlist user not found or already converted' };
    }

    // console.log removed for production
    return { success: true };

  } catch (err) {
    console.error('❌ Unexpected error converting waitlist user:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to convert waitlist user' 
    };
  }
}

/**
 * Soft delete a waitlist entry
 * Marks the entry as deleted but keeps it in the database
 */
export async function deleteWaitlistEntry(
  id: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseClient();

    const updateData: any = { 
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      deleted_reason: reason || null
    };

    const { error } = await supabase
      .from('waitlist')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting waitlist entry:', error);
      return { success: false, error: error.message };
    }

    // console.log removed for production
    return { success: true };

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to delete entry' 
    };
  }
}
