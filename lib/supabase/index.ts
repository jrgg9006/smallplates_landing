// Re-export all Supabase functions for easy importing
export * from './auth';
export * from './guests';
export * from './recipes';
export * from './communications';
export * from './profiles';

// Re-export client creation function
export { createSupabaseClient } from './client';