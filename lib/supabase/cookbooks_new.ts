import { createSupabaseClient } from '@/lib/supabase/client';
import type {
  Cookbook,
  CookbookInsert,
  CookbookUpdate,
  CookbookRecipe,
  CookbookRecipeInsert,
  CookbookRecipeUpdate,
  RecipeInCookbook,
} from '@/lib/types/database';

/**
 * Get all cookbooks for the current user (now returns Groups since we renamed Groups to Cookbooks in UI)
 */
export async function getAllCookbooks() {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  console.log('🔍 Loading Groups (renamed to Cookbooks) for user:', user.email);

  try {
    // Get all groups where the user is a member (these are displayed as "Cookbooks" in UI)
    const { data: userGroups, error: groupsError } = await supabase
      .from('group_members')
      .select(`
        groups!inner(
          id,
          name,
          description,
          created_at,
          updated_at,
          visibility,
          created_by
        )
      `)
      .eq('profile_id', user.id);

    if (groupsError) {
      console.error('Error fetching user groups:', groupsError);
      return { data: null, error: 'Failed to load cookbooks' };
    }

    console.log('Raw groups data:', userGroups);

    // Flatten and transform groups to look like cookbooks
    const allCookbooks: any[] = [];
    
    (userGroups || []).forEach(item => {
      let group;
      
      // Handle potential array structure
      if (Array.isArray(item)) {
        group = item[0]?.groups;
      } else {
        group = item?.groups;
      }
      
      if (group && group.id && group.name) {
        // Transform group to cookbook-like object for consistency
        allCookbooks.push({
          id: group.id,
          name: group.name,
          description: group.description,
          created_at: group.created_at,
          updated_at: group.updated_at,
          is_default: false, // Groups are never default
          is_group_cookbook: true, // Mark as group cookbook for compatibility
          group_id: group.id, // Store original group ID
          user_id: group.created_by, // Store creator
        });
      }
    });

    console.log('Transformed groups (as cookbooks):', allCookbooks.map(cb => ({ id: cb.id, name: cb.name })));

    // Sort by creation date (newest first)
    allCookbooks.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { data: allCookbooks, error: null };
  } catch (err) {
    console.error('Error in getAllCookbooks (Groups):', err);
    return { data: null, error: 'Failed to load cookbooks' };
  }
}