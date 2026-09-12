import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://abrrfeiyncyesaqdmxwx.supabase.co';
const defaultPublishableKey = 'sb_publishable_ROq1etUvTdEjcDLK0Eyczg_TRKQX25t';

const envUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const rawUrl = envUrl.trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  defaultPublishableKey;

export const createServerSupabaseClient = (): SupabaseClient => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
