import { createSupabaseClient } from '@/lib/supabase/client';
import type { ShippingAddress, ShippingAddressInsert, ShippingAddressUpdate } from '@/lib/types/database';

/**
 * Get all shipping addresses for the current user
 */
export async function getUserAddresses(): Promise<{ data: ShippingAddress[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return { data, error: error?.message || null };
}

/**
 * Create a new shipping address
 */
export async function createAddress(addressData: Omit<ShippingAddressInsert, 'user_id'>): Promise<{ data: ShippingAddress | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // If this is being set as default, first unset any existing default
  if (addressData.is_default) {
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('shipping_addresses')
    .insert({
      ...addressData,
      user_id: user.id,
    })
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Update an existing shipping address
 */
export async function updateAddress(addressId: string, updates: ShippingAddressUpdate): Promise<{ data: ShippingAddress | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // If this is being set as default, first unset any existing default
  if (updates.is_default) {
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('shipping_addresses')
    .update(updates)
    .eq('id', addressId)
    .eq('user_id', user.id) // Ensure user can only update their own addresses
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Delete a shipping address
 */
export async function deleteAddress(addressId: string): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'User not authenticated' };
  }

  const { error } = await supabase
    .from('shipping_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id); // Ensure user can only delete their own addresses

  return { error: error?.message || null };
}

/**
 * Set an address as the default shipping address
 */
export async function setDefaultAddress(addressId: string): Promise<{ data: ShippingAddress | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // First, unset any existing default
  await supabase
    .from('shipping_addresses')
    .update({ is_default: false })
    .eq('user_id', user.id);

  // Then set the specified address as default
  const { data, error } = await supabase
    .from('shipping_addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', user.id)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Get the default shipping address for the current user
 */
export async function getDefaultAddress(): Promise<{ data: ShippingAddress | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single();

  return { data, error: error?.message || null };
}