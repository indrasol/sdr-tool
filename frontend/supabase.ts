// src/supabase.ts

// Import environment variables
// import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from './.env';

import { createClient } from '@supabase/supabase-js';

// Use process.env instead of import.meta.env for compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);