// src/supabase.ts

// Import environment variables
// import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from './.env';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// The browser must only use the public (anon) key. Service keys have admin
// privileges and should never be exposed client-side.
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Configure Supabase client with better session management to prevent automatic logout
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Enable persistent sessions to prevent automatic logout
    persistSession: true,
    // Enable automatic token refresh to extend session life
    autoRefreshToken: true,
    // Don't detect session in URL to prevent conflicts
    detectSessionInUrl: false,
    // Use localStorage for session persistence
    storage: window.localStorage,
    // Custom storage key for better session management
    storageKey: 'supabase.auth.token',
    // Use PKCE flow for better security
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'sdr-tool-frontend'
    }
  }
});