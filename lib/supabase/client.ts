import { createClient, SupabaseClient } from '@supabase/supabase-js';

// User's configured Supabase project
const defaultSupabaseUrl = 'https://abrrfeiyncyesaqdmxwx.supabase.co';
const defaultPublishableKey = 'sb_publishable_ROq1etUvTdEjcDLK0Eyczg_TRKQX25t';

const envUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const rawUrl = envUrl.trim();
// Strip trailing /rest/v1 or /rest/v1/ if present
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || defaultPublishableKey).trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
